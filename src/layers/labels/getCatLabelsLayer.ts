// import { PolygonLayer } from '@deck.gl/layers/typed';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { DataStateShape, HeatmapStateShape } from '../../types';
// // import { TransitionInterpolator } from '@deck.gl/core';

// export function getCatLabelsLayer(
//   dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   onClick: OnClickType,
//   cat:string,
//   yOffset:number,
//   debug?: boolean,
//   axis:string="col",
// ) {
//     type CellDatum = {
//         contour: number[][];
//         text: string|null;
//         color: string|null|undefined;
//     }

//     type Color = [number, number, number, number];
  
//   if (heatmapState?.cellData && dataState) {
//     const { numColumns,numRows} = dataState;
//     const { width: cellWidth, height: cellHeight} = heatmapState.cellDimensions;

//     // Hard coded //
//     const data: CellDatum[] = []; 
//     if(axis === "col"){
//     for(let i = 0;i < numColumns ;i++){
//         const ht = 7
//         // original yOffset was 5
//         // const yOffset = 8 
//         const catDict = dataState.colLabels[i].category
//         const categoryText = catDict ? catDict[cat].split(":")[1] : null
//         // .split(":")[1]
//         const firstAndLastPoint = [i*cellWidth,-yOffset];
//         data.push({
//             contour: [
//                 firstAndLastPoint,
//                 [i * cellWidth,ht-yOffset],
//                 [i * cellWidth + cellWidth,ht-yOffset],
//                 [i * cellWidth + cellWidth, -yOffset],
//                 firstAndLastPoint,
//             ],
//             text: categoryText,
//             color: dataState.colLabels[i].categoryColor?.[cat],
//         })
//     }
//   }
//   else if(axis === "row"){
//     for(let i = 0;i < numRows; i++){
//       const ht = 7;
//       // const xOffset = 5;
//       const xOffset = yOffset;
//       const catDict = dataState.rowLabels[i].category
//       const categoryText = catDict ? catDict[cat].split(":")[1] : null
//       const firstAndLastPoint = [-xOffset,i*cellHeight];
//       data.push({
//         contour:[
//               firstAndLastPoint,
//               [-xOffset,i*cellHeight + cellHeight],
//               [-xOffset+ht,i*cellHeight + cellHeight],
//               [-xOffset+ht,i*cellHeight],
//               firstAndLastPoint
//         ],
//         text: categoryText,
//         color: dataState.rowLabels[i].categoryColor?.[cat],
//       })

//     }
//   }

//     const fillColor = (color:string|null|undefined) =>{
//       if(color){
//       const hex = color.replace("#", "");
//       const red = parseInt(hex.substring(0, 2), 16);
//       const green = parseInt(hex.substring(2, 4), 16);
//       const blue = parseInt(hex.substring(4, 6), 16);
//       return [red,green,blue, 200] as Color
//       }
//       else{
//         return [196, 164, 132, 255] as Color
//       }
//     }

//     const id = cat + ":cat"
//     return new PolygonLayer<CellDatum>({
//       id,
//       data: data,
//       pickable: true,
//       // stroked: true,
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
//         data: axis === "col"?[dataState.colLabels]:[dataState.rowLabels],
//       },
//     });
//   }
//   return null;
// }



import { PolygonLayer } from '@deck.gl/layers/typed';
import { CATEGORY_LAYER_HEIGHT, IDS } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape } from '../../types';

export function getCatLabelsLayer(
  dataState: DataStateShape,
  heatmapState: HeatmapStateShape | null,
  onClick: OnClickType,
  cat:string,
  yOffset:number,
 labelsDimension:number,
  debug?: boolean,
  axis:string="col",
) {
    type CellDatum = {
        contour: number[][];
        text: string|null;
        color: string|null|undefined;
    }

    type Color = [number, number, number, number];

  console.log(labelsDimension)
  
  if (heatmapState?.cellData && dataState) {
    const { numColumns,numRows} = dataState;
    const { width: cellWidth, height: cellHeight} = heatmapState.cellDimensions;
    const heatmapWidth = heatmapState.width
    const heatmapHeight = heatmapState.height

    // Hard coded //
    const data: CellDatum[] = []; 
    if(axis === "col"){
    

      const offsetX = heatmapWidth/4;



    for(let i = 0;i < numColumns ;i++){
        const ht = CATEGORY_LAYER_HEIGHT
        // original yOffset was 5
        // const yOffset = 8 
        const catDict = dataState.colLabels[i].category
        const categoryText = catDict ? catDict[cat].split(":")[1] : null

         // Apply the offset to all x-coordinates
        const x1 = i * cellWidth - offsetX;
        
        data.push({
          contour: [
            [x1, -yOffset],                // Adjusted x-coordinate
            [x1, ht-yOffset],              // Adjusted x-coordinate
            [x1 + cellWidth, ht-yOffset],  // Adjusted x-coordinate
            [x1 + cellWidth, -yOffset],    // Adjusted x-coordinate
          ],
          text: categoryText,
          color: dataState.colLabels[i].categoryColor?.[cat],
        });
        
        }
        
  }
  else if(axis === "row"){
    const offsetY = heatmapHeight/4;

    for(let i = 0;i < numRows; i++){
      const ht = CATEGORY_LAYER_HEIGHT;
      // const xOffset = 5;
      const xOffset = yOffset;
      const catDict = dataState.rowLabels[i].category
      const categoryText = catDict ? catDict[cat].split(":")[1] : null
      const y1 = i*cellHeight - offsetY
      data.push({
        contour:[
              [-xOffset,y1],
              [-xOffset,y1 + cellHeight],
              [-xOffset+ht,y1 + cellHeight],
              [-xOffset+ht,y1],
        ],
        text: categoryText,
        color: dataState.rowLabels[i].categoryColor?.[cat],
      })

    }
  }

    const fillColor = (color:string|null|undefined) =>{
      if(color){
      const hex = color.replace("#", "");
      const red = parseInt(hex.substring(0, 2), 16);
      const green = parseInt(hex.substring(2, 4), 16);
      const blue = parseInt(hex.substring(4, 6), 16);
      return [red,green,blue, 255] as Color
      }
      else{
        return [196, 164, 132, 255] as Color
      }
    }

    const id = `${axis}_${cat}:cat`;

    // <CellDatum>
    return new PolygonLayer({
      id,
      viewId: axis === "col" ? IDS.VIEWS.COL_LABELS:IDS.VIEWS.ROW_LABELS, // 'heatmap-grid-view'
      data: data,
      pickable: true,
      filled: true,
      wireframe: debug,
      getLineColor: [255, 255, 255],    
      getLineWidth: 0.25,
      // For a layer in the column labels view
      // coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      // coordinateOrigin: axis === "col" 
      // ? [-heatmapWidth/4, -labelsDimension/2, 0]  // For column labels view
      // : [-labelsDimension/2, -heatmapHeight/2, 0],  // For row labels view      
      getPolygon: (d) => d.contour,
      getFillColor: (d) => fillColor(d.color),
      onClick,
      autoHighlight: true,
      transitions: {
        getFillColor: {
          type: 'interpolation',
          duration: 2000,
          easing: (t: number) => t,
        },
      },
      updateTriggers: {
        data: axis === "col"?[dataState.colLabels]:[dataState.rowLabels],
      },
    });
  }
  return null;
}
