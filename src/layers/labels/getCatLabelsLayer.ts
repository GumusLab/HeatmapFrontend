// import { PolygonLayer } from '@deck.gl/layers/typed';
// import { CATEGORY_LAYER_HEIGHT, IDS } from '../../const';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { DataStateShape, HeatmapStateShape } from '../../types';

// interface CropBox {
//   startX: number;
//   startY: number;
//   endX: number;
//   endY: number;
// }

// export function getCatLabelsLayer(
//   dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   onClick: OnClickType,
//   cat: string,
//   yOffset: number,
//   labelsDimension: number,
//   debug?: boolean,
//   axis: string = "col",
//   filteredIdxDict?: CropBox | null, // Add filtering parameter
// ) {
//     type CellDatum = {
//         contour: number[][];
//         text: string|null;
//         color: string|null|undefined;
//     }

//     type Color = [number, number, number, number];

  
//   if (heatmapState?.cellData && dataState) {
//     const { numColumns, numRows } = dataState;
//     const { width: cellWidth, height: cellHeight } = heatmapState.cellDimensions;
//     const heatmapWidth = heatmapState.width
//     const heatmapHeight = heatmapState.height

//     // Hard coded //
//     const data: CellDatum[] = []; 
    
//     if (axis === "col") {
//       const offsetX = heatmapWidth/4;

//       // Determine the range of columns to process
//       const startCol = filteredIdxDict ? filteredIdxDict.startX : 0;
//       const endCol = filteredIdxDict ? filteredIdxDict.endX : numColumns - 1;

//       for (let i = startCol; i <= endCol && i < numColumns; i++) {
//         const ht = CATEGORY_LAYER_HEIGHT;
//         const catDict = dataState.colLabels[i].category;
//         const categoryText = catDict ? catDict[cat].split(":")[1] : null;

//         // Calculate shifted position - use the new column index relative to the start
//         const newColIndex = filteredIdxDict ? (i - filteredIdxDict.startX) : i;
//         const x1 = newColIndex * cellWidth - offsetX; // Use shifted index
        
//         data.push({
//           contour: [
//             [x1, -yOffset],                // Shifted x-coordinate
//             [x1, ht-yOffset],              // Shifted x-coordinate
//             [x1 + cellWidth, ht-yOffset],  // Shifted x-coordinate
//             [x1 + cellWidth, -yOffset],    // Shifted x-coordinate
//           ],
//           text: categoryText,
//           color: dataState.colLabels[i].categoryColor?.[cat],
//         });
//       }
//     }
//     else if (axis === "row") {
//       const offsetY = heatmapHeight/4;

//       // Determine the range of rows to process
//       const startRow = filteredIdxDict ? filteredIdxDict.startY : 0;
//       const endRow = filteredIdxDict ? filteredIdxDict.endY : numRows - 1;

//       for (let i = startRow; i <= endRow && i < numRows; i++) {
//         const ht = CATEGORY_LAYER_HEIGHT;
//         const xOffset = yOffset;
//         const catDict = dataState.rowLabels[i].category;
//         const categoryText = catDict ? catDict[cat].split(":")[1] : null;
        
//         // Calculate shifted position - use the new row index relative to the start
//         const newRowIndex = filteredIdxDict ? (i - filteredIdxDict.startY) : i;
//         const y1 = newRowIndex * cellHeight - offsetY; // Use shifted index
        
//         data.push({
//           contour:[
//                 [-xOffset, y1],
//                 [-xOffset, y1 + cellHeight],
//                 [-xOffset + ht, y1 + cellHeight],
//                 [-xOffset + ht, y1],
//           ],
//           text: categoryText,
//           color: dataState.rowLabels[i].categoryColor?.[cat],
//         });
//       }
//     }

//     const fillColor = (color:string|null|undefined) =>{
//       if(color){
//       const hex = color.replace("#", "");
//       const red = parseInt(hex.substring(0, 2), 16);
//       const green = parseInt(hex.substring(2, 4), 16);
//       const blue = parseInt(hex.substring(4, 6), 16);
//       return [red,green,blue, 255] as Color
//       }
//       else{
//         return [196, 164, 132, 255] as Color
//       }
//     }

//     const id = `${axis}_${cat}:cat`;

//     return new PolygonLayer({
//       id,
//       viewId: axis === "col" ? IDS.VIEWS.COL_LABELS:IDS.VIEWS.ROW_LABELS,
//       data: data,
//       pickable: true,
//       filled: true,
//       wireframe: debug,
//       getLineColor: [255, 255, 255],    
//       getLineWidth: 0.25,
//       getPolygon: (d) => d.contour,
//       getFillColor: (d) => fillColor(d.color),
//       onClick,
//       autoHighlight: true,
//       transitions: {
//         getFillColor: {
//           type: 'interpolation',
//           duration: 2000,
//           easing: (t: number) => t,
//         },
//       },
//       updateTriggers: {
//         data: [
//           axis === "col" ? dataState.colLabels : dataState.rowLabels,
//           filteredIdxDict // Add filteredIdxDict to trigger updates when filtering changes
//         ],
//       },
//     });
//   }
//   return null;
// }

import { PolygonLayer } from '@deck.gl/layers/typed';
import { CATEGORY_LAYER_HEIGHT, IDS } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape } from '../../types';

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Helper to convert hex color string to an RGBA array.
function hexToRgb(hex: string | null | undefined): [number, number, number, number] {
  if (!hex) {
    return [196, 164, 132, 255]; // Default color if none provided
  }
  const sanitizedHex = hex.startsWith('#') ? hex.substring(1) : hex;
  const red = parseInt(sanitizedHex.substring(0, 2), 16);
  const green = parseInt(sanitizedHex.substring(2, 4), 16);
  const blue = parseInt(sanitizedHex.substring(4, 6), 16);
  return [red, green, blue, 255];
}

