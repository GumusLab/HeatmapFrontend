// import { PolygonLayer } from '@deck.gl/layers/typed';
// import { IDS } from '../../const';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { HeatmapStateShape, DataStateShape } from '../../types';

// interface CropBox {
//   startX: number;
//   startY: number;
//   endX: number;
//   endY: number;
// }

// // Function to determine aggregation factor based on zoom level
// function getAggregationFactor(zoom: number): number {
//   const baseCellSize = 10; // Your base cell size
//   const currentCellSize = baseCellSize * Math.pow(2, zoom);
//   const minVisibleCellSize = 4; // Minimum size before aggregating
  
//   if (currentCellSize >= minVisibleCellSize) {
//     return 1; // No aggregation needed
//   }
  
//   // Calculate required aggregation to reach minimum size
//   const factor = Math.ceil(minVisibleCellSize / currentCellSize);
  
//   // Round to powers of 2 for clean aggregation (2, 4, 8, 16...)
//   return Math.pow(2, Math.ceil(Math.log2(factor)));
// }

// // Helper function to check if a cell is within the filtered area
// function isInFilteredArea(rowIndex: number, colIndex: number, filteredIdxDict: CropBox | null): boolean {
//   if (!filteredIdxDict) return true; // Show all if no filter
  
//   return rowIndex >= filteredIdxDict.startY && 
//          rowIndex <= filteredIdxDict.endY &&
//          colIndex >= filteredIdxDict.startX && 
//          colIndex <= filteredIdxDict.endX;
// }

// // Helper function to get shifted position based on crop box
// function getShiftedPosition(
//   originalX: number, 
//   originalY: number, 
//   cellWidth: number, 
//   cellHeight: number,
//   rowIndex: number,
//   colIndex: number,
//   filteredIdxDict: CropBox | null,
//   heatmapState: HeatmapStateShape
// ): [number, number] {
//   if (!filteredIdxDict) {
//     return [originalX, originalY]; // No shift if no filtering
//   }

//   // Get the same offsets used in your getHeatmapState function
//   const heatmapWidth = heatmapState.width;
//   const heatmapHeight = heatmapState.height;
//   const offsetX = heatmapWidth / 4;
//   const offsetY = heatmapHeight / 4;

//   // Calculate the new position as if the filtered area starts at (0,0)
//   // Then apply the same centering offset
//   const newColIndex = colIndex - filteredIdxDict.startX;
//   const newRowIndex = rowIndex - filteredIdxDict.startY;
  
//   const shiftedX = (newColIndex * cellWidth) - offsetX;
//   const shiftedY = (newRowIndex * cellHeight) - offsetY;
  
//   return [shiftedX, shiftedY];
// }

// // Helper for aggregation. It now only processes visible cells for speed.
// function getAggregatedCells(
//   heatmapState: HeatmapStateShape,
//   visibleIndices: number[],
//   aggregationFactor: number,
//   filteredIdxDict: CropBox | null,
//   offsetX: number,
//   offsetY: number
// ) {
//   const { cellData, colors, cellDimensions } = heatmapState;
//   const width = cellDimensions?.width || 10;
//   const height = cellDimensions?.height || 10;
  
//   const gridCells: {[key: string]: {
//     count: number;
//     sumValue: number;
//     colors: number[];
//     rowIndices: Set<number>;
//     colIndices: Set<number>;
//   }} = {};
  
//   // Loop ONLY over the cells that are visible on screen.
//   for (const cellIndex of visibleIndices) {
//     const rowIndex = cellData.rowIndices[cellIndex];
//     const colIndex = cellData.colIndices[cellIndex];
    
//     // This filter is still useful if the user has a separate crop box filter
//     if (!isInFilteredArea(rowIndex, colIndex, filteredIdxDict)) {
//             continue;
//           }
    
//     const value = cellData.values[cellIndex];
//     if (isNaN(value)) continue;

//     const gridX = Math.floor(colIndex / aggregationFactor);
//     const gridY = Math.floor(rowIndex / aggregationFactor);
//     const key = `${gridX}:${gridY}`;
    
