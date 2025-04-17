// import { PolygonLayer } from '@deck.gl/layers/typed';
// import clamp from 'lodash/clamp';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { IDS } from '../../const';
// import { CellDatum, DataStateShape, HeatmapStateShape } from '../../types';
// import { getColorRange } from './getColorRange';


// // import { TransitionInterpolator } from '@deck.gl/core';


// const getColorFromRange = (
//   value: number,
//   posColorRange: [number, number, number, number][],
//   negColorRange: [number, number, number, number][],
//   min: number,
//   max: number
// ): [number, number, number, number] => {

//   if (value >= 0) {
//     const index = clamp(
//       Math.floor((value / max) * posColorRange.length),
//       0,
//       posColorRange.length - 1
//     );
//     return posColorRange[index];
//   }
//   const index = clamp(
//     Math.floor((value / min) * negColorRange.length),
//     0,
//     negColorRange.length - 1
//   );
//   return negColorRange[index];
// };

// export function getHeatmapGridLayer(
//   dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   opacityVal:number,
//   onClick: OnClickType,
//   debug?: boolean,
//   pvalThreshold?:number,
//   pvalData?:Record<string, Record<string, number>>
// ) {

//   // console.log('****** data state is as follows *****',dataState)
//   // console.log(pvalData)
  
//   const posColorRange = getColorRange(0,opacityVal);
//   const negColorRange = getColorRange(dataState.min,opacityVal);

//   if (heatmapState?.cellData) {
//     return new PolygonLayer<CellDatum>({
//       id: IDS.LAYERS.HEATMAP_GRID,
//       data: heatmapState.cellData,
//       pickable: true,
//       stroked: true,
//       filled: true,
//       // extruded:true,
//       wireframe: debug,
//       getLineColor: [255, 255, 255],    
//       getLineWidth: 0.1,
//       // Increase elevation to make extrusion more visible
//       // getElevation: d => d.value * 10,  // Adjust based on data range

//       // Optionally, scale the elevation to exaggerate the 3D effect
//       // elevationScale: 5,  // Scale factor for height      getPolygon: (d) => d.contour,
//       getFillColor: (d) => {
//         if (pvalData !== undefined && pvalThreshold !== undefined){
//           if(pvalData[d.row][d.col] <= pvalThreshold){
//             return  getColorFromRange(
//               d.value,
//               posColorRange,
//               negColorRange,
//               dataState.min,
//               dataState.max
//             );
//           }
//           else{
//             return [255,255,255,255]
//             // return [255,0,0,255]

//           }
//         }
//         else{ 
//         return getColorFromRange(
//           d.value,
//           posColorRange,
//           negColorRange,
//           dataState.min,
//           dataState.max
//         );
//       }
//     },
//     // getFillColor:[255,0,0,255],
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
//         getFillColor: [opacityVal,pvalThreshold],
//       },
//     });
//   }
//   return null;
// }


// ########## Uncomment this one ###################

// import { PolygonLayer } from '@deck.gl/layers/typed';
// import clamp from 'lodash/clamp';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { IDS } from '../../const';
// import { CellDatum, DataStateShape, HeatmapStateShape } from '../../types';
// import { getColorRange } from './getColorRange';


// // import { TransitionInterpolator } from '@deck.gl/core';


// const getColorFromRange = (
//   value: number,
//   posColorRange: [number, number, number, number][],
//   negColorRange: [number, number, number, number][],
//   min: number,
//   max: number
// ): [number, number, number, number] => {

//   if (value >= 0) {
//     const index = clamp(
//       Math.floor((value / max) * posColorRange.length),
//       0,
//       posColorRange.length - 1
//     );
//     return posColorRange[index];
//   }
//   const index = clamp(
//     Math.floor((value / min) * negColorRange.length),
//     0,
//     negColorRange.length - 1
//   );
//   return negColorRange[index];
// };

// export function getHeatmapGridLayer(
//   dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   opacityVal:number,
//   onClick: OnClickType,
//   debug?: boolean,
//   pvalThreshold?:number,
//   pvalData?:Record<string, Record<string, number>>
// ) {

//   // console.log('****** data state is as follows *****',dataState)
//   // console.log(pvalData)
  
//   const posColorRange = getColorRange(0,opacityVal);
//   const negColorRange = getColorRange(dataState.min,opacityVal);

