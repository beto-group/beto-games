"use client";
import React from 'react';
import { STYLES } from '../../styles/styles.generated.jsx';
import { Navbar } from '../Navbar.generated';

export default function MainLayout({ children, activeTab, setActiveTab, navItems }) {
    return (
        <div style={STYLES.container}>
            <Navbar
                currentPage={activeTab}
                setCurrentPage={setActiveTab}
                navItems={navItems}
                STYLES={STYLES}
            />
            <main style={STYLES.mainContent}>
                {children}
            </main>
        </div>
    );
}
