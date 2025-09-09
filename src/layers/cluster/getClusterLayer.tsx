// import { PolygonLayer } from '@deck.gl/layers/typed';
// import { IDS,INITIAL_GAP } from '../../const';
// import { OnClickType } from '../../DeckGLHeatmap.types';
// import { DataStateShape, HeatmapStateShape, order } from '../../types';
// import { binom_test } from '../../utils/binom_test';
// // import { TransitionInterpolator } from '@deck.gl/core';

// type CellDatum = {
//     contour: number[][];
//     text: string|undefined;
//     nodes: string[];
//     category :Record<string, [number,string|null|undefined]>;
//     id: string;
//     Pvalue?: Record<string, number>|null;
//     numPatients?: number;
//     // totalNumNodes?: number|null;
// }

// export function getClusterLayer(
//   dataState: DataStateShape,
//   heatmapState: HeatmapStateShape | null,
//   onClick: OnClickType,
//   axis: string = 'col',
//   order:order,
//   sliderValue : number = 5,
//   labelWidth:number,
//   debug?: boolean,
// ) {
   
//     console.log(onClick)
//   if (heatmapState?.cellData && dataState) {
//     const { numColumns,numRows } = dataState;
//     const { width: cellWidth} = heatmapState.cellDimensions;
//     const {height: cellHeight} = heatmapState.cellDimensions;

//     // const heatmapWidth = heatmapState.width;
//     const heatmapHeight = heatmapState.height;


  

//     // // Hard coded //
//     const data: CellDatum[] = [];

//     if(axis === 'col'){
//         let i = 0;
//         const allPatientsSet: Set<string> = new Set();
//         const sampleWiseCategories = ['Timepoint','PatientId'];
//         let globalCatDict: Record<string, number> = {};
        
//         // Key change 1: Start with zero offset and apply the negative offset in xStart calculation
//         const offsetX = heatmapState.width/4;
    
//         while(i < numColumns){
//             // Key change 2: Increased height for better visibility
//             const ht = 15
            
//             // Key change 3: Simplified yOffset calculation
//             let yOffset = 10;
//             if(order.colCat.length > 0) {
//                 yOffset = 10 + 5 * order.colCat.length;
//             }
            
//             // Key change 4: Directly subtract the offset from xStart
//             const xStart = i * cellWidth - offsetX;
//             const grp = dataState.colLabels[i].group?.[sliderValue];
//             let TrapezoidWidth = 1;
//             const nodes: string[] = [];
//             const currentCat = order.colCat;

//             console.log('****** currentCat is ********',currentCat)
//             let catDict: Record<string, [number, string|null|undefined]> = {};
//             const patientIdSet: Set<string> = new Set();
    
//             // Process columns in the same cluster
//             while((i+1 < numColumns) && (grp === dataState.colLabels[i+1].group?.[sliderValue])){
//                 TrapezoidWidth += 1;
//                 nodes.push(dataState.colLabels[i].text);
                
//                 // Patient ID processing
//                 let patientID: string = 'null';
//                 const metaData = dataState.colLabels[i]?.metadata;
//                 if (metaData?.PatientId){
//                     patientID = metaData['PatientId'];
//                 }
                
//                 if(patientID !== 'null' && !patientIdSet.has(patientID)){
//                     patientIdSet.add(patientID);
//                     for(let j = 0; j < currentCat.length; j++){
//                         const cat = currentCat[j];
//                         const category = dataState.colLabels[i].category?.[cat];
//                         const exist = sampleWiseCategories.includes(cat);
                        
//                         if(category && !exist){
//                             if(category in catDict){
//                                 catDict[category][0] += 1;
//                             } else {
//                                 const color = dataState.colLabels[i].categoryColor?.[cat];
//                                 catDict[category] = [1, color];
//                             }
//                         }
//                     }
//                 }
                
//                 // Sample-wise categories processing
//                 for(let j = 0; j < sampleWiseCategories.length; j++){
//                     const cat = sampleWiseCategories[j];
//                     if(currentCat.includes(cat)){
//                         const category = dataState.colLabels[i].category?.[cat];
//                         if(category){
//                             if(category in catDict){
//                                 catDict[category][0] += 1;
//                             } else {
//                                 const color = dataState.colLabels[i].categoryColor?.[cat];
//                                 catDict[category] = [1, color];
//                             }
    
