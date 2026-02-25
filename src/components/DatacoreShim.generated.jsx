"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function DatacoreShim(props) {
    const { name, componentProps = {}, folderPath, STYLES, setCurrentPage } = props;
    if (typeof window !== 'undefined' && name === 'IQGame') {
        console.log(`💎 [DatacoreShim:${name}] setCurrentPage passed:`, !!setCurrentPage);
    }
    const localDc = props.dc || (typeof dc !== 'undefined' ? dc : (typeof window !== 'undefined' ? window.dc : null));
    const isRealDatacore = typeof dc !== 'undefined' && dc.app?.vault && (window.app || window.obsidian);
    // Hooks provided by React import
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadComponent = async () => {
            try {

                const projectRoot = folderPath.replace(/\/$/, '');
                // On web, content is served from /content root (standardized in build-shim)
                const basePath = isRealDatacore ? `${projectRoot}/src/datacore` : '/content/datacore';
                let actualPath = '';
                let componentId = '';

                // 1. Resolve actual folder path
                if (name === 'MapGlobe' || name === 'mapglobe') {
                    actualPath = `${basePath}/games/24.2 MapGlobe`;
                    componentId = 'D.q.mapglobe.component.v2.md';
                } else if (name === 'IQGame') {
                    actualPath = `${basePath}/games/81 IQGame`;
                    componentId = 'src/index.jsx';
                } else if (name === 'RetroMorphGame') {
                    actualPath = `${basePath}/games/RetroMorphGame`;
                    componentId = 'src/index.jsx';
                } else {
                    actualPath = `${basePath}/${name}`;
                    componentId = 'index.jsx';
                }

                if (props.component) {
                    // console.log(`💎 [DatacoreShim] Using direct component prop for ${name || 'anonymous'}`);
                    let Comp = props.component;

                    // Resolve the specific folder path for local dependencies
                    const actualSubPath = (name === 'MapGlobe' || name === 'mapglobe') ? `src/datacore/games/24.2 MapGlobe` :
                        (name === 'IQGame') ? `src/datacore/games/81 IQGame` :
                            (name === 'RetroMorphGame') ? `src/datacore/games/RetroMorphGame` : `src/datacore/${name}`;
                    const specificFolderPath = isRealDatacore ? `${folderPath}/${actualSubPath}` : actualSubPath;

                    // Apply AsyncFactory logic
                    const isAsyncComp = Comp && (
                        Comp.constructor?.name === 'AsyncFunction' ||
                        Comp[Symbol.toStringTag] === 'AsyncFunction' ||
                        Object.prototype.toString.call(Comp) === '[object AsyncFunction]'
                    );

                    if (isAsyncComp) {
                        const factoryResult = await Comp({ ...componentProps, ...props.components, folderPath: specificFolderPath, isInception: true, dc: localDc, STYLES, setCurrentPage }, localDc);
                        Comp = factoryResult;
                    }

                    if (Comp) setComponent(() => Comp);
                    else throw new Error("Provided component prop resolved to null");

                } else if (isRealDatacore) {
                    // --- Obsidian Logic ---
                    let pathToRequire = '';

                    if (name === 'MapGlobe') {
                        const mdPath = `${actualPath}/${componentId}`;
                        const genPath = `${actualPath}/MapGlobe.generated.jsx`;
                        const content = await dc.app.vault.adapter.read(mdPath);
                        const match = content.match(/```jsx\n([\s\S]*?)\n```/);
                        if (match && match[1]) {
                            const jsxContent = `/** Generated from ${componentId} **/\n${match[1]}`;
                            let shouldWrite = true;
                            try {
                                const current = await dc.app.vault.adapter.read(genPath);
                                if (current === jsxContent) shouldWrite = false;
                            } catch (e) { }
                            if (shouldWrite) await dc.app.vault.adapter.write(genPath, jsxContent);
                            pathToRequire = genPath;
                        }
                    } else {
                        pathToRequire = `${actualPath}/${componentId}`;
                    }

                    if (!pathToRequire) throw new Error(`Could not resolve path for ${name}`);

                    // console.log(`💎 [DatacoreShim] Requiring: ${pathToRequire}`);
                    const res = await dc.require(pathToRequire);

                    // Unified component resolution
                    let Comp = res.View || res.default || (typeof res === 'function' ? res : null);
                    if (!Comp && typeof res === 'object') {
                        Comp = Object.values(res).find(v => typeof v === 'function');
                    }

                    // ONLY execute as a factory if it's explicitly async. 
                    const isAsyncComp = Comp && (
                        Comp.constructor?.name === 'AsyncFunction' ||
                        Comp[Symbol.toStringTag] === 'AsyncFunction' ||
                        Object.prototype.toString.call(Comp) === '[object AsyncFunction]'
                    );

                    if (isAsyncComp) {
                        // console.log(`💎 [DatacoreShim] Executing async factory for ${name}`);
                        const factoryResult = await Comp({ ...componentProps, ...props.components, folderPath: actualPath, isInception: true, dc: localDc, setCurrentPage }, localDc);
                        Comp = factoryResult;
                    }

                    if (Comp) setComponent(() => Comp);
                    else throw new Error(`Could not find a valid component for ${name} in ${pathToRequire}`);
                } else {
                    // --- Web Logic (Next.js) ---
                    // console.log(`🌐 [DatacoreShim] Loading ${name} via Web Registry... dc.require: ${typeof localDc?.require}`);

                    let Registry = {};
                    try {
                        const registryMod = await import('../datacore/registry.generated');
                        Registry = registryMod.Registry || {};
                    } catch (e) {
                        console.warn('⚠️ [DatacoreShim] Failed to load registry.generated.jsx', e);
                    }

                    if (Registry && Registry[name]) {
                        const loader = Registry[name];
                        const mod = await loader();

                        let Comp = mod.View || mod.default || mod;

                        // Fallback: If mod is an object (like { IQGame }), find the first function
                        if (Comp && typeof Comp === 'object' && !Comp.$$typeof && !Comp.type) {
                            const firstFn = Object.values(Comp).find(v => typeof v === 'function');
                            if (firstFn) Comp = firstFn;
                        }

                        // Apply same AsyncFactory logic for web parity
                        const isAsyncCompWeb = Comp && (
                            Comp.constructor?.name === 'AsyncFunction' ||
                            Comp[Symbol.toStringTag] === 'AsyncFunction' ||
                            Object.prototype.toString.call(Comp) === '[object AsyncFunction]' ||
                            Comp.name === 'View' ||
                            /async\s+function/.test(Comp.toString())
                        );

                        if (isAsyncCompWeb) {
                            // console.log(`🌐 [DatacoreShim] Executing async factory for ${name} on Web...`);
                            const factoryResult = await Comp({ ...componentProps, ...props.components, folderPath: actualPath, isInception: true, dc: localDc, STYLES, setCurrentPage }, localDc);
                            Comp = factoryResult;
                        }

                        if (Comp) setComponent(() => Comp);
                        else throw new Error(`Could not resolve module content for ${name}`);

                    } else if (name === 'BasicFolderView') {
                        setError("BasicFolderView requires Native Obsidian Vault access to list files. It is only available in the Datacore environment.");
                    } else {
                        throw new Error(`Component ${name} not found in Web Registry. Run npm run shim.`);
                    }
                }
            } catch (err) {
                console.error(`[DatacoreShim] Failed to load ${name}:`, err);
                setError(err.message);
            }
        };
        loadComponent();
    }, [name, folderPath]);

    if (error) return (
        <div style={{ color: '#f87171', padding: '20px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171', borderRadius: '12px', margin: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Failed to load {name}</div>
            <code style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{error}</code>
        </div>
    );

    if (!Component) return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#000'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                border: '3px solid rgba(168, 85, 247, 0.2)',
                borderTop: '3px solid #a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    // Resolve the specific folder path for rendering
    const actualSubPath = (name === 'MapGlobe' || name === 'mapglobe') ? `src/datacore/games/24.2 MapGlobe` :
        (name === 'IQGame') ? `src/datacore/games/81 IQGame` :
            (name === 'RetroMorphGame') ? `src/datacore/games/RetroMorphGame` : `src/datacore/${name}`;
    const specificFolderPath = isRealDatacore ? `${folderPath}/${actualSubPath}` : actualSubPath;

    // Detect if Component is a React Element (object) or a Function
    if (typeof Component === 'object' && Component !== null) {
        // Stricter check for React elements
        const looksLikeElement = Component.$$typeof || Component.type || Component.props;

        if (looksLikeElement) {
            // console.log(`💎 [DatacoreShim] Rendering ${name} as React Element`);
            return Component;
        }

        console.warn(`⚠️ [DatacoreShim] Resolved component for "${name}" is an object but doesn't look like a React element:`, Component);
        return (
            <div style={{ color: '#f87171', padding: '10px', fontSize: '12px' }}>
                Error: Component "{name}" is not a valid React element.
                <pre style={{ fontSize: '10px' }}>{JSON.stringify(Object.keys(Component), null, 2)}</pre>
            </div>
        );
    }

    // Render as a React Component (Function)
    if (typeof Component === 'function') {
        // console.log(`💎 [DatacoreShim] Rendering ${name} as React Function`);
        return <Component {...componentProps} {...props.components} dc={localDc} STYLES={STYLES} folderPath={specificFolderPath} setCurrentPage={setCurrentPage} />;
    }

    return <div style={{ color: '#f87171', padding: '10px' }}>Error: Component "{name}" resolution failed.</div>;
}

export {  DatacoreShim  };