// src/utils/workerFactory.ts
export function createDataWorker(workerCode: string): Worker {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // Clean up URL when worker terminates
    const originalTerminate = worker.terminate;
    worker.terminate = function() {
      URL.revokeObjectURL(workerUrl);
      return originalTerminate.call(this);
    };
    
    return worker;
  }

