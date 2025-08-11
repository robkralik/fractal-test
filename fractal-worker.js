function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

const log2 = Math.log(2);

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
          // Color smoothing to avoid banding
          const logZn = Math.log(a * a + b * b) / 2;
          const nu = Math.log(logZn / log2) / log2;
          const iterationWithSmoothing = n + 1 - nu;
          
          // Use a sinusoidal coloring function for smooth gradients
          const color_r = Math.sin(0.3 * iterationWithSmoothing + 0) * 127 + 128;
          const color_g = Math.sin(0.3 * iterationWithSmoothing + 2) * 127 + 128;
          const color_b = Math.sin(0.3 * iterationWithSmoothing + 4) * 127 + 128;
          
          pixelData[index] = color_r;
          pixelData[index + 1] = color_g;
          pixelData[index + 2] = color_b;
          pixelData[index + 3] = 255;
        }
      }
    }
    
    self.postMessage({ pixelData: pixelData.buffer }, [pixelData.buffer]);
};
