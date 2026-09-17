import { defineConfig } from 'vitepress'

const repo = 'https://github.com/digital-mood/moodesk-support'

// Site base path. Kept in a constant so head assets resolve under it too.
const base = '/'

export default defineConfig({
  title: 'mooDesk',
  description: 'Public documentation and support portal for mooDesk, by digitalMood.',
  lang: 'en-US',
  base,
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#3c3c43' }]
  ],

  themeConfig: {
    siteTitle: 'mooDesk',

    nav: [
      { text: 'Guide', link: '/getting-started', activeMatch: '^/(getting-started|installation|configuration)' },
      { text: 'Features', link: '/features', activeMatch: '^/features' },
      { text: 'Integrations', link: '/integrations', activeMatch: '^/integrations' },
      { text: 'API', link: '/api', activeMatch: '^/api' },
      {
        text: 'Help',
        items: [
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Support', link: '/support' },
          { text: 'Changelog', link: '/changelog' }
        ]
      },
      { text: 'Report a Bug', link: `${repo}/issues/new?template=bug_report.yml` },
      { text: 'Feature Request', link: `${repo}/issues/new?template=feature_request.yml` }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Installation', link: '/installation' },
          { text: 'Configuration', link: '/configuration' }
        ]
      },
      {
        text: 'Product',
        items: [
          { text: 'Features', link: '/features' },
          { text: 'Integrations', link: '/integrations' },
          { text: 'API', link: '/api' }
        ]
      },
      {
        text: 'Help',
        items: [
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'FAQ', link: '/faq' },
          { text: 'Support', link: '/support' },
          { text: 'Changelog', link: '/changelog' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: repo }
    ],

    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: 'Suggest changes to this page'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    },

    footer: {
      message: 'mooDesk is a product by digitalMood.',
      copyright: 'Copyright © digitalMood'
    }
  }
})
