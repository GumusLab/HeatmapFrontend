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
//             const grp = dataState.colLabels[i].group?.[sliderValue - 1];
//             let TrapezoidWidth = 1;
//             const nodes: string[] = [];
//             const currentCat = order.colCat;

//             console.log('****** currentCat is ********',currentCat)
//             let catDict: Record<string, [number, string|null|undefined]> = {};
//             const patientIdSet: Set<string> = new Set();
    
//             // Process columns in the same cluster
//             while((i+1 < numColumns) && (grp === dataState.colLabels[i+1].group?.[sliderValue - 1])){
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
//                 const grp = dataState.rowLabels[i].group?.[sliderValue - 1];
//                 let TrapezoidHeight = 1;
//                 const nodes: string[] = [];
//                 let catDict:Record<string, [number,string|null|undefined]> = {}
    
//                 // let Gender:Record<string, number> = {}
//                 while((i+1 < numRows) && (grp === dataState.rowLabels[i+1].group?.[sliderValue - 1])){
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
import { IDS, INITIAL_GAP, LAYER_GAP, BASE_ZOOM, CATEGORY_LAYER_HEIGHT, CLUSTER_LAYER_HEIGHT, CLUSTER_LAYER_GAP } from '../../const';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape, order } from '../../types';
import { binom_test } from '../../utils/binom_test';


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

// Auto-detect patient/individual identifier from metadata keys
const PATIENT_ID_PATTERNS = [
    'patientid', 'patient_id', 'patient',
    'subjectid', 'subject_id', 'subject',
    'donorid', 'donor_id', 'donor',
    'individualid', 'individual_id', 'individual',
    'participantid', 'participant_id', 'participant',
    'personid', 'person_id', 'person'
];

function detectPatientIdentifierKey(metadata: Record<string, string> | null | undefined): string | null {
    if (!metadata) return null;

    const metadataKeys = Object.keys(metadata);
    for (const key of metadataKeys) {
        const keyLower = key.toLowerCase().replace(/[-\s]/g, '_');
        if (PATIENT_ID_PATTERNS.includes(keyLower)) {
            return key; // Return the original key (case-sensitive)
        }
    }
    return null;
}

// Sample-wise categories that should always count every sample (not deduplicated by patient)
const SAMPLE_WISE_CATEGORY_PATTERNS = ['timepoint', 'time_point', 'time', 'day', 'visit', 'week'];

