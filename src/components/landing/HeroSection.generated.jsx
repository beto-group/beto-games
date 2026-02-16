"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


function HeroSection({ STYLES, title, subtitle, buttonText }) {
    const displayTitle = title || "BETO.GROUP";
    const displaySubtitle = subtitle || "An ecosystem for creators, thinkers, and players. We build connections beyond the now.";
    const displayButton = buttonText || "EXPLORE THE CORE";

    return (
        <section style={STYLES.heroSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 style={STYLES.heroTitle}>
                    {displayTitle}
                </h1>

                <h2 style={{ ...STYLES.heroTitle, marginTop: '-0.1em', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.35em',
                        letterSpacing: '0.4em',
                        color: '#71717a',
                        fontWeight: '400',
                        marginTop: '0.2em'
                    }}>BEYOND THE</span>
                    <span>NOW</span>
                </h2>

                <h2 style={{ ...STYLES.heroTitle, marginTop: '-0.1em', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.35em',
                        letterSpacing: '0.4em',
                        color: '#71717a',
                        fontWeight: '400',
                        marginTop: '0.2em'
                    }}>WE</span>
                    <span>BUILD</span>
                </h2>
            </div>

            <p style={STYLES.heroSubtitle}>
                {displaySubtitle}
            </p>

            <button
                style={STYLES.ctaButton}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.backgroundColor = "#f4f4f5";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.backgroundColor = "#ffffff";
                }}
            >
                {displayButton}
            </button>
        </section>
    );
}

export {  HeroSection  };