/**
 * Creates a highly optimized PolygonLayer for category labels.
 *
 * This function uses the "Accessor Pattern" to avoid creating new data arrays
 * on each render, which significantly reduces memory pressure and CPU load.
 * The logic for filtering and positioning is handled inside the layer's
 * accessors, leveraging Deck.gl's internal optimizations.
 *
 * @returns A PolygonLayer instance or null if data is not ready.
 */
export function getCatLabelsLayer(
  dataState: DataStateShape,
  heatmapState: HeatmapStateShape | null,
  onClick: OnClickType,
  cat: string,
  yOffset: number,
  labelsDimension: number,
  debug?: boolean,
  axis: string = "col",
  filteredIdxDict?: CropBox | null,
) {
  // Guard clause to ensure all necessary data is available.
  if (!heatmapState?.cellData || !dataState) {
    return null;
  }

  // --- Pre-calculate constants ---
  const { width: cellWidth, height: cellHeight } = heatmapState.cellDimensions;
  const heatmapWidth = heatmapState.width;
  const heatmapHeight = heatmapState.height;

  // --- Core Optimization ---

  // 1. Get the original, stable source data array.
  const sourceLabels = axis === 'col' ? dataState.colLabels : dataState.rowLabels;
  const numSourceLabels = sourceLabels.length;

  // 2. Create a lightweight data descriptor object for Deck.gl.
  const dataDescriptor = {
    length: numSourceLabels
  };
  
  // 3. Define helper functions for use inside the accessors.
  const shouldRenderLabel = (index: number) => {
    if (!filteredIdxDict) return true;
    if (axis === 'col') {
      return index >= filteredIdxDict.startX && index <= filteredIdxDict.endX;
    } else { // 'row'
      return index >= filteredIdxDict.startY && index <= filteredIdxDict.endY;
    }
  };

  const getAdjustedPositionIndex = (index: number) => {
    if (filteredIdxDict) {
      return axis === 'col' ? index - filteredIdxDict.startX : index - filteredIdxDict.startY;
    }
    return index;
  };
  
  return new PolygonLayer({
    id: `${axis}_${cat}:cat`,
    viewId: axis === "col" ? IDS.VIEWS.COL_LABELS : IDS.VIEWS.ROW_LABELS,
    data: dataDescriptor,

    // --- Optimized Accessors ---
    
    getPolygon: (_: any, { index }: { index: number }) => {
      if (!shouldRenderLabel(index)) {
        return null; // Return null for filtered-out items so they aren't rendered.
      }
      
      const adjustedIndex = getAdjustedPositionIndex(index);

      if (axis === 'col') {
        const offsetX = heatmapWidth / 4;
        const x1 = adjustedIndex * cellWidth - offsetX;
        const ht = CATEGORY_LAYER_HEIGHT;
        return [
          [x1, -yOffset],
          [x1, ht - yOffset],
          [x1 + cellWidth, ht - yOffset],
          [x1 + cellWidth, -yOffset],
        ];
      } else { // axis === 'row'
        const offsetY = heatmapHeight / 4;
        const y1 = adjustedIndex * cellHeight - offsetY;
        const ht = CATEGORY_LAYER_HEIGHT;
        const xOffset = yOffset; // The 'yOffset' prop is used as xOffset for rows
        return [
          [-xOffset, y1],
          [-xOffset, y1 + cellHeight],
          [-xOffset + ht, y1 + cellHeight],
          [-xOffset + ht, y1],
        ];
      }
    },

    getFillColor: (_: any, { index }: { index: number }) => {
      const labelItem = sourceLabels[index];
      if (!labelItem || !shouldRenderLabel(index)) {
        return [0, 0, 0, 0]; // Transparent if hidden
      }
      const colorString = labelItem.categoryColor?.[cat];
      return hexToRgb(colorString);
    },
  //   onHover: (info, _) => {
  //     const { index } = info;
  //     if (index === -1) return;

  //     const cellIndex = dataObject.indices[index];
  //     const rowIndex = cellData.rowIndices[cellIndex];
  //     const colIndex = cellData.colIndices[cellIndex];
      
  //     // For detailed cells, provide specific row/col info
  //     info.object = {
  //         row: rowLabels[rowIndex],
  //         col: colLabels[colIndex],
  //         value: cellData.values[cellIndex],
  //         aggregated: false,
  //     };
  // },
  onHover: (info: any) => {
    const { index } = info;
    if (index === -1 || !shouldRenderLabel(index))
  {
      return;
    }

    const labelItem = sourceLabels[index];
    if (!labelItem) {
      return;
    }

    // Get the category value for this label
    const categoryValue =
  labelItem.category?.[cat];

    // Create hover object with category 
    info.object = {
      categoryName: cat,
      text: categoryValue.split(":")[1],
      axis: axis,
      labelText: labelItem.text,
      type: 'category'
    };
  },
  

    // --- Static & Other Properties ---
    pickable: true,
    filled: true,
    wireframe: debug,
    getLineColor: [255, 255, 255],
    getLineWidth: 0.25,
    onClick,
    autoHighlight: true,

    // --- Critical Update Triggers ---
    updateTriggers: {
      getPolygon: [cellWidth, cellHeight, heatmapWidth, heatmapHeight, yOffset, filteredIdxDict],
      getFillColor: [sourceLabels, cat, filteredIdxDict],
    },
  });
}
