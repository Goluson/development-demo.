# 🎮 Tic-Tac-Toe — Smart AI & 2-Player Game

[![Deploy to GitHub Pages](https://github.com/Goluson/development-demo./actions/workflows/deploy.yml/badge.svg)](https://github.com/Goluson/development-demo./actions/workflows/deploy.yml)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Goluson/development-demo.)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Goluson/development-demo.)

A modern, responsive, browser-based Tic-Tac-Toe game built with pure vanilla HTML5, CSS3, and JavaScript. Features an unbeatable Minimax AI, sound effects via Web Audio API, confetti celebrations, match series tracking, and keyboard accessibility.

---

## 🌟 Features

- **🤖 Unbeatable AI (Minimax Algorithm)**: Computes the mathematically optimal move every turn using recursive minimax evaluation with depth weighting.
- **🙂 Casual AI Mode**: Allows a more relaxed difficulty where the AI occasionally plays random moves.
- **👥 2-Player Local PvP**: Pass-and-play on the same device.
- **🎵 Built-in Web Audio Synthesizer**: Synthesizes tactile clicks, victory chimes, and draw tones directly through the browser's Web Audio API (zero external audio files). Includes a mute toggle.
- **🎊 Confetti Particle Celebration**: Physics-based canvas confetti explosion on match victories.
- **🏆 Match Series (Best-of-N)**: Configure single round, Best of 3, 5, or 7 with persistent scorekeeping in `localStorage`.
- **⌨️ Keyboard & Accessibility**: Fully playable with <kbd>Tab</kbd>, <kbd>Enter</kbd>, and <kbd>Space</kbd>.
- **📱 Fully Responsive**: Glassmorphic dark aesthetic optimized for phones, tablets, and desktops.

---

## 🚀 Live Demo & Deployment

### 1. GitHub Pages (Automatic)
The project automatically deploys to GitHub Pages on every push via [GitHub Actions](.github/workflows/deploy.yml).

### 2. Deploy to Render (1-Click)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Goluson/development-demo.)

### 3. Deploy to Vercel (1-Click)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Goluson/development-demo.)

---

## 🛠️ How to Run Locally

No build tools or package managers required!
1. Double-click `index.html` to open in any web browser.
2. Or serve locally with any static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

---

## 📂 Project Structure

- `index.html` - Semantic structure, accessibility attributes, and modals.
- `style.css` - Responsive glassmorphism layout, glowing neon tokens, and smooth pop animations.
- `first.js` - Game engine, Minimax decision tree, Web Audio synthesizer, and canvas particle system.
- `render.yaml` - 1-click Render static site blueprint.
- `vercel.json` - Vercel static routing configuration.
- `.github/workflows/deploy.yml` - Automated CI/CD pipeline deploying to GitHub Pages.

---

## 👤 Author

**Shailesh Soni**  
GitHub: [@Goluson](https://github.com/Goluson)
