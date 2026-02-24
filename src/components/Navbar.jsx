function Navbar({ currentPage, setCurrentPage, STYLES, navItems = [], AnimatedLogo, useIsMobile }) {
    const { useState, useEffect } = dc;
    // Dependencies are now injected via props

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playTrigger, setPlayTrigger] = useState(0);
    const isMobile = useIsMobile();

    /*
    if (typeof window !== 'undefined') {
        console.log("💎 [Navbar] Rendered", { isMobile, isMenuOpen, hasLogo: !!AnimatedLogo });
    }
    */

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMenuOpen]);

    const handleLogoClick = (e) => {
        e.preventDefault();
        setIsMenuOpen(false);
        if (isMobile) {
            setPlayTrigger(prev => prev + 1);
        }
        setCurrentPage('HOME');
    };

    const globalNavigation = (navItems && navItems.length > 0)
        ? navItems.map(item => typeof item === 'string' ? { label: item, value: item } : item)
        : [
            // Internal Pages
            { label: 'BEGIN', value: 'HOME' },
            { label: 'GAMES', value: 'GAMES' },
            { label: 'ABOUT', value: 'ABOUT' },
            // Separator
            { separator: true },
            // External Links
            { label: 'HOME', url: 'https://beto.group', external: true },
            { label: 'MARKETPLACE', url: 'https://marketplace.beto.group', external: true },
            { label: 'SUPPORT', url: 'https://beto.group/support', external: true },
        ];


    const navStyles = `
        .navbar-slogan-container {
             position: absolute;
             left: 50%;
             top: 50%;
             transform: translate(-50%, -50%);
             display: block;
             white-space: nowrap;
             pointer-events: none;
        }
        @media (max-width: 1100px) {
            .navbar-slogan-container {
                display: none !important;
            }
        }
    `;

    return (
        <>
            <style>{navStyles}</style>
            <header style={{
                position: 'sticky',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 9999,
                borderBottom: '1px solid #18181b',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                transition: 'all 0.3s ease-in-out'
            }}>
                <div style={{
                    maxWidth: '1600px',
                    margin: '0 auto',
                    padding: '8px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

                        {/* Logo */}
                        <a href="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10, textDecoration: 'none' }} aria-label="BETO.GROUP Homepage">
                            <AnimatedLogo playTrigger={playTrigger} useIsMobile={useIsMobile} />
                        </a>

                        {/* Slogan (Desktop) */}
                        <div className="navbar-slogan-container">
                            <p style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '20px',
                                textAlign: 'center',
                                fontVariant: 'small-caps',
                                letterSpacing: '0.05em',
                                margin: 0
                            }}>
                                an ecosystem for creators, thinkers and players
                            </p>
                        </div>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                zIndex: 80,
                                position: 'relative',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'transform 0.3s',
                                transform: isMenuOpen ? 'scale(1.1)' : 'scale(1)'
                            }}
                            aria-label="Toggle Menu"
                        >
                            <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* Menu Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28" height="28" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{
                                        position: 'absolute',
                                        transition: 'all 0.5s cubic-bezier(0.32,0.72,0,1)',
                                        opacity: isMenuOpen ? 0 : 1,
                                        transform: isMenuOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0) scale(1)'
                                    }}
                                >
                                    <line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line>
                                </svg>
                                {/* Close Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28" height="28" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    style={{
                                        position: 'absolute',
                                        transition: 'all 0.5s cubic-bezier(0.32,0.72,0,1)',
                                        opacity: isMenuOpen ? 1 : 0,
                                        transform: isMenuOpen ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0.5)'
                                    }}
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                        </button>

                    </div>
                </div>
            </header>

            {/* Full Screen Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998, // Just below sticky header (9999)
                paddingTop: '128px',
                backgroundColor: 'rgba(9, 9, 11, 0.7)', // Semi-transparent zinc-950
                backdropFilter: 'blur(20px)', // Frosted glass effect
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                transition: 'all 0.5s cubic-bezier(0.32,0.72,0,1)',
                opacity: isMenuOpen ? 1 : 0,
                visibility: isMenuOpen ? 'visible' : 'hidden',
                pointerEvents: isMenuOpen ? 'auto' : 'none'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '1600px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    height: '100%'
                }}>
                    <nav style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '24px',
                        textAlign: 'right',
                        maxHeight: 'calc(100vh - 160px)',
                        overflowY: 'auto',
                        padding: '32px 0',
                        width: 'auto',
                        minWidth: '200px'
                    }}>
                        {globalNavigation.map((nav, index) => {
                            const delay = isMenuOpen ? 100 + (index * 50) : 0;

                            // Handle Separator
                            if (nav.separator) {
                                return (
                                    <div key={`separator-${index}`} style={{
                                        width: '100%',
                                        height: '1px',
                                        background: 'linear-gradient(90deg, transparent 0%, #3f3f46 50%, transparent 100%)',
                                        margin: '16px 0',
                                        transition: 'all 0.5s cubic-bezier(0.32,0.72,0,1)',
                                        opacity: isMenuOpen ? 0.6 : 0,
                                        transitionDelay: `${delay}ms`
                                    }} />
                                );
                            }

                            const isExternal = nav.external || nav.url;
                            const isActive = !isExternal && currentPage === nav.value;

                            // External Link Arrow Icon
                            const ExternalArrow = () => (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={isMobile ? "20" : "26"}
                                    height={isMobile ? "20" : "26"}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginRight: '8px', opacity: 0.7 }}
                                >
                                    <line x1="7" y1="17" x2="17" y2="7" />
                                    <polyline points="7 7 17 7 17 17" />
                                </svg>
                            );

                            // Generate unique key: prefix external links to avoid collision with internal routes
                            const navKey = isExternal
                                ? `ext-${nav.label || index}`
                                : (nav.value || nav.label || index);

                            return (
                                <div key={navKey} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    width: '100%',
                                    transition: 'all 0.5s cubic-bezier(0.32,0.72,0,1)',
                                    transform: isMenuOpen ? 'translateY(0)' : 'translateY(-32px)',
                                    opacity: isMenuOpen ? 1 : 0,
                                    transitionDelay: `${delay}ms`
                                }}>
                                    {isExternal ? (
                                        // External Link - opens in new tab
                                        <a
                                            href={nav.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setIsMenuOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontSize: isMobile ? '30px' : '40px',
                                                fontFamily: 'Outfit, sans-serif',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '-0.025em',
                                                textDecoration: 'none',
                                                color: '#52525b',
                                                transition: 'color 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#d4d4d8'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#52525b'}
                                        >
                                            <ExternalArrow />
                                            {nav.label}
                                        </a>
                                    ) : (
                                        // Internal Link - uses setCurrentPage
                                        <button
                                            onClick={() => {
                                                setCurrentPage(nav.value);
                                                setIsMenuOpen(false);
                                            }}
                                            style={{
                                                fontSize: isMobile ? '30px' : '40px',
                                                fontFamily: 'Outfit, sans-serif',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                letterSpacing: '-0.025em',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: isActive ? '#ffffff' : '#52525b',
                                                transition: 'color 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isActive) e.currentTarget.style.color = '#d4d4d8';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) e.currentTarget.style.color = '#52525b';
                                            }}
                                        >
                                            {nav.label}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </>
    );
}

return { Navbar };
