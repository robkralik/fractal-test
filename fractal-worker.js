// This is the simplest possible Web Worker.
// It should immediately send a message back to the main thread.

console.log("Worker: Script loaded and starting.");

self.postMessage({ message: "SUCCESS: Web Worker is running!" });

console.log("Worker: Message sent.");
