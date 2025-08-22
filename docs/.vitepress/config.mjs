import {defineConfig} from 'vitepress'

export default defineConfig({
    title: 'TigerBug',
    description: 'A simple issue tracker for game devs',
    cleanUrls: true,
    ignoreDeadLinks: true,
    head: [
        ['link', {rel: 'icon', type: 'image/png', href: '/favicon.png'}]
    ],
    themeConfig: {
        logo: '/favicon.png',
        siteTitle: 'TigerBug',
        search: {
            provider: 'local'
        },
        nav: [
            {text: 'Guide', link: '/guide/getting-started'},
            {text: 'Configuration', link: '/configuration/environment-variables'}
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Guide',
                    items: [
                        {text: 'Getting Started', link: '/guide/getting-started'}
                    ]
                }
            ],
            '/configuration/': [
                {
                    text: 'Configuration',
                    items: [
                        {text: 'Environment Variables', link: '/configuration/environment-variables'},
                        {text: 'SMTP & Email', link: '/configuration/email-smtp'},
                        {text: 'OAuth', link: '/configuration/oauth'},
                        {text: 'Crash Reports', link: '/configuration/crash-reports'},
                    ]
                }
            ]
        },
        editLink: {
            pattern: 'https://github.com/TwoBitGames/TigerBug/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/TwoBitGames/TigerBug'}
        ],
        footer: {
            message: 'MIT License',
            copyright: '© 2025 TwoBit Games'
        }
    }
})