//                             if(category in globalCatDict){
//                                 globalCatDict[category] += 1;
//                             } else {
//                                 globalCatDict[category] = 1;
//                             }
//                         }
//                     }
//                 }
                
//                 // Global patient tracking
//                 if(patientID !== 'null' && !allPatientsSet.has(patientID)){
//                     allPatientsSet.add(patientID);
//                     for(let j = 0; j < currentCat.length; j++){
//                         const cat = currentCat[j];
//                         const category = dataState.colLabels[i].category?.[cat];
//                         const exist = sampleWiseCategories.includes(cat);
                        
//                         if(category && !exist){
//                             if(category in globalCatDict){
//                                 globalCatDict[category] += 1;
//                             } else {
//                                 globalCatDict[category] = 1;
//                             }
//                         }
//                     }
//                 }
                
//                 i += 1;
//             }
            
//             // Process the last column
//             let patientID: string = 'null';
//             const metaData = dataState.colLabels[i]?.metadata;
//             if (metaData?.PatientId){
//                 patientID = metaData['PatientId'];
//             }
            
//             if(patientID !== 'null' && !patientIdSet.has(patientID)){
//                 patientIdSet.add(patientID);
//                 for(let j = 0; j < currentCat.length; j++){
//                     const cat = currentCat[j];
//                     const category = dataState.colLabels[i].category?.[cat];
                    
//                     if(category){
//                         if(category in catDict){
//                             catDict[category][0] += 1;
//                         } else {
//                             const color = dataState.colLabels[i].categoryColor?.[cat];
//                             catDict[category] = [1, color];
//                         }
//                     }
//                 }
//             }
            
//             // Sample-wise categories for last column
//             for(let j = 0; j < sampleWiseCategories.length; j++){
//                 const cat = sampleWiseCategories[j];
//                 if(currentCat.includes(cat)){
//                     const category = dataState.colLabels[i].category?.[cat];
//                     if(category){
//                         if(category in catDict){
//                             catDict[category][0] += 1;
//                         } else {
//                             const color = dataState.colLabels[i].categoryColor?.[cat];
//                             catDict[category] = [1, color];
//                         }
    
//                         if(category in globalCatDict){
//                             globalCatDict[category] += 1;
//                         } else {
//                             globalCatDict[category] = 1;
//                         }
//                     }
//                 }
//             }
            
//             // Global patient tracking for last column
//             if(patientID !== 'null' && !allPatientsSet.has(patientID)){
//                 allPatientsSet.add(patientID);
//                 for(let j = 0; j < currentCat.length; j++){
//                     const cat = currentCat[j];
//                     const category = dataState.colLabels[i].category?.[cat];
//                     const exist = sampleWiseCategories.includes(cat);
                    
//                     if(category && !exist){
//                         if(category in globalCatDict){
//                             globalCatDict[category] += 1;
//                         } else {
//                             globalCatDict[category] = 1;
//                         }
//                     }
//                 }
//             }
    
//             nodes.push(dataState.colLabels[i].text);
            
//             // Key change 5: Use the simplified rectangle contour that works
//             data.push({
//                 contour: [
//                     [xStart+5, -yOffset],
//                     [xStart, -yOffset + ht],
//                     [xStart + (TrapezoidWidth * cellWidth), -yOffset + ht],
//                     [xStart + (TrapezoidWidth * cellWidth)-5, -yOffset],
//                     // [xStart, -yOffset]
//                 ],
//                 text: String(grp),
//                 nodes: nodes,
//                 category: catDict,
//                 id: 'col-cluster',
//                 numPatients: patientIdSet.size,
//             });
    
//             i += 1;
//         }
        
//         // P-value calculation
//         if(order.colCat.length > 0){
//             for(let i = 0; i < data.length; i++){
//                 let pvalue: Record<string, number> = {};
//                 for(const [key, value] of Object.entries(data[i].category)){
//                     let pval: number;
//                     const exist = sampleWiseCategories.includes(key.split(':')[0]);
                    
//                     if(exist){
//                         const catNodes = value[0];
//                         const numNodes = data[i].nodes.length;
//                         const expectedProb = globalCatDict[key] / numColumns;
//                         pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
//                         pvalue[key] = pval;
//                     } else {
//                         const catNodes = value[0];
//                         const numNodes = data[i].numPatients;
//                         const expectedProb = globalCatDict[key] / allPatientsSet.size;
//                         pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
//                         pvalue[key] = pval;
//                     }
//                 }
//                 data[i].Pvalue = pvalue;
//             }
//         }
//     }
//         if(axis === 'row'){
//             let i = 0;
//             const currentCat = order.rowCat
//             let globalCatDict:Record<string,number> = {}
//             const offsetY = heatmapHeight/4;
    
