// data-worker.ts

import { computeDataState } from '../computeDatastate'; // This function contains the logic from useDataState without hooks
import { getHeatmapState } from '../state/getHeatmapState'; // Your heatmap state computation function
import { DataStateShape } from '../types';

// Global state stored between messages
let currentDataState: DataStateShape | null = null;
// Cache the last heatmapState params so we can recompute heatmapState when dataState changes
let lastHeatmapParams: {
  colLabelsWidth: number;
  rowLabelsWidth: number;
  dimensions: any;
  ID: any;
  panelWidth: number;
} | null = null;

self.addEventListener('message', (event: MessageEvent) => {
  const message = event.data;

  if (message.messageType === 'dataState') {
    // Compute the data state based on the incoming JSON data, order, categories
    // croppedRowIndices/croppedColIndices: Arrays of ORIGINAL indices to include (for crop)
    currentDataState = computeDataState(
      message.data,
      message.order,
      message.catTemporary,
      message.croppedRowIndices,  // Original indices from visual selection
      message.croppedColIndices   // Original indices from visual selection
    );

    // Also recompute heatmapState if we have cached dimension params.
    // This ensures both states are sent together — preventing a blank frame where
    // the main thread has new dataState but stale heatmapState (old colors/values).
    if (lastHeatmapParams) {
      const heatmapState = getHeatmapState(
        currentDataState,
        lastHeatmapParams.colLabelsWidth,
        lastHeatmapParams.rowLabelsWidth,
        lastHeatmapParams.dimensions,
        lastHeatmapParams.ID,
        lastHeatmapParams.panelWidth
      );
      self.postMessage({ dataState: currentDataState, heatmapState });
    } else {
      self.postMessage({ dataState: currentDataState });
    }
  } else if (message.messageType === 'heatmapState') {
    // Cache the dimension params for future dataState recomputes
    lastHeatmapParams = {
      colLabelsWidth: message.colLabelsWidth,
      rowLabelsWidth: message.rowLabelsWidth,
      dimensions: message.dimensions,
      ID: message.ID,
      panelWidth: message.panelWidth,
    };

    if (currentDataState) {
      const heatmapState = getHeatmapState(
        currentDataState,
        message.colLabelsWidth,
        message.rowLabelsWidth,
        message.dimensions,
        message.ID,
        message.panelWidth
      );
      self.postMessage({ heatmapState });
    } else {
      self.postMessage({ heatmapState: null, error: 'dataState not computed yet' });
    }
  }
});
