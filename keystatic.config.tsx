import { config, fields, singleton } from '@keystatic/core';



export default config({
    storage: {
        kind: 'github',
        repo: {
            owner: 'beto-group',
            name: 'beto-games',
        },
    },
    ui: {
        brand: {
            name: 'Nexus Core',
            mark: () => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>Nexus</span>
                    <span style={{ color: '#aaa' }}>Core</span>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        :root {
                            color-scheme: dark !important;
                        }
                        /* Deeper black override */
                        body, [data-spectrum-theme="dark"] {
                            background-color: #000 !important;
                        }
                        header {
                            background-color: #050505 !important;
                            border-bottom: 1px solid #222 !important;
                        }
                        nav {
                            background-color: #050505 !important;
                        }
                    ` }} />
                </div>
            )
        },
        navigation: {
            Dashboard: ['agent_knowledge'],
            Website: ['pages'],
            Datacore: [
                'top_project_context',
                'top_best_practices',
                'top_troubleshooting',
                'top_hybrid_components'
            ],
        },
    },
    collections: {
        pages: {
            label: 'Website Pages',
            slugField: 'permalink',
            path: 'src/data/content/*',
            format: { contentField: 'content' },
            schema: {
                permalink: fields.slug({ name: { label: 'Permalink' } }),
                title: fields.text({ label: 'Title' }),
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        },
    },
    singletons: {
        site_settings: singleton({
            label: 'Site Settings',
            path: 'src/data/content/SETTINGS',
            format: { contentField: 'content' },
            schema: {
                title: fields.text({ label: 'Site Title', defaultValue: 'Nexus Core | The Next-Gen Software Platform' }),
                description: fields.text({ label: 'Site Description', multiline: true, defaultValue: 'Build, deploy, and manage futuristic web applications with Nexus Core.' }),
                keywords: fields.text({ label: 'Site Keywords', defaultValue: 'Next.js, Datacore, AI, Software Platform, Premium Design' }),
                content: fields.document({
                    label: 'Admin Notes',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
        agent_knowledge: singleton({
            label: 'Agent: Knowledge',
            path: '_resources/agents/KNOWLEDGE',
            format: { contentField: 'content' },
            schema: {
                content: fields.document({
                    label: 'Knowledge Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
        // Datacore Agent Resources
        top_best_practices: singleton({
            label: 'Datacore: Best Practices',
            path: '_resources/agents/BEST_PRACTICES',
            format: { contentField: 'content' },
            schema: {
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
        top_troubleshooting: singleton({
            label: 'Datacore: Troubleshooting',
            path: '_resources/agents/TROUBLESHOOTING',
            format: { contentField: 'content' },
            schema: {
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
        top_project_context: singleton({
            label: 'Datacore: Project Context',
            path: '_resources/agents/PROJECT_CONTEXT',
            format: { contentField: 'content' },
            schema: {
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
        top_hybrid_components: singleton({
            label: 'Datacore: Hybrid Components',
            path: '_resources/agents/HYBRID_COMPONENTS',
            format: { contentField: 'content' },
            schema: {
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                }),
            },
        }),
    },
});
