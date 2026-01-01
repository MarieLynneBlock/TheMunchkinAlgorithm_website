# The Munchkin Algorithm Website

A modern, immersive website featuring scroll-reactive p5.js animations and generative service card icons.

## Features

- **Immersive Scroll Animation**: Background transitions through Space → Aurora → Sky → Sea Surface → Deep Sea
- **Generative Service Icons**: Unique p5.js animations for each service card
- **Glassmorphism Design**: Modern, semi-transparent card design
- **Responsive Layout**: Works on desktop and mobile devices

## Deployment

This site is configured for GitHub Pages deployment.

### Setup Instructions

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select the branch (usually `main` or `master`)
4. Select the root folder (`/`)
5. Click Save

The site will be available at: `https://[your-username].github.io/[repository-name]/`

### Files Structure

- `index.html` - Main HTML file (required for GitHub Pages)
- `style.css` - All styles
- `immersive_scroll.js` - Background scroll animation
- `services-icons.js` - Service card generative icons
- `.nojekyll` - Prevents Jekyll processing

## Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server
```

Then visit `http://localhost:8000`

## Technologies

- HTML5
- CSS3 (Glassmorphism, Flexbox, Grid)
- JavaScript
- p5.js (for animations)

