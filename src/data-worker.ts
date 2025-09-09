// data-worker.ts

import { computeDataState } from './computeDatastate'; // This function contains the logic from useDataState without hooks
import { getHeatmapState } from './state/getHeatmapState'; // Your heatmap state computation function
import { DataStateShape } from './types';

// Global variable to store the computed data state
let currentDataState: DataStateShape | null = null;

self.addEventListener('message', (event: MessageEvent) => {
  const message = event.data;

  if (message.messageType === 'dataState') {
    // Compute the data state based on the incoming JSON data, order, and categories
    currentDataState = computeDataState(message.data, message.order, message.catTemporary);
    // Post the computed data state back to the main thread
    self.postMessage({ dataState: currentDataState });
  } else if (message.messageType === 'heatmapState') {
    if (currentDataState) {
      // Compute the heatmap state using the previously computed data state
      const heatmapState = getHeatmapState(
        currentDataState,
        message.colLabelsWidth,
        message.rowLabelsWidth,
        message.dimensions,
        message.ID,
        message.panelWidth
      );
      // Post the computed heatmap state back to the main thread
      self.postMessage({ heatmapState });
    } else {
      // If data state hasn't been computed yet, send an error or null
      self.postMessage({ heatmapState: null, error: 'dataState not computed yet' });
    }
  }
});
