/**
 * Lightweight Chrome DevTools Protocol (CDP) Client for Node.js v24+
 * Uses native globalThis.WebSocket and fetch
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class CDPClient {
    constructor(chromePath, port = 9222) {
        this.chromePath = chromePath || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        this.port = port;
        this.chromeProc = null;
        this.ws = null;
        this.messageId = 1;
        this.pendingRequests = new Map();
        this.eventListeners = new Map();
        this.consoleLogs = [];
        this.pageErrors = [];
    }

    async start() {
        const tempProfile = path.join(process.env.TEMP, 'cdp_qa_profile_' + Date.now());
        fs.mkdirSync(tempProfile, { recursive: true });

        this.chromeProc = spawn(this.chromePath, [
            `--remote-debugging-port=${this.port}`,
            '--headless=new',
            `--user-data-dir=${tempProfile}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu',
            '--disable-background-networking',
            '--disable-default-apps',
            '--disable-sync',
            '--hide-scrollbars',
            'about:blank'
        ], { detached: true, stdio: 'ignore' });

        // Poll for debugger URL
        let versionData = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 400));
            try {
                const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
                if (res.ok) {
                    versionData = await res.json();
                    break;
                }
            } catch (e) {}
        }

        if (!versionData) {
            throw new Error(`Failed to connect to Chrome on port ${this.port}`);
        }

        // Connect to the page target
        const pagesRes = await fetch(`http://127.0.0.1:${this.port}/json`);
        const pages = await pagesRes.json();
        const targetPage = pages.find(p => p.type === 'page') || pages[0];

        if (!targetPage || !targetPage.webSocketDebuggerUrl) {
            throw new Error('No inspectable page found in Chrome');
        }

        await this._connectWs(targetPage.webSocketDebuggerUrl);

        // Enable domains
        await this.send('Page.enable');
        await this.send('DOM.enable');
        await this.send('CSS.enable');
        await this.send('Runtime.enable');
        await this.send('Log.enable');

        // Listen for console and errors
        this.on('Runtime.consoleAPICalled', (params) => {
            const text = params.args.map(a => a.value !== undefined ? a.value : JSON.stringify(a)).join(' ');
            this.consoleLogs.push({ type: params.type, text, timestamp: Date.now() });
        });

        this.on('Runtime.exceptionThrown', (params) => {
            const details = params.exceptionDetails;
            this.pageErrors.push({
                text: details.text + (details.exception ? ' ' + (details.exception.description || details.exception.value) : ''),
                url: details.url,
                line: details.lineNumber,
                col: details.columnNumber,
                timestamp: Date.now()
            });
        });
    }

    _connectWs(wsUrl) {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.id && this.pendingRequests.has(msg.id)) {
                        const { resolve, reject } = this.pendingRequests.get(msg.id);
                        this.pendingRequests.delete(msg.id);
                        if (msg.error) {
                            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                        } else {
                            resolve(msg.result);
                        }
                    } else if (msg.method) {
                        const listeners = this.eventListeners.get(msg.method) || [];
                        listeners.forEach(fn => fn(msg.params));
                    }
                } catch (e) {
                    console.error('Error handling WS message:', e);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.messageId++;
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    on(method, callback) {
        if (!this.eventListeners.has(method)) {
            this.eventListeners.set(method, []);
        }
        this.eventListeners.get(method).push(callback);
    }

    async setViewport(width, height, deviceScaleFactor = 1, isMobile = false) {
        await this.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor,
            mobile: isMobile
        });
        await this.send('Emulation.setTouchEmulationEnabled', {
            enabled: isMobile,
            maxTouchPoints: isMobile ? 5 : 1
        });
        // Give time for CSS media queries to apply and layout to repaint
        await new Promise(r => setTimeout(r, 200));
    }

    async navigate(url, waitMs = 800) {
        await this.send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, waitMs));
    }

    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (result.exceptionDetails) {
            const desc = result.exceptionDetails.exception ? (result.exceptionDetails.exception.description || result.exceptionDetails.exception.value) : '';
            throw new Error((result.exceptionDetails.text || 'Evaluation failed') + ': ' + desc);
        }
        return result.result?.value;
    }

    async screenshot(filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const res = await this.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false
        });
        const buffer = Buffer.from(res.data, 'base64');
        fs.writeFileSync(filePath, buffer);
        return filePath;
    }

    async close() {
        if (this.ws) {
            try { this.ws.close(); } catch (e) {}
        }
        if (this.chromeProc) {
            try { process.kill(this.chromeProc.pid); } catch (e) {}
        }
    }
}

module.exports = CDPClient;
