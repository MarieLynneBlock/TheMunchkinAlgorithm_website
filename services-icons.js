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
          const chars = ['0', '1', '|', '/', '\\', '█', '▓', '▒', '░'];
          for (let i = 0; i < 20; i++) {
            matrixChars.push({
              x: p.random(0, containerWidth),
              y: p.random(-100, 0),
              speed: p.random(0.5, 1.5),
              char: chars[Math.floor(p.random(chars.length))]
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
        p.push();
        p.translate(p.width/2, p.height/2);
        p.rotate(t * 0.8);
        p.stroke(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 180);
        p.strokeWeight(1.5); p.noFill();
        const s = 12; const o = 5;
        p.rect(-s, -s, s*2, s*2);
        p.rect(-s+o, -s-o, s*2, s*2);
        p.line(-s, -s, -s+o, -s-o); p.line(s, -s, s+o, -s-o);
        p.line(s, s, s+o, s-o); p.line(-s, s, -s+o, s-o);
        p.pop();
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
        for (let i = 0; i < 3; i++) {
          const phase = (t * 0.5 + i * 0.6) % 2;
          const r = phase * 30;
          const alpha = p.map(phase, 0, 2, 200, 0);
          if (alpha > 10) {
            p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), alpha);
            p.strokeWeight(2); p.noFill();
            p.circle(cx, cy, r);
          }
        }
        p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), 180);
        p.noStroke(); p.circle(cx, cy, 4);
      }
      
      function drawMatrixRain(p, t) {
        const chars = ['0', '1', '|', '/', '\\', '█', '▓', '▒', '░'];
        matrixChars.forEach(c => {
          c.y += c.speed;
          if (c.y > p.height) { c.y = -20; c.x = p.random(p.width); }
          if (p.random() < 0.05) c.char = chars[Math.floor(p.random(chars.length))];
          const alpha = p.map(c.y, -20, p.height, 50, 200);
          p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), alpha);
          p.noStroke(); p.textSize(10); p.textFont('monospace');
          p.text(c.char, c.x, c.y);
        });
      }
      
      function drawCompass(p, t) {
        const cx = p.width/2; const cy = p.height/2; const r = 25;
        p.stroke(p.red(auroraPurple), p.green(auroraPurple), p.blue(auroraPurple), 80);
        for (let i = -2; i <= 2; i++) {
          p.line(cx-r, cy+i*8, cx+r, cy+i*8);
          p.line(cx+i*8, cy-r, cx+i*8, cy+r);
        }
        p.push(); p.translate(cx, cy); p.rotate(t * 0.4);
        p.stroke(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 220);
        p.strokeWeight(2); p.line(0, -r*0.8, 0, r*0.8);
        p.fill(p.red(auroraCyan), p.green(auroraCyan), p.blue(auroraCyan), 220);
        p.triangle(0, -r*0.8, -3, -r*0.6, 3, -r*0.6);
        p.pop();
        p.fill(p.red(auroraGreen), p.green(auroraGreen), p.blue(auroraGreen), 180);
        p.circle(cx, cy, 4);
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