//     if (!gridCells[key]) {
//       gridCells[key] = { count: 0, sumValue: 0, colors: [0,0,0,0], rowIndices: new Set(), colIndices: new Set() };
//     }
    
//     gridCells[key].count++;
//     gridCells[key].sumValue += value;
//     gridCells[key].rowIndices.add(rowIndex);
//     gridCells[key].colIndices.add(colIndex);
//     if (colors) {
//       gridCells[key].colors[0] += colors[cellIndex * 4];
//       gridCells[key].colors[1] += colors[cellIndex * 4 + 1];
//       gridCells[key].colors[2] += colors[cellIndex * 4 + 2];
//       gridCells[key].colors[3] += colors[cellIndex * 4 + 3];
//     }
//   }
  
//   // Convert grid to array of aggregated cells
//   return Object.values(gridCells).map((cell, index) => {
//     const avgColor: [number, number, number, number] = cell.count > 0 
//       ? [ Math.round(cell.colors[0] / cell.count), Math.round(cell.colors[1] / cell.count), Math.round(cell.colors[2] / cell.count), Math.round(cell.colors[3] / cell.count) ] 
//       : [0, 0, 0, 255];
    
//     let minCol = Array.from(cell.colIndices).reduce((min, current) => Math.min(min, current), Infinity);
//     let minRow = Array.from(cell.rowIndices).reduce((min, current) => Math.min(min, current), Infinity);
    
//     // CORRECTED: If filtering, shift the coordinates to start from the corner of the cropped box
//     // if (filteredIdxDict) {
//     //     minCol -= filteredIdxDict.startX;
//     //     minRow -= filteredIdxDict.startY;
//     // }

//     return {
//       id: index,
//       position: [(minCol * width) - offsetX, (minRow * height) - offsetY], // These are already shifted
//       width_agg: width * aggregationFactor,
//       height_agg: height * aggregationFactor,
//       value: cell.sumValue / cell.count,
//       color: avgColor,
//       aggregationFactor,
//       rowIndices: Array.from(cell.rowIndices),
//       colIndices: Array.from(cell.colIndices)
//     };
//   });
// }


// export function getHeatmapGridLayer(
//   heatmapState: HeatmapStateShape | null,
//   opacityVal: number,
//   onClick: OnClickType,
//   visibleIndices: number[] | null,
//   viewState: any,
//   filteredIdxDict: CropBox | null, // Add the filtering parameter
//   debug?: boolean,
// ) {


//   console.log('****** heatmap state in heatmap grid layer is as follows ****',heatmapState)
//   console.log('******* visible indices is as follows ********', visibleIndices)
//   // 1. Bail out early if required data is missing
//   if (!heatmapState?.cellData?.rowIndices || !visibleIndices) {
//     console.warn('Missing required heatmap data');
//     return null;
//   }

//   // Extract zoom level from viewState
//   const zoom = viewState.zoom as number;
  
//   // Calculate dynamic aggregation factor
//   const aggregationFactor = getAggregationFactor(zoom);
  
//   // Determine if we need aggregation
//   const needsAggregation = aggregationFactor > 1;

//   // Extract data with defensive checks
//   const { cellData, colors, cellDimensions, rowLabels, colLabels, width: heatmapWidth, height: heatmapHeight } = heatmapState;
//   const width = cellDimensions?.width || 10;
//   const height = cellDimensions?.height || 10;
  
//   const offsetX = heatmapWidth / 4;
//   const offsetY = heatmapHeight / 4;
  
//   // HANDLE THE AGGREGATED CASE
//   if (needsAggregation) {
//     console.log(`Creating aggregated polygon layer with ${aggregationFactor}x${aggregationFactor} aggregation at zoom ${zoom}`);
    
//     // Create aggregated cells with dynamic factor and filtering
//     const aggregatedCells = getAggregatedCells(heatmapState, visibleIndices, aggregationFactor, filteredIdxDict,offsetX,offsetY);
    
