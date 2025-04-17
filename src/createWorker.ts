export function createDataWorker() {
    let workerPath;
    
    // In development, use relative path, in production use the bundled worker
    if (process.env.NODE_ENV === 'development') {
      workerPath = './workers/data-worker.ts';
    } else {
      workerPath = './worker.js';
    }
  
    try {
      return new Worker(workerPath);
    } catch (error) {
      console.error("Failed to create worker:", error);
      
      // Handle unknown type error properly
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        errorMessage = error.toString();
      }
      
      throw new Error(`Worker creation failed: ${errorMessage}`);
    }
  }