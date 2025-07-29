import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';

async function serve() {
  const server = spawn('python3', ['-m', 'http.server', '8000'], {
    stdio: 'ignore'
  });
  // wait for server to start
  await new Promise(r => setTimeout(r, 3000));
  return server;
}

async function main() {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8000/index.html');
  await page.screenshot({ path: 'preview.png', fullPage: true });
  await browser.close();
  server.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

