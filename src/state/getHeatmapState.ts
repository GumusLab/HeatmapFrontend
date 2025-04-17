// import { range } from 'lodash';
// import { CellDatum, DataStateShape } from '../types';

// export const getHeatmapState = (
//   dataState: DataStateShape | null,
//   colLabelsWidth: number,
//   rowLabelsWidth: number,
//   dimensions: [number, number] | null,
//   ID: string,
// ) => {
//   if (dataState) {
//     const { values, numColumns, numRows,colLabels,rowLabels } = dataState;
//     if (values.length && dimensions) {
//       // Notes from deckgl docs
//       // 1 meter unit equals 1 common unit
//       // The conversion between common sizes and pixel sizes: 1 common unit equals
//       // 2 ** z pixel where z is the zoom of the current viewport.
//       // So to go from pixels (clientHeight, clientWidth) to meters we
//       // have to reverse the equation 1 cu = (2**z) * p
//       // p = (1 cu) / (2**z)
//       const cellWidth =
//         (dimensions[0] - rowLabelsWidth) / dataState.numColumns / 2;
//       const cellHeight =
//         (dimensions[1] - colLabelsWidth) / dataState.numRows / 2 ;

//       const newData: CellDatum[] = [];

//       range(numColumns).map((i) => {
//         range(numRows).map((j) => {
//           const firstAndLastPoint = [i * cellWidth, j * cellHeight];
//           newData.push({
//             contour: [
//               firstAndLastPoint,
//               [i * cellWidth, j * cellHeight + cellHeight],
//               [i * cellWidth + cellWidth, j * cellHeight + cellHeight],
//               [i * cellWidth + cellWidth, j * cellHeight],
//               firstAndLastPoint,
//             ],
//             value: ID.includes('cytof')? parseFloat(values[numColumns * j + i].toFixed(4)):parseFloat(values[numColumns * j + i].toFixed(2)),
//             row: rowLabels[j].text,
//             col: colLabels[i].text,
//             colCategory: colLabels[i].metadata?colLabels[i].metadata:null,
//           });
//         });
//       });

//       return {
//         cellData: newData,
//         cellDimensions: {
//           width: cellWidth,
//           height: cellHeight,
//         },
//       };
//     }
//     return null;
//   }
//   return null;
// };

import clamp from 'lodash/clamp';
import { getColorRange } from '../layers/heatmapGrid/getColorRange';
import { CellDatum, DataStateShape } from '../types';
import {HEATMAP_HEIGHT, HEATMAP_WIDTH} from "../const"

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

  // Reuse cachedColors
  if (!cachedColors || cachedColors.length !== totalCells * 4) {
    cachedColors = new Uint8ClampedArray(totalCells * 4);
  } else {
    cachedColors.fill(0);
  }

  const posColorRange = getColorRange(0, 1);
  const negColorRange = getColorRange(min, 1);

  // Optimized contour data storage
  const contourData = new Float32Array(totalCells * 2); // 2 floats per contour
   // Use typed arrays for efficient memory usage
   const rowIndices = new Int32Array(totalCells); // Store row indices
   const colIndices = new Int32Array(totalCells); // Store column indices
   const valuesArray = new Float32Array(totalCells); // Store numeric values
 
  let contourIndex = 0;

  // Use the original newData array, but only modify the contour data
  let newData: CellDatum[] | null = null;
  newData = new Array(totalCells);

    // Calculate heatmap dimensions (matching your view calculations)
  const heatmapWidth = (dimensions[0]-panelWidth)*HEATMAP_WIDTH/100 - rowLabelsWidth;
  const heatmapHeight = dimensions[1]*HEATMAP_HEIGHT/100 - colLabelsWidth;

  // Calculate offsets to center data in the heatmap view
  // Use heatmapWidth and heatmapHeight instead of totalDataWidth and totalDataHeight
  const offsetX = heatmapWidth/4 ;
  const offsetY = heatmapHeight/4 ;

  // const offsetX = heatmapWidth;
  // const offsetY = heatmapHeight;

  let index = 0;
  for (let j = 0; j < numRows; j++) {
    const y1 = (j * cellHeight) - offsetY;
    // const y2 = y1 + cellHeight;

    for (let i = 0; i < numColumns; i++) {
      const x1 = (i * cellWidth) - offsetX;
      // const x2 = x1 + cellWidth;
      const rawVal = values[numColumns * j + i];

      const val = ID.includes('cytof')
        ? parseFloat(rawVal.toFixed(2))
        : parseFloat(rawVal.toFixed(2));

      const color = getColorFromRange(val, posColorRange, negColorRange, min, max);
      cachedColors.set(color, index * 4);

      // Populate contourData
      contourData[contourIndex++] = x1;
      contourData[contourIndex++] = y1;

      // Populate typed arrays
      rowIndices[index] = j;  // Store row index
      colIndices[index] = i;  // Store col index
      valuesArray[index] = val;

      index++;
    }
  }

  return {
    cellData: {
      rowIndices,
      colIndices,
      values: valuesArray,
    },
    rowLabels: rowLabels.map(l => l.text), // Store separately for lookup
    colLabels: colLabels.map(l => l.text),
    cellDimensions: { width: cellWidth, height: cellHeight },
    colors: cachedColors,
    contourData,
    width:heatmapWidth,
    height:heatmapHeight
  };
};





























