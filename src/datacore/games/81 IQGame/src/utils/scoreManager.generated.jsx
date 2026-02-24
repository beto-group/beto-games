"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';



const SAVE_FILE_PATH = ".datacore/game/duel-n-back/stats.json";
const LS_KEY = "iq-game-stats";

const DEFAULT_STATS = () => ({
    overall: { gamesPlayed: 0, totalHits: 0, totalMisses: 0, totalFalseAlarms: 0 },
    sessions: []
});

/**
 * Checks if the Obsidian vault adapter is fully available (not just truthy, but has required methods).
 */
function isAdapterAvailable() {
    const adapter = dc?.app?.vault?.adapter;
    return adapter && typeof adapter.exists === 'function' && typeof adapter.read === 'function';
}

/**
 * Ensures the directory exists (Obsidian-only).
 */
async function ensureDirectory() {
    if (!isAdapterAvailable()) return;
    const dir = SAVE_FILE_PATH.substring(0, SAVE_FILE_PATH.lastIndexOf("/"));
    if (!(await dc.app.vault.adapter.exists(dir))) {
        await dc.app.vault.adapter.mkdir(dir);
    }
}

/**
 * Loads current stats. Uses Obsidian vault if available, else localStorage.
 */
async function getStats() {
    if (isAdapterAvailable()) {
        try {
            if (await dc.app.vault.adapter.exists(SAVE_FILE_PATH)) {
                const content = await dc.app.vault.adapter.read(SAVE_FILE_PATH);
                return JSON.parse(content);
            }
        } catch (e) {
            console.error("IQGame: Failed to load stats from vault", e);
        }
    } else {
        // Web/Next.js fallback: use localStorage
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error("IQGame: Failed to load stats from localStorage", e);
        }
    }
    return DEFAULT_STATS();
}

/**
 * Saves the current session and updates overall stats.
 * @param {Object} sessionData - { nLevel, score: { pos, sound }, timestamp }
 */
async function saveSession(sessionData) {
    const stats = await getStats();

    const newSession = {
        timestamp: sessionData.timestamp || Date.now(),
        nLevel: sessionData.nLevel,
        score: sessionData.score
    };
    stats.sessions.push(newSession);
    stats.overall.gamesPlayed++;

    const { pos, sound } = sessionData.score;
    stats.overall.totalHits += (pos.hits + sound.hits);
    stats.overall.totalMisses += (pos.misses + sound.misses);
    stats.overall.totalFalseAlarms += (pos.falseAlarms + sound.falseAlarms);

    if (isAdapterAvailable()) {
        try {
            await ensureDirectory();
            await dc.app.vault.adapter.write(SAVE_FILE_PATH, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error("IQGame: Failed to save to vault", error);
        }
    } else {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(stats));
        } catch (error) {
            console.error("IQGame: Failed to save to localStorage", error);
        }
    }
}

async function resetStats() {
    const emptyStats = DEFAULT_STATS();

    if (isAdapterAvailable()) {
        try {
            await dc.app.vault.adapter.write(SAVE_FILE_PATH, JSON.stringify(emptyStats, null, 2));
        } catch (error) {
            console.error("IQGame: Failed to reset in vault", error);
            return null;
        }
    } else {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(emptyStats));
        } catch (error) {
            console.error("IQGame: Failed to reset in localStorage", error);
            return null;
        }
    }
    return emptyStats;
}

export {  saveSession, getStats, resetStats  };