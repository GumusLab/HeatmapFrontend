// import { DeckGLHeatmapProps } from '../DeckGLHeatmap.types';
// import { DataStateShape, HeatmapStateShape, ViewStates } from '../types';
// import { order } from "../types/index";
// import { getClusterLayer } from './cluster/getClusterLayer';
// import { getHeatmapGridLayer } from './heatmapGrid/getHeatmapGridLayer';
// import { getCatLabelsLayer } from './labels/getCatLabelsLayer';
// import { getColLabelsLayer } from './labels/getColLabelsLayer';
// import { getRowLabelsLayer } from './labels/getRowLabelsLayer';
// // export type order = {
// //                     row:string;
// //                     col:string;
// //                     rowCat:string;
// //                     sortByRowCat:boolean;
// //                     colCat:string;
// //                     sortByColCat:boolean;
// //                   };
// export type UseLayersProps = Pick<
//   DeckGLHeatmapProps,
//   'onClick' | 'labels' | 'debug' | 'rowLabelsTitle' | 'columnLabelsTitle'| 'categories'
// > & {
//   dataState: DataStateShape | null;
//   heatmapState: HeatmapStateShape | null;
//   viewStates: ViewStates;
//   colLabelsWidth: number;
//   rowLabelsWidth: number;
//   rowSliderVal: number;
//   colSliderVal: number;
//   opacityVal:number;
//   order:order;
//   searchTerm:string;
//   pvalThreshold?:number;
//   pvalData?:Record<string, Record<string, number>>
//   setOrder:React.Dispatch<React.SetStateAction<{
//     row: string;
//     col: string;
//     rowCat: string[];
//     sortByRowCat: string;
//     colCat: string[];
//     sortByColCat: string;
// }>>
// setHoveredLabelRow:any;
// hoveredLabelRow:any|null;
// setHoveredLabelCol:any;
// hoveredLabelCol:any|null;
// };


// export const getLayers = ({
//   dataState,
//   heatmapState,
//   viewStates,
//   onClick,
//   labels,
//   debug,
//   colLabelsWidth,
//   rowLabelsWidth,
//   rowLabelsTitle,
//   columnLabelsTitle,
//   searchTerm,
//   order,
//   categories,
//   rowSliderVal,
//   colSliderVal,
//   opacityVal,
//   pvalThreshold,
//   pvalData,
//   setOrder,
//   setHoveredLabelRow,
//   hoveredLabelRow,
//   setHoveredLabelCol,
//   hoveredLabelCol
// }: UseLayersProps) => {

  

//   if (dataState) {

//     const Layers = []

//     const heatmapGrid = getHeatmapGridLayer(
//       dataState,
//       heatmapState,
//       opacityVal,
//       (info, event) => {console.log(info, event, dataState, heatmapState)},//onClick?.heatmapCell,
//       debug,
//       pvalThreshold,
//       pvalData
//     );

    
//     Layers.push(heatmapGrid)

//     const rowLabels = getRowLabelsLayer({
//       dataState,
//       viewStates,
//       heatmapState,
//       onClick: (info, _event) => setOrder((prev) => ({...prev, col:info.object.text})),//setOrder((prev)=>({...prev,col: info.object.text})),
//       labelsConfig: labels?.row,
//       labelSpace: rowLabelsWidth,
//       title: rowLabelsTitle,
//       searchTerm,
//       order,
//       categories,
//       setHoveredLabel: setHoveredLabelRow, 
//       hoveredLabel: hoveredLabelRow,  
//     });

//     Layers.push(rowLabels)

//     const colLabels = getColLabelsLayer({
//       dataState,
//       viewStates,
//       heatmapState,
//       onClick: onClick?.columnLabel,
//       labelsConfig: labels?.column,
//       labelSpace: colLabelsWidth,
//       title: columnLabelsTitle,
//       searchTerm,
//       order,
//       categories,
//       setHoveredLabel: setHoveredLabelCol, 
//       hoveredLabel: hoveredLabelCol,  
//     });
    
//     Layers.push(colLabels)


//     if(order.colCat.length>0||order.rowCat.length>0){
//       const yOffset = 8;
//       if(order.colCat.length>0){
//         const colCats = order.colCat
//         for(let i=0 ; i< colCats.length;i++){
//         const catLayer = getCatLabelsLayer(
//           dataState,
//           heatmapState,
//           onClick?.heatmapCell,
//           colCats[i],
//           yOffset*(i+1),
//           debug,
//           "col"
//         );
//         Layers.push(catLayer)
//       }
//     }
     
//       if(order.rowCat.length>0){
//         const yOffset = 8;
//         const rowCats = order.rowCat
//         for(let i=0 ; i< rowCats.length;i++){
//         const catLayer = getCatLabelsLayer(
//           dataState,
//           heatmapState,
//           onClick?.heatmapCell,
//           rowCats[i],
//           yOffset*(i+1),
//           debug,
//           "row"
//         );
//         Layers.push(catLayer)
//       }
//     }
//     }

