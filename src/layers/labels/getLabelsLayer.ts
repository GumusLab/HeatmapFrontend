// import { TextLayer } from '@deck.gl/layers/typed';
// import {
//   BASE_ZOOM,
//   CELL_TO_LABEL_SIZE_PROPORTION,
//   DEFAULT_LABEL_MAX_SIZE,
//   DEFAULT_LABEL_OFFSET,
//   IDS,
//   LABEL_SCALE,
//   MIN_LABEL_CHARS,
//   CATEGORY_LAYER_HEIGHT,
//   INITIAL_GAP,
//   LAYER_GAP,
//   DEFAULT_LABEL_GAP
// } from '../../const';
// import type { LabelProps } from './labels.types';

// import { maybeTruncateLabel } from './maybeTruncateLabel';
// import { useState } from 'react';
// import { hover } from '@testing-library/user-event/dist/hover';

// interface CropBox {
//   startX: number;
//   startY: number;
//   endX: number;
//   endY: number;
// }

// export function getLabelsLayer({
//   axis,
//   title,
//   dataState,
//   viewStates,
//   heatmapState,
//   onClick,
//   labelsConfig,
//   labelSpace,
//   searchTerm,
//   order,
//   categories,
//   filteredIdxDict, // Add this parameter
// }: LabelProps & { 
//   axis: 'row' | 'column';
// }) {

//   if (heatmapState) {
//     const { width: cellWidth, height: cellHeight } =
//       heatmapState.cellDimensions;
//     const heatmapHeight = heatmapState.height;

//     const cellSize = axis === 'row' ? cellHeight : cellWidth;

//     const viewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
//     const zoom = viewState.zoom as number;

//     let offset = labelsConfig?.offset
//       ? labelsConfig.offset
//       : DEFAULT_LABEL_OFFSET - 5;
//     let totalGap = 0

//     if(axis === "row"){
//       if(order.rowCat.length > 0) {
//         totalGap += order.rowCat.length*(CATEGORY_LAYER_HEIGHT + LAYER_GAP) + INITIAL_GAP
//       }
//       if(order.row === "cluster"){
//         totalGap += 5 + INITIAL_GAP
//       }
//     }
//     offset = -labelSpace/4 + totalGap + DEFAULT_LABEL_GAP

//     const sizeMaxPixels = labelsConfig?.maxSize || DEFAULT_LABEL_MAX_SIZE;

//     let scale: number;

//     // BASE_ZOOM is 1, so we'll normalize around that
//     const normalizedZoom = zoom - BASE_ZOOM; // This makes zoom=1 the "normal" size point

//     // Use exponential scaling that matches deck.gl's internal scaling
//     scale = LABEL_SCALE * Math.pow(2, normalizedZoom);

//     // Add constraints to prevent extreme sizes at zoom boundaries
//     const minScale = LABEL_SCALE * 0.125; // 1/8th of base size
//     const maxScale = LABEL_SCALE * 8;     // 8x base size
//     scale = Math.min(Math.max(scale, minScale), maxScale);

//     // Updated getPosition function with position shifting
//     const getPosition = (d: any, {index}: {index: number}) => {
//       // Calculate shifted position for filtered labels
//       let adjustedPosition = d.position;
      
//       if (filteredIdxDict) {
//         // For filtered data, the index in the filtered array corresponds to the shifted position
//         // The filtered data already has sequential indices starting from 0
//         adjustedPosition = index;
//       }

//       const rowPosition = [-offset, adjustedPosition * cellHeight + 0.5*cellHeight - heatmapHeight/4];

//       let rowOffset: number = 0;
//       if (axis === 'row') {
//         if (order.row === 'cluster') {
//           rowOffset -= 5;
//         }
//         if (order.rowCat.length > 0) {
//           for (let i = 0; i < order.rowCat.length; i++) {
//             rowOffset -= 5;
//           }
//         }
//       }
      
//       return (axis === 'row' ? [rowPosition[0] + rowOffset, rowPosition[1]] : rowPosition.reverse()) as [number, number];
//     };

