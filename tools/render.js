const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const ids = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 788 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CONSOLE', m.text()));
  await p.goto('http://127.0.0.1:8765/studio.html'); await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  for (const id of ids) {
    const t = Date.now();
    const url = await p.evaluate((id) => window.shot(id), id);
    fs.writeFileSync(`out/${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(id, Date.now() - t, 'ms');
  }
  await b.close();
})();
