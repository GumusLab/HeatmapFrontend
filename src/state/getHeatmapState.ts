// import clamp from 'lodash/clamp';
// import { getColorRange } from '../layers/heatmapGrid/getColorRange';
// import { CellDatum, DataStateShape } from '../types';
// import { HEATMAP_HEIGHT, HEATMAP_WIDTH } from '../const';

// const getColorFromRange = (
//   value: number,
//   posColorRange: [number, number, number, number][],
//   negColorRange: [number, number, number, number][],
//   min: number,
//   max: number
// ): [number, number, number, number] => {
//   // This function is safe as long as we don't pass NaN to it.
//   if (value >= 0) {
//     const index = clamp(Math.floor((value / max) * posColorRange.length), 0, posColorRange.length - 1);
//     return posColorRange[index];
//   }
//   const index = clamp(Math.floor((value / min) * negColorRange.length), 0, negColorRange.length - 1);
//   return negColorRange[index];
// };
// let cachedColors: Uint8ClampedArray | null = null;

// export const getHeatmapState = (
//   dataState: DataStateShape | null,
//   colLabelsWidth: number,
//   rowLabelsWidth: number,
//   dimensions: [number, number] | null,
//   ID: string,
//   panelWidth: number
// ) => {
//   if (!dataState || !dimensions) return null;

//   const { values, numColumns, numRows, colLabels, rowLabels, min, max } = dataState;
//   if (!values.length || numColumns <= 0 || numRows <= 0) return null;

//   const cellWidth = 10;
//   const cellHeight = 10;
//   const totalCells = numColumns * numRows;

//   if (!cachedColors || cachedColors.length !== totalCells * 4) {
//     cachedColors = new Uint8ClampedArray(totalCells * 4);
//   } else {
//     cachedColors.fill(0);
//   }

//   const posColorRange = getColorRange(0, 1);
//   const negColorRange = getColorRange(min, 1);
//   // Define a specific color for NaN (missing) values
//   const nanColor: [number, number, number, number] = [200, 200, 200, 255]; // A light gray

//   const contourData = new Float32Array(totalCells * 2);
//   const rowIndices = new Int32Array(totalCells);
//   const colIndices = new Int32Array(totalCells);
//   const valuesArray = new Float32Array(totalCells);

//   let contourIndex = 0;
//   const heatmapWidth = (dimensions[0] - panelWidth) * HEATMAP_WIDTH / 100 - rowLabelsWidth;
//   const heatmapHeight = dimensions[1] * HEATMAP_HEIGHT / 100 - colLabelsWidth;
//   const offsetX = heatmapWidth / 4;
//   const offsetY = heatmapHeight / 4;

//   let index = 0;
//   for (let j = 0; j < numRows; j++) {
//     const y1 = (j * cellHeight) - offsetY;
//     for (let i = 0; i < numColumns; i++) {
//       const x1 = (i * cellWidth) - offsetX;
//       const rawVal = values[numColumns * j + i];

//       let val: number;
//       let color: [number, number, number, number];

//       // *** THIS IS THE CRITICAL CHANGE ***
//       // Check if the value is NaN before processing
//       if (isNaN(rawVal)) {
//         val = NaN;
//         color = nanColor; // Use the specific gray color for missing data
//       } else {
//         // If it's a valid number, process it as before
//         val = parseFloat(rawVal.toFixed(2));
//         color = getColorFromRange(val, posColorRange, negColorRange, min, max);
//       }
      
//       cachedColors.set(color, index * 4);

//       // Populate contourData and other arrays
//       contourData[contourIndex++] = x1;
//       contourData[contourIndex++] = y1;
//       rowIndices[index] = j;
//       colIndices[index] = i;
//       valuesArray[index] = val; // Store the (potentially NaN) value

//       index++;
//     }
//   }

//   return {
//     cellData: {
//       rowIndices,
//       colIndices,
//       values: valuesArray,
//     },
//     rowLabels: rowLabels.map(l => l.text),
//     colLabels: colLabels.map(l => l.text),
//     cellDimensions: { width: cellWidth, height: cellHeight },
//     colors: cachedColors,
//     contourData,
//     width: heatmapWidth,
//     height: heatmapHeight
//   };
// };





