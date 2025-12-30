/**
 * Immersive Scroll Animation
 * A p5.js sketch that creates a reactive background animation
 * that transitions through Space -> Aurora -> Sky -> Sea Surface -> Deep Sea
 * based on scroll position.
 */

const immersiveScroll = (p) => {
  // Color definitions for different zones
  const spaceColor = p.color(0, 0, 0);        // Black - Space
  const polarNightColor = p.color(36, 41, 51); // Polar Night - Aurora background
  const auroraGreen = p.color(0, 255, 180);   // Brighter Aurora Green
  const auroraPurple = p.color(150, 50, 200); // Brighter Aurora Purple
  const skyColor = p.color(135, 206, 250);     // Light Blue - Sky
  const seaSurfaceColor = p.color(0, 119, 190); // Blue - Sea Surface
  const deepSeaColor = p.color(0, 51, 102);    // Dark Blue - Deep Sea
  
  // Animation elements
  let stars = [];
  let auroraStars = []; // Enhanced stars for aurora zone
  let meteorites = []; // Falling stars/meteorites
  let clouds = []; // Clouds for sky zone
  let bubbles = [];
  let fishes = [];
  let rocket = { 
    startX: 0, 
    startY: 0, 
    x: 0, 
    y: 0, 
    prevX: 0,
    prevY: 0,
    angle: 0,
    trail: [] // For exhaust trail
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
  let boat = { x: 0, y: 0, waveOffset: 0 };
  
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
  const scrollThrottle = 16; // Update scroll max once per ~16ms (60fps equivalent)
  
  /**
   * p5.js setup function. Initializes canvas and creates animation elements.
   */
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("canvas-bg");
    p.frameRate(60);
    
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
    
    // Initialize clouds for sky zone
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.3, p.height * 0.6),
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
    for (let i = 0; i < 10; i++) {
      fishes.push({
        x: p.random(p.width),
        y: p.random(p.height * 0.7, p.height),
        size: p.random(20, 40),
        speed: p.random(0.5, 1.5),
        direction: p.random([-1, 1]),
        color: p.color(p.random(100, 255), p.random(100, 200), p.random(150, 255))
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
    
    // Initialize boat position
    boat.x = p.width * 0.5;
    boat.y = p.height * 0.6;
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
    
    if (zone.sky > 0.1) {
      drawSkyElements(zone.sky);
    }
    
    if (zone.seaSurface > 0.1) {
      drawSeaSurfaceElements(zone.seaSurface);
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
    // Aurora starts when "OUR MAIN SERVICES" appears at bottom of screen
    const spaceEnd = 0.04;       // Space: 0% - 4% (header/hero)
    const auroraEnd = 0.22;       // Aurora: 4% - 22% (services section visible)
    const skyEnd = 0.38;          // Sky: 22% - 38% (transition to day)
    const seaSurfaceEnd = 0.58;    // Sea Surface: 38% - 58%
    // Deep Sea: 58% - 100%
    
    let space = 0;
    let aurora = 0;
    let sky = 0;
    let seaSurface = 0;
    let deepSea = 0;
    
    if (scrollProgress < spaceEnd) {
      // In space zone
      space = 1 - (scrollProgress / spaceEnd);
    } else if (scrollProgress < auroraEnd) {
      // Transitioning from space to aurora
      const localProgress = (scrollProgress - spaceEnd) / (auroraEnd - spaceEnd);
      space = 1 - localProgress;
      aurora = localProgress;
    } else if (scrollProgress < skyEnd) {
      // Transitioning from aurora to sky
      const localProgress = (scrollProgress - auroraEnd) / (skyEnd - auroraEnd);
      aurora = 1 - localProgress;
      sky = localProgress;
    } else if (scrollProgress < seaSurfaceEnd) {
      // Transitioning from sky to sea surface
      const localProgress = (scrollProgress - skyEnd) / (seaSurfaceEnd - skyEnd);
      sky = 1 - localProgress;
      seaSurface = localProgress;
    } else {
      // Transitioning from sea surface to deep sea
      const localProgress = (scrollProgress - seaSurfaceEnd) / (1 - seaSurfaceEnd);
      seaSurface = 1 - localProgress;
      deepSea = localProgress;
    }
    
    return { space, aurora, sky, seaSurface, deepSea };
  }
  
  /**
   * Draws the background with smooth color transitions between zones.
   * Optimized to reduce drawing calls.
   * @param {Object} zone - Zone weights
   */
  function drawBackground(zone) {
    // If aurora is active, draw gradient background (aurora style)
    // Optimized: sample every 2 pixels instead of every pixel
    if (zone.aurora > 0.1) {
      const polarNight = polarNightColor;
      const black = spaceColor;
      
      // Blend between space black and polar night based on aurora intensity
      const gradientStep = 2; // Sample every 2 pixels for better performance
      for (let y = 0; y < p.height; y += gradientStep) {
        const lerpRatio = p.map(y, 0, p.height, 0, 1);
        let gradientColor;
        
        // Start with aurora gradient (black to polar night)
        gradientColor = p.lerpColor(black, polarNight, lerpRatio);
        
        // Blend with space if still transitioning
        if (zone.space > 0) {
          gradientColor = p.lerpColor(black, gradientColor, zone.aurora);
        }
        
        // Blend with sky color if transitioning to sky
        if (zone.sky > 0) {
          const skyLerp = p.lerpColor(polarNight, skyColor, zone.sky);
          gradientColor = p.lerpColor(gradientColor, skyLerp, zone.sky);
        }
        
        // Blend with sea colors if transitioning to sea
        if (zone.seaSurface > 0 || zone.deepSea > 0) {
          const seaColor = zone.seaSurface > 0 ? seaSurfaceColor : deepSeaColor;
          const seaWeight = zone.seaSurface + zone.deepSea;
          gradientColor = p.lerpColor(gradientColor, seaColor, seaWeight);
        }
        
        p.stroke(gradientColor);
        p.strokeWeight(gradientStep);
        p.line(0, y, p.width, y);
      }
    } else {
      // Standard color blending for other zones (no aurora) - much faster
      let r = 0, g = 0, b = 0;
      
      r += p.red(spaceColor) * zone.space;
      g += p.green(spaceColor) * zone.space;
      b += p.blue(spaceColor) * zone.space;
      
      r += p.red(polarNightColor) * zone.aurora;
      g += p.green(polarNightColor) * zone.aurora;
      b += p.blue(polarNightColor) * zone.aurora;
      
      r += p.red(skyColor) * zone.sky;
      g += p.green(skyColor) * zone.sky;
      b += p.blue(skyColor) * zone.sky;
      
      r += p.red(seaSurfaceColor) * zone.seaSurface;
      g += p.green(seaSurfaceColor) * zone.seaSurface;
      b += p.blue(seaSurfaceColor) * zone.seaSurface;
      
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
   */
  function generateAuroraSentence() {
    let nextSentence = [];
    for (let i = 0; i < auroraSentence.length; i++) {
      const char = auroraSentence[i].symbol;
      if (auroraRules[char]) {
        auroraRules[char].forEach(production => {
          if (p.random() > 0.1) {
            nextSentence.push({ symbol: production.symbol, weight: production.weight() });
          }
        });
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
    p.push();
    clouds.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > p.width + cloud.size) {
        cloud.x = -cloud.size;
      }
      
      p.fill(255, 255, 255, cloud.opacity * intensity);
      p.noStroke();
      
      // Draw cloud as overlapping ellipses
      p.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
      p.ellipse(cloud.x + cloud.size * 0.3, cloud.y, cloud.size * 0.8, cloud.size * 0.7);
      p.ellipse(cloud.x - cloud.size * 0.3, cloud.y, cloud.size * 0.7, cloud.size * 0.6);
      p.ellipse(cloud.x, cloud.y - cloud.size * 0.2, cloud.size * 0.6, cloud.size * 0.5);
    });
    p.pop();
    
    // Draw simple birds (V shapes)
    if (intensity > 0.5) {
      p.push();
      p.stroke(255, 255, 255, 200 * intensity);
      p.strokeWeight(2);
      p.noFill();
      
      for (let i = 0; i < 5; i++) {
        const birdX = (p.frameCount * 2 + i * 200) % (p.width + 100) - 50;
        const birdY = p.height * 0.3 + p.sin(p.frameCount * 0.05 + i) * 20;
        
        p.line(birdX, birdY, birdX - 10, birdY - 10);
        p.line(birdX, birdY, birdX + 10, birdY - 10);
      }
      p.pop();
    }
  }
  
  /**
   * Draws sea surface zone elements (waves and boat).
   * Optimized: reduced wave sampling.
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawSeaSurfaceElements(intensity) {
    // Draw sine wave water lines
    // Optimized: increased step size for better performance
    p.push();
    p.stroke(255, 255, 255, 150 * intensity);
    p.strokeWeight(2);
    p.noFill();
    
    const waveHeight = 30;
    const waveSpeed = p.frameCount * 0.02;
    
    // Reduced to 2 waves and increased step size
    for (let wave = 0; wave < 2; wave++) {
      p.beginShape();
      for (let x = 0; x <= p.width; x += 8) { // Was 5, now 8
        const y = boat.y + wave * 40 + p.sin((x * 0.02) + waveSpeed + wave) * waveHeight;
        p.vertex(x, y);
      }
      p.endShape();
    }
    p.pop();
    
    // Draw floating boat
    if (intensity > 0.3) {
      p.push();
      p.translate(boat.x, boat.y + p.sin(boat.waveOffset) * 5);
      p.fill(139, 69, 19, 255 * intensity); // Brown boat
      p.stroke(101, 50, 14, 255 * intensity);
      p.strokeWeight(2);
      
      // Boat hull
      p.beginShape();
      p.vertex(-40, 0);
      p.vertex(-30, 15);
      p.vertex(30, 15);
      p.vertex(40, 0);
      p.endShape(p.CLOSE);
      
      // Boat mast
      p.stroke(101, 50, 14, 255 * intensity);
      p.line(0, 0, 0, -40);
      
      // Boat sail
      p.fill(255, 255, 255, 200 * intensity);
      p.noStroke();
      p.triangle(0, -40, 0, -10, 25, -10);
      
      p.pop();
      
      // Animate boat
      boat.waveOffset = p.frameCount * 0.05;
    }
  }
  
  /**
   * Draws deep sea zone elements (bubbles and fish).
   * @param {number} intensity - Zone intensity (0-1)
   */
  function drawDeepSeaElements(intensity) {
    // Draw rising bubbles
    p.push();
    bubbles.forEach(bubble => {
      bubble.y -= bubble.speed;
      if (bubble.y < -bubble.size) {
        bubble.y = p.height + bubble.size;
        bubble.x = p.random(p.width);
      }
      
      p.fill(255, 255, 255, bubble.opacity * intensity);
      p.stroke(200, 200, 255, bubble.opacity * intensity * 0.5);
      p.strokeWeight(1);
      p.ellipse(bubble.x, bubble.y, bubble.size);
      
      // Bubble highlight
      p.fill(255, 255, 255, bubble.opacity * intensity * 0.5);
      p.noStroke();
      p.ellipse(bubble.x - bubble.size * 0.2, bubble.y - bubble.size * 0.2, bubble.size * 0.3);
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
      
      // Fish body (triangle)
      p.push();
      p.translate(fish.x, fish.y);
      p.scale(fish.direction, 1);
      
      p.fill(
        p.red(fish.color) * intensity,
        p.green(fish.color) * intensity,
        p.blue(fish.color) * intensity,
        255 * intensity
      );
      p.stroke(0, 0, 0, 100 * intensity);
      p.strokeWeight(1);
      
      // Fish body
      p.triangle(0, 0, -fish.size, -fish.size * 0.5, -fish.size, fish.size * 0.5);
      
      // Fish eye
      p.fill(255, 255, 255, 255 * intensity);
      p.noStroke();
      p.ellipse(-fish.size * 0.3, -fish.size * 0.2, fish.size * 0.3);
      p.fill(0, 0, 0, 255 * intensity);
      p.ellipse(-fish.size * 0.3, -fish.size * 0.2, fish.size * 0.15);
      
      p.pop();
    });
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

