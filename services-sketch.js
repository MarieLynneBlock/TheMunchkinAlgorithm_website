/**
 * Services Aurora Animation
 * Creates a flowing aurora wave effect across service cards
 * using p5.js instance mode for each card container.
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Find all service animation containers
  const containers = document.querySelectorAll('.service-anim-container');
  
  // Create a p5.js instance for each container
  containers.forEach((container) => {
    const cardIndex = parseInt(container.getAttribute('data-index'), 10);
    
    // p5.js sketch function for each card
    const sketch = (p) => {
      let time = 0;
      let waveSpeed = 0.02;
      let noiseScale = 0.015;
      
      // Aurora colors (matching the main aurora theme)
      const auroraGreen = p.color(0, 255, 180);
      const auroraPurple = p.color(150, 50, 200);
      const auroraCyan = p.color(0, 200, 255);
      
      p.setup = () => {
        // Get container width (with fallback)
        const containerWidth = container.offsetWidth || container.clientWidth || 300;
        
        // Create canvas that fills the container
        const canvas = p.createCanvas(containerWidth, 80);
        canvas.parent(container);
        canvas.style('display', 'block'); // Remove default inline-block spacing
        p.pixelDensity(1); // Limit pixel density for performance
        
        // Set blend mode for glow effect
        p.colorMode(p.RGB, 255);
        
        // Ensure transparent background
        p.clear();
      };
      
      p.draw = () => {
        // Clear with transparent background
        p.background(0, 0, 0, 0);
        
        // Update time for animation
        time += waveSpeed;
        
        // Calculate the x-offset based on card index
        // Cards are in a 3-column grid:
        // Row 1: cards 0, 1, 2 (should be continuous)
        // Row 2: cards 3, 4, 5 (should be continuous, separate from row 1)
        const cardWidth = p.width;
        const columnIndex = cardIndex % 3; // Position within row (0, 1, or 2)
        const rowIndex = Math.floor(cardIndex / 3); // Which row (0 or 1)
        
        // For continuity within a row: offset by column position
        // For row separation: add a large offset to break continuity between rows
        const rowSeparation = 10000; // Large offset to separate rows
        const xOffset = (columnIndex * cardWidth) + (rowIndex * rowSeparation);
        
        // Draw vertical aurora bars (matching background aurora style)
        drawAuroraBars(p, xOffset, time);
      };
      
      /**
       * Draws vertical aurora bars (matching background aurora style)
       * @param {p5} p - p5 instance
       * @param {number} xOffset - X offset based on card index
       * @param {number} time - Animation time
       */
      function drawAuroraBars(p, xOffset, time) {
        const sampleStep = 15; // Spacing between vertical bars
        const maxBarHeight = p.height * 0.7; // Maximum height of bars
        const baseY = p.height * 0.6; // Base Y position (bars grow upward from here)
        const verticalStep = 2; // Vertical sampling step for smooth gradient
        
        // Extend slightly beyond edges for seamless connection
        const edgeExtension = sampleStep;
        const startX = -edgeExtension;
        const endX = p.width + edgeExtension;
        
        // Draw vertical bars
        for (let x = startX; x <= endX; x += sampleStep) {
          // Use noise with x-offset to ensure continuity across cards
          const noiseX = (x + xOffset) * noiseScale;
          const noiseY = time;
          
          // Calculate bar properties using multiple noise layers for more organic variation
          // Combine different noise scales to break the regular pattern
          const noise1 = p.noise(noiseX, noiseY);
          const noise2 = p.noise(noiseX * 1.7, noiseY + 100); // Different scale and offset
          const noise3 = p.noise(noiseX * 0.5, noiseY - 200); // Even more variation
          
          // Combine noises with different weights for organic variation
          const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
          
          // Add subtle sine wave for additional variation (like background aurora)
          const sineVariation = Math.sin((x + xOffset) * 0.03 + time * 1.5) * 0.15;
          
          // Map to height range with more variation
          const barHeight = p.map(combinedNoise + sineVariation, 0, 1.3, maxBarHeight * 0.2, maxBarHeight);
          const strokeWeight = 1.5 + p.noise(noiseX * 2, noiseY) * 1.5;
          
          // Draw vertical bar with gradient (green to purple, fading upward)
          for (let j = 0; j < barHeight; j += verticalStep) {
            const gradientRatio = j / barHeight;
            
            // Interpolate color from green to purple
            const r = p.lerp(p.red(auroraGreen), p.red(auroraPurple), gradientRatio);
            const g = p.lerp(p.green(auroraGreen), p.green(auroraPurple), gradientRatio);
            const b = p.lerp(p.blue(auroraGreen), p.blue(auroraPurple), gradientRatio);
            
            // Alpha fades as it goes up (bright at bottom, transparent at top)
            let alpha;
            if (j < barHeight * 0.3) {
              // Keep it bright for the first 30% of height
              alpha = 200;
            } else {
              // Gradual fade for the rest
              const fadeRatio = (j - barHeight * 0.3) / (barHeight * 0.7);
              alpha = p.map(fadeRatio, 0, 1, 200, 0);
            }
            
            // Only draw if alpha is significant
            if (alpha > 10) {
              p.stroke(r, g, b, alpha);
              p.strokeWeight(strokeWeight);
              const y = baseY - j;
              p.line(x, y, x, y - verticalStep);
            }
          }
        }
        
        // Draw a second layer of bars (slightly offset) for depth
        for (let x = startX + sampleStep * 0.5; x <= endX; x += sampleStep) {
          const noiseX = (x + xOffset) * noiseScale;
          const noiseY = time + 500; // Offset for variation
          
          // Use multiple noise layers for second layer too
          const noise1 = p.noise(noiseX, noiseY);
          const noise2 = p.noise(noiseX * 1.9, noiseY + 300);
          const noise3 = p.noise(noiseX * 0.6, noiseY - 400);
          const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
          const sineVariation = Math.sin((x + xOffset) * 0.025 + time * 1.3) * 0.12;
          
          const barHeight = p.map(combinedNoise + sineVariation, 0, 1.3, maxBarHeight * 0.15, maxBarHeight * 0.7);
          const strokeWeight = 1 + p.noise(noiseX * 2, noiseY) * 1;
          
          for (let j = 0; j < barHeight; j += verticalStep) {
            const gradientRatio = j / barHeight;
            const r = p.lerp(p.red(auroraCyan), p.red(auroraPurple), gradientRatio);
            const g = p.lerp(p.green(auroraCyan), p.green(auroraPurple), gradientRatio);
            const b = p.lerp(p.blue(auroraCyan), p.blue(auroraPurple), gradientRatio);
            
            let alpha;
            if (j < barHeight * 0.3) {
              alpha = 150;
            } else {
              const fadeRatio = (j - barHeight * 0.3) / (barHeight * 0.7);
              alpha = p.map(fadeRatio, 0, 1, 150, 0);
            }
            
            if (alpha > 10) {
              p.stroke(r, g, b, alpha);
              p.strokeWeight(strokeWeight);
              const y = baseY - j;
              p.line(x, y, x, y - verticalStep);
            }
          }
        }
      }
      
      // Handle window resize
      p.windowResized = () => {
        const containerWidth = container.offsetWidth || container.clientWidth || 300;
        p.resizeCanvas(containerWidth, 80);
      };
      
      // Also handle container resize using ResizeObserver if available
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => {
          const containerWidth = container.offsetWidth || container.clientWidth || 300;
          p.resizeCanvas(containerWidth, 80);
        });
        resizeObserver.observe(container);
      }
    };
    
    // Create p5.js instance for this container
    new p5(sketch, container);
  });
});

