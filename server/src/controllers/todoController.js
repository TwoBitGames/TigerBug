const {Op} = require('sequelize');
const {Post, Project, User, PostVote} = require('../models/associations');

const getTodoTasks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        const {status, priority, project, sort = 'due_date'} = req.query;

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

        let order = [];
        switch (sort) {
            case 'due_date':
                order = [['due_date', 'ASC'], ['created_at', 'DESC']];
                break;
            case 'priority':
                order = [['priority', 'DESC'], ['created_at', 'DESC']];
                break;
            case 'story_points':
                order = [['story_points', 'DESC'], ['created_at', 'DESC']];
                break;
            case 'created_date':
                order = [['created_at', 'DESC']];
                break;
            default:
                order = [['due_date', 'ASC'], ['created_at', 'DESC']];
        }

        const posts = await Post.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: User,
                    as: 'assignee',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Project,
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: PostVote,
                    as: 'votes',
                    attributes: ['user_id']
                }
            ],
            order,
        });

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
            attributes: ['id', 'status', 'due_date'],
        });

        let postsWithVotes = posts.map(post => ({
            ...post.toJSON(),
            vote_count: post.votes.length,
            user_voted: post.votes.some(vote => vote.user_id === req.user.id),
        }));

        if (sort === 'priority') {
            const priorityOrder = {'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4};
            postsWithVotes = postsWithVotes.sort((a, b) => {
                const priorityA = priorityOrder[a.priority] || 5;
                const priorityB = priorityOrder[b.priority] || 5;
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        }

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

        allUserTasks.forEach(task => {
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
            summary: {
                total: allUserTasks.length,
                overdue: overdueCount,
                today: todayCount,
                thisWeek: thisWeekCount,
                open: allUserTasks.filter(task => task.status !== 'Closed').length,
                closed: allUserTasks.filter(task => task.status === 'Closed').length
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
