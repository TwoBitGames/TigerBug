const {body, validationResult} = require('express-validator');
const {CrashReport, Project, User, Post, Attachment} = require('../models/associations');
const {checkProjectPermission} = require('../utils/permissions');
const {Op} = require('sequelize');

const validateCrashReport = [
    body('id').isInt({min: 1}).withMessage('Project ID must be a positive integer'),
    body('report').isBase64().withMessage('Report must be a valid base64 string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('os').optional().isString().withMessage('OS must be a string'),
    body('context').optional().isString().withMessage('Context must be a string'),
];

const submitCrashReport = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {id: projectId, report, version, os, context} = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json({error: 'Project not found'});
        }

        let crashData;
        try {
            crashData = Buffer.from(report, 'base64').toString('utf-8');
        } catch (error) {
            return res.status(400).json({error: 'Invalid base64 report data'});
        }

        const extractedInfo = extractCrashInfo(crashData, req);

        if (version) extractedInfo.application_version = version;
        if (os) extractedInfo.operating_system = os;
        if (context) extractedInfo.context = context;

        const existingCrash = await findSimilarCrashReport(projectId, extractedInfo, crashData);

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
                ip_address: ip,
                user_agent: req.get('User-Agent'),
                crash_frequency: 1,
            });

            res.status(201).json({
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
                {operating_system: {[Op.like]: `%${search}%`}}
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
        const {title, description, priority = 'High', issue_type = 'Bug'} = req.body;

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
            is_private: false,
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

const extractCrashInfo = (crashData, req) => {
    const info = {
        stack_trace: null,
        error_message: null,
        application_version: null,
        operating_system: null,
    };

    try {
        const parsed = JSON.parse(crashData);
        info.stack_trace = parsed.stack_trace || parsed.stackTrace;
        info.error_message = parsed.error || parsed.message || parsed.error_message;
        info.application_version = parsed.version || parsed.app_version;
        info.operating_system = parsed.os || parsed.platform || parsed.operating_system;
    } catch {
        const lines = crashData.split('\n');

        for (const line of lines) {
            if (line.toLowerCase().includes('error:') || line.toLowerCase().includes('exception:')) {
                info.error_message = line.trim();
                break;
            }
        }

        const stackStartIndex = lines.findIndex(line =>
            line.toLowerCase().includes('stack trace') ||
            line.toLowerCase().includes('call stack') ||
            line.includes('    at ')
        );

        if (stackStartIndex !== -1) {
            info.stack_trace = lines.slice(stackStartIndex).join('\n');
        }
    }

    if (!info.operating_system && req.get('User-Agent')) {
        const userAgent = req.get('User-Agent');
        if (userAgent.includes('Windows')) info.operating_system = 'Windows';
        else if (userAgent.includes('Mac')) info.operating_system = 'macOS';
        else if (userAgent.includes('Linux')) info.operating_system = 'Linux';
    }

    return info;
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
        if (extractedInfo.error_message && extractedInfo.stack_trace) {
            const exactMatch = await CrashReport.findOne({
                where: {
                    project_id: projectId,
                    error_message: extractedInfo.error_message,
                    stack_trace: extractedInfo.stack_trace,
                    application_version: extractedInfo.application_version || null,
                    operating_system: extractedInfo.operating_system || null,
                }
            });
            if (exactMatch) return exactMatch;
        }

        if (extractedInfo.error_message) {
            const errorMatch = await CrashReport.findOne({
                where: {
                    project_id: projectId,
                    error_message: extractedInfo.error_message,
                    application_version: extractedInfo.application_version || null,
                }
            });
            if (errorMatch) return errorMatch;
        }

        if (extractedInfo.stack_trace) {
            const stackLines = extractedInfo.stack_trace.split('\n').slice(0, 5);
            const primaryStackLine = stackLines.find(line =>
                line.trim() &&
                (line.includes('    at ') || line.includes('in ') || line.includes('.js:') || line.includes('.exe'))
            );

            if (primaryStackLine) {
                const similarCrashes = await CrashReport.findAll({
                    where: {
                        project_id: projectId,
                        stack_trace: {
                            [Op.like]: `%${primaryStackLine.trim()}%`
                        },
                        application_version: extractedInfo.application_version || null,
                    },
                    limit: 1
                });

                if (similarCrashes.length > 0) {
                    return similarCrashes[0];
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding similar crash report:', error);
        return null;
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
};
