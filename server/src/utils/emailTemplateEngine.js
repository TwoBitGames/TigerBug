const fs = require('fs').promises;
const path = require('path');

class EmailTemplateEngine {
    constructor() {
        this.templateCache = new Map();
        this.templatePath = path.join(__dirname, '../templates/email-template.html');
    }

    async loadTemplate() {
        if (!this.templateCache.has('base')) {
            try {
                const template = await fs.readFile(this.templatePath, 'utf8');
                this.templateCache.set('base', template);
            } catch (error) {
                console.error('Failed to load email template:', error);
                throw new Error('Email template not found');
            }
        }
        return this.templateCache.get('base');
    }

    interpolate(template, variables) {
        let result = template;

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, variables[key] || '');
        });

        result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
            return variables[condition] ? content : '';
        });

        result = result.replace(/{{[^}]+}}/g, '');

        return result;
    }

    async renderEmail(data) {
        const template = await this.loadTemplate();
        return this.interpolate(template, {
            baseUrl: process.env.CLIENT_URL || 'http://localhost:5173',
            ...data
        });
    }
}

const emailContents = {
    verification: (verificationCode, verificationUrl) => ({
        subject: 'Verify your email address - TigerBug',
        heroTitle: 'Welcome to TigerBug!',
        heroSubtitle: 'Please verify your email address to complete your registration and start tracking bugs like a pro.',
        mainContent: `
            <div class="content-block">
                <p>Thank you for joining TigerBug! To get started, we need to verify your email address. Choose one of the options below:</p>
            </div>
            
            <div class="cta-section">
                <a href="${verificationUrl}" class="btn">Verify Email Address</a>
            </div>
            
            <div class="divider">
                <span class="divider-text">OR</span>
            </div>
            
            <div class="content-block">
                <p style="text-align: center; margin-bottom: 16px;">Enter this verification code manually:</p>
            </div>
            
            <div class="verification-code">
                <div class="code-label">Your Verification Code</div>
                <div class="code-value">${verificationCode}</div>
            </div>
            
            <div class="info-box warning">
                <p><strong>Important:</strong> This verification code will expire in 24 hours for security reasons.</p>
            </div>
        `,
        showCta: false
    }),

    postNotification: (post, action) => ({
        subject: `[${post.Project.name}] ${action}: ${post.title}`,
        heroTitle: `Post ${action}`,
        heroSubtitle: `A post has been ${action.toLowerCase()} in project "${post.Project.name}"`,
        mainContent: `
            <div class="content-block">
                <h2>Post Details</h2>
                <p><strong>Project:</strong> ${post.Project.name}</p>
                <p><strong>Status:</strong> <span style="background: #e0f2fe; color: #0277bd; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${post.status}</span></p>
                <p><strong>Author:</strong> ${post.author.email}</p>
            </div>
            
            <div class="info-box">
                <h3 style="margin-bottom: 12px; color: #1f2937;">Description</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${post.description}</p>
            </div>
        `,
        showCta: true,
        ctaText: 'View Post',
        ctaUrl: `${process.env.CLIENT_URL}/projects/${post.project_id}/issues/${post.id}`
    }),

    commentNotification: (comment, post) => ({
        subject: `[${post.Project.name}] New comment on: ${post.title}`,
        heroTitle: 'New Comment',
        heroSubtitle: `${comment.author.email} added a comment to "${post.title}"`,
        mainContent: `
            <div class="content-block">
                <h2>Post Details</h2>
                <p><strong>Project:</strong> ${post.Project.name}</p>
                <p><strong>Commented by:</strong> ${comment.author.email}</p>
            </div>
            
            <div class="info-box success">
                <h3 style="margin-bottom: 12px; color: #1f2937;">Comment</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${comment.message}</p>
            </div>
        `,
        showCta: true,
        ctaText: 'View Discussion',
        ctaUrl: `${process.env.CLIENT_URL}/projects/${post.project_id}/issues/${post.id}`
    }),

    welcome: (userEmail) => ({
        subject: 'Welcome to TigerBug!',
        heroTitle: 'Welcome Aboard!',
        heroSubtitle: 'You\'re all set to start tracking bugs and managing projects efficiently.',
        mainContent: `
            <div class="content-block">
                <p>Hi there!</p>
                <p>Welcome to TigerBug! We're excited to have you on board. Your account (<strong>${userEmail}</strong>) is now verified and ready to use.</p>
            </div>
            
            <div class="content-block">
                <h2>What's Next?</h2>
                <p>Here are some things you can do to get started:</p>
                <ul style="margin-left: 20px; color: #4b5563;">
                    <li>Create your first project</li>
                    <li>Submit bug reports and feature requests</li>
                    <li>Collaborate with your team</li>
                    <li>Track issue progress</li>
                </ul>
            </div>
            
            <div class="info-box">
                <p><strong>Pro Tip:</strong> Use labels and priorities to organize your issues effectively!</p>
            </div>
        `,
        showCta: true,
        ctaText: 'Get Started',
        ctaUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    }),

    testEmail: () => ({
        subject: 'SMTP Configuration Test - TigerBug',
        heroTitle: 'Test Email',
        heroSubtitle: 'Your SMTP configuration is working correctly!',
        mainContent: `
            <div class="content-block">
                <p>Congratulations! This test email confirms that your SMTP configuration is working properly.</p>
                <p>You can now send system notifications including:</p>
                <ul style="margin-left: 20px; color: #4b5563;">
                    <li>Welcome emails for new users</li>
                    <li>Email verification messages</li>
                    <li>Post and comment notifications</li>
                    <li>Password reset emails</li>
                </ul>
            </div>
            
            <div class="info-box">
                <p><strong>Note:</strong> This is a test message sent from your TigerBug system. You can safely ignore it.</p>
            </div>
        `,
        showCta: false
    })
};

module.exports = {
    EmailTemplateEngine,
    emailContents
};
