"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


"use client";

if (typeof window !== 'undefined') console.log('🚀 [ENTRY] client_page.jsx evaluation started');

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import '../../web/shim'; // Initialize shim (relative to src/app/[[...slug]])
import { STYLES } from '../../styles/styles.generated.jsx';
import { WebsiteBuilder } from '../../components/WebsiteBuilder.generated';
import { Navbar } from '../../components/Navbar.generated';
import { HeroSection } from '../../components/landing/HeroSection.generated';
import { PrototypePage } from '../../components/landing/PrototypePage.generated';
import { MarkdownRenderer } from '../../components/MarkdownRenderer.generated.jsx';
import { DatacoreShim } from '../../components/DatacoreShim.generated.jsx';
import { Footer } from '../../components/Footer.generated';
import { PageRouter } from '../../components/PageRouter.generated';
import { VersionLogger } from '../../components/VersionLogger.generated';
import { useRouting } from '../../hooks/useRouting.generated.jsx';

// New Platform Components
import { View as EvolutionEngine } from '../../datacore/games/EvolutionEngine/index.generated';
import { View as LiveTicker } from '../../datacore/LiveTicker/index.generated';
import { View as GameArcade } from '../../datacore/GameArcade/index.generated';
import { GameCard } from '../../components/arcade/GameCard.generated';
import { View as GlobalLeaderboard } from '../../datacore/GlobalLeaderboard/index.generated';
import { View as Arena } from '../../datacore/Arena/index.generated';
import { AnimatedLogo } from '../../components/AnimatedLogo.generated';
import { useIsMobile } from '../../hooks/useIsMobile.generated';
import { View as RetroMorphGame } from '../../datacore/games/RetroMorphGame/src/index.generated';

export default function ClientHome({ params }) {
    const folderPath = '/content';
    // Mock dcApi for web view since we rely on shims
    const dcApi = {
        ...(typeof window !== 'undefined' ? window.dc : {}),
        useState,
        useEffect,
        useRef,
        useCallback,
        useMemo
    };

    return (
        <div style={{ width: '100%' }}>
            <WebsiteBuilder
                STYLES={STYLES}
                Navbar={Navbar}
                Footer={Footer}
                PageRouter={PageRouter}
                HeroSection={HeroSection}
                PrototypePage={PrototypePage}
                MarkdownRenderer={MarkdownRenderer}
                DatacoreShim={DatacoreShim}
                VersionLogger={VersionLogger}
                folderPath={folderPath}
                // Testing: Force full tab mode for web view
                isFullTab={true}
                onToggleFullTab={() => { }}
                useRouting={useRouting}
                params={params}
                dc={dcApi}
                EvolutionEngine={EvolutionEngine}
                LiveTicker={LiveTicker}
                GameArcade={GameArcade}
                GameCard={GameCard}
                GlobalLeaderboard={GlobalLeaderboard}
                Arena={Arena}
                RetroMorphGame={RetroMorphGame}
                AnimatedLogo={AnimatedLogo}
                useIsMobile={useIsMobile}
            />
        </div>
    );
}
