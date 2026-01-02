/**
 * Services Generative Icons
 * Creates unique, abstract generative animations for each service card
 * using p5.js instance mode.
 */

function initServicesIcons() {
  if (typeof p5 === 'undefined') {
    setTimeout(initServicesIcons, 50);
    return;
  }
  
  const containers = document.querySelectorAll('.service-anim-container');
  if (containers.length === 0) {
    setTimeout(initServicesIcons, 100);
    return;
  }
  
  containers.forEach((container) => {
    const cardIndex = parseInt(container.getAttribute('data-index'), 10);
    
    const sketch = (p) => {
      let auroraGreen, auroraPurple, auroraCyan;
      let nodes = [];
      let connections = [];
      let matrixChars = [];
      let isVisible = true; // Default to true to ensure it starts moving

      p.setup = () => {
        const containerWidth = container.offsetWidth || 300;
        const canvas = p.createCanvas(containerWidth, 80);
        canvas.parent(container);
        canvas.style('display', 'block');
        
        p.pixelDensity(1);
        p.frameRate(60);
        
        auroraGreen = p.color(0, 255, 180);
        auroraPurple = p.color(150, 50, 200);
        auroraCyan = p.color(0, 200, 255);
        
        // Init Network (Index 0)
        if (cardIndex === 0) {
          const numLayers = 3;
          const nodesPerLayer = [3, 4, 3];
          for (let layer = 0; layer < numLayers; layer++) {
            const layerY = 20 + (layer * 20);
            const spacing = (containerWidth - 40) / (nodesPerLayer[layer] + 1);
            for (let i = 0; i < nodesPerLayer[layer]; i++) {
              const baseX = 20 + spacing * (i + 1);
              nodes.push({ layer, x: baseX, y: layerY });
            }
          }
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              if (Math.abs(nodes[i].layer - nodes[j].layer) === 1) {
                connections.push({ a: nodes[i], b: nodes[j] });
              }
            }
          }
        } 
        // Init Matrix (Index 4)
        else if (cardIndex === 4) {
          const chars = ['/', '\\', '█', '▓', '▒', '░', '*', '+', '-', '·', '×', '÷', '≈', '∆', 'λ'];
          for (let i = 0; i < 25; i++) {
            const colRoll = p.random();
            let charCol;
            if (colRoll < 0.33) charCol = auroraGreen;
            else if (colRoll < 0.66) charCol = auroraPurple;
            else charCol = auroraCyan;

            matrixChars.push({
              x: p.random(0, containerWidth),
              y: p.random(-100, 0),
              speed: p.random(0.4, 1.2),
              char: chars[Math.floor(p.random(chars.length))],
              color: charCol
            });
          }
        }

        // Set up Intersection Observer for this specific sketch
        if (typeof IntersectionObserver !== 'undefined') {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              isVisible = entry.isIntersecting;
            });
          }, { threshold: 0.01 });
          const card = container.closest('.service-card') || container;
          observer.observe(card);
        }
      };
      
      p.draw = () => {
        p.clear();
        if (!isVisible) return;
        
        // Use frameCount for guaranteed continuous time
        const t = p.frameCount * 0.02; 
        
        switch (cardIndex) {
          case 0: drawNetwork(p, t); break;
          case 1: drawRotatingBox(p, t); break;
          case 2: drawSoundWave(p, t); break;
          case 3: drawRipple(p, t); break;
          case 4: drawMatrixRain(p, t); break;
          case 5: drawCompass(p, t); break;
        }
      };
      
      function drawNetwork(p, t) {
        // Ping-pong progress (0 to 1 back to 0)
        // Faster cycle: Math.sin(t) goes 0->1->0 every ~314 frames
        const progress = (p.sin(t) + 1) / 2; 
        const totalLines = connections.length;
        
        connections.forEach((conn, index) => {
          const threshold = index / totalLines;
          let lineAlpha = 0;
          if (progress > threshold) {
            lineAlpha = p.constrain((progress - threshold) * totalLines, 0, 1);
          }
          
          if (lineAlpha > 0) {
            p.strokeWeight(1.5);
            for (let i = 0; i < 10; i++) {
              const r1 = i / 10;
              const r2 = (i + 1) / 10;
              const x1 = p.lerp(conn.a.x, conn.b.x, r1);
              const y1 = p.lerp(conn.a.y, conn.b.y, r1);
              const x2 = p.lerp(conn.a.x, conn.b.x, r2);
              const y2 = p.lerp(conn.a.y, conn.b.y, r2);
              const col = p.lerpColor(auroraGreen, auroraPurple, r1);
              p.stroke(p.red(col), p.green(col), p.blue(col), 200 * lineAlpha * (1 - r1 * 0.2));
              p.line(x1, y1, x2, y2);
            }
          }
        });
        
        nodes.forEach(n => {
          p.noStroke();
          p.fill(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 220);
          p.circle(n.x, n.y, 4);
          p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), 255);
          p.circle(n.x, n.y, 2);
        });
      }
      
      function drawRotatingBox(p, t) {
        const cx = p.width/2; const cy = p.height/2;
        p.push();
        p.translate(cx, cy);
        
        // 1. "Outside the Box" Energy Beams (Now Gradient Blue-Green)
        const numBeams = 8; // Increased from 6
        for (let i = 0; i < numBeams; i++) {
          const angle = (i * p.TWO_PI / numBeams) + t * 0.15;
          const beamLen = p.map(p.sin(t * 1.2 + i), -1, 1, p.width * 0.25, p.width * 0.55);
          const beamAlpha = p.map(p.sin(t * 1.2 + i), -1, 1, 40, 120); // More prominent alpha
          
          p.push();
          p.rotate(angle);
          p.noFill();
          
          // Draw beam in segments to create a true color gradient along the line
          const segments = 6;
          for (let s = 0; s < segments; s++) {
            const r1 = s / segments;
            const r2 = (s + 1) / segments;
            const col = p.lerpColor(auroraCyan, auroraGreen, r2);
            
            // Outer glow layer for the segment
            p.stroke(p.red(col), p.green(col), p.blue(col), beamAlpha * 0.25);
            p.strokeWeight(4);
            p.line(beamLen * r1, 0, beamLen * r2, 0);
            
            // Core line layer for the segment
            p.stroke(p.red(col), p.green(col), p.blue(col), beamAlpha * 0.9);
            p.strokeWeight(1.0); // Reduced thickness (was 1.8)
            p.line(beamLen * r1, 0, beamLen * r2, 0);
          }
          
          // Prominent spark at the tip
          p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), beamAlpha);
          p.noStroke();
          p.circle(beamLen, 0, 2.5); // Slightly smaller spark
          p.pop();
        }

        // 2. Atmospheric "Floating Fragments"
        p.rotate(t * 0.5);
        for (let i = 0; i < 8; i++) {
          const frAngle = p.noise(i, t * 0.1) * p.TWO_PI;
          const frDist = p.noise(i + 10, t * 0.1) * p.width * 0.4;
          const fx = p.cos(frAngle) * frDist;
          const fy = p.sin(frAngle) * frDist;
          p.fill(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 40);
          p.noStroke();
          p.rect(fx, fy, 2, 2);
        }

        // 3. The Central Cube (The Box) - Now much Bolder
        p.rotate(t * 0.3); // Slower independent rotation
        const s = 15; 
        const o = 6 * p.sin(t * 1.2); 
        
        // Glow layer for the box
        p.strokeWeight(5); // Increased glow
        p.stroke(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 50);
        drawWireframeBox(p, s, o);
        
        // Core layer for the box
        p.strokeWeight(2.2); // Substantially thicker (was 1.2)
        p.stroke(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 255);
        drawWireframeBox(p, s, o);
        
        p.pop();
      }

      function drawWireframeBox(p, s, o) {
        p.noFill();
        p.rect(-s, -s, s*2, s*2);
        p.rect(-s+o, -s-o, s*2, s*2);
        p.line(-s, -s, -s+o, -s-o); 
        p.line(s, -s, s+o, -s-o);
        p.line(s, s, s+o, s-o); 
        p.line(-s, s, -s+o, s-o);
      }
      
      function drawSoundWave(p, t) {
        const centerY = p.height / 2;
        const numBars = 12;
        const barWidth = (p.width - 40) / numBars;
        for (let i = 0; i < numBars; i++) {
          const x = 20 + i * barWidth + barWidth / 2;
          const h = p.map(p.sin(t * 2.5 + i * 0.5) * p.noise(i * 0.3, t * 0.5), -1, 1, 5, 40);
          const col = p.lerpColor(auroraGreen, auroraPurple, i/numBars);
          p.fill(p.red(col), p.green(col), p.blue(col), 200);
          p.noStroke();
          p.rect(x - barWidth/2 + 2, centerY - h/2, barWidth - 4, h);
        }
      }
      
      function drawRipple(p, t) {
        const cx = p.width/2; const cy = p.height/2;
        
        // Background "Energy Field" - using purple/cyan particles
        p.noStroke();
        for (let i = 0; i < 12; i++) {
          const nx = p.noise(i, t * 0.1) * p.width;
          const ny = p.noise(i + 10, t * 0.1) * p.height;
          p.fill(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 8);
          p.circle(nx, ny, 1.2);
        }

        // Draw multiple expanding wave groups
        const numWaves = 6; // Increased from 4
        for (let i = 0; i < numWaves; i++) {
          const phase = (t * 0.3 + i * (2 / numWaves)) % 2;
          const rBase = phase * (p.width * 0.45); 
          const alpha = p.map(phase, 0, 2, 200, 0); // Increased max alpha
          
          if (alpha > 5) {
            const col = p.lerpColor(auroraPurple, auroraGreen, phase / 2);
            p.noFill();
            
            // Draw each wave with more substantial lines and a soft glow
            const numFineLines = 3;
            for (let j = 0; j < numFineLines; j++) {
              const lineR = rBase - (j * 6);
              const lineAlpha = alpha * (1 - j * 0.2);
              
              if (lineR > 0) {
                // Glow layer
                p.stroke(p.red(col), p.green(col), p.blue(col), lineAlpha * 0.2);
                p.strokeWeight(4); 
                p.ellipse(cx, cy, lineR * 2, lineR * 1.3);
                
                // Core line layer
                p.stroke(p.red(col), p.green(col), p.blue(col), lineAlpha * 0.9);
                p.strokeWeight(2.0 - j * 0.4); // Substantially thicker
                p.ellipse(cx, cy, lineR * 2, lineR * 1.3);
              }
            }
            
            // Larger particles following the wave
            const numDots = 2;
            for (let d = 0; d < numDots; d++) {
              const angle = (d * p.PI) + t * 0.4 + i;
              const dx = cx + p.cos(angle) * rBase;
              const dy = cy + p.sin(angle) * (rBase * 0.65);
              p.fill(p.red(col), p.green(col), p.blue(col), alpha);
              p.noStroke();
              p.circle(dx, dy, 3); // Increased from 1.5
            }
          }
        }
        
        // Central glowing core - More substantial
        const pulse = p.sin(t * 4) * 2;
        p.noStroke();
        p.fill(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 60);
        p.circle(cx, cy, 15 + pulse);
        p.fill(255, 255, 255, 240);
        p.circle(cx, cy, 4);
      }

      // Removing the jagged organic helper as we've returned to smooth geometry

      
      function drawMatrixRain(p, t) {
        const chars = ['/', '\\', '█', '▓', '▒', '░', '*', '+', '-', '·', '×', '÷', '≈', '∆', 'λ'];
        matrixChars.forEach(c => {
          c.y += c.speed;
          if (c.y > p.height) { 
            c.y = -20; 
            c.x = p.random(p.width); 
          }
          
          // INCREASED FLICKER: 
          // 1. Swap character more frequently (back to 0.08)
          if (p.random() < 0.08) c.char = chars[Math.floor(p.random(chars.length))];
          
          // 2. High-intensity flicker (randomly boost brightness for a single frame)
          const isFlickering = p.random() < 0.1;
          const flickerBoost = isFlickering ? 1.5 : 1.0;
          
          const alphaBase = p.map(c.y, -20, p.height, 40, 220);
          const finalAlpha = p.constrain(alphaBase * flickerBoost, 0, 255);
          
          // Use the pre-assigned aurora colors, but allow tiny color-shifts during flicker
          let drawCol = c.color;
          if (isFlickering && p.random() < 0.3) drawCol = p.lerpColor(c.color, p.color(255), 0.4);

          p.fill(p.red(drawCol), p.green(drawCol), p.blue(drawCol), finalAlpha);
          p.noStroke(); 
          p.textSize(11); 
          p.textFont('monospace');
          p.text(c.char, c.x, c.y);
          
          // Enhanced glow during flicker
          if (finalAlpha > 150) {
            const glowAlpha = isFlickering ? 0.6 : 0.3;
            p.fill(p.red(drawCol), p.green(drawCol), p.blue(drawCol), finalAlpha * glowAlpha);
            p.text(c.char, c.x + 0.5, c.y + 0.5);
          }
        });
      }
      
      function drawCompass(p, t) {
        const cx = p.width/2; const cy = p.height/2; 
        const r = 30; // Increased radius
        
        // 1. Background Strategic Grid - Now with depth gradient
        const gridW = p.width * 0.85;
        const gridH = 64;
        
        // Horizontal lines (drawn in segments for a radial gradient look)
        for (let i = -3; i <= 3; i++) {
          const ly = cy + i * 12;
          const yDist = Math.abs(i) / 3;
          
          const segs = 8;
          for (let s = 0; s < segs; s++) {
            const x1 = cx - gridW/2 + (s * gridW/segs);
            const x2 = cx - gridW/2 + ((s + 1) * gridW/segs);
            // Distance from center of this segment to the vertical center
            const xDist = Math.abs((s + 0.5) - segs/2) / (segs/2);
            const totalDist = Math.sqrt(xDist * xDist + yDist * yDist * 0.5);
            
            // Non-linear mapping to keep purple dominant longer
            const gradientAmt = p.pow(p.constrain(totalDist, 0, 1), 1.8);
            const col = p.lerpColor(auroraPurple, auroraGreen, gradientAmt);
            const alpha = p.map(p.constrain(totalDist, 0, 1), 0, 1, 1, 0.3);
            
            p.strokeWeight(1.5);
            p.stroke(p.red(col), p.green(col), p.blue(col), 100 * alpha);
            p.line(x1, ly, x2, ly);
            
            // Add tiny data-node "ticks" at joints
            if (s > 0 && p.random() > 0.8) {
              p.strokeWeight(1);
              p.point(x1, ly - 2);
            }
          }
        }
        
        // Vertical lines
        for (let i = -8; i <= 8; i++) {
          const lx = cx + i * 18;
          const xDist = Math.abs(i) / 8;
          
          const segs = 4;
          for (let s = 0; s < segs; s++) {
            const y1 = cy - gridH/2 + (s * gridH/segs);
            const y2 = cy - gridH/2 + ((s + 1) * gridH/segs);
            const yDist = Math.abs((s + 0.5) - segs/2) / (segs/2);
            const totalDist = Math.sqrt(xDist * xDist + yDist * yDist * 0.5);
            
            // Non-linear mapping to keep purple dominant longer
            const gradientAmt = p.pow(p.constrain(totalDist, 0, 1), 1.8);
            const col = p.lerpColor(auroraPurple, auroraGreen, gradientAmt);
            const alpha = p.map(p.constrain(totalDist, 0, 1), 0, 1, 1, 0.3);
            
            p.strokeWeight(1.5);
            p.stroke(p.red(col), p.green(col), p.blue(col), 100 * alpha);
            p.line(lx, y1, lx, y2);
          }
        }
        
        // 2. Compass Outer Dial (Glassy rings)
        p.noFill();
        p.strokeWeight(0.8);
        p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 100);
        p.circle(cx, cy, r * 2.2);
        p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 40);
        p.circle(cx, cy, r * 2.5);
        
        // Pulsing cardinal markers
        const markPulse = p.sin(t * 2) * 2;
        p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), 150);
        p.noStroke();
        p.circle(cx, cy - r * 1.1, 3 + markPulse * 0.5); // North
        p.circle(cx, cy + r * 1.1, 2); // South
        p.circle(cx - r * 1.1, cy, 2); // West
        p.circle(cx + r * 1.1, cy, 2); // East

        // 3. The Turning Arrow (Enhanced)
        p.push();
        p.translate(cx, cy);
        p.rotate(t * 0.4);
        
        // Arrow Glow layer
        p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 60);
        p.strokeWeight(5);
        p.line(0, -r * 0.8, 0, r * 0.8);
        
        // Arrow Core layer
        p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 255);
        p.strokeWeight(2.5);
        p.line(0, -r * 0.8, 0, r * 0.8);
        
        // Arrow Head
        p.fill(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 255);
        p.noStroke();
        p.triangle(0, -r * 0.9, -5, -r * 0.6, 5, -r * 0.6);
        
        // Subtle data-particles orbiting the arrow
        const px = p.cos(t * 1.5) * r * 0.7;
        const py = p.sin(t * 1.5) * r * 0.7;
        p.fill(255, 255, 255, 180);
        p.circle(px, py, 2);
        p.pop();
        
        // 4. Center Anchor
        p.fill(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 200);
        p.circle(cx, cy, 6);
        p.fill(255, 255, 255, 255);
        p.circle(cx, cy, 2);
      }

      p.windowResized = () => {
        p.resizeCanvas(container.offsetWidth || 300, 80);
      };
    };
    
    new p5(sketch, container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initServicesIcons);
} else {
  initServicesIcons();
}
