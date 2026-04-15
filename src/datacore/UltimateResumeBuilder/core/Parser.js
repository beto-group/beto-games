// ─────────────────────────────────────────────────────────────
// 📖 ELITE DATA PARSER (Markdown -> NodeGraph)
// ─────────────────────────────────────────────────────────────

function parseResumeMarkdown(text) {
    const lines = text.split('\n');
    const data = {
        groups: [{ name: 'IDENTITY', items: [] }],
        nodes: []
    };

    let currentEntry = null;

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        // 1. Slide Discovery (# 00 :: TITLE)
        const h1 = line.match(/^#\s+(\d+)\s+::\s+(.+)/);
        if (h1) {
            const title = h1[2].trim().toUpperCase();
            currentEntry = { 
                id: `node-${h1[1]}`, 
                order: parseInt(h1[1]),
                title: title, 
                desc: '', 
                media: [], 
                bullets: [],
                groupName: 'DOSSIER',
                panelVideo: null,
                panelText: '',
                trigger: null,
                epochs: [],
                milestones: []
            };
            data.nodes.push(currentEntry);
            data.groups[0].items.push(currentEntry);
            continue;
        }

        // 2. Metadata & Bullet Processing
        const bullet = line.match(/^[*-]\s+(.+)/);
        if (bullet && currentEntry) {
            const content = bullet[1].trim();
            const cleanContent = content.replace(/\*\*/g, '').trim(); // Strip bolds for key detection

            if (cleanContent.toUpperCase().startsWith('PANEL_VIDEO:')) {
                const videoMatch = content.match(/!\[\[(.+?)\]\]/);
                if (videoMatch) {
                    currentEntry.panelVideo = videoMatch[1];
                }
            } else if (cleanContent.toUpperCase().startsWith('PANEL_TEXT:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.panelText = val;
                currentEntry.desc = val;
            } else if (cleanContent.toUpperCase().startsWith('TRIGGER:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.trigger = val;
                if (val.includes('Globe')) currentEntry.showGlobe = true;
            } else if (cleanContent.toUpperCase().startsWith('PANEL_TYPE:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.panelType = val;
            } else if (cleanContent.toUpperCase().startsWith('MISSION:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.mission = val;
            } else if (cleanContent.toUpperCase().startsWith('CHRONOS_DATA:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.chronosData = val;
            } else if (cleanContent.toUpperCase().startsWith('EPOCH:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.epochs.push(val);
            } else if (cleanContent.toUpperCase().startsWith('MILESTONE:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.milestones.push(val);
            } else if (cleanContent.toUpperCase().startsWith('EVENT_DATA:')) {
                const val = cleanContent.substring(cleanContent.indexOf(':') + 1).trim();
                currentEntry.eventData = val;
            } else {
                currentEntry.bullets.push(content);
            }
        }
    }

    // 3. Finalization & Sorting
    data.nodes.sort((a, b) => a.order - b.order);
    data.nodes.forEach((n, idx) => {
        n.index = idx;
        n.isLast = (idx === data.nodes.length - 1);
        if (idx === 0) data.about = { ...n, items: [n] };
    });

    if (!data.about) data.about = { name: 'BETO' };
    
    return data;
}

const _exports = { parseResumeMarkdown };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;