//   if(order.row === 'cluster'){
//   const clusterRowLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'row',order,rowSliderVal);
//   Layers.push(clusterRowLayer)
//   }

//   if(order.col === 'cluster'){
//   const clusterColLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'col',order,colSliderVal);
//   Layers.push(clusterColLayer)
//   }
//   return Layers
//   }
//   return null;
// };



import { CATEGORY_LAYER_HEIGHT,CLUSTER_LAYER_HEIGHT,CLUSTER_LAYER_GAP,IDS,INITIAL_GAP,LAYER_GAP,BASE_ZOOM } from "../const";
import { DeckGLHeatmapProps } from '../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape, ViewStates } from '../types';
import { order } from "../types/index";
import { getClusterLayer } from './cluster/getClusterLayer';
import { getViewBorderLayer } from "./getViewBorderLayer";
// import { getHeatmapGridLayer } from './heatmapGrid/getHeatmapGridLayer'; // Old polygon version
import { getHeatmapGridLayer } from './heatmapGrid/getHeatmapGridLayerScatter'; // New scatter (circles) version
import { getCatLabelsLayer } from './labels/getCatLabelsLayer';
import { getColLabelsLayer } from './labels/getColLabelsLayer';
import { getRowLabelsLayer } from './labels/getRowLabelsLayer';
import { getViewportDebugLayer } from './getViewportDebugLayer';

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export type UseLayersProps = Pick<
  DeckGLHeatmapProps,
  'onClick' | 'labels' | 'debug' | 'rowLabelsTitle' | 'columnLabelsTitle'| 'categories'
> & {
  dataState: DataStateShape | null;
  heatmapState: HeatmapStateShape | null;
  visibleBounds: {startRow: number, endRow: number, startCol: number, endCol: number} | null;
  viewStates: ViewStates;
  colLabelsWidth: number;
  rowLabelsWidth: number;
  rowSliderVal: number;
  colSliderVal: number;
  opacityVal:number;
  order:order;
  searchTerm:string;
  pvalThreshold?:number;
  pvalData?:Record<string, Record<string, number>>;
  isZoomedOut:boolean; // Add to dependency array
  filteredIdxDict:CropBox|null;
};