//             while(i < numRows){
//                 const ht = 5
//                 // const xOffset = rowLabelsWidth?rowLabelsWidth/2:5
//                 let xOffset:number;
//                 if(order.rowCat.length === 0){
//                     xOffset = -labelWidth/4 + ht + INITIAL_GAP
//                 }
//                 else{
//                     xOffset = -labelWidth/4 + 7*(order.rowCat.length+1) + 3
//                 }
//                 const firstAndLastPoint = [-xOffset,i*cellHeight + cellHeight/2];
//                 const grp = dataState.rowLabels[i].group?.[sliderValue];
//                 let TrapezoidHeight = 1;
//                 const nodes: string[] = [];
//                 let catDict:Record<string, [number,string|null|undefined]> = {}
    
//                 // let Gender:Record<string, number> = {}
//                 while((i+1 < numRows) && (grp === dataState.rowLabels[i+1].group?.[sliderValue])){
//                     TrapezoidHeight += 1
//                     nodes.push(dataState.rowLabels[i].text)
//                     for(let j = 0; j < currentCat.length; j++){
//                         const cat = currentCat[j]
//                         const category = dataState.rowLabels[i].category?.[cat];
    
//                         if(category){
//                             if(category in catDict){
//                                 catDict[category][0] += 1
//                             }
//                             else{
//                                 const color = dataState.rowLabels[i].categoryColor?.[cat]
//                                 catDict[category] = [1,color]
//                             }
    
//                             if(category in globalCatDict){
//                                 globalCatDict[category] += 1
//                             }
//                             else{
//                                 globalCatDict[category] = 1
//                             }
//                         }
    
//                     }
//                     i += 1
    
//                 }
    
    
//                 nodes.push(dataState.rowLabels[i].text)
//                 for(let j = 0; j < currentCat.length; j++){
//                     const cat = currentCat[j]
//                     const category = dataState.rowLabels[i].category?.[cat];
    
//                     if(category){
//                         if(category in catDict){
//                             catDict[category][0] += 1
//                         }
//                         else{
//                             const color = dataState.rowLabels[i].categoryColor?.[cat]
//                             catDict[category] = [1,color]
//                         }
    
//                         if(category in globalCatDict){
//                             globalCatDict[category] += 1
//                         }
//                         else{
//                             globalCatDict[category] = 1
//                         }
//                     }
    
//                 }
    
//                 const secondPoint = [-xOffset,firstAndLastPoint[1] + TrapezoidHeight*cellHeight - cellHeight]
    
//                             // Then update your contour points
//                 data.push({
//                     contour: [
//                     [firstAndLastPoint[0], firstAndLastPoint[1] - offsetY],
//                     [secondPoint[0], secondPoint[1] - offsetY],
//                     [ht - xOffset, secondPoint[1] + cellHeight/2 - offsetY],
//                     [ht - xOffset, firstAndLastPoint[1] - cellHeight/2 - offsetY],
//                     // [firstAndLastPoint[0], firstAndLastPoint[1] - offsetY],
//                     ],
//                     text: String(grp),
//                     nodes: nodes,
//                     category: catDict,
//                     id: 'row-cluster',
//                 });
//                 i += 1
//             }
    
//             if(order.rowCat.length > 0){
//                 for(let i=0;i<data.length;i++){
//                     let pvalue:Record<string, number>={};
//                     for(const [key,value] of Object.entries(data[i].category)){
//                         let pval:number;
//                         const catNodes = value[0]
//                         const numNodes = data[i].nodes.length
//                         const expectedProb = globalCatDict[key]/numRows
    
//                         pval = numNodes?binom_test(catNodes,numNodes,expectedProb):0;
//                         pvalue[key] = pval
//                     // }
//                     } 
//                         data[i].Pvalue = pvalue
//                 }
    
//             }
//         }


