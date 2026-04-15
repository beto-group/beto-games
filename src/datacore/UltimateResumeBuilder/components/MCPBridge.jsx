/**
 * MCPBridge - Datacore Native Agent Control Bridge (URB Edition)
 */
function MCPBridge({ folderPath, dc, onReload, modules }) {
    const { useEffect, useRef } = dc;
    const COMMAND_FILE = folderPath + '/mcp_commands.json';

    useEffect(() => {
        const adapter = dc.app.vault.adapter;

        const checkCommands = async () => {
            try {
                if (!(await adapter.exists(COMMAND_FILE))) return;
                const content = await adapter.read(COMMAND_FILE);
                let cmdData;
                try { cmdData = JSON.parse(content); } catch (e) { return; }

                if (cmdData && cmdData.executed === false) {
                    console.log("🤖 MCP BRIDGE: Executing action:", cmdData.action);
                    let result = "Success";

                    const ALLOWED_ACTIONS = ['reload', 'screenshot', 'devtools', 'ping', 'open_settings'];
                    if (!ALLOWED_ACTIONS.includes(cmdData.action)) throw new Error(`Unauthorized: ${cmdData.action}`);

                    if (cmdData.action === 'reload') {
                        await onReload();
                    } else if (cmdData.action === 'screenshot') {
                        try {
                            const remote = require('@electron/remote') || require('electron').remote;
                            const webContents = remote.getCurrentWebContents();
                            const image = await webContents.capturePage();
                            const b64 = image.toDataURL();
                            const snapshotPath = folderPath + '/mcp_snapshot.txt';
                            await adapter.write(snapshotPath, b64);
                            result = `Snapshot captured to ${snapshotPath}`;
                        } catch (e) { result = "Snapshot failed: " + e.message; }
                    } else if (cmdData.action === 'devtools') {
                        try {
                            const remote = require('@electron/remote') || require('electron').remote;
                            remote.getCurrentWebContents().openDevTools();
                            result = "DevTools opened";
                        } catch (e) { result = "DevTools error: " + e.message; }
                    } else if (cmdData.action === 'open_settings') {
                        dc.app.setting.open();
                    }

                    // Mark as executed
                    cmdData.executed = true;
                    cmdData.executedAt = new Date().toISOString();
                    cmdData.result = result;
                    await adapter.write(COMMAND_FILE, JSON.stringify(cmdData, null, 2));
                }
            } catch (e) { console.error("[MCP Bridge] Error:", e); }
        };

        const interval = setInterval(checkCommands, 1000);
        return () => clearInterval(interval);
    }, []);

    return null;
}

const _exports = { MCPBridge };
if (typeof module !== 'undefined' && module.exports) module.exports = _exports;
return _exports;
