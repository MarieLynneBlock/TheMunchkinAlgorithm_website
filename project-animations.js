/**
 * Project Generative Animations
 * Creates unique, abstract generative animations for each project card
 * using p5.js instance mode.
 */

function initProjectAnimations() {
  if (typeof p5 === 'undefined') {
    setTimeout(initProjectAnimations, 50);
    return;
  }
  
  const containers = document.querySelectorAll('.project-anim-container');
  if (containers.length === 0) {
    setTimeout(initProjectAnimations, 100);
    return;
  }
  
  containers.forEach((container) => {
    const projectType = container.getAttribute('data-project');
    
    const sketch = (p) => {
      let isVisible = true;
      let particles = [];
      let deepSkyBlue, lighterSkyBlue;
      let waveColors = [];
      let cycleStartTime = 0;
      let cycleDuration = 4000; // 4 seconds in milliseconds
      
      // Spirograph variables for Harmony in Algorithmic Beauty
      let spiroTheta = 0;
      let spiroPath = [];
      let spiroR, spiror, spirod; // Outer radius, inner radius, distance from center
      
      // Animation states
      const STATE_CHAOS = 0;      // Drifting chaos phase
      const STATE_ORDERING = 1;    // Transitioning to order
      const STATE_ORDER = 2;      // Sine wave order phase
      const STATE_DISPERSING = 3; // Back to chaos
      
      // State timing (as fractions of cycle)
      const ORDERING_DURATION = 0.15;  // 15% of cycle - transition to order
      const ORDER_DURATION = 0.45;    // 45% of cycle - maintain order (longer)
      const DISPERSE_DURATION = 0.15;  // 15% of cycle - back to chaos
      // Remaining 25% is chaos

      p.setup = () => {
        // Ensure container has width (may need to wait for layout)
        let containerWidth = container.offsetWidth;
        if (containerWidth === 0) {
          containerWidth = container.parentElement?.offsetWidth || 300;
        }
        const canvas = p.createCanvas(containerWidth, containerWidth); // Square canvas
        canvas.parent(container);
        canvas.style('display', 'block');
        
        p.pixelDensity(1);
        p.frameRate(60);
        
        // Deep sky blue gradient colors
        deepSkyBlue = p.color(0, 71, 171);      // Deep sky blue (darker)
        lighterSkyBlue = p.color(135, 206, 250); // Sky blue (lighter)
        
        // Sound wave color spectrum - all white for subtle, clean look
        waveColors = [
          p.color(255, 255, 255),  // Wave 0: White (low frequency)
          p.color(255, 255, 255),  // Wave 1: White
          p.color(255, 255, 255),  // Wave 2: White (mid frequency)
          p.color(255, 255, 255),  // Wave 3: White
          p.color(255, 255, 255)   // Wave 4: White (high frequency)
        ];
        
        // Initialize particle system for Sonic Alchemy Lab
        if (projectType === 'sonic-alchemy') {
          const numParticles = 200;
          const numWaves = 5; // Number of sine waves to form
          
          for (let i = 0; i < numParticles; i++) {
            const initX = p.random(p.width);
            const initY = p.random(p.height);
            
            particles.push({
              // Initial random position
              x: initX,
              y: initY,
              // Perlin noise offsets (unique for each particle)
              noiseX: p.random(1000),
              noiseY: p.random(1000),
              // Target position for sine wave formation
              targetX: 0,
              targetY: 0,
              // Current position (for smooth transitions) - initialize to starting position
              currentX: initX,
              currentY: initY,
              // Sine wave parameters (unique for each particle)
              waveIndex: p.floor(p.random(numWaves)), // Which wave this particle belongs to (0-4)
              wavePhase: (i / numParticles) * p.TWO_PI * 2, // Phase along the wave
              // Size and opacity (matching spirograph particle size)
              size: 3,
              baseOpacity: p.random(180, 240)
            });
          }
          
          cycleStartTime = p.millis();
        }

        // Set up Intersection Observer
        if (typeof IntersectionObserver !== 'undefined') {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              isVisible = entry.isIntersecting;
            });
          }, { threshold: 0.01 });
          const card = container.closest('.project-card') || container;
          observer.observe(card);
        }
      };
      
      p.draw = () => {
        if (!isVisible) return;
        
        // Draw gradient background
        drawGradientBackground(p);
        
        if (projectType === 'sonic-alchemy') {
          drawSonicAlchemy(p);
        } else if (projectType === 'harmony-beauty') {
          drawHarmonyBeauty(p);
        }
      };
      
      function drawGradientBackground(p) {
        // Deep sky blue gradient from top to bottom
        for (let y = 0; y < p.height; y++) {
          const inter = p.map(y, 0, p.height, 0, 1);
          const c = p.lerpColor(deepSkyBlue, lighterSkyBlue, inter);
          p.stroke(c);
          p.line(0, y, p.width, y);
        }
      }
      
      function getCurrentState(cycleProgress) {
        if (cycleProgress < ORDERING_DURATION) {
          return STATE_ORDERING;
        } else if (cycleProgress < ORDERING_DURATION + ORDER_DURATION) {
          return STATE_ORDER;
        } else if (cycleProgress < ORDERING_DURATION + ORDER_DURATION + DISPERSE_DURATION) {
          return STATE_DISPERSING;
        } else {
          return STATE_CHAOS;
        }
      }
      
      function getStateProgress(cycleProgress, state) {
        if (state === STATE_ORDERING) {
          return p.map(cycleProgress, 0, ORDERING_DURATION, 0, 1);
        } else if (state === STATE_ORDER) {
          return p.map(cycleProgress, ORDERING_DURATION, ORDERING_DURATION + ORDER_DURATION, 0, 1);
        } else if (state === STATE_DISPERSING) {
          return p.map(cycleProgress, ORDERING_DURATION + ORDER_DURATION, ORDERING_DURATION + ORDER_DURATION + DISPERSE_DURATION, 0, 1);
        } else {
          return 0; // Chaos state
        }
      }
      
      function drawSonicAlchemy(p) {
        const currentTime = p.millis();
        const cycleTime = (currentTime - cycleStartTime) % cycleDuration;
        const cycleProgress = cycleTime / cycleDuration;
        
        const state = getCurrentState(cycleProgress);
        const stateProgress = getStateProgress(cycleProgress, state);
        
        const cx = p.width / 2;
        const cy = p.height / 2;
        const t = p.frameCount * 0.01;
        
        // Sine wave parameters
        const numWaves = 5;
        const waveAmplitudes = [30, 40, 35, 45, 30]; // Different amplitudes for each wave
        const waveFrequencies = [1.5, 2.0, 1.8, 2.2, 1.6]; // Different frequencies
        const waveSpacing = p.height / (numWaves + 1); // Vertical spacing between waves
        const waveWidth = p.width * 0.8; // Width of the wave area
        const waveSpeed = 0.02; // Speed of wave animation
        
        // Update and draw particles
        particles.forEach((particle, idx) => {
          if (state === STATE_CHAOS) {
            // Organic drifting using Perlin noise (chaos phase)
            const noiseScale = 0.005;
            const driftSpeed = 0.5;
            
            particle.noiseX += noiseScale * driftSpeed;
            particle.noiseY += noiseScale * driftSpeed;
            
            const noiseX = p.noise(particle.noiseX) * p.width;
            const noiseY = p.noise(particle.noiseY) * p.height;
            
            particle.x = p.lerp(particle.x, noiseX, 0.05);
            particle.y = p.lerp(particle.y, noiseY, 0.05);
            
            particle.currentX = particle.x;
            particle.currentY = particle.y;
            
          } else if (state === STATE_ORDERING) {
            // Calculate sine wave position for this particle
            const waveY = waveSpacing * (particle.waveIndex + 1);
            const waveAmp = waveAmplitudes[particle.waveIndex];
            const waveFreq = waveFrequencies[particle.waveIndex];
            
            // Animate the wave
            const waveOffset = t * waveSpeed * 100;
            const xPos = cx - waveWidth / 2 + (particle.wavePhase / (p.TWO_PI * 2)) * waveWidth;
            const yPos = waveY + p.sin(particle.wavePhase * waveFreq + waveOffset) * waveAmp;
            
            particle.targetX = xPos;
            particle.targetY = yPos;
            
            // Smoothly transition to wave position
            const easeProgress = easeInOutCubic(stateProgress);
            particle.currentX = p.lerp(particle.x, particle.targetX, easeProgress);
            particle.currentY = p.lerp(particle.y, particle.targetY, easeProgress);
            
          } else if (state === STATE_ORDER) {
            // Maintain sine wave position, animate
            const waveY = waveSpacing * (particle.waveIndex + 1);
            const waveAmp = waveAmplitudes[particle.waveIndex];
            const waveFreq = waveFrequencies[particle.waveIndex];
            
            // Animate the wave
            const waveOffset = t * waveSpeed * 100;
            const xPos = cx - waveWidth / 2 + (particle.wavePhase / (p.TWO_PI * 2)) * waveWidth;
            const yPos = waveY + p.sin(particle.wavePhase * waveFreq + waveOffset) * waveAmp;
            
            particle.targetX = xPos;
            particle.targetY = yPos;
            
            particle.currentX = particle.targetX;
            particle.currentY = particle.targetY;
            
          } else if (state === STATE_DISPERSING) {
            // Update chaos target position while dispersing
            const noiseScale = 0.005;
            const driftSpeed = 0.5;
            
            particle.noiseX += noiseScale * driftSpeed;
            particle.noiseY += noiseScale * driftSpeed;
            
            const noiseX = p.noise(particle.noiseX) * p.width;
            const noiseY = p.noise(particle.noiseY) * p.height;
            
            // Update chaos target smoothly
            particle.x = p.lerp(particle.x, noiseX, 0.05);
            particle.y = p.lerp(particle.y, noiseY, 0.05);
            
            // Disperse back to chaos position (from wave to chaos)
            const easeProgress = easeInOutCubic(stateProgress);
            particle.currentX = p.lerp(particle.targetX, particle.x, easeProgress);
            particle.currentY = p.lerp(particle.targetY, particle.y, easeProgress);
          }
          
          // Determine glow intensity and color based on state
          let coreOpacity = particle.baseOpacity;
          let glowIntensity = 0; // 0 = no colored glow, 1 = full colored glow
          let glowColor = null;
          
          if (state === STATE_ORDER || state === STATE_ORDERING) {
            // Particles radiate color in order states
            glowColor = waveColors[particle.waveIndex];
            if (state === STATE_ORDER) {
              coreOpacity = 255;
              glowIntensity = 1.0; // Full colored glow
            } else {
              // Gradually increase glow during ordering
              coreOpacity = p.lerp(particle.baseOpacity, 255, stateProgress);
              glowIntensity = stateProgress;
            }
          } else if (state === STATE_DISPERSING) {
            // Fade glow back to normal
            const fadeProgress = 1 - stateProgress;
            glowColor = waveColors[particle.waveIndex];
            coreOpacity = p.lerp(particle.baseOpacity, 255, fadeProgress);
            glowIntensity = fadeProgress;
          } else {
            // Normal white particles for chaos (no colored glow)
            coreOpacity = particle.baseOpacity * 0.7;
            glowIntensity = 0;
          }
          
          // Draw particle with white core and colored glow
          p.push();
          
          if (glowIntensity > 0 && glowColor) {
            // Colored glow layers (radiating outward) - matching spirograph style
            const glowR = p.red(glowColor);
            const glowG = p.green(glowColor);
            const glowB = p.blue(glowColor);
            
            // Outer glow (matching spirograph: radius 6, which is 2x the base size)
            p.fill(glowR, glowG, glowB, glowIntensity * 80);
            p.noStroke();
            p.circle(particle.currentX, particle.currentY, 6);
          } else {
            // No colored glow - just white glow for chaos state (matching spirograph style)
            p.fill(230, 230, 250, coreOpacity * 80);
            p.noStroke();
            p.circle(particle.currentX, particle.currentY, 6);
          }
          
          // Core particle (always white, brightest) - matching spirograph: radius 3
          p.fill(255, 255, 255, coreOpacity);
          p.circle(particle.currentX, particle.currentY, 3);
          
          p.pop();
        });
        
        // Draw connecting lines between particles in the same wave (only in order states)
        if (state === STATE_ORDER || state === STATE_ORDERING) {
          // Group particles by wave index
          const waveGroups = {};
          particles.forEach((particle, idx) => {
            if (!waveGroups[particle.waveIndex]) {
              waveGroups[particle.waveIndex] = [];
            }
            waveGroups[particle.waveIndex].push({
              x: particle.currentX,
              y: particle.currentY,
              phase: particle.wavePhase,
              color: waveColors[particle.waveIndex]
            });
          });
          
          // Draw lines connecting particles in each wave
          Object.keys(waveGroups).forEach(waveIdx => {
            const waveParticles = waveGroups[waveIdx];
            // Sort by x position to draw lines in order
            waveParticles.sort((a, b) => a.x - b.x);
            
            const waveColor = waveColors[parseInt(waveIdx)];
            const lineOpacity = state === STATE_ORDER ? 100 : 100 * stateProgress;
            
            p.push();
            // Lines with sound wave visual effects
            const lineR = p.red(waveColor);
            const lineG = p.green(waveColor);
            const lineB = p.blue(waveColor);
            p.noFill();
            
            // Draw smooth curve connecting particles with sound wave effect
            for (let i = 0; i < waveParticles.length - 1; i++) {
              const p1 = waveParticles[i];
              const p2 = waveParticles[i + 1];
              
              // Only draw if particles are close enough (part of the same wave segment)
              const dist = p.dist(p1.x, p1.y, p2.x, p2.y);
              if (dist < p.width * 0.15) {
                // Outer glow layer (more transparent, wider)
                p.stroke(lineR, lineG, lineB, lineOpacity * 0.3);
                p.strokeWeight(3);
                p.line(p1.x, p1.y, p2.x, p2.y);
                
                // Main wave line (more visible, core)
                p.stroke(lineR, lineG, lineB, lineOpacity);
                p.strokeWeight(1.5);
                p.line(p1.x, p1.y, p2.x, p2.y);
              }
            }
            
            p.pop();
          });
        }
      }
      
      // Easing function for smooth transitions
      function easeInOutCubic(t) {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - p.pow(-2 * t + 2, 3) / 2;
      }
      
      function drawHarmonyBeauty(p) {
        const cx = p.width / 2;
        const cy = p.height / 2;
        
        // Initialize spirograph parameters (only once)
        if (spiroPath.length === 0) {
          // Spirograph parameters for a harmonious, complex pattern
          spiroR = p.width * 0.25;  // Outer radius
          spiror = p.width * 0.08;  // Inner radius
          spirod = p.width * 0.12;  // Distance from center of inner circle
        }
        
        // Increment theta slowly for smooth drawing
        const thetaIncrement = 0.02;
        spiroTheta += thetaIncrement;
        
        // Calculate spirograph point using hypotrochoid formula
        const ratio = (spiroR - spiror) / spiror;
        
        // Let theta grow indefinitely - the pattern will naturally loop
        // Old points fade out automatically, so no need to reset
        // Only reset if theta gets extremely large to prevent overflow
        if (spiroTheta > p.TWO_PI * 100) {
          spiroTheta = 0;
          // Don't clear path - let it fade naturally for seamless overlap
        }
        
        const x = (spiroR - spiror) * p.cos(spiroTheta) + spirod * p.cos(ratio * spiroTheta);
        const y = (spiroR - spiror) * p.sin(spiroTheta) - spirod * p.sin(ratio * spiroTheta);
        
        // Add point to path
        spiroPath.push({ x: cx + x, y: cy + y, age: 0 });
        
        // Age all points and remove old ones (fade out effect)
        const maxAge = 4000; // Frames before complete fade (increased to keep more visible)
        spiroPath = spiroPath.filter(point => {
          point.age++;
          return point.age < maxAge;
        });
        
        // Draw the spirograph path with fading
        p.push();
        p.noFill();
        
        // Draw lines connecting points (tracing effect)
        for (let i = 1; i < spiroPath.length; i++) {
          const prev = spiroPath[i - 1];
          const curr = spiroPath[i];
          
          // Calculate alpha based on age (fade out older lines)
          const alpha = p.map(curr.age, 0, maxAge, 200, 0);
          
          if (alpha > 5) {
            // Use soft lavender/white color with sky blue accents
            const colorMix = p.lerpColor(
              p.color(230, 230, 250), // Soft Lavender
              p.color(255, 255, 255),  // White
              i / spiroPath.length
            );
            
            // Blend with sky blue for harmony
            const finalColor = p.lerpColor(
              colorMix,
              lighterSkyBlue,
              0.3
            );
            
            p.stroke(
              p.red(finalColor),
              p.green(finalColor),
              p.blue(finalColor),
              alpha
            );
            p.strokeWeight(1.5);
            p.line(prev.x, prev.y, curr.x, curr.y);
          }
        }
        
        // Draw current point with a bright highlight
        if (spiroPath.length > 0) {
          const current = spiroPath[spiroPath.length - 1];
          p.fill(255, 255, 255, 220);
          p.noStroke();
          p.circle(current.x, current.y, 3);
          
          // Outer glow
          p.fill(230, 230, 250, 80);
          p.circle(current.x, current.y, 6);
        }
        
        p.pop();
      }

      p.windowResized = () => {
        let containerWidth = container.offsetWidth;
        if (containerWidth === 0) {
          containerWidth = container.parentElement?.offsetWidth || 300;
        }
        p.resizeCanvas(containerWidth, containerWidth);
      };
    };
    
    new p5(sketch, container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectAnimations);
} else {
  initProjectAnimations();
}