//     return new PolygonLayer({
//       id: 'heatmap-grid-layer',
//       viewId: IDS.VIEWS.HEATMAP_GRID,
//       data: aggregatedCells,
//       pickable: true,
//       filled: true,
//       wireframe: debug,
//       getPolygon: d => {
//         const [x, y] = d.position;
//         return [
//           [x, y],
//           [x, y + d.height_agg],
//           [x + d.width_agg, y + d.height_agg],
//           [x + d.width_agg, y],
//         ];
//       },
//       getFillColor: d => {
//         // Get the color and apply opacity
//         const [r, g, b, a] = d.color;
//         const newAlpha = Math.floor(a * opacityVal);
//         return [r, g, b, newAlpha];
//       },
//       autoHighlight: true,
//       onHover: (info, _) => {
//         const obj = info.object;
//         if (obj) {
//           // For aggregated cells, show summary info
//           const rowCount = obj.rowIndices.length;
//           const colCount = obj.colIndices.length;
          
//           // Create a summary object for tooltip
//           info.object = {
//             aggregated: true,
//             aggregationFactor: obj.aggregationFactor,
//             cellCount: obj.rowIndices.length * obj.colIndices.length,
//             value: obj.value.toFixed(2),
//             rowCount,
//             colCount,
//             // Optionally add sample row/column names if useful
//             sampleRows: obj.rowIndices
//               .slice(0, 3)
//               .map((idx: number) => rowLabels[idx]),
//             sampleCols: obj.colIndices
//               .slice(0, 3)
//               .map((idx: number) => colLabels[idx])
//           };
//         }
//       },
//       getLineColor: [80, 80, 80],
//       getLineWidth: 0.5, // Thinner lines for aggregated view
//       onClick,
//       updateTriggers: {
//         getPolygon: [heatmapState.height, heatmapState.width, aggregationFactor, filteredIdxDict],
//         getFillColor: [colors, aggregationFactor, opacityVal, filteredIdxDict],
//       },
//     });
//   }
  
//   // ORIGINAL DETAILED VIEW LOGIC (no aggregation needed) with position shifting
//   // Apply filtering to visible indices
//   let filteredVisibleIndices = visibleIndices;
  
//   if (filteredIdxDict) {
//     filteredVisibleIndices = visibleIndices.filter(cellIndex => {
//       const rowIndex = cellData.rowIndices[cellIndex];
//       const colIndex = cellData.colIndices[cellIndex];
//       return isInFilteredArea(rowIndex, colIndex, filteredIdxDict);
//     });
    
//     console.log(`Filtered visible cells: ${filteredVisibleIndices.length} out of ${visibleIndices.length} total visible cells`);
//   }
  
//   // Create a custom data object with length property
//   const dataObject = {
//     length: filteredVisibleIndices.length,
//     indices: filteredVisibleIndices, // Store filtered indices for accessors to use
//   };
    
//   return new PolygonLayer({
//     id: 'heatmap-grid-layer',
//     viewId: IDS.VIEWS.HEATMAP_GRID,
//     data: dataObject,
//     pickable: true,
//     filled: true,
//     wireframe: debug,
//     getPolygon: (_, {index}) => {
//       const trueCellIndex = dataObject.indices[index];
//       let rowIndex = cellData.rowIndices[trueCellIndex];
//       let colIndex = cellData.colIndices[trueCellIndex];

//       // If there is a filter, we must check if the cell is inside it
//       if (filteredIdxDict) {
//         if (
//           rowIndex < filteredIdxDict.startY || rowIndex > filteredIdxDict.endY ||
//           colIndex < filteredIdxDict.startX || colIndex > filteredIdxDict.endX
//         ) {
//           return null; // Don't draw cells outside the crop box
//         }
//         // Shift the coordinates to be relative to the top-left of the crop box
//         rowIndex -= filteredIdxDict.startY;
//         colIndex -= filteredIdxDict.startX;
//       }
      
