/**
 * Immersive Scroll Animation
 * A p5.js sketch that creates a reactive background animation
 * that transitions through Space -> Aurora -> Sky -> Sea Surface -> Deep Sea
 * based on scroll position.
 */

const immersiveScroll = (p) => {
  // Color definitions for different zones (initialized in setup)
  let spaceColor;
  let polarNightColor;
  let auroraGreen;
  let auroraPurple;
  let skyColor;
  let sunsetColor;
  let sunsetSkyColor;
  let seaSurfaceColor;
  let deepSeaColor;
  
  // Animation elements
  let stars = [];
  let auroraStars = [];
  let meteorites = [];
  let clouds = [];
  let bubbles = [];
  let fishes = [];
  let jellyfish = []; 
  let seaPlants = []; // New element: coral and seaweed
  let sun = { x: 0, y: 0, size: 100, startX: 0, startY: 0, endX: 0 };
  let rocket = { 
    startX: 0, 
    startY: 0, 
    x: 0, 
    y: 0, 
    prevX: 0,
    prevY: 0,
    angle: 0,
    trail: []
  };
  let satellite = {
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    angle: 0
  };
  let waves = { y: 0, waveOffset: 0 };
  
  // Aurora L-system and animation
  let auroraSentence = [{ symbol: "A", weight: 2 }];
  let yPosNoiseOffset = 0;
  let maxWaveHeight = 7;
  const noiseScale = 0.1;
  let auroraIntervalID = null;
  
  // Aurora L-system rules
  const auroraRules = {
    "A": [
      { symbol: "A", weight: () => p.random(0.5, 3) },
      { symbol: "B", weight: () => p.random(1, 4) }
    ],
    "B": [
      { symbol: "A", weight: () => p.random(1, 4) }
    ]
  };
  
  // Scroll tracking
  let scrollProgress = 0;
  let maxScroll = 0;
  let lastScrollUpdate = 0;
  const scrollThrottle = 16;
  
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("canvas-bg");
    p.frameRate(60);

    // Initialize colors properly within setup
    spaceColor = p.color(0, 0, 0);
    polarNightColor = p.color(36, 41, 51);
    auroraGreen = p.color(0, 255, 180);
    auroraPurple = p.color(150, 50, 200);
    skyColor = p.color(120, 190, 255);
    sunsetColor = p.color(255, 130, 60);
    sunsetSkyColor = p.color(200, 80, 150);
    seaSurfaceColor = p.color(0, 120, 200);
    deepSeaColor = p.color(5, 20, 60);
    
    // Calculate max scroll (approximate based on content)
    maxScroll = document.body.scrollHeight - p.windowHeight;
    
    // Reduced star count for better performance
    for (let i = 0; i < 80; i++) {
      const isMoving = p.random() < 0.04; // Only 4% of stars are moving (just a few clear falling stars)
      stars.push({
        x: p.random(p.width),
        y: p.random(p.height),
        size: p.random(1, 3),
        brightness: p.random(100, 255),
        twinkleSpeed: p.random(0.01, 0.03), // Slower, smoother breathing
        isMoving: isMoving,
        speedX: isMoving ? p.random(-0.002, 0.002) : 0, // Very slow movement
        speedY: isMoving ? p.random(-0.002, 0.002) : 0, // Very slow movement
        trail: [], // Trail for moving stars
        trailDecay: isMoving ? p.random(0.0005, 0.002) : 0, // Very slow decay for extremely long tails
        maxTrailLength: isMoving ? p.random(200, 300) : 0 // Extremely long trails (200-300 points)
      });
    }
    
    // Reduced aurora star count
    for (let i = 0; i < 60; i++) {
      auroraStars.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.6, p.height),
        size: p.random(1, 3),
        brightness: p.random(150, 255),
        lifespan: p.random(200, 300)
      });
    }
    
    // Initialize meteorites/falling stars
    for (let i = 0; i < 4; i++) {
      meteorites.push({
        x: p.random(p.width * 0.5, p.width * 1.5),
        y: p.random(-p.height * 0.5, p.height * 0.2),
        speedX: p.random(-8, -4),
        speedY: p.random(4, 8),
        size: p.random(2, 4),
        brightness: p.random(200, 255),
        trailLength: p.random(30, 50),
        angle: p.random(-0.3, 0.3) // Slight angle variation
      });
    }
    
    // Initialize clouds for sky zone - moved higher to stay away from sea
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.15, p.height * 0.45),
        size: p.random(80, 150),
        speed: p.random(0.3, 0.8),
        opacity: p.random(150, 200)
      });
    }
    
    // Start aurora L-system generation
    auroraIntervalID = setInterval(() => {
      generateAuroraSentence();
    }, 2000);
    
    // Reduced bubble count
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.7, p.height),
        size: p.random(10, 40),
        speed: p.random(0.5, 2),
        opacity: p.random(100, 200)
      });
    }
    
    // Reduced fish count
    for (let i = 0; i < 12; i++) {
      const isSlender = p.random() > 0.6;
      fishes.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.7, p.height),
        size: isSlender ? p.random(30, 50) : p.random(20, 40),
        speed: p.random(0.5, 1.5),
        direction: p.random([-1, 1]),
        color: p.color(p.random(100, 255), p.random(100, 200), p.random(150, 255)),
        type: isSlender ? 'slender' : 'basic'
      });
    }
    
    // Initialize jellyfish (Just a few, one is bigger)
    for (let i = 0; i < 3; i++) {
      const isBig = (i === 0);
      jellyfish.push({
        x: p.random(p.width * 0.05, p.width * 0.4), // Mostly on the left
        y: p.random(p.height * 0.8, p.height * 1.5), // Start below or at bottom
        size: isBig ? p.random(90, 120) : p.random(40, 60),
        speed: isBig ? p.random(0.3, 0.5) : p.random(0.4, 0.8), // Big ones move slower
        offset: p.random(p.TWO_PI), // For pulsing animation
        // Ethereal cyan/blue with lower opacity for better translucency
        color: p.color(150, 230, 255, 120) 
      });
    }
    
    // Initialize sea plants (Coral and Seaweed) concentrated in corners
    for (let i = 0; i < 22; i++) {
      // Decide which corner: left (0) or right (1)
      const corner = p.random() > 0.5 ? 0 : 1;
      const xBase = corner === 0 ? p.random(0, p.width * 0.25) : p.random(p.width * 0.75, p.width);
      
      const type = p.random() > 0.4 ? 'seaweed' : 'coral';
      
      // For coral, pre-generate a detailed, organic branching structure
      let coralStructure = [];
      if (type === 'coral') {
        const genStructure = (depth, maxDepth) => {
          if (depth > maxDepth) return [];
          let branches = [];
          const numNext = depth === 0 ? p.random(2, 4) : (depth < 2 ? p.random(1, 3) : 1);
          
          for (let n = 0; n < numNext; n++) {
            branches.push({
              angle: p.random(-40, 40),
              lenMult: p.random(0.7, 0.85),
              children: genStructure(depth + 1, maxDepth)
            });
          }
          return branches;
        };
        coralStructure = genStructure(0, 3); // Depth 3 for performance
      }

      seaPlants.push({
        x: xBase,
        y: p.height + p.random(20, 60), 
        size: p.random(180, 350), 
        type: type,
        color: type === 'seaweed' ? 
               p.color(30, p.random(120, 200), 70, 180) : 
               p.color(p.random(200, 255), p.random(100, 180), p.random(120, 200), 220),
        swayOffset: p.random(p.TWO_PI),
        swaySpeed: p.random(0.008, 0.015), 
        numBlades: Math.floor(p.random(3, 6)), 
        coralStructure: coralStructure
      });
    }
    
    // Initialize rocket position - starts from lower left
    rocket.startX = -100; // Start off-screen left
    rocket.startY = p.height * 0.85; // Lower part of screen
    rocket.x = rocket.startX;
    rocket.y = rocket.startY;
    rocket.prevX = rocket.startX;
    rocket.prevY = rocket.startY;
    
    // Initialize satellite position - starts from right, moves left (slower than rocket)
    satellite.startX = p.width + 100; // Start off-screen right
    satellite.startY = p.height * 0.4; // Middle-upper part of screen
    satellite.x = satellite.startX;
    satellite.y = satellite.startY;
    satellite.prevX = satellite.startX;
    satellite.prevY = satellite.startY;
    
    // Initialize sunset sun position - coming from right, setting in middle-ish
    sun.startX = p.width * 1.2; // Start off-screen right
    sun.startY = p.height * 0.2; // Start slightly higher
    sun.endX = p.width * 0.45;    // Target setting position (slightly left of middle)
    sun.size = p.width * 0.12;
    
    // Initialize waves position
    waves.y = p.height * 0.45;
    waves.waveOffset = 0;
  };
  
  /**
   * p5.js draw function. Continuously updates and draws the animation.
   */
  p.draw = () => {
    // Update scroll progress
    updateScrollProgress();
    
    // Calculate current zone and transition
    const zone = calculateZone();
    
    // Draw background with smooth color transitions
    drawBackground(zone);
    
    // Draw zone-specific elements
    if (zone.space > 0.1) {
      drawSpaceElements(zone.space);
    }
    
    // Draw rocket independently - not tied to space zone intensity to avoid blinking
    drawRocket();
    
    if (zone.aurora > 0.1) {
      drawAuroraElements(zone.aurora);
    }
    
    // Draw sun independently - ensure it is drawn BEFORE waves and clouds
    // to allow for natural layering (behind clouds, under waves)
    drawSun();
    
    if (zone.sunset > 0.01) {
      drawSunsetElements(zone.sunset);
    }
    
    if (zone.sky > 0.1) {
      drawSkyElements(zone.sky);
    }
    
    if (zone.deepSea > 0.1) {
      drawDeepSeaElements(zone.deepSea);
    }
    
    // Update aurora animation (slower for better performance)
    yPosNoiseOffset += 0.008;
  };
  
  /**
   * Updates scroll progress based on window scroll position.
   * Optimized: throttle maxScroll calculation.
   */
  function updateScrollProgress() {
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const now = Date.now();
    
    // Throttle maxScroll calculation (only update occasionally)
    if (now - lastScrollUpdate > scrollThrottle) {
      maxScroll = Math.max(maxScroll, document.body.scrollHeight - p.windowHeight);
      lastScrollUpdate = now;
    }
    
    scrollProgress = p.constrain(currentScroll / Math.max(maxScroll, 1), 0, 1);
  }
  
  /**
   * Calculates which zone is currently active based on scroll progress.
   * @returns {Object} Zone weights (space, aurora, sky, seaSurface, deepSea)
   */
  function calculateZone() {
    // Define zone boundaries (0 to 1 scroll progress)
    const spaceEnd = 0.02;       // Space: 0% - 2%
    const auroraEnd = 0.25;      // Aurora: 2% - 25%
    const skyFull = 0.45;        // Sky fully blue at 45%
    const sunsetStart = 0.55;    // Waves start appearing earlier at 55%
    const sunsetEnd = 0.82;      // Sea surface level at 82%
    // Deep Sea: 82% - 100%
    
    let space = 0;
    let aurora = 0;
    let sky = 0;
    let sunset = 0;
    let deepSea = 0;
    
    if (scrollProgress < spaceEnd) {
      space = 1 - (scrollProgress / spaceEnd);
    } else if (scrollProgress < auroraEnd) {
      const localProgress = (scrollProgress - spaceEnd) / (auroraEnd - spaceEnd);
      space = 1 - localProgress;
      aurora = localProgress;
    } else if (scrollProgress < skyFull) {
      const localProgress = (scrollProgress - auroraEnd) / (skyFull - auroraEnd);
      aurora = 1 - localProgress;
      sky = localProgress;
    } else if (scrollProgress < sunsetStart) {
      sky = 1.0;
    } else if (scrollProgress < sunsetEnd) {
      // Use a smooth easing for the sky -> sunset transition
      const t = (scrollProgress - sunsetStart) / (sunsetEnd - sunsetStart);
      const easedT = p.cos((1 - t) * p.HALF_PI); // Smooth out the start and end of transition
      sky = 1 - easedT;
      sunset = easedT;
    } else {
      const t = (scrollProgress - sunsetEnd) / (1 - sunsetEnd);
      const easedT = p.sin(t * p.HALF_PI);
      sunset = 1 - easedT;
      deepSea = easedT;
    }
    
    return { space, aurora, sky, sunset, deepSea };
  }
  
  /**
   * Draws the background with smooth color transitions between zones.
   * Optimized to reduce drawing calls.
   * @param {Object} zone - Zone weights
   */
  function drawBackground(zone) {
    // Gradient backgrounds for more natural atmosphere (Aurora and Sunset)
    if (zone.aurora > 0.1 || zone.sunset > 0.05) {
      const gradientStep = 4; // Higher step for performance during sunset
      for (let y = 0; y < p.height; y += gradientStep) {
        const lerpRatio = p.map(y, 0, p.height, 0, 1);
        let gradientColor;
        
        if (zone.aurora > 0.1) {
          // Aurora Gradient
          gradientColor = p.lerpColor(spaceColor, polarNightColor, lerpRatio);
          if (zone.space > 0) gradientColor = p.lerpColor(spaceColor, gradientColor, zone.aurora);
          if (zone.sky > 0) {
            const skyLerp = p.lerpColor(polarNightColor, skyColor, zone.sky);
            gradientColor = p.lerpColor(gradientColor, skyLerp, zone.sky);
          }
        } else {
          // Sunset Gradient: Top stays blue-ish longer, bottom turns orange/pink
          // This creates a much more "natural" sky atmosphere
          const topColor = p.lerpColor(skyColor, sunsetSkyColor, zone.sunset * 0.6);
          const bottomColor = p.lerpColor(skyColor, sunsetColor, zone.sunset);
          
          gradientColor = p.lerpColor(topColor, bottomColor, lerpRatio);
          
          // Blend into Deep Sea if active
          if (zone.deepSea > 0) {
            gradientColor = p.lerpColor(gradientColor, deepSeaColor, zone.deepSea);
          }
        }
        
        p.stroke(gradientColor);
        p.strokeWeight(gradientStep);
        p.line(0, y, p.width, y);
      }
    } else {
      // Fast flat-color blending for other zones
      let r = 0, g = 0, b = 0;
      
      r += p.red(spaceColor) * zone.space;
      g += p.green(spaceColor) * zone.space;
      b += p.blue(spaceColor) * zone.space;
      
      r += p.red(skyColor) * zone.sky;
      g += p.green(skyColor) * zone.sky;
      b += p.blue(skyColor) * zone.sky;
      
      r += p.red(deepSeaColor) * zone.deepSea;
      g += p.green(deepSeaColor) * zone.deepSea;
      b += p.blue(deepSeaColor) * zone.deepSea;
      
      p.background(r, g, b);
    }
  }
  
  /**
   * Draws space zone elements (stars and rocket).
   * Rocket fades out as we transition to aurora.
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawSpaceElements(intensity) {
    // Draw stars with natural breathing effect and moving stars with trails
    p.push();
    stars.forEach(star => {
      if (star.isMoving === true) {
        // Moving stars with fading trails - ONLY these move
        star.x += star.speedX;
        star.y += star.speedY;
        
        // Wrap around screen
        if (star.x < 0) star.x = p.width;
        if (star.x > p.width) star.x = 0;
        if (star.y < 0) star.y = p.height;
        if (star.y > p.height) star.y = 0;
        
        // Update trail - add point every frame for smooth, long trail
        star.trail.push({ x: star.x, y: star.y, life: 1.0 });
        // Limit trail length based on maxTrailLength
        if (star.trail.length > star.maxTrailLength) {
          star.trail.shift(); // Remove oldest point
        }
        // Decay trail points with variable decay rate (extremely slow for very long visible tail)
        star.trail = star.trail.filter(point => {
          point.life -= star.trailDecay;
          return point.life > 0;
        });
        
        // Draw trail (fading tail with variable length) - use lines for smoother, longer appearance
        if (star.trail.length > 1) {
          p.strokeWeight(2);
          for (let i = 0; i < star.trail.length - 1; i++) {
            const point = star.trail[i];
            const nextPoint = star.trail[i + 1];
            // Use average life for smoother gradient
            const avgLife = (point.life + nextPoint.life) / 2;
            const trailAlpha = avgLife * intensity * star.brightness * 0.8;
            if (trailAlpha > 3) { // Lower threshold for longer visibility
              p.stroke(255, 255, 255, trailAlpha);
              p.line(point.x, point.y, nextPoint.x, nextPoint.y);
            }
          }
        }
        // Draw trail points for better visibility
        star.trail.forEach((point, index) => {
          const trailAlpha = point.life * intensity * star.brightness * 0.7;
          const trailSize = star.size * point.life * 0.8;
          if (trailAlpha > 3) { // Lower threshold for longer visibility
            p.fill(255, 255, 255, trailAlpha);
            p.noStroke();
            p.ellipse(point.x, point.y, trailSize);
          }
        });
        
        // Draw star head
        const breathing = p.sin(p.frameCount * star.twinkleSpeed) * 0.15 + 0.85; // Subtle breathing
        const alpha = star.brightness * intensity * breathing;
        if (alpha > 10) {
          p.fill(255, 255, 255, alpha);
          p.noStroke();
          p.ellipse(star.x, star.y, star.size * 1.2);
        }
      } else {
        // Static stars - ONLY breathing/blinking, NO movement
        // Ensure position never changes
        const originalX = star.x;
        const originalY = star.y;
        
        // More noticeable breathing effect
        const breathing = p.sin(p.frameCount * star.twinkleSpeed) * 0.35 + 0.65; // More noticeable breathing (65-100% brightness)
        const alpha = star.brightness * intensity * breathing;
        if (alpha > 10) {
          p.fill(255, 255, 255, alpha);
          p.noStroke();
          p.ellipse(originalX, originalY, star.size); // Always use original position
        }
      }
    });
    p.pop();
    
    // Draw meteorites/falling stars
    if (intensity > 0.1) {
      p.push();
      meteorites.forEach(meteor => {
        // Update position
        meteor.x += meteor.speedX;
        meteor.y += meteor.speedY;
        
        // Reset if off screen
        if (meteor.x < -100 || meteor.y > p.height + 100) {
          meteor.x = p.random(p.width * 0.5, p.width * 1.5);
          meteor.y = p.random(-p.height * 0.5, p.height * 0.2);
          meteor.speedX = p.random(-8, -4);
          meteor.speedY = p.random(4, 8);
        }
        
        // Draw trailing effect
        const trailAlpha = intensity;
        const trailSteps = Math.floor(meteor.trailLength / 3);
        
        for (let i = 0; i < trailSteps; i++) {
          const t = i / trailSteps;
          const trailX = meteor.x - meteor.speedX * t * 2;
          const trailY = meteor.y - meteor.speedY * t * 2;
          const alpha = (1 - t) * trailAlpha * meteor.brightness;
          const size = meteor.size * (1 - t * 0.5);
          
          // Gradient from bright white to blue
          const r = 255;
          const g = p.lerp(255, 200, t);
          const b = p.lerp(255, 255, t);
          
          p.fill(r, g, b, alpha);
          p.noStroke();
          p.ellipse(trailX, trailY, size);
        }
        
        // Draw bright head of meteorite
        p.fill(255, 255, 255, intensity * meteor.brightness);
        p.noStroke();
        p.ellipse(meteor.x, meteor.y, meteor.size * 1.5);
        p.fill(200, 220, 255, intensity * meteor.brightness * 0.8);
        p.ellipse(meteor.x, meteor.y, meteor.size);
      });
      p.pop();
    }
    
    // Draw satellite (background, independent time-based movement, right to left)
    if (intensity > 0.1) {
      // Satellite moves independently based on time, not scroll
      // Slower continuous movement - loops every ~25 seconds at 60fps
      const satelliteSpeed = 0.0006; // Slower movement speed
      const satelliteProgress = (p.frameCount * satelliteSpeed) % 1; // Continuous loop from 0 to 1
      
      const satelliteStartX = p.width * 0.8; // Start closer to screen (already partially visible)
      const satelliteStartY = p.height * 0.5; // Start position
      const satelliteTargetX = -150; // Exit off-screen left
      const satelliteTargetY = p.height * 0.5; // End position (same height for rainbow arc)
      
      // Create rainbow-like trajectory (pronounced upward bow)
      const satelliteControlX = p.width * 0.5; // Control point X (centered)
      const satelliteControlY = p.height * 0.05; // Control point Y (high up for rainbow arc)
      
      const t = satelliteProgress;
      const oneMinusT = 1 - t;
      
      // Calculate position on bezier curve
      const newSatX = oneMinusT * oneMinusT * satelliteStartX + 
                      2 * oneMinusT * t * satelliteControlX + 
                      t * t * satelliteTargetX;
      const newSatY = oneMinusT * oneMinusT * satelliteStartY + 
                      2 * oneMinusT * t * satelliteControlY + 
                      t * t * satelliteTargetY;
      
      // Store previous position for direction calculation
      satellite.prevX = satellite.x;
      satellite.prevY = satellite.y;
      
      // Update position
      satellite.x = newSatX;
      satellite.y = newSatY;
      
      // Calculate direction based on actual movement
      let satDx = satellite.x - satellite.prevX;
      let satDy = satellite.y - satellite.prevY;
      
      // If satellite hasn't moved yet (first frame), use bezier derivative
      if (Math.abs(satDx) < 0.1 && Math.abs(satDy) < 0.1) {
        satDx = 2 * oneMinusT * (satelliteControlX - satelliteStartX) + 2 * t * (satelliteTargetX - satelliteControlX);
        satDy = 2 * oneMinusT * (satelliteControlY - satelliteStartY) + 2 * t * (satelliteTargetY - satelliteControlY);
      }
      
      satellite.angle = p.atan2(satDy, satDx) + p.PI / 2;
      
      // Draw satellite (cartoon style with wings, in background)
      const satAlpha = p.map(intensity, 0.1, 1, 0, 200); // More transparent (background)
      const satSize = 1.3; // Size multiplier
      
      p.push();
      p.translate(satellite.x, satellite.y);
      p.rotate(satellite.angle);
      
      // Main body (rounded, cartoon-like)
      p.fill(200, 200, 220, satAlpha);
      p.stroke(160, 160, 180, satAlpha);
      p.strokeWeight(1.5);
      p.rectMode(p.CENTER);
      p.rect(0, 0, 20 * satSize, 14 * satSize, 3); // Rounded rectangle
      
      // Cartoon-style wings (solar panels) - more prominent
      p.fill(220, 220, 240, satAlpha);
      p.stroke(180, 180, 200, satAlpha);
      p.strokeWeight(1.5);
      
      // Left wing (larger, more cartoon-like)
      p.beginShape();
      p.vertex(-10 * satSize, -2 * satSize);
      p.vertex(-18 * satSize, -6 * satSize);
      p.vertex(-22 * satSize, 0);
      p.vertex(-18 * satSize, 6 * satSize);
      p.vertex(-10 * satSize, 2 * satSize);
      p.endShape(p.CLOSE);
      
      // Right wing
      p.beginShape();
      p.vertex(10 * satSize, -2 * satSize);
      p.vertex(18 * satSize, -6 * satSize);
      p.vertex(22 * satSize, 0);
      p.vertex(18 * satSize, 6 * satSize);
      p.vertex(10 * satSize, 2 * satSize);
      p.endShape(p.CLOSE);
      
      // Wing details (panel lines)
      p.stroke(150, 150, 170, satAlpha * 0.7);
      p.strokeWeight(1);
      p.noFill();
      p.line(-14 * satSize, -4 * satSize, -14 * satSize, 4 * satSize);
      p.line(14 * satSize, -4 * satSize, 14 * satSize, 4 * satSize);
      
      // Antenna (cartoon style - thicker)
      p.stroke(160, 160, 180, satAlpha);
      p.strokeWeight(2);
      p.line(0, -7 * satSize, 0, -14 * satSize);
      p.fill(220, 220, 240, satAlpha);
      p.noStroke();
      p.ellipse(0, -14 * satSize, 5 * satSize);
      
      // Small window/eye (cartoon detail)
      p.fill(150, 200, 255, satAlpha * 0.8);
      p.noStroke();
      p.ellipse(0, -2 * satSize, 6 * satSize, 6 * satSize);
      
      p.pop();
    }
  }
  
  /**
   * Draws the rocket independently of zone intensity to prevent blinking.
   */
  function drawRocket() {
    // Draw rocket (flies off screen before aurora)
    // Keep rocket visible until it flies off screen - check flight progress only
    const flightProgress = p.constrain(scrollProgress / 0.05, 0, 1); // Complete flight in first 5% of scroll (slower movement)
    // Stay visible as long as flight is in progress (don't check intensity to avoid blinking)
    // Use <= 0.999 to avoid floating point precision issues that could cause blinking
    if (flightProgress <= 0.999) { // Stay visible until flight is complete
      // Calculate rocket position - curved flight from lower left to right, exits before aurora
      const targetX = p.width + 200; // Exit further off-screen right (stays visible longer)
      const targetY = p.height * 0.3; // Exit on right side (not top)
      
      // Create curved trajectory using quadratic bezier curve
      // Control point creates a pronounced bow/arc shape
      // Position control point to create a clear outward-bowing arc
      const controlX = p.width * 0.5; // Control point X (centered for symmetric bow)
      const controlY = p.height * 0.2; // Control point Y (higher up to create upward bow)
      
      // Calculate position on bezier curve
      const t = flightProgress;
      const oneMinusT = 1 - t;
      
      // Standard bezier curve calculation for smooth bow shape
      const newX = oneMinusT * oneMinusT * rocket.startX + 
                   2 * oneMinusT * t * controlX + 
                   t * t * targetX;
      const newY = oneMinusT * oneMinusT * rocket.startY + 
                   2 * oneMinusT * t * controlY + 
                   t * t * targetY;
      
      // Add slight horizontal acceleration towards the end (but keep the bow shape)
      const horizontalBoost = t * t; // Quadratic easing for gentle end acceleration
      const finalX = p.lerp(newX, targetX, horizontalBoost * 0.15); // Small boost to maintain bow
      
      // Calculate direction of travel (point rocket in direction it's moving)
      // Store previous position before updating
      rocket.prevX = rocket.x;
      rocket.prevY = rocket.y;
      
      // Update position
      rocket.x = finalX;
      rocket.y = newY;
      
      // Calculate direction based on actual movement (works for both forward and backward)
      let dx = rocket.x - rocket.prevX;
      let dy = rocket.y - rocket.prevY;
      
      // If rocket hasn't moved yet (first frame or very small movement), use bezier derivative
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        dx = 2 * oneMinusT * (controlX - rocket.startX) + 2 * t * (targetX - controlX);
        dy = 2 * oneMinusT * (controlY - rocket.startY) + 2 * t * (targetY - controlY);
      }
      
      // Use atan2 to get angle, add PI/2 because rocket points up (negative Y) by default
      rocket.angle = p.atan2(dy, dx) + p.PI / 2;
      
      // Update exhaust trail
      rocket.trail.push({ x: rocket.x, y: rocket.y, life: 1.0 });
      // Remove old trail points
      rocket.trail = rocket.trail.filter(point => {
        point.life -= 0.05;
        return point.life > 0;
      });
      
      // Calculate alpha - keep fully visible throughout flight, no fading
      // Keep at full brightness to avoid any blinking
      const rocketAlpha = 255;
      
      // Draw exhaust trail first (so it appears behind)
      p.push();
      rocket.trail.forEach((point, index) => {
        const trailAlpha = point.life * rocketAlpha * 0.6;
        const trailSize = point.life * 15;
        p.fill(255, 100, 0, trailAlpha);
        p.noStroke();
        p.ellipse(point.x, point.y, trailSize, trailSize * 0.5);
      });
      p.pop();
      
      // Draw rocket - modern sleek design
      p.push();
      p.translate(rocket.x, rocket.y);
      p.rotate(rocket.angle);
      
      const rocketSize = 2.6; // Increased scale multiplier
      const bodyLength = 60 * rocketSize;
      const bodyWidth = 16 * rocketSize;
      
      // Main body - sleek cylindrical shape with contrast
      // Base body color (lighter)
      p.fill(250, 250, 255, rocketAlpha);
      p.stroke(200, 200, 210, rocketAlpha);
      p.strokeWeight(1.5);
      
      // Body cylinder
      p.ellipse(0, -bodyLength * 0.3, bodyWidth, bodyLength * 0.6);
      p.rect(-bodyWidth/2, -bodyLength * 0.3, bodyWidth, bodyLength * 0.6);
      
      // Darker contrast band in middle section
      p.fill(200, 200, 210, rocketAlpha);
      p.noStroke();
      p.rect(-bodyWidth/2, -bodyLength * 0.1, bodyWidth, bodyLength * 0.15);
      p.ellipse(0, -bodyLength * 0.025, bodyWidth, bodyLength * 0.15);
      
      // Highlight on top section
      p.fill(255, 255, 255, rocketAlpha);
      p.rect(-bodyWidth/2, -bodyLength * 0.3, bodyWidth, bodyLength * 0.2);
      p.ellipse(0, -bodyLength * 0.2, bodyWidth, bodyLength * 0.2);
      
      // Pointed nose cone - sleek and modern with contrast
      p.fill(255, 255, 255, rocketAlpha);
      p.stroke(200, 200, 210, rocketAlpha);
      p.strokeWeight(1.5);
      p.beginShape();
      p.vertex(0, -bodyLength * 0.5);
      p.vertex(-bodyWidth * 0.4, -bodyLength * 0.2);
      p.vertex(-bodyWidth * 0.5, 0);
      p.vertex(0, bodyLength * 0.1);
      p.vertex(bodyWidth * 0.5, 0);
      p.vertex(bodyWidth * 0.4, -bodyLength * 0.2);
      p.endShape(p.CLOSE);
      
      // Darker nose tip for contrast
      p.fill(220, 220, 230, rocketAlpha);
      p.noStroke();
      p.beginShape();
      p.vertex(0, -bodyLength * 0.5);
      p.vertex(-bodyWidth * 0.3, -bodyLength * 0.3);
      p.vertex(0, -bodyLength * 0.35);
      p.vertex(bodyWidth * 0.3, -bodyLength * 0.3);
      p.endShape(p.CLOSE);
      
      // Engine section at bottom - darker for contrast
      p.fill(180, 180, 190, rocketAlpha);
      p.stroke(150, 150, 160, rocketAlpha);
      p.strokeWeight(1.5);
      p.rect(-bodyWidth/2, bodyLength * 0.3, bodyWidth, bodyLength * 0.2);
      p.ellipse(0, bodyLength * 0.4, bodyWidth, bodyLength * 0.2);
      
      // Panel lines for detail with better contrast
      p.stroke(150, 150, 160, rocketAlpha * 0.8);
      p.strokeWeight(1);
      p.noFill();
      p.line(-bodyWidth/2, -bodyLength * 0.3, -bodyWidth/2, bodyLength * 0.3);
      p.line(bodyWidth/2, -bodyLength * 0.3, bodyWidth/2, bodyLength * 0.3);
      p.line(0, -bodyLength * 0.3, 0, bodyLength * 0.3);
      
      // Additional horizontal panel lines for more contrast
      p.stroke(160, 160, 170, rocketAlpha * 0.6);
      p.strokeWeight(0.8);
      p.line(-bodyWidth/2, -bodyLength * 0.1, bodyWidth/2, -bodyLength * 0.1);
      p.line(-bodyWidth/2, bodyLength * 0.1, bodyWidth/2, bodyLength * 0.1);
      
      // Small window/port
      p.fill(150, 200, 255, rocketAlpha * 0.8);
      p.noStroke();
      p.ellipse(0, -bodyLength * 0.15, bodyWidth * 0.4, bodyWidth * 0.4);
      p.fill(200, 230, 255, rocketAlpha * 0.5);
      p.ellipse(0, -bodyLength * 0.15, bodyWidth * 0.25, bodyWidth * 0.25);
      
      // Wings - sleek and modern
      p.fill(240, 240, 250, rocketAlpha);
      p.stroke(200, 200, 210, rocketAlpha);
      p.strokeWeight(1.5);
      
      // Left wing
      p.beginShape();
      p.vertex(-bodyWidth/2, bodyLength * 0.1);
      p.vertex(-bodyWidth * 0.8, bodyLength * 0.25);
      p.vertex(-bodyWidth * 0.6, bodyLength * 0.3);
      p.vertex(-bodyWidth * 0.4, bodyLength * 0.2);
      p.endShape(p.CLOSE);
      
      // Right wing
      p.beginShape();
      p.vertex(bodyWidth/2, bodyLength * 0.1);
      p.vertex(bodyWidth * 0.8, bodyLength * 0.25);
      p.vertex(bodyWidth * 0.6, bodyLength * 0.3);
      p.vertex(bodyWidth * 0.4, bodyLength * 0.2);
      p.endShape(p.CLOSE);
      
      // Wing details
      p.stroke(180, 180, 190, rocketAlpha * 0.6);
      p.strokeWeight(0.8);
      p.noFill();
      p.line(-bodyWidth * 0.6, bodyLength * 0.25, -bodyWidth * 0.4, bodyLength * 0.2);
      p.line(bodyWidth * 0.6, bodyLength * 0.25, bodyWidth * 0.4, bodyLength * 0.2);
      
      // Flame exhaust - animated and vibrant
      const exhaustOffset = p.sin(p.frameCount * 0.3) * 2;
      const exhaustLength = 25 + p.sin(p.frameCount * 0.4) * 8;
      const exhaustWidth = bodyWidth * 0.7;
      
      // Outer flame (orange/red)
      p.fill(255, 80, 0, rocketAlpha * 0.9);
      p.noStroke();
      p.beginShape();
      p.vertex(-exhaustWidth/2, bodyLength * 0.4);
      p.vertex(-exhaustWidth * 0.35 + exhaustOffset, bodyLength * 0.4 + exhaustLength);
      p.vertex(0, bodyLength * 0.4 + exhaustLength * 1.2);
      p.vertex(exhaustWidth * 0.35 - exhaustOffset, bodyLength * 0.4 + exhaustLength);
      p.vertex(exhaustWidth/2, bodyLength * 0.4);
      p.endShape(p.CLOSE);
      
      // Middle flame (yellow-orange)
      p.fill(255, 150, 0, rocketAlpha * 0.85);
      p.beginShape();
      p.vertex(-exhaustWidth * 0.3, bodyLength * 0.4);
      p.vertex(-exhaustWidth * 0.2 + exhaustOffset * 0.6, bodyLength * 0.4 + exhaustLength * 0.7);
      p.vertex(0, bodyLength * 0.4 + exhaustLength * 0.9);
      p.vertex(exhaustWidth * 0.2 - exhaustOffset * 0.6, bodyLength * 0.4 + exhaustLength * 0.7);
      p.vertex(exhaustWidth * 0.3, bodyLength * 0.4);
      p.endShape(p.CLOSE);
      
      // Inner flame (bright yellow-white)
      p.fill(255, 220, 150, rocketAlpha * 0.8);
      p.beginShape();
      p.vertex(-exhaustWidth * 0.2, bodyLength * 0.4);
      p.vertex(0, bodyLength * 0.4 + exhaustLength * 0.5);
      p.vertex(exhaustWidth * 0.2, bodyLength * 0.4);
      p.endShape(p.CLOSE);
      
      // Exhaust particles
      for (let i = 0; i < 4; i++) {
        const particleX = p.random(-exhaustWidth * 0.4, exhaustWidth * 0.4);
        const particleY = bodyLength * 0.4 + p.random(8, exhaustLength * 0.9);
        const particleSize = p.random(2, 4);
        const particleAlpha = p.random(150, 255) * (rocketAlpha / 255);
        p.fill(255, p.random(100, 200), 0, particleAlpha);
        p.ellipse(particleX, particleY, particleSize);
      }
      
      p.pop();
    }
  }
  
  /**
   * Generates the next aurora L-system sentence.
   * Limits growth to prevent performance crashes.
   */
  function generateAuroraSentence() {
    if (auroraSentence.length > 100) {
      // If it gets too long, reset to a simpler state rather than crashing
      auroraSentence = [{ symbol: "A", weight: p.random(1, 3) }];
      return;
    }

    let nextSentence = [];
    for (let i = 0; i < auroraSentence.length; i++) {
      const char = auroraSentence[i].symbol;
      if (auroraRules[char]) {
        // Only expand with a certain probability to keep it organic but stable
        if (p.random() > 0.5) {
          auroraRules[char].forEach(production => {
            nextSentence.push({ symbol: production.symbol, weight: production.weight() });
          });
        } else {
          nextSentence.push(auroraSentence[i]);
        }
      } else {
        nextSentence.push(auroraSentence[i]);
      }
    }
    auroraSentence = nextSentence;
  }
  
  /**
   * Draws aurora zone elements (aurora waves and enhanced stars).
   * Optimized for better performance.
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawAuroraElements(intensity) {
    // Draw aurora waves
    const baseHeight = p.height * 0.5 - maxWaveHeight;
    const baselineOffsets = [];
    const secondWaveOffsets = [];
    
    // Increased sample step for better performance (was 15, now 20)
    const sampleStep = 20;
    
    for (let i = 0; i < p.width; i += sampleStep) {
      const waveOffset = p.noise(i * noiseScale, yPosNoiseOffset) * maxWaveHeight + 
                         Math.sin(i * 0.004) * maxWaveHeight * 10 + i * 0.2;
      baselineOffsets.push(baseHeight + waveOffset);
      const secondWaveOffset = p.noise(i * noiseScale, yPosNoiseOffset + 1000) * maxWaveHeight * 0.5 + 
                               Math.sin(i * 0.009) * maxWaveHeight * 5 + (p.width - i) * 0.1;
      secondWaveOffsets.push(p.height * 0.35 + secondWaveOffset);
    }
    
    // Draw aurora waves with L-system based stroke weights
    // Optimized: reduce vertical sampling and limit line drawing
    for (let i = 0; i < baselineOffsets.length; i++) {
      const x = i * sampleStep;
      const baseY = baselineOffsets[i];
      const secondBaseY = secondWaveOffsets[i];
      const lineHeight = p.map(p.noise(x * noiseScale, yPosNoiseOffset), 0, 1.5, 0, p.height - 2);
      
      const strokeIndex = i % auroraSentence.length;
      // Increased stroke weight multiplier for brighter aurora
      const strokeWeight = auroraSentence[strokeIndex].weight * intensity * 1.3;
      
      // Optimized: sample every 3 pixels vertically instead of every pixel
      const verticalStep = 3;
      const maxHeight = Math.min(lineHeight, p.height * 0.7); // Increased height for more visibility
      
      // Draw main aurora wave - brighter with extended fade
      for (let j = 0; j < maxHeight; j += verticalStep) {
        const gradientRatio = j / maxHeight;
        const interColor = p.lerpColor(auroraGreen, auroraPurple, gradientRatio);
        // Increased brightness: extend bright area and multiply alpha
        let alpha;
        if (j < maxHeight * 0.3) {
          // Keep it bright for the first 30% of height
          alpha = 255 * intensity * 1.2;
        } else {
          // Gradual fade for the rest
          const fadeRatio = (j - maxHeight * 0.3) / (maxHeight * 0.7);
          alpha = p.map(fadeRatio, 0, 1, 255 * intensity * 1.2, 0);
        }
        
        // Only draw if alpha is significant
        if (alpha > 15) {
          p.stroke(p.red(interColor), p.green(interColor), p.blue(interColor), alpha);
          p.strokeWeight(strokeWeight);
          p.line(x, baseY - j, x, baseY - (j + verticalStep));
        }
      }
      
      // Second wave layer - brighter and more visible
      if (intensity > 0.2 && secondBaseY > 0 && secondBaseY < p.height) {
        const secondLineHeight = Math.min(maxHeight * 0.8, p.height * 0.5);
        for (let j = 0; j < secondLineHeight; j += verticalStep) {
          const gradientRatio = j / secondLineHeight;
          const interColor = p.lerpColor(auroraGreen, auroraPurple, gradientRatio);
          // Brighter second wave
          let alpha;
          if (j < secondLineHeight * 0.3) {
            alpha = 220 * intensity * 1.1;
          } else {
            const fadeRatio = (j - secondLineHeight * 0.3) / (secondLineHeight * 0.7);
            alpha = p.map(fadeRatio, 0, 1, 220 * intensity * 1.1, 0);
          }
          
          if (alpha > 10) {
            p.stroke(p.red(interColor), p.green(interColor), p.blue(interColor), alpha);
            p.strokeWeight(strokeWeight * 0.9);
            p.line(x, secondBaseY - j, x, secondBaseY - (j + verticalStep));
          }
        }
      }
    }
    
    // Draw enhanced twinkling stars (aurora style)
    // Optimized: only update stars every other frame
    p.push();
    auroraStars.forEach((star, index) => {
      // Update star lifespan less frequently (every other frame)
      if (p.frameCount % 2 === 0 || index % 2 === 0) {
        star.lifespan -= 0.5;
        if (star.lifespan <= 0) {
          star.lifespan = p.random(200, 300);
          star.x = p.random(p.width);
          star.y = p.random(p.height * 0.6, p.height);
          star.brightness = p.random(150, 255);
        }
      }
      
      const alpha = p.map(star.lifespan, 0, 300, 0, star.brightness) * intensity;
      if (alpha > 10) { // Only draw if visible
        p.fill(255, 255, 224, alpha);
        p.noStroke();
        p.ellipse(star.x, star.y, star.size);
        
        // Draw twinkle effect only for brightest stars
        if (intensity > 0.5 && alpha > 100) {
          drawStarTwinkle(star, alpha);
        }
      }
    });
    p.pop();
  }
  
  /**
   * Draws twinkle effect for aurora stars (cross pattern with fading).
   * Optimized: reduced line count.
   * @param {Object} star - Star object
   * @param {number} alpha - Current alpha value
   */
  function drawStarTwinkle(star, alpha) {
    const lineLength = star.size * 2.5; // Slightly shorter
    const fadeExtent = lineLength / 2;
    
    // Reduced sampling for better performance
    const step = 2;
    for (let i = 0; i < fadeExtent; i += step) {
      const fadeAlpha = p.map(i, 0, fadeExtent, 0, alpha);
      p.stroke(255, 255, 224, fadeAlpha);
      p.strokeWeight(1);
      p.line(star.x - fadeExtent + i, star.y, star.x + fadeExtent - i, star.y);
      p.line(star.x, star.y - fadeExtent + i, star.x, star.y + fadeExtent - i);
    }
  }
  
  /**
   * Draws sky zone elements (clouds and birds).
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawSkyElements(intensity) {
    // Draw floating clouds
    // Add a more pronounced upward drift as sky fades out
    const cloudRise = p.map(intensity, 0, 1, -p.height * 0.2, 0);
    
    p.push();
    clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > p.width + cloud.size) {
        cloud.x = -cloud.size;
      }
      
      p.fill(255, 255, 255, cloud.opacity * intensity);
      p.noStroke();
      
      const cy = cloud.y + cloudRise;
      
      // Draw cloud as overlapping ellipses
      p.ellipse(cloud.x, cy, cloud.size, cloud.size * 0.6);
      p.ellipse(cloud.x + cloud.size * 0.3, cy, cloud.size * 0.8, cloud.size * 0.7);
      p.ellipse(cloud.x - cloud.size * 0.3, cy, cloud.size * 0.7, cloud.size * 0.6);
      p.ellipse(cloud.x, cy - cloud.size * 0.2, cloud.size * 0.6, cloud.size * 0.5);
    });
    p.pop();
    
    // Draw animated birds (V shapes with flapping wings)
    if (intensity > 0.4) {
      p.push();
      // Fade birds in as sky becomes more dominant
      const birdAlpha = p.map(intensity, 0.4, 1.0, 0, 200);
      p.stroke(255, 255, 255, birdAlpha);
      p.strokeWeight(2);
      p.noFill();
      
      for (let i = 0; i < 5; i++) {
        // Individual bird timing
        const birdTime = p.frameCount * 0.1 + i;
        const birdX = (p.frameCount * 2 + i * 200) % (p.width + 100) - 50;
        const birdY = (p.height * 0.25 + cloudRise) + p.sin(p.frameCount * 0.05 + i) * 20;
        
        // Wing flapping motion (sin wave for wing offset)
        const wingSpan = 10;
        const flapHeight = p.sin(birdTime) * 8; // -8 to 8
        
        // Left wing
        p.line(birdX, birdY, birdX - wingSpan, birdY - flapHeight);
        // Right wing
        p.line(birdX, birdY, birdX + wingSpan, birdY - flapHeight);
      }
      p.pop();
    }
  }

  /**
   * Draws sea surface zone elements (waves and boat).
   * Optimized: reduced wave sampling.
   * @param {number} intensity - Zone intensity (0-1)
   */
  /**
   * Draws sunset zone elements (sun and warm waves).
   * Replaces sea surface elements with a warm sunset theme.
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawSunsetElements(intensity) {
    const zone = calculateZone();
    
    // Calculate dynamic baseline for the sea (rising horizon)
    let riseIntensity = intensity;
    if (zone.deepSea > 0) riseIntensity = 1.0;
    
    let currentSeaY;
    if (zone.deepSea > 0) {
      const scrollOffOffset = p.map(zone.deepSea, 0, 1, 0, -p.height * 0.6);
      currentSeaY = waves.y + scrollOffOffset;
    } else {
      const horizonOffset = p.map(riseIntensity, 0, 1, p.height * 0.55, 0);
      currentSeaY = waves.y + horizonOffset;
    }

    // Gradual fade for the whole sea section
    const seaAlpha = zone.deepSea > 0 ? p.map(zone.deepSea, 0, 0.95, 255, 0) : 255 * intensity;
    
    if (seaAlpha < 1) return;

    p.push();
    // 1. Draw the "body" of the water (filled area)
    // Using a deep blue that blends into the horizon color
    const oceanFill = p.color(p.red(seaSurfaceColor), p.green(seaSurfaceColor), p.blue(seaSurfaceColor), seaAlpha * 0.4);
    p.fill(oceanFill);
    p.noStroke();
    
    // Draw the main body of water
    p.beginShape();
    p.vertex(0, p.height); // Bottom left
    p.vertex(-50, currentSeaY); // Top left (horizon start)
    
    const waveTime = p.frameCount * 0.025; // Increased speed for more dynamic movement
    for (let x = -50; x <= p.width + 50; x += 15) {
      // Create sharper peaks for a more "wave" like look
      const freq = 0.008;
      const baseWave = p.sin(x * freq + waveTime * 0.8);
      const sharpWave = p.pow(p.map(baseWave, -1, 1, 0, 1), 1.5);
      
      const noiseVal = p.noise(x * 0.004, waveTime * 0.3) * 20;
      const y = currentSeaY - (sharpWave * 45) + noiseVal; // Increased amplitude
      p.vertex(x, y);
    }
    
    p.vertex(p.width + 50, currentSeaY); // Top right
    p.vertex(p.width, p.height); // Bottom right
    p.endShape(p.CLOSE);

    // 2. Draw expressive wave lines (layers)
    const numLayers = 5; 
    for (let i = 0; i < numLayers; i++) {
      const layerYOffset = i * 40; // More spacing between layers
      const speedMult = 0.7 + i * 0.3;
      const freqMult = 1.0 + i * 0.15;
      const amplitude = (30 - i * 4) * 1.5; // Increased amplitude
      
      p.noFill();
      
      const edgeAlpha = p.map(i, 0, numLayers - 1, 240, 60) * (seaAlpha / 255);
      const waveCol = p.lerpColor(p.color(255, 255, 255), seaSurfaceColor, i * 0.15);
      p.stroke(p.red(waveCol), p.green(waveCol), p.blue(waveCol), edgeAlpha);
      p.strokeWeight(3.5 - i * 0.5); // Slightly thicker lines
      
      p.beginShape();
      for (let x = -50; x <= p.width + 50; x += 12) {
        const baseWave = p.sin(x * 0.008 * freqMult + waveTime * speedMult);
        const sharpWave = p.pow(p.map(baseWave, -1, 1, 0, 1), 1.8);
        
        const noiseVal = p.noise(x * 0.004, waveTime * 0.3 + i) * 15;
        const y = currentSeaY + layerYOffset - (sharpWave * amplitude) + noiseVal;
        
        p.vertex(x, y);
        
        // Add "foam" glints at the peaks
        if (sharpWave > 0.93 && p.random() > 0.7) {
          p.push();
          p.stroke(255, 255, 255, edgeAlpha * 1.6);
          p.strokeWeight(2.5);
          p.point(x + p.random(-8, 8), y + p.random(-3, 3));
          p.pop();
        }
      }
      p.endShape();
    }
    
    p.pop();
  }

  /**
   * Draws the sun independently across sky and sunset zones.
   */
  /**
   * Draws the sun independently across sky and sunset zones.
   * Implements a true "SUN DOWN" with horizon clipping.
   */
  function drawSun() {
    const zone = calculateZone();
    
    // 1. Journey Timing:
    // Starts emerging when the Sky zone is fully active (0.45)
    // Hits the waves at the end of Sunset (0.82)
    const sunStart = 0.45;
    const sunEnd = 0.82;
    
    if (scrollProgress < sunStart) return;
    
    // Normalize progress (0.0 to 1.0)
    const t = p.constrain((scrollProgress - sunStart) / (sunEnd - sunStart), 0, 1);
    
    // Determine the ACTUAL line where the water meets the air
    let horizonY;
    if (zone.deepSea > 0) {
      const scrollOffOffset = p.map(zone.deepSea, 0, 1, 0, -p.height * 0.6);
      horizonY = waves.y + scrollOffOffset;
    } else if (zone.sunset > 0) {
      // Transition from bottom of screen to waves.y
      const horizonOffset = p.map(zone.sunset, 0, 1, p.height * 0.55, 0);
      horizonY = waves.y + horizonOffset;
    } else if (scrollProgress > 0.5) {
      // Horizon is starting to rise
      const localSunsetT = p.constrain((scrollProgress - 0.55) / (0.82 - 0.55), 0, 1);
      const horizonOffset = p.map(localSunsetT, 0, 1, p.height * 0.55, 0);
      horizonY = waves.y + horizonOffset;
    } else {
      // Horizon is still below screen
      horizonY = waves.y + p.height * 0.55;
    }

    // 3. Trajectory:
    // A beautiful "bow" arc from top-right to center-horizon
    const sunT = zone.deepSea > 0 ? 1.0 : t;
    const p0x = p.width * 1.15;  // Off-screen right
    const p0y = p.height * 0.15; // Higher start for a more natural mid-day sun
    const p1x = p.width * 0.75;  // Control point
    const p1y = -p.height * 0.4; // Much higher peak for a grand arc
    const p2x = p.width * 0.4;   // Center-ish left
    const p2y = horizonY;        // Hits the waves
    
    const sunX = (1 - sunT) * (1 - sunT) * p0x + 2 * (1 - sunT) * sunT * p1x + sunT * sunT * p2x;
    const sunY = (1 - sunT) * (1 - sunT) * p0y + 2 * (1 - sunT) * sunT * p1y + sunT * sunT * p2y;
    
    // 4. Visuals:
    // Color: Very Pale Yellow (Natural Sun) -> Warm Sunset Orange
    // Using a strong power curve to keep it pale/bright for much longer
    const colorT = p.pow(sunT, 2.5); 
    const sunColor = p.lerpColor(p.color(255, 255, 245), sunsetColor, colorT);
    
    // Alpha: Fade in early, fade out very late
    const fadeIn = p.map(t, 0, 0.1, 0, 255);
    const fadeOut = zone.deepSea > 0 ? p.map(zone.deepSea, 0, 0.9, 255, 0) : 255;
    const sunAlpha = p.constrain(p.min(fadeIn, fadeOut), 0, 255);
    
    if (sunAlpha > 1) {
      p.push();
      
      // Helper function to draw a circle clipped by the horizon line
      const drawClippedSun = (x, y, d, col) => {
        const r = d / 2;
        const dy = horizonY - y; // Distance from sun center to horizon
        
        if (dy > r) {
          // Fully above horizon
          p.fill(col);
          p.noStroke();
          p.circle(x, y, d);
        } else if (dy > -r) {
          // Partially submerged: Draw top part from bottom-up
          // We calculate the angle where the circle intersects the horizon
          const angle = p.asin(p.constrain(dy / r, -1, 1));
          p.fill(col);
          p.noStroke();
          // arc(x, y, w, h, start, stop, mode)
          // Angles in p5: PI is 9 o'clock, 2PI is 3 o'clock. 
          // PI-angle to 2PI+angle draws the top part correctly.
          p.arc(x, y, d, d, p.PI - angle, p.TWO_PI + angle, p.CHORD);
        }
      };

      // 1. Draw Atmospheric Glow (also clipped)
      // Stay white-pale longer to match the core's intense heat
      const glowColBase = p.lerpColor(p.color(255, 255, 255), p.color(255, 80, 0), p.pow(sunT, 2.2));
      const glowLayers = 6;
      for (let i = glowLayers; i > 0; i--) {
        const layerSize = sun.size * (1 + i * 0.35);
        const glowAlpha = sunAlpha * (1 - i / glowLayers) * 0.25;
        const layerCol = p.color(p.red(glowColBase), p.green(glowColBase), p.blue(glowColBase), glowAlpha);
        drawClippedSun(sunX, sunY, layerSize, layerCol);
      }
      
      // 2. Draw Core
      drawClippedSun(sunX, sunY, sun.size, p.color(p.red(sunColor), p.green(sunColor), p.blue(sunColor), sunAlpha));
      
      p.pop();
    }
  }

  /**
   * Draws deep sea zone elements (bubbles and fish).
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawDeepSeaElements(intensity) {
    // The horizon scrolls off screen as we descend
    const scrollOffOffset = p.map(intensity, 0, 1, 0, -p.height * 0.6);
    const horizonY = waves.y + 20 + scrollOffOffset; 
    const fadePadding = 60; 

    // Draw background plants (layer 1) - half of them
    drawSeaPlants(intensity, 0, Math.floor(seaPlants.length / 2), horizonY);

    // Draw rising bubbles
    p.push();
    bubbles.forEach(bubble => {
      bubble.y -= bubble.speed;
      if (bubble.y < horizonY) {
        bubble.y = p.height + bubble.size;
        bubble.x = p.random(p.width);
      }
      let surfaceFade = 1.0;
      if (bubble.y < horizonY + fadePadding) {
        surfaceFade = p.map(bubble.y, horizonY + fadePadding, horizonY, 1.0, 0.0);
      }
      const finalOpacity = bubble.opacity * intensity * surfaceFade;
      if (finalOpacity > 5) {
        p.fill(255, 255, 255, finalOpacity);
        p.stroke(200, 200, 255, finalOpacity * 0.5);
        p.strokeWeight(1);
        p.ellipse(bubble.x, bubble.y, bubble.size);
        p.fill(255, 255, 255, finalOpacity * 0.5);
        p.noStroke();
        p.ellipse(bubble.x - bubble.size * 0.2, bubble.y - bubble.size * 0.2, bubble.size * 0.3);
      }
    });
    p.pop();
    
    // Draw jellyfish (ethereal, pulsing, swimming up)
    p.push();
    jellyfish.forEach(jelly => {
      const pulse = p.sin(p.frameCount * 0.04 + jelly.offset);
      const moveUp = p.map(pulse, -1, 1, 0.2, 1.2) * jelly.speed;
      jelly.y -= moveUp;
      jelly.x += p.sin(p.frameCount * 0.02 + jelly.offset) * 0.5;
      if (jelly.y < horizonY - jelly.size) {
        jelly.y = p.height + jelly.size * 2;
        jelly.x = p.random(p.width * 0.05, p.width * 0.5);
      }
      let surfaceFade = 1.0;
      if (jelly.y < horizonY + fadePadding) {
        surfaceFade = p.map(jelly.y, horizonY + fadePadding, horizonY, 1.0, 0.0);
      }
      const finalAlpha = p.alpha(jelly.color) * intensity * surfaceFade;
      if (finalAlpha > 5) {
        p.push();
        p.translate(jelly.x, jelly.y);
        p.noFill();
        p.stroke(p.red(jelly.color), p.green(jelly.color), p.blue(jelly.color), finalAlpha * 0.4);
        p.strokeWeight(1.2);
        for (let i = 0; i < 5; i++) {
          const tOffset = i * 0.5;
          p.beginShape();
          for (let seg = 0; seg < 6; seg++) {
            const tx = p.sin(p.frameCount * 0.08 + seg * 0.5 + tOffset) * (5 + seg * 2);
            const ty = seg * (jelly.size * 0.22);
            p.vertex(tx + (i - 2) * (jelly.size * 0.12), ty + jelly.size * 0.15);
          }
          p.endShape();
        }
        const pulseWidth = jelly.size * (1 + pulse * 0.1);
        const pulseHeight = jelly.size * 0.6 * (1 - pulse * 0.05);
        p.fill(p.red(jelly.color), p.green(jelly.color), p.blue(jelly.color), finalAlpha * 0.5);
        p.noStroke();
        p.arc(0, 0, pulseWidth, pulseHeight, p.PI, p.TWO_PI, p.CHORD);
        p.fill(p.red(jelly.color), p.green(jelly.color), p.blue(jelly.color), finalAlpha * 0.8);
        p.arc(0, 0, pulseWidth * 0.7, pulseHeight * 0.7, p.PI, p.TWO_PI, p.CHORD);
        p.fill(255, 255, 255, finalAlpha * 0.4);
        p.ellipse(0, -pulseHeight * 0.25, pulseWidth * 0.5, pulseHeight * 0.3);
        p.pop();
      }
    });
    p.pop();
    
    // Draw floating fish
    p.push();
    fishes.forEach(fish => {
      fish.x += fish.speed * fish.direction;
      if (fish.x > p.width + 50) {
        fish.x = -50;
      } else if (fish.x < -50) {
        fish.x = p.width + 50;
      }
      if (fish.y < horizonY + 50) {
        fish.y = p.random(horizonY + 50, p.height);
      }
      let fishFade = 1.0;
      const fishFadePadding = 100;
      if (fish.y < horizonY + fishFadePadding) {
        fishFade = p.map(fish.y, horizonY + fishFadePadding, horizonY + 20, 1.0, 0.0);
      }
      const finalFishAlpha = 255 * intensity * fishFade;
      if (finalFishAlpha > 5) {
        p.push();
        p.translate(fish.x, fish.y);
        p.scale(fish.direction, 1);
        const wiggle = p.sin(p.frameCount * 0.15 + fish.x * 0.1) * 5;
        const bodyCol = p.color(p.red(fish.color), p.green(fish.color), p.blue(fish.color), finalFishAlpha);
        p.fill(bodyCol);
        p.stroke(0, 0, 0, 60 * intensity * fishFade);
        p.strokeWeight(1);
        if (fish.type === 'slender') {
          p.push();
          p.translate(-fish.size * 0.45, 0);
          p.rotate(p.radians(wiggle * 3));
          p.beginShape();
          p.vertex(0, 0);
          p.bezierVertex(-fish.size * 0.4, -fish.size * 0.3, -fish.size * 0.6, -fish.size * 0.5, -fish.size * 0.9, 0);
          p.bezierVertex(-fish.size * 0.6, fish.size * 0.5, -fish.size * 0.4, fish.size * 0.3, 0, 0);
          p.endShape(p.CLOSE);
          p.pop();
          p.ellipse(0, 0, fish.size, fish.size * 0.35);
          p.fill(p.red(fish.color), p.green(fish.color), p.blue(fish.color), finalFishAlpha * 0.7);
          p.beginShape();
          p.vertex(-fish.size * 0.2, -fish.size * 0.15);
          p.bezierVertex(0, -fish.size * 0.4, fish.size * 0.2, -fish.size * 0.3, fish.size * 0.1, -fish.size * 0.1);
          p.endShape(p.CLOSE);
          p.fill(255, 255, 255, finalFishAlpha);
          p.noStroke();
          p.ellipse(fish.size * 0.35, -fish.size * 0.05, fish.size * 0.12);
          p.fill(0, 0, 0, finalFishAlpha);
          p.ellipse(fish.size * 0.35, -fish.size * 0.05, fish.size * 0.06);
        } else {
          p.push();
          p.translate(-fish.size * 0.45, 0); 
          p.rotate(p.radians(wiggle * 2.5));
          p.triangle(0, 0, -fish.size * 0.4, -fish.size * 0.35, -fish.size * 0.4, fish.size * 0.35);
          p.pop();
          p.ellipse(0, 0, fish.size, fish.size * 0.6);
          p.fill(p.red(fish.color), p.green(fish.color), p.blue(fish.color), finalFishAlpha * 0.8);
          p.triangle(0, 0, -fish.size * 0.2, -fish.size * 0.4, fish.size * 0.1, -fish.size * 0.1);
          p.fill(255, 255, 255, finalFishAlpha);
          p.noStroke();
          p.ellipse(fish.size * 0.25, -fish.size * 0.1, fish.size * 0.15);
          p.fill(0, 0, 0, finalFishAlpha);
          p.ellipse(fish.size * 0.25, -fish.size * 0.1, fish.size * 0.07);
        }
        p.pop();
      }
    });
    p.pop();

    // Draw foreground plants (layer 2) - other half
    drawSeaPlants(intensity, Math.floor(seaPlants.length / 2), seaPlants.length, horizonY);
  }

  /**
   * Helper function to draw sea plants (coral and seaweed) with swaying motion.
   */
  function drawSeaPlants(intensity, start, end, horizonY) {
    p.push();
    const plantScrollOffset = p.map(intensity, 0, 1, p.height, 0);
    
    for (let i = start; i < end; i++) {
      const plant = seaPlants[i];
      if (!plant) continue;

      const x = plant.x;
      const y = plant.y + plantScrollOffset;
      const baseSway = p.sin(p.frameCount * plant.swaySpeed + plant.swayOffset);
      
      p.push();
      p.translate(x, y);
      
      if (plant.type === 'seaweed') {
        p.noStroke();
        for (let b = 0; b < plant.numBlades; b++) {
          const bOffset = b * (plant.size * 0.08) - (plant.numBlades * 0.04 * plant.size);
          const bSway = p.sin(p.frameCount * plant.swaySpeed + plant.swayOffset + b * 0.5) * (plant.size * 0.12);
          const bHeight = plant.size * (0.7 + p.noise(i, b) * 0.4);
          const bCol = p.color(p.red(plant.color), p.green(plant.color) + b * 5, p.blue(plant.color), p.alpha(plant.color) * 0.8);
          p.fill(bCol);
          p.beginShape();
          p.vertex(bOffset - plant.size * 0.05, 0);
          p.bezierVertex(bOffset - plant.size * 0.02 + bSway, -bHeight * 0.4, bOffset + plant.size * 0.05 + bSway * 1.5, -bHeight * 0.7, bOffset + bSway * 2, -bHeight);
          p.bezierVertex(bOffset + plant.size * 0.08 + bSway * 1.2, -bHeight * 0.6, bOffset + plant.size * 0.1 + bSway, -bHeight * 0.3, bOffset + plant.size * 0.05, 0);
          p.endShape(p.CLOSE);
        }
      } else {
        // --- DETAILED ORGANIC CORAL ---
        p.strokeCap(p.ROUND);
        p.strokeJoin(p.ROUND);
        p.noFill();
        const tipColor = p.color(255, 255, 255, 200); 
        
        const drawCoralBranch = (structure, len, weight, depth, maxDepth) => {
          if (!structure || structure.length === 0) return;
          structure.forEach((branch, idx) => {
            p.push();
            const lerpAmt = depth / maxDepth;
            const branchCol = p.lerpColor(plant.color, tipColor, lerpAmt * 0.7);
            p.stroke(branchCol);
            const swayMag = 3 / (depth + 1);
            p.rotate(p.radians(branch.angle + baseSway * swayMag));
            p.strokeWeight(weight);
            p.line(0, 0, 0, -len);
            p.translate(0, -len);
            if (depth >= 2) {
              p.push();
              p.noStroke();
              p.fill(255, 255, 255, 100);
              p.circle(0, 0, weight * 0.6);
              p.pop();
            }
            drawCoralBranch(branch.children, len * branch.lenMult, weight * 0.75, depth + 1, maxDepth);
            p.pop();
          });
        };

        p.push();
        p.stroke(plant.color);
        const baseWeight = plant.size * 0.06;
        p.strokeWeight(baseWeight);
        const mainLen = plant.size * 0.25;
        p.line(0, 0, 0, -mainLen);
        p.translate(0, -mainLen);
        drawCoralBranch(plant.coralStructure, mainLen, baseWeight * 0.8, 1, 3);
        p.pop();
      }
      p.pop();
    }
    p.pop();
  }
  
  /**
   * Adjusts canvas size when window is resized.
   */
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    maxScroll = document.body.scrollHeight - p.windowHeight;
  };
  
  /**
   * Cleans up intervals when sketch is removed.
   */
  p.remove = () => {
    if (auroraIntervalID) {
      clearInterval(auroraIntervalID);
    }
  };
};

// Initialize p5.js sketch in instance mode
new p5(immersiveScroll, "canvas-bg");