//   if (heatmapState?.cellData) {
//     return new PolygonLayer<CellDatum>({
//       id: IDS.LAYERS.HEATMAP_GRID,
//       data: heatmapState.cellData,
//       pickable: true,
//       stroked: true,
//       filled: true,
//       wireframe: debug,
//       getLineColor: [255, 255, 255],    
//       getLineWidth: 0.1,  
//       getPolygon: (d) => d.contour,
//       getFillColor: (d) => {
//         if (pvalData !== undefined && pvalThreshold !== undefined){
//           if((d.row in pvalData) && (d.col in pvalData[d.row]) && pvalData[d.row][d.col] <= pvalThreshold){
//             return  getColorFromRange(
//               d.value,
//               posColorRange,
//               negColorRange,
//               dataState.min,
//               dataState.max
//             );
//           }
//           else{
//             return [255,255,255,255]
//             // return [255,0,0,255]

//           }
//         }
//         else{ 
//         return getColorFromRange(
//           d.value,
//           posColorRange,
//           negColorRange,
//           dataState.min,
//           dataState.max
//         );
//       }
//     },
//     // getFillColor:[255,0,0,255],
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
//         getFillColor: [opacityVal,pvalThreshold],
//       },
//     });
//   }
//   return null;
// }



// import { PolygonLayer } from '@deck.gl/layers/typed';
// import { IDS } from '../../const';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { HeatmapStateShape } from '../../types';


// export function getHeatmapGridLayer(
//   // dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   // opacityVal: number,
//   onClick: OnClickType,
//   visibleIndices: number[]|null, // Add this parameter
//   debug?: boolean,
// ) {
//   // Bail out early if required data is missing
//   if (!heatmapState?.cellData?.rowIndices || !heatmapState?.contourData) {
//     console.warn('Missing required heatmap data');
//     return null;
//   }
  
//   // Extract data with defensive checks
//   // const { cellData, contourData, colors, cellDimensions } = heatmapState;
//   const { cellData, contourData, colors, cellDimensions, rowLabels, colLabels } = heatmapState;

//   const totalCells = cellData.rowIndices.length;
  
//   // Ensure valid dimensions
//   const width = cellDimensions?.width || 10;
//   const height = cellDimensions?.height || 10;
  
//   // Use visibleIndices if provided, otherwise use all cells
//   const indices = visibleIndices || Array.from({ length: totalCells }, (_, i) => i);

//   console.log('************** indices length in the get heeatmap grid layer is as follows ******', indices.length)
  
//   // Create a custom data object with length property
//   const dataObject = {
//     length: indices.length,
//     indices: indices, // Store indices for accessors to use
//   };


  
//   return new PolygonLayer({
//     id: 'heatmap-grid-layer',
//     viewId: IDS.VIEWS.HEATMAP_GRID, // 'heatmap-grid-view'
//     data: dataObject,
//     pickable: true,
//     filled: true,
//     wireframe: debug,
//     getPolygon: (_, {index}) => {
//       // Use the stored index to get the real cell index
//       const cellIndex = dataObject.indices[index];
      
//       if (cellIndex * 2 + 1 >= contourData.length) {
//         return [[0, 0], [0, 0], [0, 0], [0, 0]];
//       }
      
//       const x = contourData[cellIndex * 2] || 0;
//       const y = contourData[cellIndex * 2 + 1] || 0;
      
//       return [
//         [x, y],
//         [x, y + height],
//         [x + width, y + height],
//         [x + width, y],
//       ];
//     },
//     getFillColor: (_, {index}) => {
//       // Use the stored index to get the real cell index
//       const cellIndex = dataObject.indices[index];
      
//       if (!colors || cellIndex * 4 + 3 >= colors.length) {
//         return [0, 0, 0, 255];
//       }
//       return colors.slice(cellIndex * 4, cellIndex * 4 + 4);
//     },
//     autoHighlight:true,
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
          
//           // Add the row, column, and value info to the pick info object
//           info.object = {
//             row: rowLabels[rowIndex],
//             col: colLabels[colIndex],
//             value: value,
//             // Include any other properties you need for hover display
//           };
//         }
//       }
//     },
//     getLineColor: [255, 255, 255], // Change this to white
//     getLineWidth: 1, // You can adjust the width as needed
//     onClick,
//     updateTriggers: {
//       getPolygon: [heatmapState.height,heatmapState.width],
//     },
//   });
// }

