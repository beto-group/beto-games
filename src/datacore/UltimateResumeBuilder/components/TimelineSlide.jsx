
function TimelineSlide({ node, dc, modules, TOKENS }) {
    const { useEffect, useRef, useState, useMemo } = dc;
    const { gsap } = modules;
    const containerRef = useRef(null);
    const scrollRef = useRef(null);
    const contentRef = useRef(null);
    const [hoveredItem, setHoveredItem] = useState(null);

    // ─── DATA ORCHESTRATION ────────────────────────────────────
    const START_YEAR = 1999;
    const END_YEAR = 2026;
    const TOTAL_YEARS = END_YEAR - START_YEAR + 1;
    const YEAR_WIDTH = 80; // Pixels per year
    const TRACK_HEIGHT = 80;

    const TRACKS = {
        'LIFE': 0,
        'EDUCATION': 1,
        'PROFESSIONAL': 2,
        'INNOVATION': 3
    };

    const epochs = useMemo(() => {
        return (node.epochs || []).map(e => {
            // Format: [START - END | TITLE | TRACK]
            const parts = e.replace(/[\[\]]/g, '').split('|').map(s => s.trim());
            const [years, title, trackLabel, desc] = parts;
            const [start, end] = years.split('-').map(s => parseInt(s.trim()));
            return {
                start, end, title, desc: desc || "VERIFIED_RECORD",
                track: TRACKS[trackLabel] ?? 0,
                color: trackLabel === 'PROFESSIONAL' ? TOKENS.accent : 'rgba(255,255,255,0.4)'
            };
        });
    }, [node.epochs]);

    const milestones = useMemo(() => {
        return (node.milestones || []).map(m => {
            // Format: [YEAR | EVENT | MEDIA | QUOTE]
            const parts = m.replace(/[\[\]]/g, '').split('|').map(s => s.trim());
            const [year, title, media, quote] = parts;
            return {
                year: parseInt(year),
                title,
                media: media.replace(/!\[\[|\]\]/g, ''),
                quote: quote.replace(/^"|"$/g, '')
            };
        });
    }, [node.milestones]);

    // ─── ANIMATION ENGINE ──────────────────────────────────────
    const isUserInteracting = useRef(false);
    useEffect(() => {
        if (!gsap || !contentRef.current || !scrollRef.current) return;

        // 🔄 INERTIAL TACTICAL SCROLL ENGINE
        const scroller = scrollRef.current;
        let targetX = scroller.scrollLeft;
        let isDragging = false;
        let lastX = 0;

        const syncScroll = (delta) => {
            isUserInteracting.current = true;
            targetX += delta;
            const max = scroller.scrollWidth - scroller.clientWidth;
            targetX = Math.max(0, Math.min(max, targetX));
            
            // Buttery smooth glide with superior inertia
            gsap.to(scroller, {
                scrollLeft: targetX,
                duration: 0.9, // Increased duration for deep inertia
                ease: "power2.out",
                overwrite: "auto"
            });
        };

        const handleWheel = (e) => {
            // Only respond to horizontal deltas to preserve vertical slide navigation
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                syncScroll(e.deltaX * 1.5);
            }
        };

        const handlePointerDown = (e) => {
            isDragging = true;
            lastX = e.pageX;
            scroller.style.cursor = 'grabbing';
            // Sync target before drag to ensure 'delta' logic is relative to current view
            targetX = scroller.scrollLeft;
        };

        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX;
            const delta = lastX - x; // Calculate the movement delta
            lastX = x;
            syncScroll(delta * 1.5); // Apply with sensitivity multiplier
        };

        const handlePointerUp = () => {
            isDragging = false;
            scroller.style.cursor = 'grab';
        };

        scroller.addEventListener('wheel', handleWheel, { passive: true });
        scroller.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        const tl = gsap.timeline({ 
            delay: 0.5, 
            onUpdate: () => { if (isUserInteracting.current) tl.kill(); }
        });
        
        // 1. Reveal Sequence: Tactical arrival
        tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1.2 });
        tl.to(".origin-overlay", { opacity: 0.9, duration: 1.0 }, "-=0.2");
        
        const totalWidth = TOTAL_YEARS * YEAR_WIDTH;
        const viewportWidth = scroller.clientWidth || 1000;
        const centerOffset = (viewportWidth / 2) - (YEAR_WIDTH / 2);
        const maxScroll = Math.max(0, totalWidth - viewportWidth);

        if (maxScroll > 0) {
            // A. Origin Deep-Dive: Centered and snappy (0.4s)
            tl.set(scroller, { scrollLeft: -centerOffset });
            tl.to(scroller, { scrollLeft: -centerOffset, duration: 0.4 }); 

            // B. Temporal Compression: Rapid Centered Skip
            const center2017 = ((2017 - START_YEAR) * YEAR_WIDTH) - centerOffset;
            tl.to(scroller, {
                scrollLeft: Math.min(center2017, maxScroll),
                duration: 1.0,
                ease: "power4.inOut",
                onStart: () => {
                    gsap.to(contentRef.current, { scale: 0.99, duration: 0.5, yoyo: true, repeat: 1 });
                    gsap.to(".origin-overlay", { opacity: 0, duration: 0.6 });
                }
            });

            // C. Detail Traversal: High-speed glide (2017 -> 2026)
            tl.to(scroller, {
                scrollLeft: maxScroll,
                duration: 8.5, // Further accelerated to 8.5s for optimal responsiveness
                ease: "none",
                onStart: () => {
                    gsap.to(".epoch-node", { 
                        boxShadow: `0 0 30px ${TOKENS.accent}88`, 
                        opacity: 1,
                        duration: 0.6, 
                        stagger: 0.05 
                    });
                }
            });
        }

        return () => {
            tl.kill();
            scroller.removeEventListener('wheel', handleWheel);
            scroller.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [gsap, TOTAL_YEARS, YEAR_WIDTH]);

    return (
        <div ref={containerRef} style={{ 
            width: '100%', height: '100%', 
            display: 'flex', flexDirection: 'column', 
            background: 'transparent', color: 'white',
            overflow: 'hidden', padding: '60px 0',
            opacity: 1 // Ensure base visibility
        }}>
            {/* 📍 ORIGIN SCANLINE (Tactical Sync Overlay) */}
            <div className="origin-overlay" style={{
                position: 'absolute', top: '150px', right: '60px', 
                padding: '12px 24px', background: `rgba(15, 15, 20, 0.9)`, 
                border: `1px solid ${TOKENS.accent}44`, 
                backdropFilter: 'none',
                color: TOKENS.accent, fontSize: '10px', fontWeight: 900, 
                zIndex: 2000, pointerEvents: 'none',
                fontFamily: TOKENS.fontMono, opacity: 0,
                letterSpacing: 2, boxShadow: `0 20px 50px rgba(0,0,0,0.8)`
            }}>
                [ ARCHIVE_ORIGIN_SYNC // DEC_1999 ]<br/>
                <span style={{ fontSize: '7px', opacity: 0.5, letterSpacing: 1 }}>
                    DECODING_BIOLOGICAL_INITIATIVE... [SUCCESS]
                </span>
            </div>

            {/* 📟 TACTICAL HEADER */}
            <div style={{ 
                padding: '20px 60px', marginBottom: '40px', zIndex: 100,
                background: 'linear-gradient(to bottom, rgba(5,5,8,0.8), transparent)',
                backdropFilter: 'none'
            }}>
                <div style={{ color: TOKENS.accent, fontSize: '9px', fontWeight: 900, fontFamily: TOKENS.fontMono, letterSpacing: 4, marginBottom: '6px' }}>
                    PROTOCOL_CHRONOS // SYSTEM_ARCHIVE_v5.2
                </div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, fontFamily: TOKENS.font, letterSpacing: -1 }}>
                    BIOGRAPHICAL_TRAJECTORY
                </h1>
            </div>

            {/* 🕰️ TIMELINE SCROLL AREA */}
            <div 
                ref={scrollRef} 
                onMouseDown={() => isUserInteracting.current = true}
                onPointerDown={() => isUserInteracting.current = true}
                style={{ 
                    height: '680px', width: '100%', overflowX: 'auto', overflowY: 'hidden',
                    msOverflowStyle: 'none', scrollbarWidth: 'none',
                    position: 'relative', cursor: 'grab', zIndex: 9999
                }}
            >
                <style>{` .timeline-scroll-container::-webkit-scrollbar { display: none; } `}</style>
                
                <div 
                    ref={contentRef} 
                    style={{ 
                        width: `${TOTAL_YEARS * YEAR_WIDTH}px`, height: '100%',
                        position: 'relative', padding: '20px 0', zIndex: 9999
                    }}
                >
                    {/* 📏 YEAR GRID LATTICE */}
                    {Array.from({ length: TOTAL_YEARS }).map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute', left: i * YEAR_WIDTH, top: 0, bottom: 0,
                            width: '1px', background: 'rgba(255,255,255,0.05)', 
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            paddingBottom: '20px', zIndex: 1
                        }}>
                            <div style={{ 
                                fontSize: '10px', color: (START_YEAR + i) % 5 === 0 ? TOKENS.accent : 'rgba(255,255,255,0.1)',
                                fontFamily: TOKENS.fontMono, transform: 'rotate(-90deg) translateX(-10px)',
                                opacity: (START_YEAR + i) % 5 === 0 ? 1 : 0.2
                            }}>
                                {START_YEAR + i}
                            </div>
                        </div>
                    ))}

                    {/* 🧬 EPOCH TRACKS */}
                    <div style={{ position: 'relative', height: '100%', zIndex: 10 }}>
                        {epochs.map((e, i) => {
                            const x = (e.start - START_YEAR) * YEAR_WIDTH;
                            const w = (e.end - e.start + 1) * YEAR_WIDTH;
                            const y = e.track * TRACK_HEIGHT + 20;

                            return (
                                <div 
                                    key={i}
                                    className="epoch-node fade-in"
                                    style={{
                                        position: 'absolute', left: x, top: y, width: w - 10, height: '30px',
                                        background: hoveredItem === e ? 'rgba(168, 85, 247, 0.2)' : 'rgba(5, 5, 8, 0.6)',
                                        backdropFilter: 'none',
                                        border: `1px solid ${hoveredItem === e ? TOKENS.accent : e.color + '44'}`,
                                        borderRadius: '4px',
                                        padding: '0 12px',
                                        display: 'flex', alignItems: 'center',
                                        transition: 'all 0.3s ease',
                                        cursor: 'help',
                                        opacity: hoveredItem && hoveredItem !== e ? 0.4 : 1,
                                        zIndex: hoveredItem === e ? 100 : 10
                                    }}
                                    onMouseEnter={() => setHoveredItem(e)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <div style={{ width: '4px', height: '100%', background: e.color, position: 'absolute', left: 0 }} />
                                    <div style={{ fontSize: '10px', fontWeight: 900, fontFamily: TOKENS.fontMono, color: 'white', letterSpacing: 1 }}>
                                        {e.title.toUpperCase()}
                                    </div>
                                    <div style={{ position: 'absolute', right: 10, fontSize: '8px', color: TOKENS.textMuted, opacity: 0.5 }}>
                                        {e.start === e.end ? e.start : `${e.start} - ${e.end}`}
                                    </div>
                                </div>
                            );
                        })}

                        {/* 📍 MILESTONE PINS */}
                        {milestones.map((m, i) => {
                            const x = (m.year - START_YEAR) * YEAR_WIDTH + (YEAR_WIDTH / 2);
                            const y = 3.5 * TRACK_HEIGHT; // Bottom track for project milestones

                            return (
                                <div 
                                    key={i}
                                    style={{ position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    {/* Vertical Connector */}
                                    <div style={{ width: '1px', height: '60px', background: `linear-gradient(to top, ${TOKENS.accent}, transparent)` }} />
                                    
                                    {/* The Event Pin */}
                                    <div 
                                        className="milestone-pin"
                                        style={{ 
                                            padding: '12px', background: 'rgba(10, 10, 15, 0.9)', 
                                            border: `1px solid ${hoveredItem === m ? TOKENS.accent : TOKENS.accent + '88'}`, borderRadius: '4px',
                                            width: '150px', boxShadow: `0 10px 30px rgba(0,0,0,0.5)`,
                                            transition: 'all 0.3s ease', cursor: 'help',
                                            opacity: hoveredItem && hoveredItem !== m ? 0.4 : 1,
                                            transform: hoveredItem === m ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                        onMouseEnter={() => setHoveredItem(m)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    >
                                        <div style={{ fontSize: '9px', color: TOKENS.accent, fontWeight: 900, marginBottom: '6px' }}>{m.year} // {m.title}</div>
                                        <div style={{ 
                                            fontSize: '11px', color: 'rgba(255,255,255,0.7)', 
                                            fontStyle: 'italic', position: 'relative', paddingLeft: '15px' 
                                        }}>
                                            <span style={{ position: 'absolute', left: 0, color: TOKENS.accent }}>"</span>
                                            {m.quote}
                                        </div>
                                        {m.media && (
                                            <div style={{ 
                                                marginTop: '12px', width: '100%', height: '110px', 
                                                background: 'black', borderRadius: '4px',
                                                overflow: 'hidden', border: `1px solid rgba(255,255,255,0.1)`,
                                                position: 'relative'
                                            }}>
                                                <video 
                                                    src={m.media}
                                                    autoPlay muted loop playsInline
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                                />
                                                <div style={{ position: 'absolute', top: 5, right: 8, fontSize: '7px', color: TOKENS.accent, opacity: 0.5 }}>LIVE_FEED</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 🎞️ EDGE MASKS */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', background: 'linear-gradient(90deg, #050508 0%, transparent 100%)', zIndex: 100, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', background: 'linear-gradient(-90deg, #050508 0%, transparent 100%)', zIndex: 100, pointerEvents: 'none' }} />

            {/* 🛰️ TACTICAL INTELLIGENCE PLATE */}
            {hoveredItem && (
                <div 
                    className="fade-in"
                    style={{
                        position: 'absolute', bottom: '60px', left: '60px', 
                        width: '500px', padding: '40px', 
                        background: 'rgba(5, 5, 8, 0.98)', border: `1px solid ${TOKENS.accent}`,
                        borderRadius: '4px', zIndex: 10000, pointerEvents: 'none',
                        boxShadow: `0 20px 60px rgba(0,0,0,0.9)`
                    }}
                >
                    <div style={{ fontSize: '10px', color: TOKENS.accent, fontWeight: 900, fontFamily: TOKENS.fontMono, letterSpacing: 3, marginBottom: '12px' }}>
                        INTELLIGENCE_REPORT // {hoveredItem.year || `${hoveredItem.start}-${hoveredItem.end}`}
                    </div>
                    
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'white', marginBottom: '8px', letterSpacing: -0.5 }}>
                        {hoveredItem.title.toUpperCase()}
                    </div>
                    
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontFamily: TOKENS.fontMono }}>
                        {hoveredItem.desc || hoveredItem.quote || "ARCHIVE_DETAILS_ENCRYPTED"}
                    </div>
                    
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <div style={{ fontSize: '8px', color: TOKENS.accent, background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '2px', border: `1px solid ${TOKENS.accent}33` }}>
                            {hoveredItem.start ? 'EPOCH_ACTIVE' : 'MILESTONE_VERIFIED'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const _exports = { TimelineSlide };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