import clamp from 'lodash/clamp';
import { getColorRange } from '../layers/heatmapGrid/getColorRange';
import { DataStateShape } from '../types';
import { HEATMAP_HEIGHT, HEATMAP_WIDTH } from '../const';

const getColorFromRange = (
  value: number,
  posColorRange: [number, number, number, number][],
  negColorRange: [number, number, number, number][],
  min: number,
  max: number
): [number, number, number, number] => {
  if (value >= 0) {
    const index = clamp(Math.floor((value / max) * posColorRange.length), 0, posColorRange.length - 1);
    return posColorRange[index];
  }
  const index = clamp(Math.floor((value / min) * negColorRange.length), 0, negColorRange.length - 1);
  return negColorRange[index];
};

let cachedColors: Uint8ClampedArray | null = null;

export const getHeatmapState = (
  dataState: DataStateShape | null,
  colLabelsWidth: number,
  rowLabelsWidth: number,
  dimensions: [number, number] | null,
  ID: string,
  panelWidth: number
) => {
  if (!dataState || !dimensions) return null;

  const { values, numColumns, numRows, colLabels, rowLabels, min, max } = dataState;
  if (!values.length || numColumns <= 0 || numRows <= 0) return null;

  const cellWidth = 10;
  const cellHeight = 10;
  const totalCells = numColumns * numRows;

  // --- Efficiently manage cached typed arrays ---
  if (!cachedColors || cachedColors.length !== totalCells * 4) {
    cachedColors = new Uint8ClampedArray(totalCells * 4);
  } else {
    cachedColors.fill(0);
  }

  const posColorRange = getColorRange(0, 1);
  const negColorRange = getColorRange(min, 1);
  const nanColor: [number, number, number, number] = [200, 200, 200, 255]; // Light gray

  // --- OPTIMIZATION: Removed contourData ---
  // const contourData = new Float32Array(totalCells * 2);

  // These are the only typed arrays we need
  const rowIndices = new Int32Array(totalCells);
  const colIndices = new Int32Array(totalCells);
  // const valuesArray = new Float32Array(totalCells);

  const heatmapWidth = (dimensions[0] - panelWidth) * HEATMAP_WIDTH / 100 - rowLabelsWidth;
  const heatmapHeight = dimensions[1] * HEATMAP_HEIGHT / 100 - colLabelsWidth;

  // let index = 0;
  // for (let j = 0; j < numRows; j++) {
  //   for (let i = 0; i < numColumns; i++) {
  //     const rawVal = values[numColumns * j + i];

  //     let val: number;
  //     let color: [number, number, number, number];

  //     if (isNaN(rawVal)) {
  //       val = NaN;
  //       color = nanColor;
  //     } else {
  //       val = parseFloat(rawVal.toFixed(2));
  //       color = getColorFromRange(val, posColorRange, negColorRange, min, max);
  //     }
      
  //     cachedColors.set(color, index * 4);

  //     // Populate only the necessary data arrays
  //     rowIndices[index] = j;
  //     colIndices[index] = i;
  //     valuesArray[index] = val;

  //     index++;
  //   }
  // }

  let index = 0;
for (let j = 0; j < numRows; j++) {
  for (let i = 0; i < numColumns; i++) {
    const rawVal = values[numColumns * j + i];

    let color: [number, number, number, number];

    if (isNaN(rawVal)) {
      color = nanColor;
    } else {
      const val = parseFloat(rawVal.toFixed(2));
      color = getColorFromRange(val, posColorRange, negColorRange, min, max);
    }
    
    cachedColors.set(color, index * 4);

    // Populate only the necessary index arrays
    rowIndices[index] = j;
    colIndices[index] = i;
    // REMOVED: valuesArray[index] = val; - we'll reuse dataState.values!

    index++;
  }
}

  // --- OPTIMIZATION: Return object is now much smaller ---
  return {
    cellData: {
      rowIndices,
      colIndices,
      // values: valuesArray,
      values: dataState.values, // ← REUSE the original values array!

    },
    rowLabels: rowLabels.map(l => l.text),
    colLabels: colLabels.map(l => l.text),
    cellDimensions: { width: cellWidth, height: cellHeight },
    colors: cachedColors,
    // contourData is no longer returned
    width: heatmapWidth,
    height: heatmapHeight
  };
};


















