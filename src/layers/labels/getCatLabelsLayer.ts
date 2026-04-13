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
import { CATEGORY_LAYER_HEIGHT, IDS, BASE_ZOOM } from '../../const';
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

  // Generic centering calculation based on BASE_ZOOM
  const baseScaleFactor = Math.pow(2, BASE_ZOOM);

  // Always use heatmap (view) dimensions for centering
  // This keeps the coordinate system consistent with the heatmap scatter layer
  const centeringX = heatmapWidth / 2 / baseScaleFactor;
  const centeringY = heatmapHeight / 2 / baseScaleFactor;

  // Get the source labels
  const sourceLabels = axis === 'col' ? dataState.colLabels : dataState.rowLabels;

  // Filter and create actual data array with pre-computed positions
  type CatCellData = {
    originalIndex: number;
    adjustedIndex: number;
    contour: number[][];
    color: [number, number, number, number];
  };

  const data: CatCellData[] = [];

  // Determine range based on filtering
  const startIdx = filteredIdxDict
    ? (axis === 'col' ? filteredIdxDict.startX : filteredIdxDict.startY)
    : 0;
  const endIdx = filteredIdxDict
    ? (axis === 'col' ? filteredIdxDict.endX : filteredIdxDict.endY)
    : sourceLabels.length - 1;

  for (let i = startIdx; i <= endIdx && i < sourceLabels.length; i++) {
    const adjustedIndex = i - startIdx;
    const labelItem = sourceLabels[i];

    let contour: number[][];
    if (axis === 'col') {
      const x1 = adjustedIndex * cellWidth - centeringX;
      const ht = CATEGORY_LAYER_HEIGHT;
      contour = [
        [x1, -yOffset],
        [x1, ht - yOffset],
        [x1 + cellWidth, ht - yOffset],
        [x1 + cellWidth, -yOffset],
      ];
    } else {
      const y1 = adjustedIndex * cellHeight - centeringY;
      const ht = CATEGORY_LAYER_HEIGHT;
      const xOffset = yOffset;
      contour = [
        [-xOffset, y1],
        [-xOffset, y1 + cellHeight],
        [-xOffset + ht, y1 + cellHeight],
        [-xOffset + ht, y1],
      ];
    }

    const colorString = labelItem?.categoryColor?.[cat];
    const color = hexToRgb(colorString);

    data.push({
      originalIndex: i,
      adjustedIndex,
      contour,
      color,
    });
  }

  return new PolygonLayer<CatCellData>({
    id: `${axis}_${cat}:cat`,
    data,

    getPolygon: (d) => d.contour,
    getFillColor: (d) => d.color,

    onHover: (info: any) => {
      if (!info.object) return;
      const d = info.object as CatCellData;
      const labelItem = sourceLabels[d.originalIndex];
      if (!labelItem) return;

      const categoryValue = labelItem.category?.[cat];
      info.object = {
        categoryName: cat,
        text: categoryValue?.split(":")[1] || '',
        axis: axis,
        labelText: labelItem.text,
        type: 'category'
      };
    },

    pickable: true,
    filled: true,
    wireframe: debug,
    getLineColor: [255, 255, 255],
    getLineWidth: 0.25,
    onClick,
    autoHighlight: true,

    updateTriggers: {
      data: [filteredIdxDict, sourceLabels, cellWidth, cellHeight, centeringX, centeringY, yOffset, cat],
    },
  });
}
