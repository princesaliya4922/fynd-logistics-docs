import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'doc',
      id: 'README',
      label: 'Home',
    },
    {
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: [
        'overview/introduction',
        'overview/ecosystem-map',
        'overview/glossary',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/prerequisites',
        'getting-started/local-setup-backend',
        'getting-started/local-setup-promise',
        'getting-started/local-setup-logistics',
        'getting-started/environment-variables',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/system-overview',
        'architecture/shopify-backend',
        'architecture/fynd-promise',
        'architecture/fynd-logistics',
        'architecture/data-flow',
        'architecture/authentication',
        'architecture/integrations',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api-backend',
        'reference/api-promise-frontend',
        'reference/api-logistics-frontend',
        'reference/database-schemas',
        'reference/shopify-extensions',
        'reference/webhooks',
        'reference/billing',
      ],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      items: [
        'how-to/install-promise-app',
        'how-to/install-logistics-app',
        'how-to/configure-delivery-promise',
        'how-to/fulfill-an-order',
        'how-to/handle-returns',
        'how-to/deploy-new-version',
        'how-to/run-billing-cron',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/environments',
        'operations/infrastructure',
        'operations/monitoring',
        'operations/ci-cd',
        'operations/incident-response',
        'operations/rollback',
      ],
    },
    {
      type: 'category',
      label: 'Decisions (ADRs)',
      items: [
        'decisions/adr-001-sqlite-vs-redis',
        'decisions/adr-002-india-only',
        'decisions/adr-003-docs-platform',
      ],
    },
    {
      type: 'category',
      label: 'Quality',
      items: [
        'quality/testing',
        'quality/linting',
        'quality/known-gaps',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/contribution-guide',
        'contributing/repo-structure',
      ],
    },
    {
      type: 'category',
      label: 'Data Pipeline',
      items: [
        'data-pipeline/overview',
        'data-pipeline/collections-synced',
        'data-pipeline/pipeline-management',
      ],
    },
    {
      type: 'category',
      label: 'Business Context',
      items: [
        'business/fynd-promise-product',
        'business/fynd-logistics-product',
      ],
    },
  ],
};

export default sidebars;