//       // The centering offset is always applied to the final coordinate system
//       const x = (colIndex * width) - offsetX;
//       const y = (rowIndex * height) - offsetY;
      
//       return [[x, y], [x, y + height], [x + width, y + height], [x + width, y]];
//     }
//     ,
//     getFillColor: (_, {index}) => {
//       // Use the stored index to get the real cell index
//       const cellIndex = dataObject.indices[index];
      
//       if (!colors || cellIndex * 4 + 3 >= colors.length) {
//         return [0, 0, 0, 255];
//       }
      
//       // Get the original color
//       const r = colors[cellIndex * 4];
//       const g = colors[cellIndex * 4 + 1];
//       const b = colors[cellIndex * 4 + 2];
      
//       // Apply the opacity value directly to the alpha channel
//       const originalAlpha = colors[cellIndex * 4 + 3];
//       const newAlpha = Math.floor(originalAlpha * opacityVal);
      
//       return [r, g, b, newAlpha];
//     },
//     autoHighlight: true,
//     onHover: (info, _) => {
//       const index = info.index;
//       if (index !== undefined && index >= 0 && index < dataObject.indices.length) {
//         // Get the actual cell index
//         const cellIndex = dataObject.indices[index];
        
//         // Get row and column indices for this cell
//         const rowIndex = cellData.rowIndices[cellIndex];
//         const colIndex = cellData.colIndices[cellIndex];
        
//         // Get the value for this cell
//         const value = cellData.values[cellIndex];
        
//         // Ensure indices are within bounds
//         if (rowIndex >= 0 && rowIndex < rowLabels.length && 
//             colIndex >= 0 && colIndex < colLabels.length) {
            
//             // Add the row, column, and value info to the pick info object
//             info.object = {
//               row: rowLabels[rowIndex],
//               col: colLabels[colIndex],
//               value: value,
//               aggregated: false,

//               // Include any other properties you need for hover display
//             };
//         }
//       }
//     },
//     getLineColor: [255, 255, 255],
//     getLineWidth: 1,
//     onClick,
//     updateTriggers: {
//       getPolygon: [heatmapState.height, heatmapState.width, filteredVisibleIndices, filteredIdxDict],
//       getFillColor: [colors, filteredVisibleIndices, opacityVal, filteredIdxDict],
//     },
//   });
// }


import { PolygonLayer } from '@deck.gl/layers/typed';
import { IDS, BASE_ZOOM } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { HeatmapStateShape, DataStateShape } from '../../types';

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Helper: Determines the aggregation level based on zoom (BASE_ZOOM from const)
function getAggregationFactor(zoom: number): number {
  // Generic thresholds relative to BASE_ZOOM
  if (zoom >= BASE_ZOOM) return 1; // No aggregation at or above BASE_ZOOM
  if (zoom > BASE_ZOOM - 2) return 2; // 2x2 aggregation
  if (zoom > BASE_ZOOM - 4) return 4; // 4x4 aggregation
  return 8; // 8x8 aggregation at farthest zoom
}

// Helper: Checks if a cell is inside the user-defined crop box.
function isInFilteredArea(rowIndex: number, colIndex: number, filteredIdxDict: CropBox | null): boolean {
  if (!filteredIdxDict) return true;
  return rowIndex >= filteredIdxDict.startY && rowIndex <= filteredIdxDict.endY &&
         colIndex >= filteredIdxDict.startX && colIndex <= filteredIdxDict.endX;
}

