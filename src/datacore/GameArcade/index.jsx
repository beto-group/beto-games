async function View({ STYLES, dc, GameCard, folderPath, setCurrentPage: factorySetCurrentPage }) {
    const games = [
        { id: 'IQGAME', title: 'IQ Game', category: 'Logic', desc: 'Test your cognitive limits with the N-Back challenge.' },
    ];

    return function GameArcade(componentProps) {
        const setCurrentPage = factorySetCurrentPage || componentProps?.setCurrentPage;

        return (
            <div style={{ width: '100%', padding: '0 40px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px'
                }}>
                    {games.map(game => (
                        <GameCard
                            key={game.id}
                            title={game.title}
                            category={game.category}
                            description={game.desc}
                            STYLES={STYLES}
                            onClick={() => setCurrentPage && setCurrentPage(game.id)}
                        />
                    ))}
                </div>
            </div>
        );
    };
}

return { View };