//     // Filter the labels data based on filteredIdxDict and add shifted positions
//     const getFilteredLabelsData = () => {
//       const labelsData = axis === 'row' ? dataState.rowLabels : dataState.colLabels;
      
//       if (!filteredIdxDict) {
//         return labelsData; // No filtering, return all labels
//       }

//       // Filter labels based on the crop box and add shifted position
//       const filtered = labelsData.filter((label, index) => {
//         if (axis === 'row') {
//           // For row labels, check if the row index is within the Y bounds
//           return index >= filteredIdxDict.startY && index <= filteredIdxDict.endY;
//         } else {
//           // For column labels, check if the column index is within the X bounds
//           return index >= filteredIdxDict.startX && index <= filteredIdxDict.endX;
//         }
//       });

//       // Map the filtered labels to have shifted positions
//       return filtered.map((label, newIndex) => ({
//         ...label,
//         position: newIndex // Set the new position starting from 0
//       }));
//     };

//     const filteredLabelsData = getFilteredLabelsData();

//     return [
//       new TextLayer({
//         id: axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS,
//         data: filteredLabelsData, // Use filtered data with shifted positions
//         fontFamily:'Arial, sans-serif',
//         getPosition: getPosition, // Updated position function
//         background: true,

//         getAngle: labelsConfig?.angle
//           ? labelsConfig.angle
//           : axis === 'row'
//           ? 0
//           : 90,
//         getText: (d: any) => {
//           if (axis === 'column' && Object.keys(categories.col).length > 0) return ""
//           if (!labelSpace) return d.text;          
//           const maxChars =
//             labelsConfig?.maxChars && labelsConfig?.maxChars > 0
//               ? labelsConfig.maxChars
//               : MIN_LABEL_CHARS;
//           return maybeTruncateLabel(d.text, Math.max(0, maxChars));
//         },
//         getColor: [0,0,0],
//         getBackgroundColor: (d) => d.text.trim() === searchTerm?.trim() ? [255, 255, 0,255]:[255,255,255,255],

//         sizeUnits: 'meters',
//         getTextAnchor: axis === 'row' ? 'end' : 'start',
//         sizeMaxPixels: cellSize,
//         sizeScale: scale,
//         pickable: true,
//         onClick,
//         transitions: {
//           getPosition: {
//             type: 'interpolation',
//             duration: 2000,
//             easing: (t: any) => {
//               return t*t
//             },
//             delay: 1000,
//           },
//           getSize: {
//               type: 'interpolation',
//               duration: 200,
//               easing: (t: any) => t * (2 - t), // Ease-out effect
//             },
//         },
//         updateTriggers: {
//           getPosition: [sizeMaxPixels, cellSize, offset, order, heatmapHeight, filteredIdxDict],
//           data: [filteredLabelsData, filteredIdxDict], // Add filteredIdxDict to trigger updates
//           getSize: [cellSize, scale],
//           sizeScale: [scale],
//           sizeMaxPixels: [sizeMaxPixels],
//           getAngle: [labelsConfig],
//           getColor: [searchTerm],
//           getBackgroundColor: [searchTerm],
//         },
//       }),
//       ...(title
//         ? [
//             new TextLayer({
//               id: `${
//                 axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS
//               }-title`,
//               sizeUnits: 'meters',
//               data: [{ title }],
//               getText: (d) => d.title,
//               getPosition: () => {
//                 // Adjust title position based on filtered data size
//                 const numCols = filteredIdxDict 
//                   ? (filteredIdxDict.endX - filteredIdxDict.startX + 1)
//                   : dataState.numColumns;
//                 const numRows = filteredIdxDict 
//                   ? (filteredIdxDict.endY - filteredIdxDict.startY + 1)
//                   : dataState.numRows;

