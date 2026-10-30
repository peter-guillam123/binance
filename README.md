# The Binance heist

An interactive explainer of the $6.3bn Binance theft of 29 October 2026, for
readers new to crypto, with four short vertical videos for social media.

Live at https://peter-guillam123.github.io/binance/

- `index.html` is the explainer and the videos tab (`#videos`).
- `about.html` explains how it is made, with a diary of changes.
- `videos/` holds the MP4s and poster images. `videos/src/render.html` draws
  each frame and `videos/src/render.js` turns the frames into MP4s:
  `node videos/src/render.js 1 videos/binance-heist-1-twenty-minutes.mp4`
  (needs Playwright and ffmpeg).
- GitHub Actions deploys main to GitHub Pages.
