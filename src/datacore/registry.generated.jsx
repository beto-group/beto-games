"use client";
import React from 'react';

const loaders = {
    'Arena': () => import('./Arena/index.generated'),
    'GameArcade': () => import('./GameArcade/index.generated'),
    'GlobalLeaderboard': () => import('./GlobalLeaderboard/index.generated'),
    'LiveTicker': () => import('./LiveTicker/index.generated'),
    'IQGame': () => import('./games/81 IQGame/src/index.generated'),
    'EvolutionEngine': () => import('./games/EvolutionEngine/index.generated'),
    'RetroMorphGame': () => import('./games/RetroMorphGame/src/index.generated'),
    'mapglobe': () => import('./games/24.3 MapGlobe/D.q.mapglobe.component.v3.generated'),
    'MAP GLOBE v3': () => import('./games/24.3 MapGlobe/MAP GLOBE v3.generated')
};

export const Registry = new Proxy(loaders, {
    get: function(target, prop) {
        if (prop in target) {
            return async () => {
                try {
                    const mod = await target[prop]();
                    return mod;
                } catch (e) {
                    console.error('[Registry] Failed to load component:', prop, e);
                    return { default: () => <div style={{color: 'red'}}>Failed to load {String(prop)}</div> };
                }
            };
        }
        return undefined;
    }
});

console.log('🚀 [Registry] Initialized with:', Object.keys(loaders));