//                 const colPosition = [
//                   viewState.target[0] +
//                     (numCols * cellWidth) /
//                       2 /
//                       2 ** ((viewState.zoom as number) - 1),
//                   -(labelSpace / 4),
//                 ];
//                 const rowPosition = [
//                   -(labelSpace / 4),
//                   viewState.target[1] +
//                     (numRows * cellHeight) /
//                       2 /
//                       2 ** ((viewState.zoom as number) - 1),
//                 ];
//                 return (axis === 'row' ? rowPosition : colPosition) as [
//                   number,
//                   number
//                 ];
//               },

//               getTextAnchor: 'middle',
//               getAlignmentBaseline: 'center',
//               getColor: [0,0,0],
//               getSize:
//                 scale < 2
//                   ? labelsConfig?.titleSize || DEFAULT_LABEL_MAX_SIZE
//                   : 0,
//               getAngle: axis === 'row' ? 90 : 45,
//               updateTriggers: {
//                 getSize: [scale],
//                 getPosition: [
//                   dataState.numColumns,
//                   dataState.numRows,
//                   cellWidth,
//                   cellHeight,
//                   viewState.zoom,
//                   labelSpace,
//                   viewState.target,
//                   filteredIdxDict, // Add to trigger title repositioning
//                 ],
//               },
//             }),
//           ]
//         : []),
//     ];
//   }
//   return null;
// }

import { TextLayer } from '@deck.gl/layers/typed';
import {
  BASE_ZOOM,
  DEFAULT_LABEL_MAX_SIZE,
  DEFAULT_LABEL_OFFSET,
  IDS,
  LABEL_SCALE,
  MIN_LABEL_CHARS,
  CATEGORY_LAYER_HEIGHT,
  CLUSTER_LAYER_HEIGHT,
  CLUSTER_LAYER_GAP,
  INITIAL_GAP,
  LAYER_GAP,
  DEFAULT_LABEL_GAP
} from '../../const';
import type { LabelProps } from './labels.types';
import { maybeTruncateLabel } from './maybeTruncateLabel';

/**
 * Creates a highly optimized TextLayer for row or column labels.
 *
 * This function uses the "Accessor Pattern" to avoid creating new data arrays
 * on each render, which significantly reduces memory pressure and CPU load.
 * The logic for filtering and positioning is handled inside the layer's
 * accessors, leveraging Deck.gl's internal optimizations.
 *
 * @param props - The properties for the label layer.
 * @returns An array containing the main TextLayer and an optional title TextLayer.
 */
