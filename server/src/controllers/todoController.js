const {Op} = require('sequelize');
const sequelize = require('../config/database');
const {Post, Project, User, PostVote} = require('../models/associations');

const getTodoTasks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {
            status, 
            priority, 
            project, 
            sort = 'due_date',
            search,
            page = 1,
            limit = 100,
            date_range
        } = req.query;

        const where = {
            assignee_id: req.user.id,
        };

        if (status && status !== 'all') {
            if (status === 'open') {
                where.status = {[Op.in]: ['Open', 'In Progress']};
            } else if (status === 'closed') {
                where.status = 'Closed';
            } else {
                where.status = status;
            }
        }

        if (priority && priority !== 'all') {
            where.priority = priority;
        }

        if (project && project !== 'all') {
            where.project_id = project;
        }

        if (search && search.trim()) {
            where[Op.or] = [
                {title: {[Op.like]: `%${search.trim()}%`}},
                {description: {[Op.like]: `%${search.trim()}%`}}
            ];
        }

        if (date_range) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            switch (date_range) {
                case 'overdue':
                    where.due_date = {[Op.lt]: today};
                    break;
                case 'today':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    where.due_date = {[Op.between]: [today, tomorrow]};
                    break;
                case 'this_week':
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    where.due_date = {[Op.between]: [today, nextWeek]};
                    break;
                case 'no_due_date':
                    where.due_date = {[Op.is]: null};
                    break;
            }
        }

        let order = [];
        switch (sort) {
            case 'due_date':
                order = [
                    [sequelize.literal("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END"), 'ASC'],
                    ['due_date', 'ASC'], 
                    ['created_at', 'DESC']
                ];
                break;
            case 'priority':
                order = [
                    [sequelize.literal(`CASE 
                        WHEN priority = 'Critical' THEN 1 
                        WHEN priority = 'High' THEN 2 
                        WHEN priority = 'Medium' THEN 3 
                        WHEN priority = 'Low' THEN 4 
                        ELSE 5 END`), 'ASC'],
                    ['created_at', 'DESC']
                ];
                break;
            case 'story_points':
                order = [
                    [sequelize.literal("CASE WHEN story_points IS NULL THEN 1 ELSE 0 END"), 'ASC'],
                    ['story_points', 'DESC'], 
                    ['created_at', 'DESC']
                ];
                break;
            case 'created_date':
                order = [['created_at', 'DESC']];
                break;
            case 'updated_date':
                order = [['updated_at', 'DESC']];
                break;
            case 'title':
                order = [['title', 'ASC']];
                break;
            default:
                order = [
                    [sequelize.literal("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END"), 'ASC'],
                    ['due_date', 'ASC'], 
                    ['created_at', 'DESC']
                ];
        }

        const posts = await Post.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'email', 'profile_picture']
                },
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'username', 'email', 'profile_picture']
                },
                {
                    model: Project,
                    attributes: ['id', 'name', 'description', 'logo_url']
                },
                {
                    model: PostVote,
                    as: 'votes',
                    attributes: ['user_id']
                }
            ],
            order,
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        const totalCount = await Post.count({where});

        const summaryWhere = {
            assignee_id: req.user.id,
        };

        if (priority && priority !== 'all') {
            summaryWhere.priority = priority;
        }

        if (project && project !== 'all') {
            summaryWhere.project_id = project;
        }

        const allUserTasks = await Post.findAll({
            where: summaryWhere,
            attributes: ['id', 'status', 'due_date', 'priority', 'story_points'],
        });

        let postsWithVotes = posts.map(post => ({
            ...post.toJSON(),
            vote_count: post.votes?.length || 0,
            user_voted: post.votes?.some(vote => vote.user_id === req.user.id) || false,
        }));

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const groupedTasks = {
            overdue: [],
            today: [],
            tomorrow: [],
            thisWeek: [],
            later: [],
            noDueDate: []
        };

        postsWithVotes.forEach(post => {
            if (!post.due_date) {
                groupedTasks.noDueDate.push(post);
            } else {
                const dueDate = new Date(post.due_date);
                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                if (dueDateOnly < today) {
                    groupedTasks.overdue.push(post);
                } else if (dueDateOnly.getTime() === today.getTime()) {
                    groupedTasks.today.push(post);
                } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
                    groupedTasks.tomorrow.push(post);
                } else if (dueDateOnly <= nextWeek) {
                    groupedTasks.thisWeek.push(post);
                } else {
                    groupedTasks.later.push(post);
                }
            }
        });

        let overdueCount = 0;
        let todayCount = 0;
        let thisWeekCount = 0;
        let totalStoryPoints = 0;
        let completedStoryPoints = 0;

        allUserTasks.forEach(task => {
            if (task.story_points) {
                totalStoryPoints += task.story_points;
                if (task.status === 'Closed') {
                    completedStoryPoints += task.story_points;
                }
            }

            if (task.due_date) {
                const dueDate = new Date(task.due_date);
                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

                if (dueDateOnly < today) {
                    overdueCount++;
                } else if (dueDateOnly.getTime() === today.getTime()) {
                    todayCount++;
                } else if (dueDateOnly <= nextWeek) {
                    thisWeekCount++;
                }
            }
        });

        const userProjects = await Post.findAll({
            where: {assignee_id: req.user.id},
            include: [{
                model: Project,
                attributes: ['id', 'name']
            }],
            attributes: [],
            group: ['Project.id', 'Project.name'],
            raw: true
        });

        const projects = userProjects.map(item => ({
            id: item['Project.id'],
            name: item['Project.name']
        }));

        res.json({
            tasks: postsWithVotes,
            groupedTasks,
            projects,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1
            },
            summary: {
                total: allUserTasks.length,
                overdue: overdueCount,
                today: todayCount,
                thisWeek: thisWeekCount,
                open: allUserTasks.filter(task => task.status !== 'Closed').length,
                closed: allUserTasks.filter(task => task.status === 'Closed').length,
                totalStoryPoints,
                completedStoryPoints,
                storyPointsProgress: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get todo tasks error:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

module.exports = {
    getTodoTasks,
};
