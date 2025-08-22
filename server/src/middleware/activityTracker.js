const { createActivity } = require('../controllers/activityController');

const trackPostChanges = async (originalPost, updatedData, userId) => {
    try {
        const activitiesToCreate = [];

        if (updatedData.status && originalPost.status !== updatedData.status) {
            activitiesToCreate.push({
                type: 'status_changed',
                oldValue: originalPost.status,
                newValue: updatedData.status
            });
        }

        if (updatedData.priority && originalPost.priority !== updatedData.priority) {
            activitiesToCreate.push({
                type: 'priority_changed',
                oldValue: originalPost.priority,
                newValue: updatedData.priority
            });
        }

        if (updatedData.assignee_id !== undefined && originalPost.assignee_id !== updatedData.assignee_id) {
            const oldAssignee = originalPost.assignee ? originalPost.assignee.username : null;
            let newAssigneeName = null;
            
            if (updatedData.assignee_id) {
                newAssigneeName = updatedData.assignee_id;
            }

            activitiesToCreate.push({
                type: 'assignee_changed',
                oldValue: { id: originalPost.assignee_id, username: oldAssignee },
                newValue: { id: updatedData.assignee_id, username: newAssigneeName }
            });
        }

        if (updatedData.issue_type && originalPost.issue_type !== updatedData.issue_type) {
            activitiesToCreate.push({
                type: 'issue_type_changed',
                oldValue: originalPost.issue_type,
                newValue: updatedData.issue_type
            });
        }

        if (updatedData.story_points !== undefined && originalPost.story_points !== updatedData.story_points) {
            activitiesToCreate.push({
                type: 'story_points_changed',
                oldValue: originalPost.story_points,
                newValue: updatedData.story_points
            });
        }

        if (updatedData.time_estimate !== undefined && originalPost.time_estimate !== updatedData.time_estimate) {
            activitiesToCreate.push({
                type: 'time_estimate_changed',
                oldValue: originalPost.time_estimate,
                newValue: updatedData.time_estimate
            });
        }

        if (updatedData.due_date !== undefined) {
            const originalDate = originalPost.due_date ? originalPost.due_date.toISOString().split('T')[0] : null;
            const newDate = updatedData.due_date;
            
            if (originalDate !== newDate) {
                activitiesToCreate.push({
                    type: 'due_date_changed',
                    oldValue: originalDate,
                    newValue: newDate
                });
            }
        }

        if (updatedData.labels) {
            const oldLabels = originalPost.labels || [];
            const newLabels = updatedData.labels || [];
            
            const addedLabels = newLabels.filter(label => !oldLabels.includes(label));
            const removedLabels = oldLabels.filter(label => !newLabels.includes(label));

            if (addedLabels.length > 0) {
                activitiesToCreate.push({
                    type: 'labels_added',
                    oldValue: oldLabels,
                    newValue: addedLabels
                });
            }

            if (removedLabels.length > 0) {
                activitiesToCreate.push({
                    type: 'labels_removed',
                    oldValue: removedLabels,
                    newValue: newLabels
                });
            }
        }

        for (const activity of activitiesToCreate) {
            await createActivity(
                originalPost.id,
                userId,
                activity.type,
                activity.oldValue,
                activity.newValue
            );
        }

        return activitiesToCreate.length;
    } catch (error) {
        console.error('Failed to track post changes:', error);
        return 0;
    }
};

module.exports = {
    trackPostChanges
};