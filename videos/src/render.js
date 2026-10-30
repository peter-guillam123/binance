// Renders videos/src/render.html frame by frame into an MP4 with ffmpeg.
// node render.js <id> <out.mp4>            full render at 30fps
// node render.js <id> --stills <dir> t1 t2  PNG stills at chosen seconds
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
(async () => {
  const [id, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  page.on("console", (m) => { if (m.type() === "error") console.error("console", m.text()); });
  await page.goto("file://" + path.join(__dirname, "render.html") + "?v=" + id);
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DUR);
  if (out === "--stills") {
    const [dir, ...times] = rest;
    for (const t of times) {
      await page.evaluate((t) => window.seek(t), +t);
      await page.screenshot({ path: `${dir}/v${id}-${String(t).padStart(5, "0")}.png` });
    }
    await browser.close(); return;
  }
  const fps = 30, frames = Math.round(dur * fps);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest",
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`v${id} frame ${f}/${frames} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`v${id} done in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`);
})();
