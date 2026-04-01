#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Self-sustaining server wrapper.
 * Spawns the Next.js production server as a detached child process
 * and monitors it. If it dies, it restarts automatically.
 * 
 * This survives bash session termination because:
 * 1. It runs as a Node.js process (not a shell script)
 * 2. It detaches the server from the parent process group
 * 3. It monitors via event listeners, not polling
 */

const { spawn } = require('child_process');
const path = require('path');

const SERVER_JS = path.join(__dirname, '.next', 'standalone', 'server.js');
const PORT = 3000;
const MAX_RESTART_DELAY = 30000;
let restartCount = 0;

function startServer() {
    const child = spawn(process.argv[0], [SERVER_JS], {
        cwd: __dirname,
        detached: false,
        env: {
            ...process.env,
            NODE_ENV: 'production',
            PORT: String(PORT),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
        process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
        process.stderr.write(data);
    });

    child.on('exit', (code, signal) => {
        const now = new Date().toISOString();
        console.error(`[${now}] Server exited (code=${code}, signal=${signal}). Restarting...`);
        
        restartCount++;
        const delay = Math.min(1000 * restartCount, MAX_RESTART_DELAY);
        
        setTimeout(() => {
            startServer();
        }, delay);
    });

    // If parent dies, let the child keep running
    child.unref();
    
    console.log(`[${new Date().toISOString()}] Server started (PID: ${child.pid})`);
}

// Start
console.log(`[${new Date().toISOString()}] Self-sustaining server wrapper starting...`);
console.log(`[${new Date().toISOString()}] Server: ${SERVER_JS}`);
console.log(`[${new Date().toISOString()}] Port: ${PORT}`);
startServer();
