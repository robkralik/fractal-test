// This script runs in a separate Web Worker thread.
// It has no access to the DOM or the window object.

let canvas, ctx, width, height;
let xCenter, yCenter;
let zoom = 1;

// We'll use a smoother color algorithm
const log2 = Math.log(2);

// Function to map a value from one range to another
function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// The core fractal drawing logic
function drawFractal() {
  // Dynamically calculate maxIterations based on zoom level
  // This is a simple heuristic; more complex formulas exist
  let maxIterations = Math.floor(200 + zoom * 20); 

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let a = (x - halfWidth) / (width * zoom) + xCenter;
      let b = (y - halfHeight) / (height * zoom) + yCenter;
      
      let ca = a;
      let cb = b;

      let n = 0;
      while (n < maxIterations) {
        const aa = a * a - b * b;
        const bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;

        if (a * a + b * b > 4) {
          break;
        }
        n++;
      }

      // Calculate pixel index in the data array
      const index = (y * width + x) * 4;

      // Color the pixel based on the number of iterations
      if (n === maxIterations) {
        data[index] = 0;     // R
        data[index + 1] = 0; // G
        data[index + 2] = 0; // B
        data[index + 3] = 255; // A
      } else {
        const logZn = Math.log(a * a + b * b) / 2;
        const nu = Math.log(logZn / log2) / log2;
        const iterationWithSmoothing = n + 1 - nu;

        // Use HSL for coloring, but convert to RGB for ImageData
        const hue = map(iterationWithSmoothing, 0, maxIterations, 0, 360);
        const lightness = 50;
        
        // Simple HSL to RGB conversion
        const c = (1 - Math.abs(2 * (lightness / 100) - 1)) * 1; // saturation is 100%
        const x_val = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = (lightness / 100) - c / 2;

        let r, g, b;
        if (hue >= 0 && hue < 60) {
          [r, g, b] = [c, x_val, 0];
        } else if (hue >= 60 && hue < 120) {
          [r, g, b] = [x_val, c, 0];
        } else if (hue >= 120 && hue < 180) {
          [r, g, b] = [0, c, x_val];
        } else if (hue >= 180 && hue < 240) {
          [r, g, b] = [0, x_val, c];
        } else if (hue >= 240 && hue < 300) {
          [r, g, b] = [x_val, 0, c];
        } else {
          [r, g, b] = [c, 0, x_val];
        }

        data[index] = Math.round((r + m) * 255);
        data[index + 1] = Math.round((g + m) * 255);
        data[index + 2] = Math.round((b + m) * 255);
        data[index + 3] = 255; // Alpha
      }
    }
  }

  // Draw the image data to the offscreen canvas
  ctx.putImageData(imageData, 0, 0);

  // Send a message back to the main thread with updated info
  self.postMessage({ zoom: zoom, maxIterations: maxIterations });
}

// Message handler for the worker
self.onmessage = (e) => {
  if (e.data.canvas) {
    canvas = e.data.canvas;
    ctx = canvas.getContext('2d');
    width = e.data.width;
    height = e.data.height;
    xCenter = e.data.xCenter;
    yCenter = e.data.yCenter;
    drawFractal();
  }
  
  if (e.data.type === 'animate') {
    // Increase zoom for the next frame
    zoom *= 1.02; 
    drawFractal();
  }
};