//          console.log('&&&&&&&&& data in the cluster layer is as follows &&&&&&&&',data)
//         return new PolygonLayer({
//           id: axis === 'row' ? 'row-clusters' : 'col-clusters',
//           viewId: axis === "row" ? IDS.VIEWS.ROW_LABELS:IDS.VIEWS.COL_LABELS, // 'heatmap-grid-view'
//           data: data,
//           pickable: true,
//         //   stroked: false,
//           filled: true,
//           wireframe: debug,
//           getPolygon: (d) => d.contour,
//           getFillColor: [211, 211, 211],
//           getLineColor: [211, 211, 211], // Change this to white
//           getLineWidth: 0.5, // You can adjust the width as needed
//         //   onClick,
//         //   onClick: (event) => { console.log(event); return true; },
//           autoHighlight: true,
//           transitions: {
//             getFillColor: {
//               type: 'interpolation',
//               duration: 2000,
//               easing: (t: number) => t,
//             },
//           },
//           updateTriggers: {
//             data: [dataState.colLabels,sliderValue],
//           },
//         });
//       }
//       return null;
//     }
    
import { PolygonLayer } from '@deck.gl/layers/typed';
import { IDS,INITIAL_GAP, LAYER_GAP } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape, order } from '../../types';
import { binom_test } from '../../utils/binom_test';
import { CATEGORY_LAYER_HEIGHT } from "../../const";


interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

type CellDatum = {
    contour: number[][];
    text: string|undefined;
    nodes: string[];
    category :Record<string, [number,string|null|undefined]>;
    id: string;
    Pvalue?: Record<string, number>|null;
    numPatients?: number;
}

