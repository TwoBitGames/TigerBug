const {DataTypes} = require("sequelize");

module.exports = {
    async up(queryInterface) {
        const tableNames = await queryInterface.showAllTables();

        if (!tableNames.includes("attachments")) {
            await queryInterface.createTable("attachments", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                related_type: {
                    type: DataTypes.ENUM('post', 'comment'),
                    allowNull: false,
                },
                related_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
                file_path: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                original_filename: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                uploaded_by: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                uploaded_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created attachments table");
        }

        if (!tableNames.includes("branding_configs")) {
            await queryInterface.createTable("branding_configs", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    defaultValue: 1,
                },
                app_name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'TigerBug',
                },
                logo_url: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                banner_url: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                tagline: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                social_links: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    defaultValue: null,
                },
                client_url: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created branding_configs table");
        }

        if (!tableNames.includes("comments")) {
            await queryInterface.createTable("comments", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                post_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'posts',
                        key: 'id',
                    },
                },
                author_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                message: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                created_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created comments table");
        }

        if (!tableNames.includes("posts")) {
            await queryInterface.createTable("posts", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                project_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'projects',
                        key: 'id',
                    },
                },
                author_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                title: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                is_private: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                status: {
                    type: DataTypes.ENUM('Open', 'In Progress', 'Closed'),
                    allowNull: false,
                    defaultValue: 'Open',
                },
                priority: {
                    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                    allowNull: false,
                    defaultValue: 'Medium',
                },
                issue_type: {
                    type: DataTypes.ENUM('Bug', 'Feature'),
                    allowNull: false,
                    defaultValue: 'Bug',
                },
                assignee_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                parent_issue_id: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'posts',
                        key: 'id',
                    },
                },
                story_points: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    validate: {
                        min: 1,
                        max: 100,
                    },
                },
                time_estimate: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                    validate: {
                        min: 0,
                        max: 999,
                    },
                },
                due_date: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                labels: {
                    type: DataTypes.JSON,
                    allowNull: true,
                    defaultValue: [],
                },
                created_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created posts table");
        }


        if (!tableNames.includes("post_votes")) {
            await queryInterface.createTable("post_votes", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                post_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'posts',
                        key: 'id',
                    },
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                }
            });
            console.log("Created post_votes table");
        }
        if (!tableNames.includes("projects")) {
            await queryInterface.createTable("projects", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                description: {
                    type: DataTypes.TEXT,
                    allowNull: true,
                },
                logo_url: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                status: {
                    type: DataTypes.TEXT,
                    defaultValue: 'active',
                    allowNull: false,
                    validate: {
                        isIn: [['active', 'archived']]
                    },
                },
                created_at: {
                    type: DataTypes.DATE,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created projects table");
        }

        if (!tableNames.includes("project_memberships")) {
            await queryInterface.createTable("project_memberships", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                project_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'projects',
                        key: 'id',
                    },
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created project_memberships table");
        }

        if (!tableNames.includes("smtp_config")) {
            await queryInterface.createTable("smtp_config", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    defaultValue: 1,
                },
                host: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                port: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 587,
                },
                username: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                use_tls: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                },
                from_address: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created smtp_config table");
        }

        if (!tableNames.includes("users")) {
            await queryInterface.createTable("users", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                username: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                    validate: {
                        len: [2, 30],
                        isAlphanumeric: {
                            args: true,
                            msg: 'Username can only contain letters and numbers'
                        }
                    },
                },
                email: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                    validate: {
                        isEmail: true,
                    },
                },
                password_hash: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                oauth_provider: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                oauth_id: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                is_admin: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                is_verified: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                },
                verification_code: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                verification_code_expires: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                profile_picture: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created users table");
        }

        if (!tableNames.includes("user_notification_preferences")) {
            await queryInterface.createTable("user_notification_preferences", {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                user_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    unique: true,
                    references: {
                        model: 'Users',
                        key: 'id'
                    },
                    onDelete: 'CASCADE',
                },
                notification_level: {
                    type: DataTypes.ENUM('off', 'important_only', 'all'),
                    defaultValue: 'all',
                    comment: 'Overall notification level: off (no emails), important_only (critical events), all (everything)',
                },
                post_created: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when a new post is created in projects I am a member of',
                },
                post_assigned: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when I am assigned to a post',
                },
                post_status_changed: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when post status changes (especially when closed/fixed)',
                },
                comment_on_my_post: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when someone comments on my posts',
                },
                admin_comment: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when an admin comments on posts',
                },
                added_to_project: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when I am added to a project',
                },
                removed_from_project: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: true,
                    comment: 'Email when I am removed from a project',
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
            });
            console.log("Created user_notification_preferences table");
        }

    },
};