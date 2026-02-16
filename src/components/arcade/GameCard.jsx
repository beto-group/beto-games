function GameCard({ title, category, description, image, onClick, STYLES }) {
    return (
        <div
            onClick={onClick}
            style={{
                ...STYLES.glassCard,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '24px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
        >
            <div style={{
                width: '100%',
                height: '160px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {image ? (
                    <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={title} />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="72"
                        height="72"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ opacity: 0.3, color: '#fff' }}
                    >
                        <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.967 2.5 4 4 0 0 0 7.967-2.5 4 4 0 0 0 .556-6.588 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5" />
                        <path d="M12 5v14.5" />
                        <path d="M9 18.5h6" />
                    </svg>
                )}
            </div>

            <div>
                <div style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    color: '#71717a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    {category}
                </div>
                <h3 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '900' }}>{title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#a1a1aa', lineHeight: '1.5' }}>
                    {description}
                </p>
            </div>
        </div>
    );
}

return { GameCard };
