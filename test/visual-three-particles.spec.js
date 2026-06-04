const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 420, height: 420 },
  { name: 'mobile', width: 320, height: 420 }
];

for (const viewport of viewports) {
  test(`Three.js particles render and animate on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      window.jarvis = {
        getConfig: async () => ({
          particleCount: 1500,
          windowSize: 420,
          wakeWordEnabled: false,
          wakeWords: ['贾维斯', 'jarvis']
        }),
        beginDrag: () => {},
        moveDrag: () => {},
        endDrag: () => {},
        onStartListening: () => () => {},
        notifyState: () => {},
        transcribe: async () => '',
        chat: async () => '',
        speak: async () => ''
      };
    });

    await page.goto('/index.html');
    const canvas = page.locator('#particle-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveCSS('cursor', 'move');
    await page.waitForTimeout(1000);

    const firstSample = await sampleCanvas(canvas);
    await page.waitForTimeout(600);
    const secondSample = await sampleCanvas(canvas);

    expect(firstSample.width).toBeGreaterThanOrEqual(viewport.width);
    expect(firstSample.height).toBeGreaterThanOrEqual(viewport.height);
    expect(firstSample.litPixels).toBeGreaterThan(500);
    expect(firstSample.bounds.minX).toBeGreaterThanOrEqual(0);
    expect(firstSample.bounds.maxX).toBeLessThan(firstSample.width);
    expect(firstSample.bounds.minY).toBeGreaterThanOrEqual(0);
    expect(firstSample.bounds.maxY).toBeLessThan(firstSample.height);
    expect(Math.abs(firstSample.center.x - firstSample.width / 2)).toBeLessThan(firstSample.width * 0.25);
    expect(Math.abs(firstSample.center.y - firstSample.height / 2)).toBeLessThan(firstSample.height * 0.25);
    expect(secondSample.checksum).not.toBe(firstSample.checksum);

    await page.screenshot({
      path: `test-artifacts/three-particles-${viewport.name}.png`,
      omitBackground: true
    });
  });
}

async function sampleCanvas(canvasLocator) {
  return canvasLocator.evaluate((canvas) => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        const width = canvas.width;
        const height = canvas.height;
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        let litPixels = 0;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let sumX = 0;
        let sumY = 0;
        let checksum = 0;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const a = pixels[index + 3];

            if (a > 0 || r > 8 || g > 8 || b > 8) {
              litPixels += 1;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              sumX += x;
              sumY += y;
              checksum = (checksum + (r * 3 + g * 5 + b * 7 + a * 11 + x + y)) % 1000000007;
            }
          }
        }

        resolve({
          width,
          height,
          litPixels,
          bounds: { minX, minY, maxX, maxY },
          center: {
            x: litPixels ? sumX / litPixels : 0,
            y: litPixels ? sumY / litPixels : 0
          },
          checksum
        });
      });
    });
  });
}