export function getLabelsLayer({
  axis,
  title,
  dataState,
  viewStates,
  heatmapState,
  onClick,
  labelsConfig,
  labelSpace,
  searchTerm,
  order,
  categories,
  filteredIdxDict,
}: LabelProps & {
  axis: 'row' | 'column';
}) {
  // Guard clause to ensure all necessary data is available.
  if (!heatmapState || !dataState) {
    return null;
  }

  // --- Pre-calculate constants and scaling factors ---
  // This logic runs on the CPU but is lightweight.
  const { width: cellWidth, height: cellHeight } = heatmapState.cellDimensions;
  const heatmapHeight = heatmapState.height;
  const heatmapWidth = heatmapState.width;
  const cellSize = axis === 'row' ? cellHeight : cellWidth;
  const viewState = viewStates[IDS.VIEWS.HEATMAP_GRID];

  // A null check for viewState, as it might not be ready on the first render.
  if (!viewState) {
    return null;
  }
  const zoom = viewState.zoom as number;

  // Generic centering calculation based on BASE_ZOOM
  const baseScaleFactor = Math.pow(2, BASE_ZOOM);
  const labelSpaceCentering = labelSpace / 2 / baseScaleFactor;

  // Always use heatmap (view) dimensions for centering
  // This keeps the coordinate system consistent with the heatmap scatter layer
  const centeringX = heatmapWidth / 2 / baseScaleFactor;
  const centeringY = heatmapHeight / 2 / baseScaleFactor;

  let offset = labelsConfig?.offset ? labelsConfig.offset : DEFAULT_LABEL_OFFSET - 5;
  let totalGap = 0;

  if (axis === "row") {
    // Add gap for row category layers
    if (order.rowCat.length > 0) {
      totalGap += order.rowCat.length * (CATEGORY_LAYER_HEIGHT + LAYER_GAP) + INITIAL_GAP;
    }
    // Add gap for row cluster layer
    if (order.row === "cluster") {
      totalGap += CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP + INITIAL_GAP;
    }
  } else {
    // Column axis
    // Add gap for column category layers
    if (order.colCat.length > 0) {
      totalGap += order.colCat.length * (CATEGORY_LAYER_HEIGHT + LAYER_GAP) + INITIAL_GAP;
    }
    // Add gap for column cluster layer
    if (order.col === "cluster") {
      totalGap += CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP + INITIAL_GAP;
    }
  }
  offset = -labelSpaceCentering + totalGap + DEFAULT_LABEL_GAP;

  const sizeMaxPixels = labelsConfig?.maxSize || DEFAULT_LABEL_MAX_SIZE;
  const normalizedZoom = zoom - BASE_ZOOM;
  let scale = LABEL_SCALE * Math.pow(2, normalizedZoom);
  const minScale = LABEL_SCALE * 0.125; // Prevent labels from becoming too small
  const maxScale = LABEL_SCALE * 8;     // Prevent labels from becoming too large
  scale = Math.min(Math.max(scale, minScale), maxScale);

  // Determine if aggregation is happening (same logic as getHeatmapGridLayerScatter.ts)
  // Aggregation starts when zoom < BASE_ZOOM (i.e., zoom < 0)
  const isAggregated = zoom < BASE_ZOOM;

  // --- Core Optimization ---

  // 1. Get the original, stable source data array.
  const sourceLabels = axis === 'row' ? dataState.rowLabels : dataState.colLabels;
  const numSourceLabels = sourceLabels.length;

  // 2. Create a lightweight data descriptor object for Deck.gl.
  //    This is memory-efficient as it doesn't duplicate the source data.
  const dataDescriptor = {
    length: numSourceLabels
  };

  // 3. Define helper functions for use inside the accessors.
  //    This keeps the accessor logic clean.
  const shouldRenderLabel = (index: number) => {
    if (!filteredIdxDict) return true; // No filter, render all.
    if (axis === 'row') {
      return index >= filteredIdxDict.startY && index <= filteredIdxDict.endY;
    } else { // 'column'
      return index >= filteredIdxDict.startX && index <= filteredIdxDict.endX;
    }
  };

  const getAdjustedPositionIndex = (index: number) => {
    if (filteredIdxDict) {
      // If filtered, the position is relative to the start of the cropped area.
      return axis === 'row' ? index - filteredIdxDict.startY : index - filteredIdxDict.startX;
    }
    return index; // Otherwise, it's just the original index.
  };

  const mainLabelsLayer = new TextLayer({
    id: axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS,
    viewId: axis === 'row' ? IDS.VIEWS.ROW_LABELS : IDS.VIEWS.COL_LABELS,
    data: dataDescriptor,
    
    // --- Optimized Accessors ---
    // Deck.gl calls these functions for each item, passing the `index`.
    
    getPosition: (_: any, { index }: { index: number }) => {
      // If a label is filtered out, move it off-screen to hide it efficiently.
      if (!shouldRenderLabel(index)) {
        return [Infinity, Infinity];
      }

      const adjustedPosition = getAdjustedPositionIndex(index);

      if (axis === 'row') {
        // Row labels: x = offset from left edge, y = row position
        const x = -offset;
        const y = adjustedPosition * cellHeight + 0.5 * cellHeight - centeringY;
        return [x, y] as [number, number];
      } else {
        // Column labels: x = column position, y = offset from top edge
        const x = adjustedPosition * cellWidth + 0.5 * cellWidth - centeringX;
        const y = -offset;
        return [x, y] as [number, number];
      }
    },

    getText: (_: any, { index }: { index: number }) => {
      const labelItem = sourceLabels[index];
      if (!labelItem || !shouldRenderLabel(index)) return '';

      // Hide labels when aggregation is happening (zoom < BASE_ZOOM)
      if (isAggregated) return "";

      // Hide labels when categories are selected or available in the data
      if (axis === 'row' && (order.rowCat.length > 0 || Object.keys(categories.row).length > 0)) return "";
      if (axis === 'column' && (order.colCat.length > 0 || Object.keys(categories.col).length > 0)) return "";

      if (!labelSpace) return labelItem.text;

      const maxChars = labelsConfig?.maxChars || MIN_LABEL_CHARS;
      return maybeTruncateLabel(labelItem.text, Math.max(0, maxChars));
    },

    getBackgroundColor: (_: any, { index }: { index: number }) => {
      const labelItem = sourceLabels[index];
      if (!labelItem || !shouldRenderLabel(index)) return [0, 0, 0, 0]; // Transparent if hidden

      const isSearched = searchTerm && labelItem.text.trim().toLowerCase() === searchTerm.trim().toLowerCase();
      return isSearched ? [255, 255, 0, 255] : [255, 255, 255, 255];
    },

    // --- Static & Other Properties ---
    getAngle: labelsConfig?.angle ? labelsConfig.angle : (axis === 'row' ? 0 : 90),
    getColor: [0, 0, 0],
    fontFamily: 'Arial, sans-serif',
    background: true,
    sizeUnits: 'meters',
    getTextAnchor: axis === 'row' ? 'end' : 'start',
    // Column labels are smaller to avoid overwhelming the view
    sizeMaxPixels: axis === 'row' ? cellSize : cellSize * 0.6,
    sizeScale: axis === 'row' ? scale : scale * 0.7,
    pickable: true,
    onClick,

    // --- Critical Update Triggers ---
    // These tell Deck.gl when to re-run the accessors. They point to the
    // actual data sources, not newly created arrays.
    updateTriggers: {
      getPosition: [offset, cellWidth, cellHeight, centeringX, centeringY, order, filteredIdxDict],
      getText: [sourceLabels, labelSpace, labelsConfig, categories, order.rowCat, order.colCat, filteredIdxDict, isAggregated],
      getBackgroundColor: [sourceLabels, searchTerm, filteredIdxDict],
      // sizeScale and sizeMaxPixels are derived from other props, so they
      // don't need to be in triggers if the props they depend on are.
    },
  });

  const titleLayer = title ? new TextLayer({
    id: `${axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS}-title`,
    sizeUnits: 'meters',
    data: [{ title }],
    getText: (d: any) => d.title,
    getPosition: () => {
        const numVisibleCols = filteredIdxDict ? (filteredIdxDict.endX - filteredIdxDict.startX + 1) : dataState.numColumns;
        const numVisibleRows = filteredIdxDict ? (filteredIdxDict.endY - filteredIdxDict.startY + 1) : dataState.numRows;

        // The title's position is centered on the visible area.
        const colPosition = [
            viewState.target[0] + (numVisibleCols * cellWidth) / 2 / (2 ** (zoom - BASE_ZOOM)),
            -labelSpaceCentering,
        ];
        const rowPosition = [
            -labelSpaceCentering,
            viewState.target[1] + (numVisibleRows * cellHeight) / 2 / (2 ** (zoom - BASE_ZOOM)),
        ];
        return (axis === 'row' ? rowPosition : colPosition) as [number, number];
    },
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    getColor: [0, 0, 0],
    getSize: scale < 2 ? (labelsConfig?.titleSize || DEFAULT_LABEL_MAX_SIZE) : 0,
    getAngle: axis === 'row' ? 90 : 45,
    updateTriggers: {
        getPosition: [dataState.numColumns, dataState.numRows, cellWidth, cellHeight, viewState.zoom, labelSpace, viewState.target, filteredIdxDict],
        getSize: [scale],
    },
  }) : null;

  return [mainLabelsLayer, titleLayer].filter(Boolean) as TextLayer[];
}