export function getClusterLayer(
  dataState: DataStateShape,
  heatmapState: HeatmapStateShape | null,
  onClick: OnClickType,
  axis: string = 'col',
  order: order,
  sliderValue: number = 5,
  labelWidth: number,
  filteredIdxDict?: CropBox | null, // Add filtering parameter
  debug?: boolean,
) {
   
  if (heatmapState?.cellData && dataState) {
    const { numColumns, numRows } = dataState;
    const { width: cellWidth, height: cellHeight } = heatmapState.cellDimensions;
    const heatmapHeight = heatmapState.height;

    const data: CellDatum[] = [];

    if (axis === 'col') {
        // Determine the range of columns to process based on filtering
        const startCol = filteredIdxDict ? filteredIdxDict.startX : 0;
        const endCol = filteredIdxDict ? filteredIdxDict.endX : numColumns - 1;
        const filteredNumColumns = endCol - startCol + 1;

        let i = startCol;
        const allPatientsSet: Set<string> = new Set();
        const sampleWiseCategories = ['Timepoint','PatientId'];
        let globalCatDict: Record<string, number> = {};
        
        const offsetX = heatmapState.width/4;
    
        while (i <= endCol) {
            const ht = 15;
            
            let yOffset = 10;
            if (order.colCat.length > 0) {
                yOffset = 10 + 5 * order.colCat.length;
            }
            
            // Calculate shifted position for cluster
            const newColIndex = filteredIdxDict ? (i - filteredIdxDict.startX) : i;
            const xStart = newColIndex * cellWidth - offsetX;
            
            const grp = dataState.colLabels[i].group?.[sliderValue];
            let TrapezoidWidth = 1;
            const nodes: string[] = [];
            const currentCat = order.colCat;

            let catDict: Record<string, [number, string|null|undefined]> = {};
            const patientIdSet: Set<string> = new Set();
    
            // Process columns in the same cluster (within filtered range)
            while ((i + 1 <= endCol) && (grp === dataState.colLabels[i + 1].group?.[sliderValue])) {
                TrapezoidWidth += 1;
                nodes.push(dataState.colLabels[i].text);
                
                // Patient ID processing
                let patientID: string = 'null';
                const metaData = dataState.colLabels[i]?.metadata;
                if (metaData?.PatientId) {
                    patientID = metaData['PatientId'];
                }
                
                if (patientID !== 'null' && !patientIdSet.has(patientID)) {
                    patientIdSet.add(patientID);
                    for (let j = 0; j < currentCat.length; j++) {
                        const cat = currentCat[j];
                        const category = dataState.colLabels[i].category?.[cat];
                        const exist = sampleWiseCategories.includes(cat);
                        
                        if (category && !exist) {
                            if (category in catDict) {
                                catDict[category][0] += 1;
                            } else {
                                const color = dataState.colLabels[i].categoryColor?.[cat];
                                catDict[category] = [1, color];
                            }
                        }
                    }
                }
                
                // Sample-wise categories processing
                for (let j = 0; j < sampleWiseCategories.length; j++) {
                    const cat = sampleWiseCategories[j];
                    if (currentCat.includes(cat)) {
                        const category = dataState.colLabels[i].category?.[cat];
                        if (category) {
                            if (category in catDict) {
                                catDict[category][0] += 1;
                            } else {
                                const color = dataState.colLabels[i].categoryColor?.[cat];
                                catDict[category] = [1, color];
                            }
    
                            if (category in globalCatDict) {
                                globalCatDict[category] += 1;
                            } else {
                                globalCatDict[category] = 1;
                            }
                        }
                    }
                }
                
                // Global patient tracking
                if (patientID !== 'null' && !allPatientsSet.has(patientID)) {
                    allPatientsSet.add(patientID);
                    for (let j = 0; j < currentCat.length; j++) {
                        const cat = currentCat[j];
                        const category = dataState.colLabels[i].category?.[cat];
                        const exist = sampleWiseCategories.includes(cat);
                        
                        if (category && !exist) {
                            if (category in globalCatDict) {
                                globalCatDict[category] += 1;
                            } else {
                                globalCatDict[category] = 1;
                            }
                        }
                    }
                }
                
                i += 1;
            }
            
            // Process the last column in cluster
            let patientID: string = 'null';
            const metaData = dataState.colLabels[i]?.metadata;
            if (metaData?.PatientId) {
                patientID = metaData['PatientId'];
            }
            
            if (patientID !== 'null' && !patientIdSet.has(patientID)) {
                patientIdSet.add(patientID);
                for (let j = 0; j < currentCat.length; j++) {
                    const cat = currentCat[j];
                    const category = dataState.colLabels[i].category?.[cat];
                    
                    if (category) {
                        if (category in catDict) {
                            catDict[category][0] += 1;
                        } else {
                            const color = dataState.colLabels[i].categoryColor?.[cat];
                            catDict[category] = [1, color];
                        }
                    }
                }
            }
            
            // Sample-wise categories for last column
            for (let j = 0; j < sampleWiseCategories.length; j++) {
                const cat = sampleWiseCategories[j];
                if (currentCat.includes(cat)) {
                    const category = dataState.colLabels[i].category?.[cat];
                    if (category) {
                        if (category in catDict) {
                            catDict[category][0] += 1;
                        } else {
                            const color = dataState.colLabels[i].categoryColor?.[cat];
                            catDict[category] = [1, color];
                        }

                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    }
                }
            }
            
            // Global patient tracking for last column
            if (patientID !== 'null' && !allPatientsSet.has(patientID)) {
                allPatientsSet.add(patientID);
                for (let j = 0; j < currentCat.length; j++) {
                    const cat = currentCat[j];
                    const category = dataState.colLabels[i].category?.[cat];
                    const exist = sampleWiseCategories.includes(cat);
                    
                    if (category && !exist) {
                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    }
                }
            }

            nodes.push(dataState.colLabels[i].text);
            
            data.push({
                contour: [
                    [xStart + 5, -yOffset],
                    [xStart, -yOffset + ht],
                    [xStart + (TrapezoidWidth * cellWidth), -yOffset + ht],
                    [xStart + (TrapezoidWidth * cellWidth) - 5, -yOffset],
                ],
                text: String(grp),
                nodes: nodes,
                category: catDict,
                id: 'col-cluster',
                numPatients: patientIdSet.size,
            });

            i += 1;
        }
        
        // P-value calculation (use filtered column count)
        if (order.colCat.length > 0) {
            for (let i = 0; i < data.length; i++) {
                let pvalue: Record<string, number> = {};
                for (const [key, value] of Object.entries(data[i].category)) {
                    let pval: number;
                    const exist = sampleWiseCategories.includes(key.split(':')[0]);
                    
                    if (exist) {
                        const catNodes = value[0];
                        const numNodes = data[i].nodes.length;
                        const expectedProb = globalCatDict[key] / filteredNumColumns;
                        pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
                        pvalue[key] = pval;
                    } else {
                        const catNodes = value[0];
                        const numNodes = data[i].numPatients;
                        const expectedProb = globalCatDict[key] / allPatientsSet.size;
                        pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
                        pvalue[key] = pval;
                    }
                }
                data[i].Pvalue = pvalue;
            }
        }
    }

    if (axis === 'row') {
        // Determine the range of rows to process based on filtering
        const startRow = filteredIdxDict ? filteredIdxDict.startY : 0;
        const endRow = filteredIdxDict ? filteredIdxDict.endY : numRows - 1;
        const filteredNumRows = endRow - startRow + 1;

        let i = startRow;
        const currentCat = order.rowCat;
        let globalCatDict: Record<string, number> = {};
        const offsetY = heatmapHeight / 4;

        while (i <= endRow) {
            const ht = 5;
            let xOffset: number;
            if (order.rowCat.length === 0) {
                xOffset = -labelWidth / 4 + ht + INITIAL_GAP;
            } else {
                xOffset = -labelWidth / 4 + order.rowCat.length * (CATEGORY_LAYER_HEIGHT + LAYER_GAP) + CATEGORY_LAYER_HEIGHT;
            }
            
            // Calculate shifted position for cluster
            const newRowIndex = filteredIdxDict ? (i - filteredIdxDict.startY) : i;
            const firstAndLastPoint = [-xOffset, newRowIndex * cellHeight + cellHeight / 2];
            
            const grp = dataState.rowLabels[i].group?.[sliderValue];
            let TrapezoidHeight = 1;
            const nodes: string[] = [];
            let catDict: Record<string, [number, string|null|undefined]> = {};

            // Process rows in the same cluster (within filtered range)
            while ((i + 1 <= endRow) && (grp === dataState.rowLabels[i + 1].group?.[sliderValue])) {
                TrapezoidHeight += 1;
                nodes.push(dataState.rowLabels[i].text);
                for (let j = 0; j < currentCat.length; j++) {
                    const cat = currentCat[j];
                    const category = dataState.rowLabels[i].category?.[cat];

                    if (category) {
                        if (category in catDict) {
                            catDict[category][0] += 1;
                        } else {
                            const color = dataState.rowLabels[i].categoryColor?.[cat];
                            catDict[category] = [1, color];
                        }

                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    }
                }
                i += 1;
            }

            nodes.push(dataState.rowLabels[i].text);
            for (let j = 0; j < currentCat.length; j++) {
                const cat = currentCat[j];
                const category = dataState.rowLabels[i].category?.[cat];

                if (category) {
                    if (category in catDict) {
                        catDict[category][0] += 1;
                    } else {
                        const color = dataState.rowLabels[i].categoryColor?.[cat];
                        catDict[category] = [1, color];
                    }

                    if (category in globalCatDict) {
                        globalCatDict[category] += 1;
                    } else {
                        globalCatDict[category] = 1;
                    }
                }
            }

            const secondPoint = [-xOffset, firstAndLastPoint[1] + TrapezoidHeight * cellHeight - cellHeight];

            data.push({
                contour: [
                    [firstAndLastPoint[0], firstAndLastPoint[1] - offsetY],
                    [secondPoint[0], secondPoint[1] - offsetY],
                    [ht - xOffset, secondPoint[1] + cellHeight / 2 - offsetY],
                    [ht - xOffset, firstAndLastPoint[1] - cellHeight / 2 - offsetY],
                ],
                text: String(grp),
                nodes: nodes,
                category: catDict,
                id: 'row-cluster',
            });
            i += 1;
        }

        // P-value calculation (use filtered row count)
        if (order.rowCat.length > 0) {
            for (let i = 0; i < data.length; i++) {
                let pvalue: Record<string, number> = {};
                for (const [key, value] of Object.entries(data[i].category)) {
                    let pval: number;
                    const catNodes = value[0];
                    const numNodes = data[i].nodes.length;
                    const expectedProb = globalCatDict[key] / filteredNumRows;

                    pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
                    pvalue[key] = pval;
                }
                data[i].Pvalue = pvalue;
            }
        }
    }

    return new PolygonLayer({
      id: axis === 'row' ? 'row-clusters' : 'col-clusters',
      viewId: axis === "row" ? IDS.VIEWS.ROW_LABELS : IDS.VIEWS.COL_LABELS,
      data: data,
      pickable: true,
      filled: true,
      wireframe: debug,
      getPolygon: (d) => d.contour,
      getFillColor: [211, 211, 211],
      getLineColor: [211, 211, 211],
      getLineWidth: 0.5,
      autoHighlight: true,
      transitions: {
        getFillColor: {
          type: 'interpolation',
          duration: 2000,
          easing: (t: number) => t,
        },
      },
      updateTriggers: {
        data: [
          axis === 'col' ? dataState.colLabels : dataState.rowLabels,
          sliderValue,
          filteredIdxDict // Add filteredIdxDict to trigger updates
        ],
      },
    });
  }
  return null;
}