// --- OPTIMIZED AGGREGATION HELPER ---
// This function returns a lightweight descriptor of the aggregated grid.
function getAggregationDescriptor(
  heatmapState: HeatmapStateShape,
  visibleIndices: number[],
  aggregationFactor: number,
  filteredIdxDict: CropBox | null
) {
  const { cellData, colors } = heatmapState;
  
  const gridCellMap = new Map<string, {
    count: number;
    sumValue: number;
    colors: number[];
    rowIndices: Set<number>;
    colIndices: Set<number>;
  }>();
  
  for (const cellIndex of visibleIndices) {
    const rowIndex = cellData.rowIndices[cellIndex];
    const colIndex = cellData.colIndices[cellIndex];
    
    if (!isInFilteredArea(rowIndex, colIndex, filteredIdxDict)) continue;
    
    const value = cellData.values[cellIndex];
    if (isNaN(value)) continue;

    const gridX = Math.floor(colIndex / aggregationFactor);
    const gridY = Math.floor(rowIndex / aggregationFactor);
    const key = `${gridX}:${gridY}`;
    
    if (!gridCellMap.has(key)) {
      gridCellMap.set(key, { count: 0, sumValue: 0, colors: [0,0,0,0], rowIndices: new Set(), colIndices: new Set() });
    }
    
    const cell = gridCellMap.get(key)!;
    cell.count++;
    cell.sumValue += value;
    cell.rowIndices.add(rowIndex);
    cell.colIndices.add(colIndex);
    if (colors) {
      cell.colors[0] += colors[cellIndex * 4];
      cell.colors[1] += colors[cellIndex * 4 + 1];
      cell.colors[2] += colors[cellIndex * 4 + 2];
      cell.colors[3] += colors[cellIndex * 4 + 3];
    }
  }
  
  return {
    gridCellMap,
    gridKeys: Array.from(gridCellMap.keys()),
  };
}

