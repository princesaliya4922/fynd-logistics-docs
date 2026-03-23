import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Fynd Shopify Docs',
  tagline: 'Documentation for Fynd Promise, Fynd Logistics & Shared Backend',
  favicon: 'img/favicon.ico',

  url: 'https://fynd-docs.vercel.app',
  baseUrl: '/',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],
  plugins: [
    function forceWebpackHmr() {
      return {
        name: 'force-webpack-hmr',
        configureWebpack(_config: unknown, isServer: boolean) {
          if (isServer) {
            return {};
          }

          // Workaround for environments where WDS injects HMR client but HMR
          // plugin is missing, causing "[HMR] Hot Module Replacement is disabled."
          // in the browser and a blank page.
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const webpack = require('webpack');
          return {
            plugins: [new webpack.HotModuleReplacementPlugin()],
          };
        },
      };
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
      defaultMode: 'light',
    },
    navbar: {
      title: 'Fynd Shopify Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          label: 'API Reference',
          to: 'reference/api-backend',
          position: 'left',
        },
        {
          label: 'Architecture',
          to: 'architecture/system-overview',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Get Started',
          items: [
            { label: 'Introduction', to: 'overview/introduction' },
            { label: 'Prerequisites', to: 'getting-started/prerequisites' },
            { label: 'Local Setup — Backend', to: 'getting-started/local-setup-backend' },
          ],
        },
        {
          title: 'Reference',
          items: [
            { label: 'Backend API', to: 'reference/api-backend' },
            { label: 'Database Schemas', to: 'reference/database-schemas' },
            { label: 'Webhooks', to: 'reference/webhooks' },
          ],
        },
        {
          title: 'Operations',
          items: [
            { label: 'Environments', to: 'operations/environments' },
            { label: 'Monitoring', to: 'operations/monitoring' },
            { label: 'Incident Response', to: 'operations/incident-response' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fynd (Reliance Retail). Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
