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
      
      // Hover progress tracking (0 = rest, 1 = active/hovered)
      let hoverProgress = 0;
      let targetHoverProgress = 0;
      
      // Red dot positions for Sonic Alchemy Lab (one per wave)
      let redDotPhases = [0, 0, 0]; // Phase offset for each wave's red dot
      
      // Spirograph variables for Harmony in Algorithmic Beauty
      let spiroParticles = []; // Array of particles, each with their own theta and path
      let spiroR, spiror, spirod; // Outer radius, inner radius, distance from center
      
      // Liquid Automation variables for DAW Audio Plugins
      let faders = [];
      let faderNoiseOffsets = [];
      
      // Living Sequencer variables for Digital Sound Architectures
      let sequencerGrid = []; // Grid pattern (active notes)
      let sequencerPatternChangeTime = 0;
      let sequencerPatternDuration = 8000; // Change pattern every 8 seconds
      
      // Signal Chain variables for ChucK => Etudes
      let signalChainTime = 0; // Time accumulator for wave flow
      
      // 8-bit Pixel Art variables for Fr0zzy
      let frozzyBobOffset = 0; // Vertical offset for llama head bobbing
      let frozzyAnimationFrame = 0; // Frame counter for jerky 8-bit animation
      let frozzyGrassGrowth = []; // Track grass growth height for each pixel (0 = ground, higher = taller)
      let frozzyGrassGrowthRates = []; // Different growth rates for each grass pixel
      let frozzyParticles = []; // Particles that fly up when grass is eaten
      let frozzyLastGrassEat = 0; // Time since last grass was eaten
      
      // TBA Animation variables
      let tba1Particles = []; // Flocking particles for TBA 1
      let tba2GlitchLines = []; // Glitch lines for digital signal (TBA 2)
      let tba2LastGlitch = 0;
      let tba3Pulses = []; // Radial pulses for heartbeat (TBA 3)
      let tba3LastPulse = 0;
      
      // Placeholder animation variables
      let placeholder1Particles = [];
      let placeholder4Nodes = [];
      
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
        
        // Wave colors will be calculated dynamically based on hoverProgress
        // Unified palette colors (defined in draw function scope)
        
        // Initialize particle system for Sonic Alchemy Lab
        if (projectType === 'sonic-alchemy') {
          // Initialize red dot phases with random starting positions
          redDotPhases = [p.random(p.TWO_PI * 2), p.random(p.TWO_PI * 2), p.random(p.TWO_PI * 2)];
          
          const numParticles = 200;
          const numWaves = 3; // Number of sine waves to form (reduced for cleaner appearance)
          
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
        
        // Set up hover tracking on entire card (not just animation)
        const projectCardLink = container.closest('.project-card-link');
        if (projectCardLink) {
          projectCardLink.addEventListener('mouseenter', () => {
            targetHoverProgress = 1;
          });
          projectCardLink.addEventListener('mouseleave', () => {
            targetHoverProgress = 0;
          });
        }
      };
      
      p.draw = () => {
        if (!isVisible) return;
        
        // Smoothly transition hover progress
        hoverProgress = p.lerp(hoverProgress, targetHoverProgress, 0.1);
        
        // Clear canvas first
        p.clear();
        
        // Draw dark overlay based on hover (Spotlight Effect)
        // Deep Midnight Blue overlay that fades in on hover for contrast
        const overlayAlpha = 230 * hoverProgress; // 0 when rest, 230 when hovered
        p.fill(5, 15, 40, overlayAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);
        
        // Draw animations with unified theme
        if (projectType === 'sonic-alchemy') {
          drawSonicAlchemy(p);
        } else if (projectType === 'harmony-beauty') {
          drawHarmonyBeauty(p);
        } else if (projectType === 'daw-plugins') {
          drawDAWPlugins(p);
        } else if (projectType === 'sound-arch') {
          drawSoundArch(p);
        } else if (projectType === 'chuck-etudes') {
          drawChuckEtudes(p);
        } else if (projectType === 'frozzy') {
          drawFrozzy(p);
        } else if (projectType === 'tba-1') {
          drawTBA1(p);
        } else if (projectType === 'tba-2') {
          drawTBA2(p);
        } else if (projectType === 'tba-3') {
          drawTBA3(p);
        } else if (projectType === 'placeholder-1') {
          drawPlaceholder1(p);
        } else if (projectType === 'placeholder-2') {
          drawPlaceholder2(p);
        } else if (projectType === 'placeholder-3') {
          drawPlaceholder3(p);
        } else if (projectType === 'placeholder-4') {
          drawPlaceholder4(p);
        } else if (projectType === 'placeholder-5') {
          drawPlaceholder5(p);
        } else if (projectType === 'placeholder-6') {
          drawPlaceholder6(p);
        }
      };
      
      // Unified color palette (rest state)
      const unifiedWhite = p.color(255, 255, 255);
      const unifiedLightCyan = p.color(200, 240, 255);
      const unifiedPaleBlue = p.color(180, 220, 255);
      
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
        // Unified colors for rest state (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255); // Soft ice blue
        
        // Project identity colors (Sonic Alchemy: white/cyan with subtle glow)
        const activeCyan = p.color(0, 255, 255); // Bright cyan
        const activeLightCyan = p.color(150, 240, 255); // Light cyan
        
        // Calculate wave colors: lerp from rest (white/ice blue) to active (cyan)
        const waveColor0 = p.lerpColor(restWhite, activeLightCyan, hoverProgress);
        const waveColor1 = p.lerpColor(restIceBlue, activeCyan, hoverProgress);
        const waveColor2 = p.lerpColor(restWhite, activeLightCyan, hoverProgress);
        waveColors = [waveColor0, waveColor1, waveColor2];
        
        const currentTime = p.millis();
        const cycleTime = (currentTime - cycleStartTime) % cycleDuration;
        const cycleProgress = cycleTime / cycleDuration;
        
        const state = getCurrentState(cycleProgress);
        const stateProgress = getStateProgress(cycleProgress, state);
        
        const cx = p.width / 2;
        const cy = p.height / 2;
        const t = p.frameCount * 0.01;
        
        // Sine wave parameters (3 waves spread evenly across canvas)
        const numWaves = 3;
        const waveAmplitudes = [35, 40, 35]; // Different amplitudes for each wave
        const waveFrequencies = [1.8, 2.0, 1.6]; // Different frequencies
        // Spread waves evenly across the canvas with padding
        const padding = p.height * 0.15; // Top and bottom padding
        const availableHeight = p.height - (padding * 2);
        const waveSpacing = availableHeight / (numWaves + 1); // Vertical spacing between waves
        const waveWidth = p.width * 0.8; // Width of the wave area
        const waveSpeed = 0.02; // Speed of wave animation
        
        // Update red dot phases based on state
        const dotSpeed = 0.015; // Speed of red dot movement
        if (state === STATE_ORDER || state === STATE_ORDERING) {
          // In order states: move along wave
          for (let i = 0; i < numWaves; i++) {
            redDotPhases[i] = (redDotPhases[i] + dotSpeed) % (p.TWO_PI * 2); // Loop around
          }
        } else {
          // In chaos states: don't update phases (use time-based noise instead)
          // Phases stay constant to give each dot a unique noise offset
        }
        
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
            // Calculate sine wave position for this particle (centered in available space)
            const waveY = padding + waveSpacing * (particle.waveIndex + 1);
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
            // Maintain sine wave position, animate (centered in available space)
            const waveY = padding + waveSpacing * (particle.waveIndex + 1);
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
          
          // Draw particle with rest/active color interpolation
          p.push();
          
          // Determine base color: use wave color if in order state, otherwise rest white
          const baseColor = glowColor || restWhite;
          
          if (glowIntensity > 0 && glowColor) {
            // Colored glow layers - already using waveColors which lerp based on hover
            const glowR = p.red(baseColor);
            const glowG = p.green(baseColor);
            const glowB = p.blue(baseColor);
            
            // Outer glow (slightly smaller: radius 5)
            p.fill(glowR, glowG, glowB, glowIntensity * 80 * (1 + hoverProgress * 0.2)); // Slightly brighter on hover
            p.noStroke();
            p.circle(particle.currentX, particle.currentY, 5);
          } else {
            // No colored glow - use rest white/ice blue
            const restGlow = p.lerpColor(restWhite, restIceBlue, hoverProgress * 0.2);
            p.fill(p.red(restGlow), p.green(restGlow), p.blue(restGlow), coreOpacity * 80);
            p.noStroke();
            p.circle(particle.currentX, particle.currentY, 5);
          }
          
          // Core particle - lerp from rest white to active color
          const coreColor = p.lerpColor(restWhite, baseColor, hoverProgress);
          p.fill(p.red(coreColor), p.green(coreColor), p.blue(coreColor), coreOpacity);
          p.circle(particle.currentX, particle.currentY, 2.5);
          
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
            // Sort by x position to draw waves left to right
            waveParticles.sort((a, b) => a.x - b.x);
            
            const waveColor = waveColors[parseInt(waveIdx)];
            const lineOpacity = state === STATE_ORDER ? 100 : 100 * stateProgress;
            
            p.push();
            // Draw smooth sine wave curves
            const lineR = p.red(waveColor);
            const lineG = p.green(waveColor);
            const lineB = p.blue(waveColor);
            p.noFill();
            
            // Filter to only connect particles that are close together (stricter distance)
            const continuousWave = waveParticles.filter((particle, idx) => {
              if (idx === 0) return true;
              const prev = waveParticles[idx - 1];
              const dist = p.dist(particle.x, particle.y, prev.x, prev.y);
              // Stricter distance check to prevent cross-wave connections
              return dist < p.width * 0.12;
            });
            
            if (continuousWave.length > 2) {
              // Draw smooth wave curve (matching harmony-beauty line style)
              p.stroke(lineR, lineG, lineB, lineOpacity);
              p.strokeWeight(1.5); // Matching spirograph line weight
              p.beginShape();
              p.curveVertex(continuousWave[0].x, continuousWave[0].y);
              continuousWave.forEach(particle => {
                p.curveVertex(particle.x, particle.y);
              });
              p.curveVertex(continuousWave[continuousWave.length - 1].x, continuousWave[continuousWave.length - 1].y);
              p.endShape();
            } else if (continuousWave.length === 2) {
              // Fallback to line for very short segments
              const p1 = continuousWave[0];
              const p2 = continuousWave[1];
              p.stroke(lineR, lineG, lineB, lineOpacity);
              p.strokeWeight(1.5); // Matching spirograph line weight
              p.line(p1.x, p1.y, p2.x, p2.y);
            }
            
            p.pop();
          });
        }
        
        // Draw red dots (in all states)
        for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
          let dotX, dotY;
          
          if (state === STATE_ORDER || state === STATE_ORDERING) {
            // In order states: move along sine wave
            const waveY = padding + waveSpacing * (waveIndex + 1);
            const waveAmp = waveAmplitudes[waveIndex];
            const waveFreq = waveFrequencies[waveIndex];
            const waveOffset = t * waveSpeed * 100;
            
            dotX = cx - waveWidth / 2 + (redDotPhases[waveIndex] / (p.TWO_PI * 2)) * waveWidth;
            dotY = waveY + p.sin(redDotPhases[waveIndex] * waveFreq + waveOffset) * waveAmp;
          } else {
            // In chaos/dispersing states: move with Perlin noise (slowly, like particles)
            const noiseTime = t * 0.1; // Much slower time multiplier
            const noiseOffset = redDotPhases[waveIndex] * 100;
            const noiseX = p.noise(noiseOffset, noiseTime) * p.width;
            const noiseY = p.noise(noiseOffset + 1000, noiseTime) * p.height;
            
            dotX = noiseX;
            dotY = noiseY;
          }
          
          // Draw accent dot - lerp from rest ice blue to bordeaux on hover
          p.push();
          const bordeaux = p.color(128, 0, 32); // Bordeaux (project identity)
          
          // Lerp from rest ice blue (rest) to bordeaux (active)
          const dotColor = p.lerpColor(restIceBlue, bordeaux, hoverProgress);
          
          // Outer glow
          p.fill(p.red(dotColor), p.green(dotColor), p.blue(dotColor), 60);
          p.noStroke();
          p.circle(dotX, dotY, 13);
          
          // Core dot
          p.fill(p.red(dotColor), p.green(dotColor), p.blue(dotColor), 180);
          p.circle(dotX, dotY, 7.5);
          
          // Bright center highlight
          const centerColor = p.lerpColor(dotColor, restWhite, 0.5);
          p.fill(p.red(centerColor), p.green(centerColor), p.blue(centerColor), 150);
          p.circle(dotX, dotY, 4);
          
          p.pop();
        }
      }
      
      // Easing function for smooth transitions
      function easeInOutCubic(t) {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - p.pow(-2 * t + 2, 3) / 2;
      }
      
      function drawHarmonyBeauty(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        const cx = p.width / 2;
        const cy = p.height / 2;
        const numParticles = 3; // Number of particles drawing the spirograph
        
        // Initialize spirograph parameters and particles (only once)
        if (spiroParticles.length === 0) {
          // Initialize multiple particles with different spirograph parameters
          // This creates distinct patterns that don't overlap
          const baseR = p.width * 0.25;  // Base outer radius
          const baser = p.width * 0.08;   // Base inner radius
          const based = p.width * 0.12;   // Base distance
          
          for (let i = 0; i < numParticles; i++) {
            // Vary parameters for each particle to create different patterns
            const scale = 0.8 + (i * 0.15); // Different scales: 0.8, 0.95, 1.1
            const phaseOffset = (i / numParticles) * p.TWO_PI * 2; // Phase offset
            
            spiroParticles.push({
              theta: phaseOffset, // Start at different positions
              path: [],
              R: baseR * scale,    // Unique outer radius for each particle
              r: baser * scale,    // Unique inner radius for each particle
              d: based * scale     // Unique distance for each particle
            });
          }
        }
        
        // Increment theta slowly for smooth drawing
        const thetaIncrement = 0.02;
        const maxAge = 4000; // Frames before complete fade
        
        // Update and draw each particle
        spiroParticles.forEach(particle => {
          // Update theta
          particle.theta += thetaIncrement;
          
          // Reset if theta gets extremely large to prevent overflow
          if (particle.theta > p.TWO_PI * 100) {
            particle.theta = 0;
          }
          
          // Calculate spirograph point using hypotrochoid formula with unique parameters
          const ratio = (particle.R - particle.r) / particle.r;
          const x = (particle.R - particle.r) * p.cos(particle.theta) + particle.d * p.cos(ratio * particle.theta);
          const y = (particle.R - particle.r) * p.sin(particle.theta) - particle.d * p.sin(ratio * particle.theta);
          
          // Add point to this particle's path
          particle.path.push({ x: cx + x, y: cy + y, age: 0 });
          
          // Age all points and remove old ones (fade out effect)
          particle.path = particle.path.filter(point => {
            point.age++;
            return point.age < maxAge;
          });
        });
        
        // Draw all spirograph paths with fading
        p.push();
        p.noFill();
        
        // Switch to HSB color mode for vibrant rainbow colors
        p.colorMode(p.HSB, 360, 100, 100, 255);
        
        // Draw each particle's trail
        spiroParticles.forEach((particle, particleIndex) => {
          // Draw lines connecting points (tracing effect)
          for (let i = 1; i < particle.path.length; i++) {
            const prev = particle.path[i - 1];
            const curr = particle.path[i];
            
            // Calculate alpha based on age (fade out older lines)
            const alpha = p.map(curr.age, 0, maxAge, 255, 0);
            
            if (alpha > 5) {
              // Calculate rainbow color (vibrant when hovered)
              const angleFromCenter = p.atan2(curr.y - cy, curr.x - cx);
              const normalizedAngle = (angleFromCenter + p.PI) / (p.TWO_PI);
              const hueOffset = (particleIndex / spiroParticles.length) * 360;
              const hue = (normalizedAngle * 360 + hueOffset) % 360;
              
              // Calculate vibrant rainbow color (high saturation/brightness for glow effect)
              p.colorMode(p.HSB, 360, 100, 100, 255);
              const rainbowColor = p.color(hue, 100, 100); // Full saturation and brightness
              p.colorMode(p.RGB, 255);
              
              // Interpolate from rest white to vibrant rainbow based on hover
              const finalColor = p.lerpColor(restWhite, rainbowColor, hoverProgress);
              
              // Draw with lerped color
              p.stroke(p.red(finalColor), p.green(finalColor), p.blue(finalColor), alpha);
              p.strokeWeight(1.5);
              p.line(prev.x, prev.y, curr.x, curr.y);
            }
          }
        });
        
        // Switch back to RGB for particle heads
        p.colorMode(p.RGB, 255);
        p.pop();
        
        // Draw all current points with unified/rainbow colors based on hover
        p.push();
        
        spiroParticles.forEach((particle, particleIndex) => {
          if (particle.path.length > 0) {
            const current = particle.path[particle.path.length - 1];
            
            // Calculate rainbow color
            const angleFromCenter = p.atan2(current.y - cy, current.x - cx);
            const normalizedAngle = (angleFromCenter + p.PI) / (p.TWO_PI);
            const hueOffset = (particleIndex / spiroParticles.length) * 360;
            const hue = (normalizedAngle * 360 + hueOffset) % 360;
            
            p.colorMode(p.HSB, 360, 100, 100, 255);
            const rainbowColor = p.color(hue, 100, 100); // Full saturation and brightness for vibrant glow
            p.colorMode(p.RGB, 255);
            
            // Lerp from rest white to vibrant rainbow
            const particleColor = p.lerpColor(restWhite, rainbowColor, hoverProgress);
            
            // Outer glow
            p.fill(p.red(particleColor), p.green(particleColor), p.blue(particleColor), 100);
            p.noStroke();
            p.circle(current.x, current.y, 8);
            
            // Core dot
            p.fill(p.red(particleColor), p.green(particleColor), p.blue(particleColor), 255);
            p.circle(current.x, current.y, 4);
            
            // Bright center highlight (fades from white to particle color on hover)
            const highlightColor = p.lerpColor(restWhite, particleColor, hoverProgress * 0.5);
            p.fill(p.red(highlightColor), p.green(highlightColor), p.blue(highlightColor), 200);
            p.circle(current.x, current.y, 2);
          }
        });
        
        p.pop();
      }

      function drawDAWPlugins(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Dandelion Yellow for DAW Plugins in dark mode)
        const dandelionYellow = p.color(255, 225, 53); // Dandelion Yellow (#FFE135)
        
        const t = p.frameCount * 0.01;
        const numFaders = 5;
        const padding = p.width * 0.15;
        const trackAreaWidth = p.width - (padding * 2);
        const trackSpacing = trackAreaWidth / (numFaders + 1);
        const maxTrailLength = 50;
        
        // Initialize faders if not already done
        if (faders.length === 0) {
          for (let i = 0; i < numFaders; i++) {
            const trackX = padding + (i + 1) * trackSpacing;
            faders.push({
              trackX: trackX,
              trail: [],
              y: p.height / 2, // Start at center
              phase: p.random(p.TWO_PI), // Random phase for sine wave
              noiseOffset: p.random(1000) // Random noise offset
            });
            faderNoiseOffsets.push(p.random(1000));
          }
        }
        
        // Update and draw each fader
        faders.forEach((fader, index) => {
          // Calculate fader position using mix of sine wave and noise (human-like movement)
          const sineComponent = p.sin(t * 0.5 + fader.phase) * 0.3; // Slow sine wave
          const noiseComponent = p.noise(fader.noiseOffset + t * 0.3) - 0.5; // Noise variation
          const combined = sineComponent + noiseComponent * 0.7;
          
          // Map to vertical position (with padding)
          const verticalPadding = p.height * 0.15;
          const availableHeight = p.height - (verticalPadding * 2);
          fader.y = verticalPadding + p.map(combined, -1, 1, availableHeight, 0);
          
          // Add current position to trail
          fader.trail.push({ x: fader.trackX, y: fader.y, age: 0 });
          
          // Age and limit trail length
          fader.trail.forEach(point => point.age++);
          fader.trail = fader.trail.filter(point => point.age < maxTrailLength);
          
          // Draw vertical track - always pure white (not affected by hover)
          // Explicitly set RGB mode to ensure white color
          p.push();
          p.colorMode(p.RGB, 255);
          p.stroke(255, 255, 255, 100); // Pure white RGB values, good opacity
          p.strokeWeight(1);
          p.noFill();
          p.line(fader.trackX, verticalPadding, fader.trackX, p.height - verticalPadding);
          p.pop();
          
          // Draw fading trail - lerp from rest white to mint green
          if (fader.trail.length > 1) {
            p.push();
            p.noFill();
            
            // Draw trail with fading effect
            for (let i = 1; i < fader.trail.length; i++) {
              const prev = fader.trail[i - 1];
              const curr = fader.trail[i];
              
              // Calculate alpha based on age (fade out older parts)
              const alpha = p.map(curr.age, 0, maxTrailLength, 200, 0);
              
              if (alpha > 5) {
                // Lerp from rest white to dandelion yellow based on hover
                const trailColor = p.lerpColor(restWhite, dandelionYellow, hoverProgress);
                
                p.stroke(
                  p.red(trailColor),
                  p.green(trailColor),
                  p.blue(trailColor),
                  alpha
                );
                p.strokeWeight(1.5);
                p.line(prev.x, prev.y, curr.x, curr.y);
              }
            }
            p.pop();
          }
          
          // Draw fader head - lerp from rest white to dandelion yellow
          const faderColor = p.lerpColor(restWhite, dandelionYellow, hoverProgress);
          p.push();
          
          // Outer glow
          p.fill(p.red(faderColor), p.green(faderColor), p.blue(faderColor), 100);
          p.noStroke();
          p.circle(fader.trackX, fader.y, 8);
          
          // Core fader head
          p.fill(p.red(faderColor), p.green(faderColor), p.blue(faderColor), 255);
          p.circle(fader.trackX, fader.y, 4);
          
          // Bright center highlight (fades from white to fader color on hover)
          const highlightColor = p.lerpColor(restWhite, faderColor, hoverProgress * 0.5);
          p.fill(p.red(highlightColor), p.green(highlightColor), p.blue(highlightColor), 200);
          p.circle(fader.trackX, fader.y, 2);
          
          p.pop();
        });
      }

      function drawSoundArch(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Electric Purple/Magenta for Digital Sound Architectures)
        const electricPurple = p.color(200, 0, 255); // Electric Purple
        const magenta = p.color(255, 0, 200); // Magenta
        
        // Grid parameters
        const gridCols = 8; // 8 columns (steps)
        const gridRows = 4; // 4 rows (tracks/instruments)
        const padding = p.width * 0.2;
        const gridWidth = p.width - (padding * 2);
        const gridHeight = p.height - (padding * 2);
        const cellWidth = gridWidth / gridCols;
        const cellHeight = gridHeight / gridRows;
        
        // Initialize grid pattern if not already done
        if (sequencerGrid.length === 0) {
          for (let row = 0; row < gridRows; row++) {
            sequencerGrid[row] = [];
            for (let col = 0; col < gridCols; col++) {
              // Randomly activate some notes (30% chance)
              sequencerGrid[row][col] = p.random() < 0.3;
            }
          }
          sequencerPatternChangeTime = p.millis();
        }
        
        // Change pattern periodically (generative aspect)
        const currentTime = p.millis();
        if (currentTime - sequencerPatternChangeTime > sequencerPatternDuration) {
          // Generate new random pattern
          for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
              sequencerGrid[row][col] = p.random() < 0.3;
            }
          }
          sequencerPatternChangeTime = currentTime;
        }
        
        // Calculate playhead position (BPM control)
        const bpm = 120; // Beats per minute
        const beatDuration = 60000 / bpm; // Duration of one beat in milliseconds
        const stepDuration = beatDuration / 4; // Each step is 1/4 beat (16th notes)
        const loopDuration = stepDuration * gridCols; // Full loop duration
        const loopProgress = (currentTime % loopDuration) / loopDuration;
        const currentStep = p.floor(loopProgress * gridCols);
        
        // Draw grid
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const gridStartX = centerX - gridWidth / 2;
        const gridStartY = centerY - gridHeight / 2;
        
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            const x = gridStartX + col * cellWidth + cellWidth / 2;
            const y = gridStartY + row * cellHeight + cellHeight / 2;
            const isActive = sequencerGrid[row][col];
            const isPlayhead = col === currentStep;
            
            // Determine color based on state
            let cellColor;
            let cellAlpha = 150;
            
            if (isPlayhead && isActive) {
              // Playhead on active note - bright flash
              const activeColor = p.lerpColor(restWhite, electricPurple, hoverProgress);
              cellColor = activeColor;
              cellAlpha = 255;
            } else if (isPlayhead) {
              // Playhead on inactive note - subtle highlight
              cellColor = p.lerpColor(restIceBlue, electricPurple, hoverProgress * 0.5);
              cellAlpha = 200;
            } else if (isActive) {
              // Active note (not under playhead) - medium brightness
              cellColor = p.lerpColor(restIceBlue, magenta, hoverProgress);
              cellAlpha = 180;
            } else {
              // Inactive note - rest state color
              cellColor = p.lerpColor(restWhite, restIceBlue, hoverProgress * 0.3);
              cellAlpha = 80;
            }
            
            // Draw grid cell
            p.push();
            p.fill(p.red(cellColor), p.green(cellColor), p.blue(cellColor), cellAlpha);
            p.noStroke();
            
            // Draw square with rounded corners
            const cellSize = Math.min(cellWidth, cellHeight) * 0.7;
            p.rectMode(p.CENTER);
            p.rect(x, y, cellSize, cellSize, 3);
            
            // Add glow effect for active notes on hover
            if (isActive && hoverProgress > 0.5) {
              p.fill(p.red(cellColor), p.green(cellColor), p.blue(cellColor), cellAlpha * 0.3);
              p.rect(x, y, cellSize * 1.5, cellSize * 1.5, 3);
            }
            
            p.pop();
          }
        }
      }

      function drawChuckEtudes(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Electric Amber/Gold for ChucK => Etudes)
        const electricAmber = p.color(255, 195, 0); // Electric Amber/Gold (#FFC300)
        
        // Define zone colors for gradient
        const zone1Color = p.color(100, 200, 255); // Cyan/Blue for source
        const zone2Color = p.color(255, 220, 100); // Yellow/Amber for modulation
        const zone3Color = electricAmber; // Gold for output
        
        // Lerp zone colors from rest white/ice blue to active colors based on hover
        const restColor = p.lerpColor(restWhite, restIceBlue, 0.3);
        const activeZone1 = p.lerpColor(restColor, zone1Color, hoverProgress);
        const activeZone2 = p.lerpColor(restColor, zone2Color, hoverProgress);
        const activeZone3 = p.lerpColor(restColor, zone3Color, hoverProgress);
        
        const cy = p.height / 2; // Center vertically
        const waveAmplitude = p.height * 0.25; // Wave height
        const zone1End = p.width / 3; // End of Zone 1 (Source: Sine)
        const zone2End = (p.width * 2) / 3; // End of Zone 2 (Modulation: Square/Triangle)
        
        // Increment time for continuous flow
        signalChainTime += 0.05;
        
        // Draw vertical markers (gates/nodes) for visual separation
        p.push();
        const markerColor = p.lerpColor(restColor, activeZone2, hoverProgress);
        p.stroke(p.red(markerColor), p.green(markerColor), p.blue(markerColor), 30 + hoverProgress * 50);
        p.strokeWeight(1);
        p.line(zone1End, 0, zone1End, p.height);
        p.line(zone2End, 0, zone2End, p.height);
        p.pop();
        
        // Draw the signal chain wave with gradient colors
        p.push();
        p.noFill();
        p.strokeWeight(2);
        
        // Sample points across the width and draw as segments with gradient colors
        const numPoints = 200;
        let prevX = 0;
        let prevY = cy;
        
        for (let i = 0; i <= numPoints; i++) {
          const x = p.map(i, 0, numPoints, 0, p.width);
          let y;
          let segmentColor;
          
          // Zone 1: Pure Sine Wave (Source)
          if (x < zone1End) {
            const freq = 3; // Frequency of sine wave
            y = cy + waveAmplitude * p.sin(freq * (x * 0.02 + signalChainTime));
            // Gradient within zone 1 (from rest color to zone1 color)
            const zoneProgress = x / zone1End;
            segmentColor = p.lerpColor(restColor, activeZone1, hoverProgress * zoneProgress);
          }
          // Zone 2: Triangle/Square Wave (Modulation)
          else if (x < zone2End) {
            const freq = 3;
            const sineValue = p.sin(freq * (x * 0.02 + signalChainTime));
            // Create triangle/square wave by using sign and adding harmonics
            const triangle = p.map(sineValue, -1, 1, -1, 1) * p.abs(sineValue);
            // Blend between sine and triangle for smooth transition
            const blendFactor = (x - zone1End) / (zone2End - zone1End);
            const zone1Y = cy + waveAmplitude * p.sin(freq * (zone1End * 0.02 + signalChainTime));
            const zone2Y = cy + waveAmplitude * triangle;
            y = p.lerp(zone1Y, zone2Y, blendFactor);
            // Gradient from zone1 to zone2 color
            segmentColor = p.lerpColor(activeZone1, activeZone2, hoverProgress * blendFactor);
          }
          // Zone 3: Complex/Noisy (Granular Synthesis)
          else {
            const freq = 3;
            // Start with modulated wave from zone 2
            const sineValue = p.sin(freq * (x * 0.02 + signalChainTime));
            const triangle = p.map(sineValue, -1, 1, -1, 1) * p.abs(sineValue);
            const baseWave = cy + waveAmplitude * triangle;
            
            // Add Perlin noise for complexity
            const noiseScale = 0.1;
            const noiseValue = p.noise(x * noiseScale, signalChainTime * 2) * 2 - 1;
            const noiseAmplitude = waveAmplitude * 0.4;
            
            // Blend between zone 2 and noisy signal
            const blendFactor = (x - zone2End) / (p.width - zone2End);
            const zone2Y = cy + waveAmplitude * triangle;
            const zone3Y = baseWave + noiseValue * noiseAmplitude * blendFactor;
            y = p.lerp(zone2Y, zone3Y, blendFactor);
            // Gradient from zone2 to zone3 color
            segmentColor = p.lerpColor(activeZone2, activeZone3, hoverProgress * blendFactor);
          }
          
          // Draw line segment with gradient color
          if (i > 0) {
            p.stroke(
              p.red(segmentColor),
              p.green(segmentColor),
              p.blue(segmentColor),
              200 + hoverProgress * 55
            );
            p.line(prevX, prevY, x, y);
          }
          
          prevX = x;
          prevY = y;
        }
        
        p.pop();
      }

      function drawFrozzy(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity colors (Fr0zzy: cream/white llama, vibrant green grass)
        const llamaCream = p.color(255, 250, 240); // Cream/white for llama
        const grassGreen = p.color(51, 255, 51); // Vibrant Arcade Green (#33FF33)
        
        // Lerp colors from rest white/ice blue to active colors based on hover
        const restColor = p.lerpColor(restWhite, restIceBlue, 0.3);
        const activeLlamaColor = p.lerpColor(restColor, llamaCream, hoverProgress);
        const activeGrassColor = p.lerpColor(restColor, grassGreen, hoverProgress);
        
        // Pixel art settings
        const pixelSize = 5; // Chunky pixel size
        const cx = p.width / 2;
        const cy = p.height / 2;
        
        // Initialize grass growth arrays if needed
        const numGrassBlocks = p.floor(p.width / pixelSize);
        if (frozzyGrassGrowth.length !== numGrassBlocks) {
          frozzyGrassGrowth = [];
          frozzyGrassGrowthRates = [];
          for (let i = 0; i < numGrassBlocks; i++) {
            frozzyGrassGrowth.push(p.random(0, 3)); // Random initial growth (0-3 pixels)
            frozzyGrassGrowthRates.push(p.random(0.01, 0.03)); // Random growth rate for each pixel
          }
        }
        
        // 8-bit jerky animation: update only every 500ms
        const currentTime = p.millis();
        if (currentTime - frozzyLastGrassEat > 500) {
          frozzyAnimationFrame++;
          frozzyLastGrassEat = currentTime;
          
          // Bob animation: head goes down and up
          frozzyBobOffset = p.sin(frozzyAnimationFrame * 0.2) * 2; // Bob 2 pixels
          
          // Grow grass (pixel art growth)
          for (let i = 0; i < numGrassBlocks; i++) {
            // Grow each grass pixel at its own rate
            if (frozzyGrassGrowth[i] < 5) { // Max height of 5 pixels
              frozzyGrassGrowth[i] += frozzyGrassGrowthRates[i];
              
              // Occasionally reset growth (simulating being eaten or cut)
              if (p.random() < 0.02 && frozzyGrassGrowth[i] > 2) {
                frozzyGrassGrowth[i] = 0;
                
                // Create particles when grass is "cut"
                for (let j = 0; j < 2; j++) {
                  frozzyParticles.push({
                    x: i * pixelSize + pixelSize / 2,
                    y: p.height - pixelSize * 2 - (frozzyGrassGrowth[i] * pixelSize),
                    vx: p.random(-0.5, 0.5),
                    vy: p.random(-2, -0.5),
                    life: 30,
                    maxLife: 30
                  });
                }
              }
            }
          }
        }
        
        // Update and draw particles
        frozzyParticles = frozzyParticles.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life--;
          
          if (particle.life > 0) {
            const alpha = p.map(particle.life, 0, particle.maxLife, 0, 255);
            p.fill(p.red(activeGrassColor), p.green(activeGrassColor), p.blue(activeGrassColor), alpha);
            p.noStroke();
            p.rect(p.floor(particle.x / pixelSize) * pixelSize, p.floor(particle.y / pixelSize) * pixelSize, pixelSize, pixelSize);
            return true;
          }
          return false;
        });
        
        // Draw grass at bottom (growing upward in pixel art style)
        const grassBaseY = p.height - pixelSize * 2;
        
        p.push();
        p.noStroke();
        
        for (let i = 0; i < numGrassBlocks; i++) {
          const x = i * pixelSize;
          const growthHeight = p.floor(frozzyGrassGrowth[i]); // Current growth height in pixels
          
          // Always draw base grass pixel (ground level)
          p.fill(
            p.red(activeGrassColor),
            p.green(activeGrassColor),
            p.blue(activeGrassColor),
            200 + hoverProgress * 55
          );
          p.rect(x, grassBaseY, pixelSize, pixelSize);
          
          // Draw grass growing upward (pixel by pixel)
          if (growthHeight > 0) {
            for (let h = 1; h <= growthHeight; h++) {
              const y = grassBaseY - (h * pixelSize);
              // Slightly vary color for depth
              const colorVariation = p.map(h, 0, growthHeight, 0.9, 1.0);
              p.fill(
                p.red(activeGrassColor) * colorVariation,
                p.green(activeGrassColor) * colorVariation,
                p.blue(activeGrassColor) * colorVariation,
                200 + hoverProgress * 55
              );
              p.rect(x, y, pixelSize, pixelSize);
            }
            
            // Add a small "tip" pixel for taller grass (more organic look)
            if (growthHeight >= 3) {
              const tipY = grassBaseY - (growthHeight * pixelSize);
              p.fill(
                p.red(activeGrassColor) * 0.8,
                p.green(activeGrassColor) * 0.8,
                p.blue(activeGrassColor) * 0.8,
                200 + hoverProgress * 55
              );
              // Tip can be slightly offset for variation
              const tipOffset = (i % 2 === 0) ? 0 : pixelSize;
              p.rect(x + tipOffset, tipY - pixelSize, pixelSize, pixelSize);
            }
          }
        }
        
        p.pop();
        
        // Draw Llama (8-bit pixel art - bigger with more detail, side view)
        // Position llama so feet are on the grass line
        const llamaHeight = pixelSize * 12; // Total llama height in pixels (bigger)
        const llamaX = cx - (pixelSize * 5); // Center the llama (10 pixels wide)
        const llamaY = grassBaseY - llamaHeight + p.floor(frozzyBobOffset); // Position so feet touch grass, with bobbing
        
        p.push();
        p.noStroke();
        
        const llamaColor = p.color(p.red(activeLlamaColor), p.green(activeLlamaColor), p.blue(activeLlamaColor), 200 + hoverProgress * 55);
        p.fill(llamaColor);
        
        // Classic 8-bit llama - side view, bigger with more detail
        // Head (larger with more definition)
        p.rect(llamaX + pixelSize * 2, llamaY, pixelSize * 3, pixelSize * 3); // Head main
        p.rect(llamaX + pixelSize * 3, llamaY - pixelSize, pixelSize, pixelSize * 2); // Ear (pointy, taller)
        
        // Snout (protruding forward)
        p.rect(llamaX + pixelSize * 5, llamaY + pixelSize, pixelSize * 2, pixelSize * 2);
        
        // Neck (longer, more defined)
        p.rect(llamaX + pixelSize * 3, llamaY + pixelSize * 3, pixelSize * 2, pixelSize * 3);
        
        // Body (larger, more oval-shaped)
        p.rect(llamaX, llamaY + pixelSize * 6, pixelSize * 2, pixelSize * 4); // Body front
        p.rect(llamaX + pixelSize * 2, llamaY + pixelSize * 6, pixelSize * 5, pixelSize * 4); // Body main
        p.rect(llamaX + pixelSize * 6, llamaY + pixelSize * 7, pixelSize * 2, pixelSize * 3); // Body back
        
        // Tail (curved upward)
        p.rect(llamaX + pixelSize * 7, llamaY + pixelSize * 6, pixelSize, pixelSize * 2);
        p.rect(llamaX + pixelSize * 8, llamaY + pixelSize * 5, pixelSize, pixelSize);
        
        // Legs (front and back pairs, more defined)
        // Front legs
        p.rect(llamaX + pixelSize, llamaY + pixelSize * 10, pixelSize, pixelSize * 2); // Front leg
        p.rect(llamaX + pixelSize * 2, llamaY + pixelSize * 10, pixelSize, pixelSize * 2); // Front leg 2
        // Back legs
        p.rect(llamaX + pixelSize * 5, llamaY + pixelSize * 10, pixelSize, pixelSize * 2); // Back leg
        p.rect(llamaX + pixelSize * 6, llamaY + pixelSize * 10, pixelSize, pixelSize * 2); // Back leg 2
        
        // Eye (more visible)
        if (hoverProgress > 0.1) {
          p.fill(0, 0, 0, 150 + hoverProgress * 105);
          p.rect(llamaX + pixelSize * 3, llamaY + pixelSize * 2, pixelSize, pixelSize);
        }
        
        // Nostril (small detail on snout)
        if (hoverProgress > 0.3) {
          p.fill(0, 0, 0, 100);
          p.rect(llamaX + pixelSize * 6, llamaY + pixelSize * 2, pixelSize, pixelSize);
        }
        
        p.pop();
      }

      function drawTBA1(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Electric Teal for TBA 1)
        const electricTeal = p.color(0, 255, 255); // Electric Teal (#00FFFF)
        
        // Lerp color from rest white/ice blue to electric teal based on hover
        const restColor = p.lerpColor(restWhite, restIceBlue, 0.3);
        const activeColor = p.lerpColor(restColor, electricTeal, hoverProgress);
        
        // Initialize particles if needed
        if (tba1Particles.length === 0) {
          const numParticles = 80;
          for (let i = 0; i < numParticles; i++) {
            tba1Particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-1, 1),
              vy: p.random(-1, 1),
              noiseX: p.random(1000),
              noiseY: p.random(1000),
              size: p.random(2, 4)
            });
          }
        }
        
        // Update and draw particles with flocking/noise behavior
        p.push();
        p.noStroke();
        
        tba1Particles.forEach(particle => {
          // Use Perlin noise for smooth, organic movement
          const noiseScale = 0.01;
          const noiseX = p.noise(particle.noiseX) * 2 - 1;
          const noiseY = p.noise(particle.noiseY) * 2 - 1;
          
          // Update velocity with noise (flocking behavior)
          particle.vx += noiseX * 0.1;
          particle.vy += noiseY * 0.1;
          
          // Limit velocity
          const maxSpeed = 2;
          const speed = p.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          if (speed > maxSpeed) {
            particle.vx = (particle.vx / speed) * maxSpeed;
            particle.vy = (particle.vy / speed) * maxSpeed;
          }
          
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Wrap around edges
          if (particle.x < 0) particle.x = p.width;
          if (particle.x > p.width) particle.x = 0;
          if (particle.y < 0) particle.y = p.height;
          if (particle.y > p.height) particle.y = 0;
          
          // Update noise offsets
          particle.noiseX += 0.01;
          particle.noiseY += 0.01;
          
          // Draw particle with glow effect
          const alpha = 150 + hoverProgress * 105;
          p.fill(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha * 0.3);
          p.circle(particle.x, particle.y, particle.size * 3);
          p.fill(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha);
          p.circle(particle.x, particle.y, particle.size);
        });
        
        // Draw connections between nearby particles (flocking visualization)
        p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), 50 + hoverProgress * 50);
        p.strokeWeight(1);
        
        const connectionDistance = p.width * 0.15;
        for (let i = 0; i < tba1Particles.length; i++) {
          for (let j = i + 1; j < tba1Particles.length; j++) {
            const dx = tba1Particles[i].x - tba1Particles[j].x;
            const dy = tba1Particles[i].y - tba1Particles[j].y;
            const distance = p.sqrt(dx * dx + dy * dy);
            
            if (distance < connectionDistance) {
              const alpha = p.map(distance, 0, connectionDistance, 100, 0);
              p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha);
              p.line(tba1Particles[i].x, tba1Particles[i].y, tba1Particles[j].x, tba1Particles[j].y);
            }
          }
        }
        
        p.pop();
      }

      function drawTBA2(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Neon Orange for TBA 2)
        const neonOrange = p.color(255, 95, 31); // Neon Orange (#FF5F1F)
        
        // Lerp color from rest white/ice blue to neon orange based on hover
        const restColor = p.lerpColor(restWhite, restIceBlue, 0.3);
        const activeColor = p.lerpColor(restColor, neonOrange, hoverProgress);
        
        // Initialize glitch lines
        if (tba2GlitchLines.length === 0) {
          for (let i = 0; i < 20; i++) {
            tba2GlitchLines.push({
              x: p.random(p.width),
              y: p.random(p.height),
              length: p.random(20, 80),
              angle: p.random(p.TWO_PI),
              speed: p.random(1, 3),
              life: p.random(30, 60)
            });
          }
        }
        
        // Update glitch lines
        const currentTime = p.millis();
        if (currentTime - tba2LastGlitch > 100) {
          tba2LastGlitch = currentTime;
          
          tba2GlitchLines.forEach(line => {
            line.x += p.cos(line.angle) * line.speed;
            line.y += p.sin(line.angle) * line.speed;
            line.life--;
            
            // Reset if off screen or expired
            if (line.x < -50 || line.x > p.width + 50 || line.y < -50 || line.y > p.height + 50 || line.life <= 0) {
              line.x = p.random(p.width);
              line.y = p.random(p.height);
              line.angle = p.random(p.TWO_PI);
              line.life = p.random(30, 60);
            }
          });
        }
        
        // Draw glitch lines
        p.push();
        p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), 150 + hoverProgress * 105);
        p.strokeWeight(2);
        
        tba2GlitchLines.forEach(line => {
          const alpha = p.map(line.life, 0, 60, 0, 255);
          p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha);
          const endX = line.x + p.cos(line.angle) * line.length;
          const endY = line.y + p.sin(line.angle) * line.length;
          p.line(line.x, line.y, endX, endY);
        });
        
        p.pop();
      }

      function drawTBA3(p) {
        // Rest state colors (soft white/ice blue for clean look on sky)
        const restWhite = p.color(255, 255, 255);
        const restIceBlue = p.color(200, 230, 255);
        
        // Project identity color (Hot Pink for TBA 3)
        const hotPink = p.color(255, 0, 127); // Hot Pink (#FF007F)
        
        // Lerp color from rest white/ice blue to hot pink based on hover
        const restColor = p.lerpColor(restWhite, restIceBlue, 0.3);
        const activeColor = p.lerpColor(restColor, hotPink, hoverProgress);
        
        const cx = p.width / 2;
        const cy = p.height / 2;
        
        // Create new pulse every 1.5 seconds (heartbeat rhythm)
        const currentTime = p.millis();
        if (currentTime - tba3LastPulse > 1500) {
          tba3Pulses.push({
            radius: 0,
            maxRadius: p.width * 0.6,
            life: 60,
            maxLife: 60
          });
          tba3LastPulse = currentTime;
        }
        
        // Draw center point (always visible for reference)
        p.push();
        p.fill(p.red(activeColor), p.green(activeColor), p.blue(activeColor), 100 + hoverProgress * 155);
        p.noStroke();
        p.circle(cx, cy, 4);
        p.pop();
        
        // Update and draw pulses with better visibility
        p.push();
        p.noFill();
        
        tba3Pulses = tba3Pulses.filter(pulse => {
          pulse.radius += pulse.maxRadius / pulse.maxLife;
          pulse.life--;
          
          if (pulse.life > 0) {
            // Calculate alpha with higher base opacity for better visibility
            const baseAlpha = 120; // Higher base opacity
            const fadeAlpha = p.map(pulse.life, 0, pulse.maxLife, 0, 135);
            const alpha = baseAlpha + fadeAlpha;
            
            // Draw multiple layers for glow effect and better visibility
            // Outer glow layer (thicker, more transparent)
            p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha * 0.3);
            p.strokeWeight(4);
            p.circle(cx, cy, pulse.radius);
            
            // Middle layer
            p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha * 0.6);
            p.strokeWeight(3);
            p.circle(cx, cy, pulse.radius);
            
            // Inner layer (brightest, most visible)
            p.stroke(p.red(activeColor), p.green(activeColor), p.blue(activeColor), alpha);
            p.strokeWeight(2);
            p.circle(cx, cy, pulse.radius);
            
            return true;
          }
          return false;
        });
        
        p.pop();
      }

      p.windowResized = () => {
        let containerWidth = container.offsetWidth;
        if (containerWidth === 0) {
          containerWidth = container.parentElement?.offsetWidth || 300;
        }
        p.resizeCanvas(containerWidth, containerWidth);
        
        // Reset faders on resize for DAW plugins
        if (projectType === 'daw-plugins') {
          faders = [];
          faderNoiseOffsets = [];
        }
        
        // Reset sequencer grid on resize for Sound Architectures
        if (projectType === 'sound-arch') {
          sequencerGrid = [];
          sequencerPatternChangeTime = 0;
        }
        
        // Reset signal chain time on resize for ChucK => Etudes
        if (projectType === 'chuck-etudes') {
          signalChainTime = 0;
        }
        
        // Reset 8-bit animation variables on resize for Fr0zzy
        if (projectType === 'frozzy') {
          frozzyBobOffset = 0;
          frozzyAnimationFrame = 0;
          frozzyGrassGrowth = [];
          frozzyGrassGrowthRates = [];
          frozzyParticles = [];
          frozzyLastGrassEat = 0;
        }
        
        // Reset TBA animation variables on resize
        if (projectType === 'tba-1') {
          tba1Particles = [];
        }
        if (projectType === 'tba-2') {
          tba2GlitchLines = [];
          tba2LastGlitch = 0;
        }
        if (projectType === 'tba-3') {
          tba3Pulses = [];
          tba3LastPulse = 0;
        }
        
        // Reset placeholder variables when switching projects
        if (projectType.startsWith('placeholder-')) {
          if (projectType === 'placeholder-1') {
            placeholder1Particles = [];
          } else if (projectType === 'placeholder-4') {
            placeholder4Nodes = [];
          }
        }
      };
      
      // Placeholder animations
      function drawPlaceholder1(p) {
        // Particle swarm (Purple)
        const t = p.frameCount * 0.01;
        const numParticles = 50;
        const accentColor = p.color(138, 43, 226); // Blue violet
        
        if (placeholder1Particles.length === 0) {
          for (let i = 0; i < numParticles; i++) {
            placeholder1Particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-1, 1),
              vy: p.random(-1, 1),
              size: p.random(2, 4)
            });
          }
        }
        
        placeholder1Particles.forEach(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;
          
          const noiseX = p.noise(particle.x * 0.01, t) * 2 - 1;
          const noiseY = p.noise(particle.y * 0.01, t + 100) * 2 - 1;
          particle.vx += noiseX * 0.1;
          particle.vy += noiseY * 0.1;
          
          p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 150);
          p.noStroke();
          p.circle(particle.x, particle.y, particle.size);
        });
      }
      
      function drawPlaceholder2(p) {
        // Rotating geometric shapes (Teal)
        const t = p.frameCount * 0.02;
        const accentColor = p.color(0, 206, 209); // Dark turquoise
        const cx = p.width / 2;
        const cy = p.height / 2;
        
        p.push();
        p.translate(cx, cy);
        p.rotate(t);
        
        for (let i = 0; i < 6; i++) {
          p.push();
          p.rotate((p.TWO_PI / 6) * i);
          p.translate(0, -p.width * 0.15);
          p.rotate(-t * 2);
          
          p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 120);
          p.noStroke();
          p.triangle(0, -10, -8, 8, 8, 8);
          p.pop();
        }
        
        p.pop();
      }
      
      function drawPlaceholder3(p) {
        // Wave patterns (Pink)
        const t = p.frameCount * 0.015;
        const accentColor = p.color(255, 20, 147); // Deep pink
        const numWaves = 5;
        
        p.push();
        p.noFill();
        p.strokeWeight(2);
        
        for (let i = 0; i < numWaves; i++) {
          const y = (p.height / (numWaves + 1)) * (i + 1);
          const amp = 20 + i * 5;
          const freq = 0.02 + i * 0.01;
          
          p.beginShape();
          for (let x = 0; x < p.width; x += 2) {
            const waveY = y + p.sin(x * freq + t * 50) * amp;
            const alpha = 150 - i * 20;
            p.stroke(p.red(accentColor), p.green(accentColor), p.blue(accentColor), alpha);
            p.vertex(x, waveY);
          }
          p.endShape();
        }
        
        p.pop();
      }
      
      function drawPlaceholder4(p) {
        // Grid network (Cyan)
        const t = p.frameCount * 0.01;
        const accentColor = p.color(0, 255, 255); // Cyan
        const gridSize = 8;
        const nodes = [];
        
        if (placeholder4Nodes.length === 0) {
          for (let x = 0; x < p.width; x += p.width / gridSize) {
            for (let y = 0; y < p.height; y += p.height / gridSize) {
              placeholder4Nodes.push({
                x: x + p.width / (gridSize * 2),
                y: y + p.height / (gridSize * 2),
                pulse: p.random(p.TWO_PI)
              });
            }
          }
        }
        
        placeholder4Nodes.forEach(node => {
          node.pulse += 0.05;
          const size = 3 + p.sin(node.pulse) * 2;
          
          p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 180);
          p.noStroke();
          p.circle(node.x, node.y, size);
        });
        
        p.stroke(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 60);
        p.strokeWeight(1);
        for (let i = 0; i < placeholder4Nodes.length; i++) {
          for (let j = i + 1; j < placeholder4Nodes.length; j++) {
            const dist = p.dist(
              placeholder4Nodes[i].x, placeholder4Nodes[i].y,
              placeholder4Nodes[j].x, placeholder4Nodes[j].y
            );
            if (dist < p.width * 0.25) {
              p.line(
                placeholder4Nodes[i].x, placeholder4Nodes[i].y,
                placeholder4Nodes[j].x, placeholder4Nodes[j].y
              );
            }
          }
        }
      }
      
      function drawPlaceholder5(p) {
        // Orbiting circles (Magenta)
        const t = p.frameCount * 0.02;
        const accentColor = p.color(255, 0, 255); // Magenta
        const cx = p.width / 2;
        const cy = p.height / 2;
        const numOrbits = 3;
        
        for (let i = 0; i < numOrbits; i++) {
          const radius = (p.width * 0.15) + (i * p.width * 0.1);
          const angle = t + (i * p.TWO_PI / numOrbits);
          const x = cx + p.cos(angle) * radius;
          const y = cy + p.sin(angle) * radius;
          
          p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 150);
          p.noStroke();
          p.circle(x, y, 12 - i * 2);
          
          p.stroke(p.red(accentColor), p.green(accentColor), p.blue(accentColor), 40);
          p.strokeWeight(1);
          p.noFill();
          p.circle(cx, cy, radius * 2);
        }
      }
      
      function drawPlaceholder6(p) {
        // Flowing stream of particles (Coral/Salmon)
        const t = p.frameCount * 0.015;
        const accentColor = p.color(255, 127, 80); // Coral
        const numParticles = 40;
        
        if (!p.placeholder6Particles) {
          p.placeholder6Particles = [];
          for (let i = 0; i < numParticles; i++) {
            p.placeholder6Particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              speed: p.random(0.5, 2),
              size: p.random(3, 6),
              phase: p.random(p.TWO_PI)
            });
          }
        }
        
        p.placeholder6Particles.forEach((particle, index) => {
          // Move particles in a flowing wave pattern
          particle.x += particle.speed;
          particle.y = p.height / 2 + p.sin(particle.x * 0.02 + particle.phase + t) * (p.height * 0.3);
          
          // Wrap around horizontally
          if (particle.x > p.width + 20) {
            particle.x = -20;
            particle.y = p.random(p.height);
          }
          
          // Draw particle with trail effect
          const alpha = 180 - (index % 10) * 15; // Varying opacity for depth
          p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), alpha);
          p.noStroke();
          p.circle(particle.x, particle.y, particle.size);
          
          // Draw small trailing particles
          for (let i = 1; i <= 3; i++) {
            const trailX = particle.x - i * particle.speed * 2;
            const trailY = particle.y - p.sin(particle.x * 0.02 + particle.phase + t - i * 0.1) * (p.height * 0.3);
            const trailAlpha = alpha * (1 - i * 0.3);
            if (trailAlpha > 20 && trailX > 0) {
              p.fill(p.red(accentColor), p.green(accentColor), p.blue(accentColor), trailAlpha);
              p.circle(trailX, trailY, particle.size * 0.6);
            }
          }
        });
      }
    };
    
    new p5(sketch, container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectAnimations);
} else {
  initProjectAnimations();
}