export function getHeatmapGridLayer(
  heatmapState: HeatmapStateShape | null,
  opacityVal: number,
  onClick: OnClickType,
  visibleIndices: number[] | null,
  viewState: any,
  filteredIdxDict: CropBox | null,
  debug?: boolean,
) {
  if (!heatmapState?.cellData?.rowIndices || !visibleIndices || !viewState) {
    return null;
  }

  const zoom = viewState.zoom as number;
  const aggregationFactor = getAggregationFactor(zoom);
  const needsAggregation = aggregationFactor > 1;

  const { cellData, colors, cellDimensions, rowLabels, colLabels, width: heatmapWidth, height: heatmapHeight } = heatmapState;
  const width = cellDimensions?.width || 10;
  const height = cellDimensions?.height || 10;
  
  // Adjust offset based on filtering to keep the view centered on the cropped area
  const offsetX = filteredIdxDict ? (filteredIdxDict.startX * width) : 0;
  const offsetY = filteredIdxDict ? (filteredIdxDict.startY * height) : 0;

  // Generic centering calculation based on BASE_ZOOM
  const baseScaleFactor = Math.pow(2, BASE_ZOOM);
  const centeringX = heatmapWidth / 2 / baseScaleFactor;
  const centeringY = heatmapHeight / 2 / baseScaleFactor;

  // --- AGGREGATED (ZOOMED-OUT) VIEW ---
  if (needsAggregation) {
    const aggregationDescriptor = getAggregationDescriptor(heatmapState, visibleIndices, aggregationFactor, filteredIdxDict);
    const data = { length: aggregationDescriptor.gridKeys.length };

    return new PolygonLayer({
      id: 'heatmap-grid-layer-aggregated',
      viewId: IDS.VIEWS.HEATMAP_GRID,
      data,
      pickable: true,
      filled: true,
      wireframe: debug,
      
      getPolygon: (_: any, { index }: { index: number }) => {
        const key = aggregationDescriptor.gridKeys[index];
        const [gridX, gridY] = key.split(':').map(Number);
        const x = (gridX * aggregationFactor * width) - offsetX - centeringX;
        const y = (gridY * aggregationFactor * height) - offsetY - centeringY;
        const aggWidth = width * aggregationFactor;
        const aggHeight = height * aggregationFactor;
        return [[x, y], [x, y + aggHeight], [x + aggWidth, y + aggHeight], [x + aggWidth, y]];
      },
      
      getFillColor: (_: any, { index }: { index: number }) => {
        const key = aggregationDescriptor.gridKeys[index];
        const cell = aggregationDescriptor.gridCellMap.get(key)!;
        const [r, g, b, a] = cell.count > 0 ? [
          Math.round(cell.colors[0] / cell.count),
          Math.round(cell.colors[1] / cell.count),
          Math.round(cell.colors[2] / cell.count),
          Math.round(cell.colors[3] / cell.count)
        ] : [0, 0, 0, 255];
        return [r, g, b, Math.floor(a * opacityVal)];
      },

      onHover: (info, event) => {
        const { index } = info;
        if (index === -1) return;
        
        const key = aggregationDescriptor.gridKeys[index];
        const cell = aggregationDescriptor.gridCellMap.get(key)!;

        // For aggregated cells, we create a summary object for the tooltip
        info.object = {
            aggregated: true,
            aggregationFactor,
            cellCount: cell.count,
            value: cell.sumValue / cell.count,
            rowCount: cell.rowIndices.size,
            colCount: cell.colIndices.size,
        };
      },
      getLineColor: [255, 255, 255],
      getLineWidth: 0.5,
      onClick,
      updateTriggers: {
        getPolygon: [offsetX, offsetY, centeringX, centeringY, aggregationFactor, visibleIndices],
        getFillColor: [aggregationDescriptor, opacityVal, visibleIndices],
      },
    });
  }
  
  // --- DETAILED (ZOOMED-IN) VIEW ---
  // Filter visible indices based on crop box BEFORE creating the data object
  let filteredVisibleIndices = visibleIndices;
  
  if (filteredIdxDict) {
    filteredVisibleIndices = visibleIndices.filter(cellIndex => {
      const rowIndex = cellData.rowIndices[cellIndex];
      const colIndex = cellData.colIndices[cellIndex];
      return isInFilteredArea(rowIndex, colIndex, filteredIdxDict);
    });
    
  }

  const dataObject = {
    length: filteredVisibleIndices.length,
    indices: filteredVisibleIndices,
  };

  return new PolygonLayer({
    id: 'heatmap-grid-layer-detailed',
    viewId: IDS.VIEWS.HEATMAP_GRID,
    data: dataObject,
    pickable: true,
    filled: true,
    wireframe: debug,
    
    getPolygon: (_, { index }: { index: number }) => {
      const cellIndex = dataObject.indices[index];
      const rowIndex = cellData.rowIndices[cellIndex];
      const colIndex = cellData.colIndices[cellIndex];

      // No need to check isInFilteredArea again since we already filtered the indices
      const adjustedRow = filteredIdxDict ? rowIndex - filteredIdxDict.startY : rowIndex;
      const adjustedCol = filteredIdxDict ? colIndex - filteredIdxDict.startX : colIndex;

      const x = (adjustedCol * width) - centeringX;
      const y = (adjustedRow * height) - centeringY;
      
      return [[x, y], [x, y + height], [x + width, y + height], [x + width, y]];
    },
    
    getFillColor: (_, { index }: { index: number }) => {
      const cellIndex = dataObject.indices[index];
      if (!colors || cellIndex * 4 + 3 >= colors.length) return [0, 0, 0, 255];
      const [r,g,b,a] = [colors[cellIndex*4], colors[cellIndex*4+1], colors[cellIndex*4+2], colors[cellIndex*4+3]];
      return [r, g, b, Math.floor(a * opacityVal)];
    },
    
    autoHighlight: true,
    onHover: (info, _) => {
        const { index } = info;
        if (index === -1) return;

        const cellIndex = dataObject.indices[index];
        const rowIndex = cellData.rowIndices[cellIndex];
        const colIndex = cellData.colIndices[cellIndex];
        
        // For detailed cells, provide specific row/col info
        info.object = {
            row: rowLabels[rowIndex],
            col: colLabels[colIndex],
            value: cellData.values[cellIndex],
            aggregated: false,
        };
    },
    getLineColor: [255, 255, 255],
    getLineWidth: 0.5,
    onClick,
    updateTriggers: {
      getPolygon: [centeringX, centeringY, filteredIdxDict, filteredVisibleIndices],
      getFillColor: [colors, opacityVal, filteredIdxDict, filteredVisibleIndices],
    },
  });
}