function isSampleWiseCategory(categoryName: string): boolean {
    const nameLower = categoryName.toLowerCase().replace(/[-\s]/g, '_');
    return SAMPLE_WISE_CATEGORY_PATTERNS.some(pattern => nameLower.includes(pattern));
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
    const heatmapWidth = heatmapState.width;
    const heatmapHeight = heatmapState.height;

    const data: CellDatum[] = [];

    if (axis === 'col') {
        // Determine the range of columns to process based on filtering
        const startCol = filteredIdxDict ? filteredIdxDict.startX : 0;
        const endCol = filteredIdxDict ? filteredIdxDict.endX : numColumns - 1;
        const filteredNumColumns = endCol - startCol + 1;

        let i = startCol;
        const allPatientsSet: Set<string> = new Set();
        let globalCatDict: Record<string, number> = {};

        // Auto-detect patient identifier from the first column's metadata
        const firstColMetadata = dataState.colLabels[startCol]?.metadata;
        const patientIdKey = detectPatientIdentifierKey(firstColMetadata);
        const hasPatientIdentifier = patientIdKey !== null;

        // Log detection result for debugging
        if (hasPatientIdentifier) {
            console.log(`🔍 Auto-detected patient identifier: "${patientIdKey}"`);
        } else {
            console.log('🔍 No patient identifier found - treating all samples as unique individuals');
        }

        // Generic centering calculation based on BASE_ZOOM
        const baseScaleFactor = Math.pow(2, BASE_ZOOM);
        const labelSpaceCentering = labelWidth / 2 / baseScaleFactor;

        // Always use heatmap (view) dimensions for centering
        const offsetX = heatmapWidth / 2 / baseScaleFactor;

        while (i <= endCol) {
            const ht = CLUSTER_LAYER_HEIGHT;

            // Calculate yOffset to position cluster just above the heatmap
            // Use labelSpaceCentering similar to row cluster for proper alignment
            let yOffset = -labelSpaceCentering + CLUSTER_LAYER_HEIGHT;            
            // Calculate shifted position for cluster
            const newColIndex = filteredIdxDict ? (i - filteredIdxDict.startX) : i;
            const xStart = newColIndex * cellWidth - offsetX;
            
            const grp = dataState.colLabels[i].group?.[sliderValue - 1];
            let TrapezoidWidth = 1;
            const nodes: string[] = [];
            const currentCat = order.colCat;

            let catDict: Record<string, [number, string|null|undefined]> = {};
            const patientIdSet: Set<string> = new Set();
    
            // Process columns in the same cluster (within filtered range)
            while ((i + 1 <= endCol) && (grp === dataState.colLabels[i + 1].group?.[sliderValue - 1])) {
                TrapezoidWidth += 1;
                nodes.push(dataState.colLabels[i].text);

                // Get patient ID if available (using auto-detected key)
                let patientID: string | null = null;
                const metaData = dataState.colLabels[i]?.metadata;
                if (hasPatientIdentifier && patientIdKey && metaData?.[patientIdKey]) {
                    patientID = metaData[patientIdKey];
                }

                // Process each category
                for (let j = 0; j < currentCat.length; j++) {
                    const cat = currentCat[j];
                    const category = dataState.colLabels[i].category?.[cat];
                    if (!category) continue;

                    const isSampleWise = isSampleWiseCategory(cat);

                    // Determine if this category should count for this sample
                    let shouldCount = false;

                    if (!hasPatientIdentifier) {
                        // No patient identifier - count every sample for all categories
                        shouldCount = true;
                    } else if (isSampleWise) {
                        // Sample-wise category (e.g., Timepoint) - count every sample
                        shouldCount = true;
                    } else if (patientID && !patientIdSet.has(patientID)) {
                        // Patient-wise category - only count first occurrence of each patient
                        shouldCount = true;
                    }

                    if (shouldCount) {
                        if (category in catDict) {
                            catDict[category][0] += 1;
                        } else {
                            const color = dataState.colLabels[i].categoryColor?.[cat];
                            catDict[category] = [1, color];
                        }
                    }

                    // Global category tracking for p-value calculation
                    if (!hasPatientIdentifier || isSampleWise) {
                        // Count every sample
                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    } else if (patientID && !allPatientsSet.has(patientID)) {
                        // Patient-wise - count once per patient globally
                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    }
                }

                // Track unique patients for this cluster and globally
                if (patientID && !patientIdSet.has(patientID)) {
                    patientIdSet.add(patientID);
                }
                if (patientID && !allPatientsSet.has(patientID)) {
                    allPatientsSet.add(patientID);
                }

                i += 1;
            }
            
            // Process the last column in cluster (same logic as inner loop)
            {
                const lastMetaData = dataState.colLabels[i]?.metadata;
                let lastPatientID: string | null = null;
                if (hasPatientIdentifier && patientIdKey && lastMetaData?.[patientIdKey]) {
                    lastPatientID = lastMetaData[patientIdKey];
                }

                // Process each category for the last column
                for (let j = 0; j < currentCat.length; j++) {
                    const cat = currentCat[j];
                    const category = dataState.colLabels[i].category?.[cat];
                    if (!category) continue;

                    const isSampleWise = isSampleWiseCategory(cat);

                    let shouldCount = false;

                    if (!hasPatientIdentifier) {
                        shouldCount = true;
                    } else if (isSampleWise) {
                        shouldCount = true;
                    } else if (lastPatientID && !patientIdSet.has(lastPatientID)) {
                        shouldCount = true;
                    }

                    if (shouldCount) {
                        if (category in catDict) {
                            catDict[category][0] += 1;
                        } else {
                            const color = dataState.colLabels[i].categoryColor?.[cat];
                            catDict[category] = [1, color];
                        }
                    }

                    // Global category tracking
                    if (!hasPatientIdentifier || isSampleWise) {
                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    } else if (lastPatientID && !allPatientsSet.has(lastPatientID)) {
                        if (category in globalCatDict) {
                            globalCatDict[category] += 1;
                        } else {
                            globalCatDict[category] = 1;
                        }
                    }
                }

                // Track unique patients
                if (lastPatientID && !patientIdSet.has(lastPatientID)) {
                    patientIdSet.add(lastPatientID);
                }
                if (lastPatientID && !allPatientsSet.has(lastPatientID)) {
                    allPatientsSet.add(lastPatientID);
                }
            }

            nodes.push(dataState.colLabels[i].text);
            
            // Handle undefined group names at higher dendrogram levels
            const clusterName = grp !== undefined ? String(grp) : `Cluster ${data.length + 1}`;
            
            data.push({
                contour: [
                    [xStart + 5, -yOffset],
                    [xStart, -yOffset + ht],
                    [xStart + (TrapezoidWidth * cellWidth), -yOffset + ht],
                    [xStart + (TrapezoidWidth * cellWidth) - 5, -yOffset],
                ],
                text: clusterName,
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
                    const categoryName = key.split(':')[0];
                    const isSampleWise = isSampleWiseCategory(categoryName);

                    if (!hasPatientIdentifier || isSampleWise) {
                        // Sample-wise: use column count
                        const catNodes = value[0];
                        const numNodes = data[i].nodes.length;
                        const expectedProb = globalCatDict[key] / filteredNumColumns;
                        pval = numNodes ? binom_test(catNodes, numNodes, expectedProb) : 0;
                        pvalue[key] = pval;
                    } else {
                        // Patient-wise: use patient count
                        const catNodes = value[0];
                        const numNodes = data[i].numPatients;
                        const totalPatients = allPatientsSet.size || 1; // Avoid division by zero
                        const expectedProb = globalCatDict[key] / totalPatients;
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

        // Generic centering calculation based on BASE_ZOOM
        const baseScaleFactor = Math.pow(2, BASE_ZOOM);
        const labelSpaceCentering = labelWidth / 2 / baseScaleFactor;

        // Always use heatmap (view) dimensions for centering
        const offsetY = heatmapHeight / 2 / baseScaleFactor;

        while (i <= endRow) {
            const ht = CLUSTER_LAYER_HEIGHT;

            // Calculate xOffset to position cluster just left of the heatmap
            // For now, use a simple offset like column clusters
            // TODO: Account for labelSpaceCentering properly
            // const xOffset = -CLUSTER_LAYER_HEIGHT;
            const xOffset = -labelSpaceCentering + CLUSTER_LAYER_HEIGHT;



            
            // Calculate shifted position for cluster
            const newRowIndex = filteredIdxDict ? (i - filteredIdxDict.startY) : i;
            const firstAndLastPoint = [-xOffset, newRowIndex * cellHeight + cellHeight / 2];
            
            const grp = dataState.rowLabels[i].group?.[sliderValue - 1];
            let TrapezoidHeight = 1;
            const nodes: string[] = [];
            let catDict: Record<string, [number, string|null|undefined]> = {};

            // Process rows in the same cluster (within filtered range)
            while ((i + 1 <= endRow) && (grp === dataState.rowLabels[i + 1].group?.[sliderValue - 1])) {
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

            // Handle undefined group names at higher dendrogram levels
            const clusterName = grp !== undefined ? String(grp) : `Cluster ${data.length + 1}`;

            data.push({
                contour: [
                    [firstAndLastPoint[0], firstAndLastPoint[1] - offsetY],
                    [secondPoint[0], secondPoint[1] - offsetY],
                    [ht - xOffset, secondPoint[1] + cellHeight / 2 - offsetY],
                    [ht - xOffset, firstAndLastPoint[1] - cellHeight / 2 - offsetY],
                ],
                text: clusterName,
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
      onClick: (info, event) => {
        if (info.object && onClick) {
          // Call the onClick handler
          onClick(info, event);
          // Return true to consume the event and prevent propagation
          return true;
        }
        return false;
      },
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