export const getLayers = ({
  dataState,
  heatmapState,
  visibleBounds,
  viewStates,
  onClick,
  labels,
  debug,
  colLabelsWidth,
  rowLabelsWidth,
  rowLabelsTitle,
  columnLabelsTitle,
  searchTerm,
  order,
  categories,
  rowSliderVal,
  colSliderVal,
  opacityVal,
  // pvalThreshold,
  // pvalData,
  isZoomedOut,
  filteredIdxDict
}: UseLayersProps) => {

  if (dataState && heatmapState) {

    const Layers = []

    const heatmapGridLayers = getHeatmapGridLayer(
      heatmapState,
      opacityVal,
      onClick?.heatmapCell,
      viewStates[IDS.VIEWS.HEATMAP_GRID],
      filteredIdxDict,
      debug,
      visibleBounds,
      dataState.numColumns
    );

    if (heatmapGridLayers) {
      Layers.push(...heatmapGridLayers);
    }

    const rowLabels = getRowLabelsLayer({
      dataState,
      viewStates,
      heatmapState,
      onClick: onClick?.rowLabel,
      labelsConfig: labels?.row,
      labelSpace: rowLabelsWidth,
      title: rowLabelsTitle,
      searchTerm,
      order,
      categories,
      filteredIdxDict
    });

    Layers.push(rowLabels)

    const colLabels = getColLabelsLayer({
      dataState,
      viewStates,
      heatmapState,
      onClick: onClick?.columnLabel,
      labelsConfig: labels?.column,
      labelSpace: colLabelsWidth,
      title: columnLabelsTitle,
      searchTerm,
      order,
      categories,
      filteredIdxDict
    });

    Layers.push(colLabels)



  // if(order.colCat.length > 0) {
  //   const colCats = order.colCat;
    
  //   // Use the same height as heatmap state cells
  //   const categoryHeight = CATEGORY_LAYER_HEIGHT;
    
  //   // Small gap between layers
  //   const gap = LAYER_GAP;
    
  //   // Half-height of the column labels view (distance from center to bottom)
  //   const halfViewHeight = colLabelsWidth / 4;
    
  //   for(let i = 0; i < colCats.length; i++) {
  //     // Calculate position from bottom of view
  //     // Start with a small initial gap from the very bottom
  //     const initialGap = INITIAL_GAP;
  //           // Position calculation:
  //     // - halfViewHeight is the distance from center to bottom edge
  //     // - Subtract initialGap to move up from the very bottom
  //     // - Subtract height and gap for each previous layer
  //     const yPosition = halfViewHeight - initialGap - ((i+1) * (categoryHeight + gap));
      
  //     const catLayer = getCatLabelsLayer(
  //       dataState,
  //       heatmapState,
  //       onClick?.heatmapCell,
  //       colCats[i],
  //       -yPosition,  // This becomes the yOffset parameter
  //       colLabelsWidth,
  //       debug,
  //       "col"
  //     );
      
  //     Layers.push(catLayer);
  //     // break;
  //   }
  // }

  if (order.colCat.length > 0 && dataState.colLabels.length > 0) {
    // Get categories from the first column label
    const firstLabelCategories = dataState.colLabels[0].category || {};

    // Get available category keys from the first label
    const availableCategories = Object.keys(firstLabelCategories);

    if (availableCategories.length > 0) {
      const categoryHeight = CATEGORY_LAYER_HEIGHT;
      const gap = LAYER_GAP;

      // Generic centering calculation based on BASE_ZOOM
      const baseScaleFactor = Math.pow(2, BASE_ZOOM);
      const halfViewHeight = colLabelsWidth / 2 / baseScaleFactor;

      // Filter colCats to only include categories that exist in the first label
      const validColCats = order.colCat.filter(cat => availableCategories.includes(cat));

      // Add offset for cluster layer if column clustering is enabled
      const clusterOffset = order.col === 'cluster' ? (CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP) : 0;

      for (let i = 0; i < validColCats.length; i++) {
        const initialGap = INITIAL_GAP;
        const yPosition = halfViewHeight - initialGap - clusterOffset - ((i+1) * (categoryHeight + gap));

        const catLayer = getCatLabelsLayer(
          dataState,
          heatmapState,
          onClick?.heatmapCell,
          validColCats[i],
          -yPosition,
          colLabelsWidth,
          debug,
          "col",
          filteredIdxDict
        );

        Layers.push(catLayer);
      }
    }
  }

  if(order.rowCat.length > 0) {
    const rowCats = order.rowCat;

    // Use the same height as heatmap state cells
    const categoryHeight = CATEGORY_LAYER_HEIGHT;

    // Small gap between layers
    const gap = LAYER_GAP;

    // Generic centering calculation based on BASE_ZOOM
    const baseScaleFactor = Math.pow(2, BASE_ZOOM);
    const halfViewWidth = rowLabelsWidth / 2 / baseScaleFactor;

    // Add offset for cluster layer if row clustering is enabled
    const clusterOffset = order.row === 'cluster' ? (CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP) : 0;

    for(let i = 0; i < rowCats.length; i++) {
      // Calculate position from left of view
      // Start with a small initial gap from the very left
      const initialGap = INITIAL_GAP;

      // Position calculation:
      // - halfViewWidth is the distance from center to left edge
      // - Subtract initialGap to move right from the very left
      // - Subtract clusterOffset to make room for cluster layer
      // - Subtract width and gap for each previous layer
      const xPosition = halfViewWidth - initialGap - clusterOffset - ((i+1) * (categoryHeight + gap));

      const catLayer = getCatLabelsLayer(
        dataState,
        heatmapState,
        onClick?.heatmapCell,
        rowCats[i],
        -xPosition,  // This becomes the xOffset parameter
        rowLabelsWidth,
        debug,
        "row",
        filteredIdxDict
      );

      Layers.push(catLayer);
    }
  }

     
    //   if(order.rowCat.length>0){
    //     const yOffset = 8;
    //     const rowCats = order.rowCat
    //     for(let i=0 ; i< rowCats.length;i++){
    //     const catLayer = getCatLabelsLayer(
    //       dataState,
    //       heatmapState,
    //       onClick?.heatmapCell,
    //       rowCats[i],
    //       yOffset*(i+1),
    //       debug,
    //       "row"
    //     );
    //     Layers.push(catLayer)
    //   }
    // }
    // }

  if(order.row === 'cluster'){
  const clusterRowLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'row',order,rowSliderVal,rowLabelsWidth,filteredIdxDict);
  Layers.push(clusterRowLayer)
  }

  if(order.col === 'cluster'){
  const clusterColLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'col',order,colSliderVal,colLabelsWidth,filteredIdxDict);
  Layers.push(clusterColLayer)
  }
  
  // ********** viewport debug layers ********** //
  // const viewportDebugLayers = getViewportDebugLayer(
  //   heatmapState,
  //   viewStates[IDS.VIEWS.HEATMAP_GRID],
  //   true  // Set to false to hide the debug layer
  // );
  // if (viewportDebugLayers) {
  //   Layers.push(...viewportDebugLayers); // Spread the array of layers
  // }
    // const rowViewportBorderLayer = getViewBorderLayer(heatmapState,rowLabelsWidth,"row");
  // const colViewportBorderLayer = getViewBorderLayer(heatmapState,colLabelsWidth,"col");

  // Layers.push(rowViewportBorderLayer);
  // Layers.push(colViewportBorderLayer)
  return Layers
  }
  return null;
};
