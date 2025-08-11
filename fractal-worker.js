function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// A more sophisticated coloring and smoothing algorithm
const log2 = Math.log(2);

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

self.onmessage = (e) => {
    const { width, height, xCenter, yCenter, zoom, maxIterations } = e.data;

    const pixelData = new Uint8ClampedArray(width * height * 4);

    const halfWidth = width / 2;
    const halfHeight = height / 2;

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

        const index = (y * width + x) * 4;

        if (n === maxIterations) {
          pixelData[index] = 0;
          pixelData[index + 1] = 0;
          pixelData[index + 2] = 0;
          pixelData[index + 3] = 255;
        } else {
          // Color smoothing algorithm
          const logZn = Math.log(a * a + b * b) / 2;
          const nu = Math.log(logZn / log2) / log2;
          const iterationWithSmoothing = n + 1 - nu;
          
          // Use a rich, cycling color palette
          const hue = (iterationWithSmoothing * 0.05) % 1;
          const saturation = 1;
          const lightness = 0.5;

          const [r, g, b] = hslToRgb(hue, saturation, lightness);

          pixelData[index] = r;
          pixelData[index + 1] = g;
          pixelData[index + 2] = b;
          pixelData[index + 3] = 255;
        }
      }
    }
    
    self.postMessage({ pixelData: pixelData.buffer }, [pixelData.buffer]);
};
