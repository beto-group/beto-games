"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


const STYLES = {
    // Layout
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: "'Inter', 'Roboto', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        containerType: 'inline-size', // Enable Container Queries for 1:1 scaling
    },
    mainContent: {
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },

    // Navbar
    navbar: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        padding: '24px 20px',
        position: 'sticky',
        top: 0,
        top: 0,
        zIndex: 9999,
        background: 'linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0.8) 100%)',
        backdropFilter: 'blur(5px)',
        width: '100%',
    },
    navButton: (isActive) => ({
        background: 'none',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        appearance: 'none',
        color: isActive ? '#fff' : '#71717a',
        fontSize: '11px',
        fontWeight: isActive ? '900' : '400',
        cursor: 'pointer',
        padding: '10px 0',
        transition: 'color 0.2s ease',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        fontFamily: 'inherit',
        borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
    }),

    // Hero Section
    heroSection: {
        width: "100%",
        maxWidth: "1400px",
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 6cqw", // Use Container Scaling
        boxSizing: "border-box",
    },
    heroTitle: {
        fontSize: "clamp(48px, 12cqw, 150px)", // Responsive scaling
        fontWeight: "bold",
        color: "#ffffff",
        margin: 0,
        letterSpacing: "-0.05em", // Match beto-landing-page tracking-tighter
        lineHeight: "0.85", // Match beto-landing-page
        textTransform: "uppercase",
    },
    heroSubtitle: {
        fontSize: "clamp(16px, 2.5cqw, 24px)",
        color: "#a1a1aa", // zinc-400
        marginTop: "32px",
        maxWidth: "600px",
        lineHeight: "1.6",
    },
    ctaButton: {
        fontSize: "14px",
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: "0.1em",

        marginTop: "48px",
        padding: "20px 48px",
        backgroundColor: "#ffffff",
        color: "#000000",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.2s ease, background-color 0.2s ease",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "240px",
        minWidth: "240px",
        alignSelf: "flex-start",
    },

    // Markdown / Content
    contentWrapper: {
        width: '100%',
        margin: '0 auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden'
    },
    glassCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
    },
};

export {  STYLES  };