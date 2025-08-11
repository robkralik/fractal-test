function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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
          if (a * a + b * b > 4) break;
          n++;
        }

        const index = (y * width + x) * 4;
        if (n === maxIterations) {
          pixelData[index] = pixelData[index + 1] = pixelData[index + 2] = 0;
          pixelData[index + 3] = 255;
        } else {
          const colorValue = Math.floor(map(n, 0, maxIterations, 0, 255));
          pixelData[index] = pixelData[index + 1] = pixelData[index + 2] = colorValue;
          pixelData[index + 3] = 255;
        }
      }
    }
    
    self.postMessage({ pixelData: pixelData.buffer }, [pixelData.buffer]);
};