// ################## This was being used in the previouos version #####################


// import { CellDatum, DataStateShape } from '../types';

// export const getHeatmapState = (
//   dataState: DataStateShape | null,
//   colLabelsWidth: number,
//   rowLabelsWidth: number,
//   dimensions: [number, number] | null,
//   ID: string
// ) => {
//   // Early return if data is missing
//   if (!dataState || !dimensions) return null;

//   const { values, numColumns, numRows, colLabels, rowLabels } = dataState;
//   // If `values` is empty or dimensions are invalid, return null
//   if (!values.length || numColumns <= 0 || numRows <= 0) return null;

//    /** Constants for min cell size */
//    const MIN_CELL_WIDTH = 10;  // Minimum width for each heatmap cell (in pixels)
//    const MIN_CELL_HEIGHT = 10; // Minimum height for each heatmap cell (in pixels)

//   // Calculate cell dimensions
//   let cellWidth = (dimensions[0] - rowLabelsWidth) / numColumns / 2;
//   let cellHeight = (dimensions[1] - colLabelsWidth) / numRows / 2;

//   // Ensure cell width & height don't shrink below minimum values
//   // cellWidth = MIN_CELL_WIDTH
//   // cellHeight = MIN_CELL_HEIGHT

//   // Pre-allocate the array for all cells to avoid push overhead
//   const totalCells = numColumns * numRows;
//   const newData: CellDatum[] = new Array(totalCells);

//   let index = 0;
//   for (let j = 0; j < numRows; j++) {
//     // Precompute y coordinates
//     const y1 = j * cellHeight;
//     const y2 = y1 + cellHeight;

//     for (let i = 0; i < numColumns; i++) {
//       // Precompute x coordinates
//       const x1 = i * cellWidth;
//       const x2 = x1 + cellWidth;

//       // Read the raw float from the typed array
//       const rawVal = values[numColumns * j + i];
      
//       // If you need a specific decimal format:
//       const val = ID.includes('cytof')
//         ? parseFloat(rawVal.toFixed(4))
//         : parseFloat(rawVal.toFixed(2));

//       newData[index++] = {
//         contour: [
//           [x1, y1],
//           [x1, y2],
//           [x2, y2],
//           [x2, y1],
//           [x1, y1]
//         ],
//         value: val,
//         row: rowLabels[j].text,
//         col: colLabels[i].text,
//         colCategory: colLabels[i].metadata ?? null
//       };
//     }
//   }

//   return {
//     cellData: newData,
//     cellDimensions: {
//       width: cellWidth,
//       height: cellHeight
//     }
//   };
// };
