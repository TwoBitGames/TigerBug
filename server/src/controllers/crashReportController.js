const {body, validationResult} = require('express-validator');
const {CrashReport, Project, User, Post, Attachment} = require('../models/associations');
const {checkProjectPermission} = require('../utils/permissions');
const {semverCompare, normalizeVersion} = require('../utils/semver');
const {Op} = require('sequelize');
const crypto = require('crypto');

const validateCrashReport = [
    body('id').isInt({min: 1}).withMessage('Project ID must be a positive integer'),
    body('report').isBase64().withMessage('Report must be a valid base64 string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('os').optional().isString().withMessage('OS must be a string'),
    body('user_story').optional().isBase64().withMessage('User story must be a valid base64 string'),
];

const submitCrashReport = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {id: projectId, report, version, os, user_story} = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        if (!project.crash_reports_enabled) {
            return res.status(403).json({error: 'Crash reports are disabled for this project'});
        }

        if (project.crash_reports_min_version && version) {
            const normalizedVersion = normalizeVersion(version);
            const normalizedMinVersion = normalizeVersion(project.crash_reports_min_version);

            if (normalizedVersion && normalizedMinVersion) {
                if (semverCompare(normalizedVersion, normalizedMinVersion) < 0) {
                    return res.status(400).json({
                        error: `Version ${version} is below the minimum required version ${project.crash_reports_min_version}`
                    });
                }
            }
        }

        let crashData;
        try {
            crashData = Buffer.from(report, 'base64').toString('utf-8');
        } catch (error) {
            return res.status(400).json({error: 'Invalid base64 report data'});
        }

        let userStoryData = null;
        if (user_story) {
            try {
                userStoryData = Buffer.from(user_story, 'base64').toString('utf-8');
            } catch (error) {
                return res.status(400).json({error: 'Invalid base64 user story data'});
            }
        }

        const extractionResult = extractCrashInfo(crashData, req, project.crash_reports_template);

        if (project.crash_reports_template && project.crash_reports_template.trim() && !extractionResult.templateSuccess) {
            return res.status(400).json({
                error: 'Crash report does not match the required template format for this project'
            });
        }

        const extractedInfo = extractionResult.info || extractionResult;

        if (version) extractedInfo.application_version = version;
        if (os) extractedInfo.operating_system = os;

        const existingCrash = await findSimilarCrashReport(projectId, extractedInfo);

        if (existingCrash) {
            await existingCrash.increment('crash_frequency');

            res.status(201).json({
                message: 'Crash report matched with existing report, frequency updated',
                crash_report_id: existingCrash.id,
                is_duplicate: true,
                frequency: existingCrash.crash_frequency + 1,
            });
        } else {
            const crashReport = await CrashReport.create({
                project_id: projectId,
                crash_data: crashData,
                stack_trace: extractedInfo.stack_trace,
                error_message: extractedInfo.error_message,
                application_version: extractedInfo.application_version,
                operating_system: extractedInfo.operating_system,
                script_line: extractedInfo.script_line,
                user_story: userStoryData,
                ip_address: ip,
                user_agent: req.get('User-Agent'),
                crash_frequency: 1,
            });            res.status(201).json({
                message: 'Crash report submitted successfully',
                crash_report_id: crashReport.id,
                is_duplicate: false,
                frequency: 1,
            });
        }
    } catch (error) {
        console.error('Submit crash report error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getCrashReports = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId} = req.params;
        const {
            page = 1,
            limit = 25,
            status = 'all',
            sort = 'created_at',
            order = 'DESC',
            search = ''
        } = req.query;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can view crash reports.'});
        }

        const where = {
            project_id: projectId
        };

        if (status !== 'all') {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                {error_message: {[Op.like]: `%${search}%`}},
                {stack_trace: {[Op.like]: `%${search}%`}},
                {application_version: {[Op.like]: `%${search}%`}},
                {operating_system: {[Op.like]: `%${search}%`}},
                {script_line: {[Op.like]: `%${search}%`}},
                {user_story: {[Op.like]: `%${search}%`}}
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const {count, rows: crashReports} = await CrashReport.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Post,
                    as: 'convertedIssue',
                    attributes: ['id', 'title', 'status']
                }
            ],
            order: [[sort, order.toUpperCase()]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            crash_reports: crashReports,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
                hasNext: parseInt(page) < Math.ceil(count / parseInt(limit)),
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Get crash reports error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const getCrashReport = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId, crashId} = req.params;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can view crash reports.'});
        }

        const crashReport = await CrashReport.findOne({
            where: {
                id: crashId,
                project_id: projectId
            },
            include: [
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Post,
                    as: 'convertedIssue',
                    attributes: ['id', 'title', 'status', 'description']
                }
            ]
        });

        if (!crashReport) {
            return res.status(404).json({error: 'Crash report not found'});
        }

        res.json({crash_report: crashReport});
    } catch (error) {
        console.error('Get crash report error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const updateCrashReportStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId, crashId} = req.params;
        const {status, notes} = req.body;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can update crash reports.'});
        }

        const crashReport = await CrashReport.findOne({
            where: {
                id: crashId,
                project_id: projectId
            }
        });

        if (!crashReport) {
            return res.status(404).json({error: 'Crash report not found'});
        }

        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        if (status && status !== 'New' && crashReport.status === 'New') {
            updateData.reviewed_by = req.user.id;
            updateData.reviewed_at = new Date();
        }

        await crashReport.update(updateData);

        const updatedCrashReport = await CrashReport.findByPk(crashId, {
            include: [
                {
                    model: User,
                    as: 'reviewer',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Post,
                    as: 'convertedIssue',
                    attributes: ['id', 'title', 'status']
                }
            ]
        });

        res.json({
            message: 'Crash report updated successfully',
            crash_report: updatedCrashReport
        });
    } catch (error) {
        console.error('Update crash report error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const convertToIssue = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId, crashId} = req.params;
        const {title, description, priority = 'High', issue_type = 'Bug', is_private = false} = req.body;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can convert crash reports.'});
        }

        const crashReport = await CrashReport.findOne({
            where: {
                id: crashId,
                project_id: projectId
            }
        });

        if (!crashReport) {
            return res.status(404).json({error: 'Crash report not found'});
        }

        if (crashReport.converted_to_issue_id) {
            return res.status(400).json({error: 'Crash report has already been converted to an issue'});
        }

        const issueData = {
            project_id: projectId,
            author_id: req.user.id,
            title: title || `Crash Report #${crashId}: ${crashReport.error_message || 'Application Crash'}`,
            description: description || generateIssueDescription(crashReport),
            priority,
            issue_type,
            is_private: is_private,
        };

        const issue = await Post.create(issueData);

        const crashDataFile = `crash_report_${crashId}.txt`;
        const attachmentPath = await saveCrashDataAsAttachment(crashReport, crashDataFile);

        await Attachment.create({
            related_type: 'post',
            related_id: issue.id,
            file_path: attachmentPath,
            original_filename: crashDataFile,
            uploaded_by: req.user.id,
        });

        await crashReport.update({
            status: 'Converted',
            converted_to_issue_id: issue.id,
            reviewed_by: req.user.id,
            reviewed_at: new Date(),
        });

        const fullIssue = await Post.findByPk(issue.id, {
            include: [
                {model: User, as: 'author', attributes: ['id', 'username', 'email']},
                {model: Project, attributes: ['id', 'name']},
            ],
        });

        res.json({
            message: 'Crash report converted to issue successfully',
            issue: fullIssue,
            crash_report: crashReport
        });
    } catch (error) {
        console.error('Convert to issue error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const deleteCrashReport = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId, crashId} = req.params;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can delete crash reports.'});
        }

        const crashReport = await CrashReport.findOne({
            where: {
                id: crashId,
                project_id: projectId
            }
        });

        if (!crashReport) {
            return res.status(404).json({error: 'Crash report not found'});
        }

        await crashReport.destroy();

        res.json({
            message: 'Crash report deleted successfully',
            deleted_id: crashId
        });
    } catch (error) {
        console.error('Delete crash report error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const clearAllCrashReports = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {id: projectId} = req.params;

        const permission = await checkProjectPermission(req.user.id, projectId);
        if (!permission.hasAccess && !req.user.is_admin) {
            return res.status(403).json({error: 'Access denied. Only project members can delete crash reports.'});
        }

        const totalCount = await CrashReport.count({
            where: {
                project_id: projectId
            }
        });

        if (totalCount === 0) {
            return res.json({
                message: 'No crash reports to delete',
                deleted_count: 0
            });
        }

        const deletedCount = await CrashReport.destroy({
            where: {
                project_id: projectId
            }
        });

        res.json({
            message: `Successfully deleted ${deletedCount} crash report${deletedCount !== 1 ? 's' : ''}`,
            deleted_count: deletedCount
        });
    } catch (error) {
        console.error('Clear all crash reports error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

const parseWithTemplate = (crashData, template) => {
    if (!template || !template.trim()) {
        return {success: false};
    }

    try {
        const templateSegments = [];
        const variables = [];
        let lastIndex = 0;

        const variableRegex = /%(\w+)%/g;
        let match;

        while ((match = variableRegex.exec(template)) !== null) {
            if (match.index > lastIndex) {
                templateSegments.push({
                    type: 'text',
                    content: template.slice(lastIndex, match.index)
                });
            }

            templateSegments.push({
                type: 'variable',
                name: match[1].toLowerCase(),
                fullMatch: match[0]
            });
            variables.push(match[1].toLowerCase());

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < template.length) {
            templateSegments.push({
                type: 'text',
                content: template.slice(lastIndex)
            });
        }

        let pattern = '';
        for (let i = 0; i < templateSegments.length; i++) {
            const segment = templateSegments[i];

            if (segment.type === 'text') {
                const escapedText = segment.content
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\s+/g, '\\s*');
                pattern += escapedText;
            } else if (segment.type === 'variable') {
                const nextSegment = templateSegments[i + 1];

                if (segment.name === 'any') {
                    if (nextSegment && nextSegment.type === 'text') {
                        const nextText = nextSegment.content.trim();
                        if (nextText) {
                            pattern += `(?:(?!${nextText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}).)*?`;
                        } else {
                            pattern += '(?:.*?)';
                        }
                    } else {
                        pattern += '(?:.*?)';
                    }
                } else {
                    if (nextSegment && nextSegment.type === 'text') {
                        const nextText = nextSegment.content.trim();
                        if (nextText) {
                            pattern += `(?<${segment.name}>(?:(?!${nextText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*')}).)*)`;
                        } else {
                            pattern += `(?<${segment.name}>.*?)`;
                        }
                    } else {
                        pattern += `(?<${segment.name}>.*?)`;
                    }
                }
            }
        }

        const regex = new RegExp(pattern, 'is');
        const matchResult = crashData.match(regex);

        if (matchResult && matchResult.groups) {
            const result = {
                success: true,
                data: {
                    error_message: null,
                    stack_trace: null,
                    application_version: null,
                    operating_system: null,
                }
            };

            Object.keys(matchResult.groups).forEach(key => {
                let value = matchResult.groups[key];
                if (value) {
                    value = value.trim();

                    value = value.replace(/#+\s*$/, '').trim();
                    value = value.replace(/[=\-_]{3,}\s*$/, '').trim();

                    if (value) {
                        switch (key) {
                            case 'error':
                                result.data.error_message = value;
                                break;
                            case 'stack_trace':
                                result.data.stack_trace = value;
                                break;
                            case 'script':
                                result.data.script = value;
                                break;
                            case 'line':
                                result.data.line = value;
                                break;
                            default:
                                break;
                        }
                    }
                }
            });

            if (result.data.script || result.data.line) {
                let scriptLine = '';
                if (result.data.script) {
                    scriptLine += result.data.script.replace(/:/g, '\\:');
                }
                if (result.data.line) {
                    if (scriptLine) scriptLine += ':';
                    scriptLine += result.data.line;
                }
                result.data.script_line = scriptLine;
                delete result.data.script;
                delete result.data.line;
            }

            const hasData = Object.values(result.data).some(value => value !== null);
            if (hasData) {
                return result;
            }
        }

        return {success: false};
    } catch (error) {
        console.error('Template parsing error:', error);
        return {success: false};
    }
};

const extractCrashInfo = (crashData, req, customTemplate = null) => {
    const info = {
        stack_trace: null,
        error_message: null,
        application_version: null,
        operating_system: null,
        script_line: null,
        error_signature: null,
    };

    if (customTemplate && customTemplate.trim()) {
        const templateResult = parseWithTemplate(crashData, customTemplate);
        if (templateResult.success) {
            Object.assign(info, templateResult.data);
            info.error_signature = generateErrorSignature(info);
            return {
                info: info,
                templateSuccess: true
            };
        } else {
            return {
                info: info,
                templateSuccess: false
            };
        }
    }

    const sections = parseTextSections(crashData);
    info.error_message = extractErrorFromSections(sections);
    info.stack_trace = extractStackFromSections(sections);
    info.application_version = extractVersionFromSections(sections);
    info.operating_system = extractOSFromSections(sections);

    if (!info.error_message) info.error_message = extractFallbackError(crashData);

    info.error_signature = generateErrorSignature(info);

    return info;
};

const parseTextSections = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const sections = {};
    let currentKey = null;
    let currentValue = [];

    for (const line of lines) {
        const colonMatch = line.match(/^([^:]+):\s*(.*)$/);
        if (colonMatch && !isStackTraceLine(line)) {
            if (currentKey) sections[currentKey] = currentValue.join('\n').trim();
            currentKey = colonMatch[1].toLowerCase().trim();
            currentValue = colonMatch[2] ? [colonMatch[2]] : [];
        } else if (currentKey) {
            currentValue.push(line);
        }
    }
    if (currentKey) sections[currentKey] = currentValue.join('\n').trim();

    sections._lines = lines;
    return sections;
};

const extractErrorFromSections = (sections) => {
    const errorSections = [
        'full error', 'error', 'exception', 'short error', 'crash reason',
        'fault', 'problem', 'message', 'description'
    ];

    for (const key of errorSections) {
        if (sections[key] && !isHeaderOrFooter(sections[key])) {
            return sections[key];
        }
    }

    for (const line of sections._lines || []) {
        if (isErrorLine(line) && !isHeaderOrFooter(line)) {
            return line;
        }
    }

    return null;
};

const extractStackFromSections = (sections) => {
    const stackSections = ['stack trace', 'call stack', 'backtrace', 'stack'];
    for (const key of stackSections) {
        if (sections[key]) return sections[key];
    }

    const stackLines = [];
    let inStack = false;
    for (const line of sections._lines || []) {
        if (isStackTraceLine(line)) {
            inStack = true;
            stackLines.push(line);
        } else if (inStack && !line.match(/^[a-zA-Z\s]*:/) && line.length > 5) {
            stackLines.push(line);
        } else if (inStack) {
            break;
        }
    }
    return stackLines.length > 0 ? stackLines.join('\n') : null;
};

const extractVersionFromSections = (sections) => {
    const versionSections = ['version', 'build', 'app version', 'application version'];
    for (const key of versionSections) {
        if (sections[key]) return sections[key];
    }

    for (const value of Object.values(sections)) {
        if (typeof value === 'string') {
            const versionMatch = value.match(/\b(\d+\.\d+(?:\.\d+)*(?:\.\d+)?)\b/);
            if (versionMatch) return versionMatch[1];
        }
    }
    return null;
};

const extractOSFromSections = (sections) => {
    const osSections = ['os', 'platform', 'operating system', 'system'];
    for (const key of osSections) {
        if (sections[key]) return sections[key];
    }
    return null;
};

const isHeaderOrFooter = (text) => {
    const lower = text.toLowerCase();
    return (
        lower.includes('crashlog') || lower.includes('crash report') ||
        lower.includes('bug report') || lower.includes('error report') ||
        lower.includes('you can report') || lower.includes('file saved') ||
        text.match(/^[#=\-_*]{3,}$/) || text.length < 3
    );
};

const isErrorLine = (line) => {
    const lower = line.toLowerCase();
    return (
        (lower.includes('error') || lower.includes('exception') ||
            lower.includes('fault') || lower.includes('crash')) &&
        !isHeaderOrFooter(line) && line.length > 10
    );
};

const isStackTraceLine = (line) => {
    return (
        line.includes('    at ') || line.includes('\tat ') ||
        line.match(/^\s*#\d+/) || line.match(/^\s*\d+\s+/) ||
        line.includes('0x') || line.match(/\w+\.\w+\([^)]*\)/) ||
        line.includes('.dll!') || line.includes('.so!') || line.includes('.dylib!')
    );
};

const extractFallbackError = (crashData) => {
    const lines = crashData.split('\n').map(l => l.trim()).filter(l => l);

    for (const line of lines) {
        if (line.length > 10 &&
            !isHeaderOrFooter(line) &&
            !line.match(/^(time|date|thread|process|module):/i) &&
            (isErrorLine(line) || line.includes('Exception') || line.includes('Error'))) {
            return line;
        }
    }

    for (const line of lines) {
        if (line.length > 5 && !isHeaderOrFooter(line)) {
            return line;
        }
    }

    return 'Unknown error';
};

const generateErrorSignature = (info) => {
    const parts = [];

    if (info.error_message) {
        const normalized = info.error_message
            .replace(/\d{4}-\d{2}-\d{2}[\s\w:.-]*/g, '[TIME]')
            .replace(/0x[0-9a-f]+/gi, '[ADDR]')
            .replace(/\b\d{8,}\b/g, '[ID]')
            .replace(/line\s+\d+/gi, 'line [N]')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        parts.push(normalized);
    }

    if (info.stack_trace) {
        const frames = info.stack_trace.split('\n')
            .slice(0, 3)
            .map(f => f.replace(/0x[0-9a-f]+/gi, '[ADDR]').replace(/\+\d+/g, '+[OFF]').trim())
            .join('|');
        parts.push(frames);
    }

    if (info.application_version) parts.push(info.application_version);

    return crypto.createHash('sha256').update(parts.join('::') || 'unknown').digest('hex').substring(0, 16);
};

const generateIssueDescription = (crashReport) => {
    let description = `# Crash Report Analysis\n\n`;
    description += `**Crash Report ID:** ${crashReport.id}\n`;
    description += `**Frequency:** ${crashReport.crash_frequency} occurrence(s)\n`;
    description += `**First Reported:** ${crashReport.created_at}\n\n`;

    if (crashReport.error_message) {
        description += `## Error Message\n\`\`\`\n${crashReport.error_message}\n\`\`\`\n\n`;
    }

    if (crashReport.application_version) {
        description += `**Application Version:** ${crashReport.application_version}\n`;
    }

    if (crashReport.operating_system) {
        description += `**Operating System:** ${crashReport.operating_system}\n`;
    }

    if (crashReport.script_line) {
        description += `**Script:Line:** ${crashReport.script_line}\n`;
    }

    description += `\n## Additional Information\n`;
    description += `The complete crash data has been attached to this issue for detailed analysis.\n`;

    return description;
};

const saveCrashDataAsAttachment = async (crashReport, filename) => {
    const fs = require('fs');
    const path = require('path');

    const attachmentsDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../attachments');
    const postsDir = path.join(attachmentsDir, 'posts');

    if (!fs.existsSync(postsDir)) {
        fs.mkdirSync(postsDir, {recursive: true});
    }

    const filePath = path.join(postsDir, filename);
    fs.writeFileSync(filePath, crashReport.crash_data, 'utf8');

    return filePath;
};

const findSimilarCrashReport = async (projectId, extractedInfo) => {
    try {
        if (extractedInfo.error_signature) {
            const signatureMatch = await CrashReport.findOne({
                where: {
                    project_id: projectId,
                    error_signature: extractedInfo.error_signature,
                    application_version: extractedInfo.application_version || null,
                }
            });
            if (signatureMatch) return signatureMatch;
        }

        if (extractedInfo.error_message) {
            const recentCrashes = await CrashReport.findAll({
                where: {
                    project_id: projectId,
                    application_version: extractedInfo.application_version || null,
                    error_message: {[Op.ne]: null},
                    created_at: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                },
                order: [['created_at', 'DESC']],
                limit: 20
            });

            const newNorm = normalizeForComparison(extractedInfo.error_message);
            for (const crash of recentCrashes) {
                const existingNorm = normalizeForComparison(crash.error_message);
                if (similarity(newNorm, existingNorm) > 0.95) {
                    return crash;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding similar crash report:', error);
        return null;
    }
};

const normalizeForComparison = (text) => {
    return text.toLowerCase()
        .replace(/\d{4}-\d{2}-\d{2}[\s\w:.-]*/g, '')
        .replace(/0x[0-9a-f]+/gi, '')
        .replace(/\b\d{8,}\b/g, '')
        .replace(/line\s+\d+/gi, 'line')
        .replace(/\s+/g, ' ')
        .trim();
};

const similarity = (a, b) => {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1;
    return (longer.length - levenshtein(longer, shorter)) / longer.length;
};

const levenshtein = (a, b) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
        }
    }
    return matrix[b.length][a.length];
};

const backfillErrorSignatures = async (req, res) => {
    try {
        if (!req.user || !req.user.is_admin) {
            return res.status(403).json({error: 'Admin access required'});
        }

        const {projectId} = req.params;
        const {batchSize = 100} = req.query;

        let updated = 0;
        let processed = 0;
        let offset = 0;

        while (true) {
            const crashReports = await CrashReport.findAll({
                where: {
                    project_id: projectId || undefined,
                    error_signature: null
                },
                include: [{
                    model: Project,
                    attributes: ['id', 'crash_reports_template']
                }],
                limit: parseInt(batchSize),
                offset: offset,
                order: [['id', 'ASC']]
            });

            if (crashReports.length === 0) break;

            for (const crashReport of crashReports) {
                try {
                    const project = crashReport.Project;
                    const extractionResult = extractCrashInfo(
                        crashReport.crash_data,
                        {},
                        project?.crash_reports_template
                    );

                    const extractedInfo = extractionResult.info || extractionResult;

                    if (extractedInfo.error_signature) {
                        await crashReport.update({
                            error_signature: extractedInfo.error_signature,
                            error_message: crashReport.error_message || extractedInfo.error_message,
                            stack_trace: crashReport.stack_trace || extractedInfo.stack_trace,
                            application_version: crashReport.application_version || extractedInfo.application_version,
                            operating_system: crashReport.operating_system || extractedInfo.operating_system,
                        });
                        updated++;
                    }
                } catch (error) {
                    console.error(`Error processing crash report ${crashReport.id}:`, error);
                }
                processed++;
            }

            offset += parseInt(batchSize);
        }

        res.json({
            message: 'Error signatures backfilled successfully',
            processed,
            updated
        });
    } catch (error) {
        console.error('Backfill error signatures error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    validateCrashReport,
    submitCrashReport,
    getCrashReports,
    getCrashReport,
    updateCrashReportStatus,
    convertToIssue,
    deleteCrashReport,
    clearAllCrashReports,
    backfillErrorSignatures,
};
