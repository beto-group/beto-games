"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';


const STYLES = {
    container: {
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: '100%',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        padding: '0 20px'
    },
    gameOverlay: {
        position: 'absolute',
        top: 'clamp(20px, 5vw, 40px)',
        left: 'clamp(20px, 5vw, 40px)',
        zIndex: 10,
        pointerEvents: 'none'
    },
    title: {
        fontSize: '48px',
        fontWeight: '900',
        letterSpacing: '0.4em',
        color: '#ffffff',
        textShadow: '0 0 10px rgba(255,255,255,0.5)',
        margin: 0,
        textTransform: 'uppercase',
        fontFamily: "'Inter', sans-serif"
    },
    score: {
        fontSize: 'clamp(80px, 25vw, 400px)',
        fontWeight: '900',
        color: 'rgba(255,255,255,0.04)',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        pointerEvents: 'none',
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '-2px'
    },
    startPrompt: {
        fontSize: '16px',
        color: '#ffffff',
        marginTop: '20px',
        fontFamily: "'Courier New', monospace",
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        animation: 'pulse 2s infinite',
        opacity: 0.7
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        opacity: 0.9 // Slight fade for atmosphere
    },
    glassCard: {
        background: 'rgba(5, 5, 5, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '0px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)'
    },
    enigmaticIndicator: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderLeft: 'clamp(2px, 0.4vw, 5px) solid #fff',
        paddingLeft: 'clamp(10px, 2vw, 30px)',
        animation: 'fadeIn 1s ease-out'
    },
    mysticalLabel: {
        fontSize: 'clamp(14px, 1.5vw, 32px)',
        fontWeight: '900',
        color: '#fff',
        letterSpacing: '2px',
        fontFamily: "'Inter', sans-serif",
        textShadow: '0 0 20px rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 0.5vw, 12px)'
    },
    minimalLeaderboard: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        zIndex: 100,
        width: 'min(400px, 100vw)',
        maxHeight: 'min(35vh, 400px)',
        marginLeft: 'auto', // Keeps it right-aligned on desktop
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(25px)',
        padding: 'min(3vh, 20px) 5vw',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        pointerEvents: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.9)',
        boxSizing: 'border-box'
    },
    leaderboardRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '2px 0',
        fontSize: '10px',
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    leaderboardHeader: {
        fontSize: '12px',
        color: '#fff',
        fontWeight: '900',
        marginBottom: '16px',
        letterSpacing: '4px',
        fontFamily: "'Inter', sans-serif",
        textTransform: 'uppercase',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px',
        opacity: 0.8
    },
    statusBanner: {
        fontSize: 'clamp(8px, 2vw, 11px)',
        color: '#aaa',
        letterSpacing: 'clamp(1px, 1vw, 4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: 'clamp(6px, 2vw, 10px) clamp(10px, 3vw, 20px)',
        marginBottom: 'clamp(15px, 4vh, 40px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: "'Inter', sans-serif",
        textTransform: 'uppercase',
        fontWeight: '700',
        maxWidth: '90vw',
        justifyContent: 'center'
    },
    heroTitle: {
        fontSize: 'clamp(18px, 10vw, 180px)',
        fontWeight: '900',
        letterSpacing: '-0.03em',
        color: '#fff',
        lineHeight: '0.85',
        margin: '0',
        textTransform: 'uppercase',
        textAlign: 'center',
        wordBreak: 'keep-all',
        maxWidth: '95%',
        textShadow: '0 0 50px rgba(255,255,255,0.3)',
        transition: 'all 0.5s ease-out'
    },
    heroSubtitle: {
        fontSize: 'clamp(8px, 1.5vw, 16px)',
        color: '#444',
        letterSpacing: 'clamp(2px, 0.8vw, 10px)',
        textTransform: 'uppercase',
        marginBottom: 'clamp(20px, 5vh, 60px)',
        fontFamily: "'Courier New', monospace",
        textAlign: 'center',
        maxWidth: '80vw'
    },
    secretLink: {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        fontSize: '9px',
        color: '#111',
        textDecoration: 'none',
        letterSpacing: '2px',
        transition: 'all 0.5s',
        cursor: 'pointer',
        zIndex: 50,
        opacity: 0.3
    },
    minimalButton: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#888',
        padding: '12px 24px',
        fontSize: '11px',
        letterSpacing: '4px',
        cursor: 'pointer',
        fontFamily: "'Inter', sans-serif",
        fontWeight: '600',
        textTransform: 'uppercase',
        transition: 'all 0.3s'
    },
    cyberInput: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 15px',
        color: '#fff',
        fontSize: '13px',
        fontFamily: "'Courier New', monospace",
        outline: 'none',
        letterSpacing: '2px',
        width: '140px',
        textAlign: 'center',
        transition: 'all 0.3s',
        '&:focus': {
            background: 'rgba(255, 255, 255, 0.08)',
            borderColor: '#fff'
        }
    },
    modIdPrompt: {
        fontSize: '10px',
        color: '#666',
        letterSpacing: '2px',
        marginBottom: '4px',
        fontWeight: '900'
    },
    bigSquareButton: {
        width: 'clamp(120px, 90%, 420px)',
        height: 'clamp(50px, 8vh, 90px)',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        gap: '4px',
        padding: '0 20px',
        boxSizing: 'border-box',
        overflow: 'hidden'
    },
    navButtonGroup: {
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        gap: 'min(1.2vw, 10px)',
        marginBottom: 'min(15vh, 120px)',
        pointerEvents: 'auto',
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0 min(5vw, 60px)',
        margin: '0 auto'
    },
    // Tutorials & About
    infoButton: {
        width: 'clamp(32px, 3.5vw, 60px)',
        height: 'clamp(32px, 3.5vw, 60px)',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.4)',
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 1.2, 1)',
        fontSize: 'clamp(14px, 1.6vw, 24px)',
        fontWeight: '900',
        pointerEvents: 'auto'
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Centered by default
        padding: '20px',
        textAlign: 'center',
        pointerEvents: 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
    },
    overlayContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1200px',
        minHeight: '100%',
        padding: '60px 20px',
        boxSizing: 'border-box'
    },
    aboutText: {
        fontSize: 'clamp(14px, 2vw, 18px)',
        lineHeight: '1.6',
        color: '#ccc',
        maxWidth: '600px',
        marginBottom: '40px',
        fontWeight: '400',
        letterSpacing: '1px'
    },
    tutorialGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: '15px',
        width: '100%',
        maxWidth: '1000px',
        marginTop: '20px',
        padding: '0 10px',
        marginBottom: '40px'
    },
    tutorialCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
    tutorialIcon: {
        fontSize: '24px',
        marginBottom: '10px'
    },
    tutorialLabel: {
        fontSize: 'clamp(10px, 1.2vw, 12px)', // Slightly smaller
        fontWeight: '900',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#fff'
    },
    controlInfo: {
        fontSize: 'clamp(8px, 1vw, 10px)', // Slightly smaller
        color: '#888', // brighter for better legibility through transparency
        letterSpacing: '1px',
        textTransform: 'uppercase'
    },
    inGameTutorial: {
        position: 'absolute',
        top: 'clamp(120px, 18vh, 180px)', // Moved up slightly
        left: 'clamp(15px, 4vw, 30px)', // More compact
        zIndex: 400,
        background: 'rgba(0,0,0,0.3)', // Significantly more transparent
        borderLeft: 'clamp(3px, 0.6vw, 8px) solid rgba(255, 255, 255, 0.8)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: 'clamp(10px, 2vw, 16px) clamp(14px, 3vw, 24px)', // Compact padding
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: '6px',
        pointerEvents: 'none',
        backdropFilter: 'blur(6px)', // Reduced blur for better visibility through
        opacity: 0,
        transform: 'translateX(-120%)',
        maxWidth: 'min(280px, 75vw)' // Restricted width for mobile
    },
    tutorialEntering: {
        animation: 'slideInLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
    },
    tutorialExiting: {
        animation: 'slideOutLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
    },
    controlVisualContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginTop: '10px'
    },
    arrowKeyLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        width: '60px'
    },
    keyCap: {
        width: '18px',
        height: '18px',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        color: '#fff',
        background: 'rgba(255,255,255,0.05)',
        transition: 'all 0.1s'
    },
    keyCapActive: {
        animation: 'keyTapPulse 0.5s infinite ease-in-out'
    },
    swipeVisual: {
        width: '60px',
        height: '40px',
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.2)',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    swipeFinger: {
        width: '10px',
        height: '10px',
        background: '#fff',
        borderRadius: '50%',
        position: 'absolute',
        boxShadow: '0 0 10px #fff',
        transition: 'all 0.1s',
        opacity: 0.8
    },
    swipeFingerActive: {
        animation: 'pulse 0.8s infinite reverse'
    },
    fingerHolding: {
        animation: 'fingerHoldSwell 2s infinite ease-in-out'
    },
    spaceBar: {
        width: '100px',
        height: '16px',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '8px',
        fontWeight: '900',
        letterSpacing: '2px',
        color: '#fff',
        marginTop: '8px'
    },
    spaceBarActive: {
        animation: 'keyTapPulse 0.6s infinite ease-in-out'
    },
    tapIcon: {
        fontSize: '24px',
        animation: 'pulse 1s infinite'
    },
    acknowledgeButton: {
        marginBottom: '60px',
        padding: '16px 80px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.4)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '900',
        letterSpacing: '4px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        textTransform: 'uppercase',
        display: 'inline-block',
        minWidth: '240px'
    }
};

export {  STYLES  };