import { PolygonLayer } from '@deck.gl/layers/typed';
import { IDS } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { HeatmapStateShape } from '../../types';

export function getHeatmapGridLayer(
  heatmapState: HeatmapStateShape | null,
  opacityVal: number,
  onClick: OnClickType,
  visibleIndices: number[] | null, // This parameter will determine if we render
  debug?: boolean,
) {
  // 1. Bail out early if required data is missing
  if (!heatmapState?.cellData?.rowIndices || !heatmapState?.contourData) {
    console.warn('Missing required heatmap data');
    return null;
  }

  // 2. Bail out early if visibleIndices is null - THIS IS THE KEY CHANGE
  // Only create the layer when we have visible indices
  if (visibleIndices === null) {
    console.log('Waiting for visible indices to be calculated');
    return null;
  }

  // Extract data with defensive checks
  const { cellData, contourData, colors, cellDimensions, rowLabels, colLabels } = heatmapState;

  // Ensure valid dimensions
  const width = cellDimensions?.width || 10;
  const height = cellDimensions?.height || 10;
  
  // We're now guaranteed to have visibleIndices
  console.log('Creating polygon layer with', visibleIndices.length, 'visible cells');
  
  // Create a custom data object with length property
  const dataObject = {
    length: visibleIndices.length,
    indices: visibleIndices, // Store indices for accessors to use
  };
    
  return new PolygonLayer({
    id: 'heatmap-grid-layer',
    viewId: IDS.VIEWS.HEATMAP_GRID,
    data: dataObject,
    pickable: true,
    filled: true,
    wireframe: debug,
    getPolygon: (_, {index}) => {
      // Use the stored index to get the real cell index
      const cellIndex = dataObject.indices[index];
      
      if (cellIndex * 2 + 1 >= contourData.length) {
        return [[0, 0], [0, 0], [0, 0], [0, 0]];
      }
      
      const x = contourData[cellIndex * 2] || 0;
      const y = contourData[cellIndex * 2 + 1] || 0;
      
      return [
        [x, y],
        [x, y + height],
        [x + width, y + height],
        [x + width, y],
      ];
    },
    // getFillColor: (_, {index}) => {
    //   // Use the stored index to get the real cell index
    //   const cellIndex = dataObject.indices[index];
      
    //   if (!colors || cellIndex * 4 + 3 >= colors.length) {
    //     return [0, 0, 0, 255];
    //   }
    //   return colors.slice(cellIndex * 4, cellIndex * 4 + 4);
    // },
    getFillColor: (_, {index}) => {
      // Use the stored index to get the real cell index
      const cellIndex = dataObject.indices[index];
      
      if (!colors || cellIndex * 4 + 3 >= colors.length) {
        return [0, 0, 0, 255];
      }
      
      // Get the original color
      const r = colors[cellIndex * 4];
      const g = colors[cellIndex * 4 + 1];
      const b = colors[cellIndex * 4 + 2];
      
      // Apply the opacity value directly to the alpha channel
      const originalAlpha = colors[cellIndex * 4 + 3];
      const newAlpha = Math.floor(originalAlpha * opacityVal);
      
      return [r, g, b, newAlpha];
    },
    autoHighlight: true,
    onHover: (info, _) => {
      const index = info.index;
      if (index !== undefined && index >= 0 && index < dataObject.indices.length) {
        // Get the actual cell index
        const cellIndex = dataObject.indices[index];
        
        // Get row and column indices for this cell
        const rowIndex = cellData.rowIndices[cellIndex];
        const colIndex = cellData.colIndices[cellIndex];
        
        // Get the value for this cell
        const value = cellData.values[cellIndex];
        
        // Ensure indices are within bounds
        if (rowIndex >= 0 && rowIndex < rowLabels.length && 
            colIndex >= 0 && colIndex < colLabels.length) {
            
            // Add the row, column, and value info to the pick info object
            info.object = {
              row: rowLabels[rowIndex],
              col: colLabels[colIndex],
              value: value,
              // Include any other properties you need for hover display
            };
        }
      }
    },
    getLineColor: [255, 255, 255],
    getLineWidth: 1,
    onClick,
    updateTriggers: {
      getPolygon: [heatmapState.height, heatmapState.width, visibleIndices],
      getFillColor: [colors, visibleIndices,opacityVal],
    },
  });
}