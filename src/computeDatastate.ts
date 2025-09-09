// data-worker.ts (or a separate file you import into your worker)
// import { transformClustergrammerData } from './state/helpers/transformClustergrammerData';


import { DataStateShape } from './types';
// Helper function to clean label names
function cleanLabelName(name: string) {
  return name;
  // return name.replace(/(.*:)/, '').trim();
}

// Apply regular sorting to row and column indices
function applyRegularSorting(
  rowIndices: number[],
  colIndices: number[],
  order: any,
  jsonData: any,
  rowNodeMap: Map<string, any>,
  colNodeMap: Map<string, any>
) {
  // Row sorting
  switch (order.row) {
    case 'sum':
      rowIndices.sort((a, b) => {
        const sumA = colIndices.reduce((acc, colIdx) => acc + (jsonData.mat[a][colIdx] || 0), 0);
        const sumB = colIndices.reduce((acc, colIdx) => acc + (jsonData.mat[b][colIdx] || 0), 0);
        return sumB - sumA;
      });
      break;
    case 'alphabetically':
      rowIndices.sort((a, b) => cleanLabelName(jsonData.row_nodes[a].name).localeCompare(cleanLabelName(jsonData.row_nodes[b].name)));
      break;
    case 'variance':
      rowIndices.sort((a, b) => {
        const rowDataA = colIndices.map(colIdx => jsonData.mat[a][colIdx]);
        const rowDataB = colIndices.map(colIdx => jsonData.mat[b][colIdx]);
        return calculateVariance(rowDataB) - calculateVariance(rowDataA);
      });
      break;
    case 'cluster':
      if (jsonData.row_nodes) {
        rowIndices.sort((a, b) => (jsonData.row_nodes[b]?.clust || 0) - (jsonData.row_nodes[a]?.clust || 0));
      }
      break;
  }

  // Column sorting
  switch (order.col) {
    case 'sum':
      colIndices.sort((a, b) => {
        const sumA = rowIndices.reduce((acc, rowIdx) => acc + (jsonData.mat[rowIdx][a] || 0), 0);
        const sumB = rowIndices.reduce((acc, rowIdx) => acc + (jsonData.mat[rowIdx][b] || 0), 0);
        return sumB - sumA;
      });
      break;
    case 'alphabetically':
      colIndices.sort((a, b) => cleanLabelName(jsonData.col_nodes[a].name).localeCompare(cleanLabelName(jsonData.col_nodes[b].name)));
      break;
    case 'variance':
      colIndices.sort((a, b) => {
        const colDataA = rowIndices.map(rowIdx => jsonData.mat[rowIdx][a]);
        const colDataB = rowIndices.map(rowIdx => jsonData.mat[rowIdx][b]);
        return calculateVariance(colDataB) - calculateVariance(colDataA);
      });
      break;
    case 'cluster':
      if (jsonData.col_nodes) {
        colIndices.sort((a, b) => (jsonData.col_nodes[b]?.clust || 0) - (jsonData.col_nodes[a]?.clust || 0));
      }
      break;
  }
}

// Apply category-based sorting to row and column indices
function applyCategorySorting(
  rowIndices: number[],
  colIndices: number[],
  order: any,
  jsonData: any,
  categories: any
) {
  // Column category sorting
  if (order.sortByColCat.trim().length > 0) {
    const indexName = categories.col[order.sortByColCat];
    let indexStringArray = indexName.split("-");
    indexStringArray.push('index');
    let idxString = indexStringArray.join("_");
    
    colIndices.sort((a, b) => (jsonData.col_nodes[a][idxString] || 0) - (jsonData.col_nodes[b][idxString] || 0));
  }
  
  // Row category sorting
  if (order.sortByRowCat.trim().length > 0) {
    const indexName = categories.row[order.sortByRowCat];
    rowIndices.sort((a, b) => (jsonData.row_nodes[a][indexName] || 0) - (jsonData.row_nodes[b][indexName] || 0));
  }
}


function calculateVariance(data: (number | null)[]): number {
  // Filter out null/undefined values and treat them as numbers
  const validData = data.filter(d => d !== null) as number[];
  if (validData.length === 0) {
    return 0; // Or handle as you see fit
  }
  const mean = validData.reduce((a, b) => a + b, 0) / validData.length;
  return validData.reduce((a, b) => a + (b - mean) ** 2, 0) / validData.length;
}

/**
 * Build an object mapping each category in `cat` to the corresponding value
 * on the given node using the keys from `catIndex`.
 */
function getCategory(node: any, cat: string[], catIndex: string[]): { [key: string]: string } {
  const categories: { [key: string]: string } = {};
  for (let i = 0; i < cat.length; i++) {
    categories[cat[i]] = node[catIndex[i]];
  }
  return categories;
}

/**
 * Build an object mapping each category in `cat` to a color value based on the
 * provided colors lookup.
 */
function getColor(node: any, colors: any, catIndex: string[], cat: string[]): { [key: string]: string } {
  const catColors: { [key: string]: string } = {};
  for (let i = 0; i < cat.length; i++) {
    catColors[cat[i]] = colors[catIndex[i]][node[catIndex[i]]];
  }
  return catColors;
}

/**
 * Sorts the data based on the order criteria.
 */
function sortData(
  data: Record<string, Record<string, number>>,
  order: {
    row: string;
    col: string;
    rowCat: string[];
    sortByRowCat: string;
    colCat: string[];
    sortByColCat: string;
  },
  jsonData: any,
  rowNodeMap: Map<string, any>,
  colNodeMap: Map<string, any>
): Record<string, Record<string, number>> {
  let sortedRows = Object.keys(data);
  let sortedCols = Object.keys(data[sortedRows[0]]);

  // Row sorting
  switch (order.row) {
    case 'sum':
      // sortedRows.sort((a, b) => {
      //   const sumA = Object.values(data[a]).reduce((acc, val) => acc + val, 0);
      //   const sumB = Object.values(data[b]).reduce((acc, val) => acc + val, 0);
      //   return sumB - sumA;
      // });
      sortedRows.sort((a, b) => {
        const sumA = Object.values(data[a]).reduce((acc, val) => acc + (val || 0), 0);
        const sumB = Object.values(data[b]).reduce((acc, val) => acc + (val || 0), 0);
        return sumB - sumA;
      });
      break;
    case 'alphabetically':
      sortedRows.sort();
      break;
    case 'variance':
      sortedRows.sort((a, b) => calculateVariance(Object.values(data[b])) - calculateVariance(Object.values(data[a])));
      break;
    case 'cluster':
      if (jsonData.row_nodes) {
        sortedRows.sort((a, b) => (rowNodeMap.get(b)?.clust || 0) - (rowNodeMap.get(a)?.clust || 0));
      }
      break;
  }

  // Column sorting
  switch (order.col) {
    case 'sum':
      sortedCols.sort((a, b) => {
        const sumA = sortedRows.reduce((acc, row) => acc + (data[row][a] || 0), 0);
        const sumB = sortedRows.reduce((acc, row) => acc + (data[row][b] || 0), 0);
        return sumB - sumA;
      });

      break;
    case 'alphabetically':
      sortedCols.sort();
      break;
    case 'variance':
      sortedCols.sort(
        (a, b) =>
          calculateVariance(sortedRows.map((row) => data[row][b])) -
          calculateVariance(sortedRows.map((row) => data[row][a]))
      );
      break;
    case 'cluster':
      if (jsonData.col_nodes) {
        sortedCols.sort((a, b) => (colNodeMap.get(b)?.clust || 0) - (colNodeMap.get(a)?.clust || 0));
      }
      break;
  }

  // Reorder data based on the sorted rows and columns
  const newData: Record<string, Record<string, number>> = {};
  sortedRows.forEach((row) => {
    newData[row] = {};
    sortedCols.forEach((col) => {
      newData[row][col] = data[row][col];
    });
  });

  return newData;
}


  // Modified sortByCat to work with regular objects instead of Maps
  function sortByCat(
    data: Record<string, Record<string, number>>,
    order: {
      row: string;
      col: string;
      rowCat: string[];
      sortByRowCat: string;
      colCat: string[];
      sortByColCat: string;
    },
    jsonData: any,
    categories: {row: { [key: string]: string }, col: { [key: string]: string }}
  ): Record<string, Record<string, number>> {
  
  let sortedDataCat: Record<string, Record<string, number>> = {};
  const rows = Object.keys(data);

  if(jsonData.row_nodes && jsonData.col_nodes && jsonData.mat) {
    if(order.sortByColCat.trim().length > 0) {
      const indexName = categories.col[order.sortByColCat];
      let indexStringArray = indexName.split("-");
      indexStringArray.push('index');
      let idxString = indexStringArray.join("_");
      
      const colNodes: [string, number][] = jsonData.col_nodes.map((d:any) => [d.name, d[idxString]]);
      const sortedCols = colNodes.sort((a, b) => a[1] - b[1]);
      
      rows.forEach((rowLabel) => {
        sortedDataCat[rowLabel] = {};
        sortedCols.forEach((colLabel) => {
          sortedDataCat[rowLabel][colLabel[0]] = data[rowLabel][colLabel[0]];
        });
      });
    }
    
    if(order.sortByRowCat.trim().length > 0) {
      const indexName = categories.row[order.sortByRowCat];
      const rowNodes: [string, number][] = jsonData.row_nodes.map((d:any) => [d.name, d[indexName]]);
      const sortedRows = rowNodes.sort((a, b) => a[1] - b[1]);

      if(Object.keys(sortedDataCat).length > 0) {
        let sortedDataCombined: Record<string, Record<string, number>> = {};
        const columns = Object.keys(sortedDataCat[rows[0]]);
        
        sortedRows.forEach((row) => {
          sortedDataCombined[row[0]] = {};
          columns.forEach((col) => {
            sortedDataCombined[row[0]][col] = sortedDataCat[row[0]][col];
          });
        });
        
        return sortedDataCombined;
      } else {
        const columns = Object.keys(data[rows[0]]);
        let newSortedData: Record<string, Record<string, number>> = {};
        
        sortedRows.forEach((row) => {
          newSortedData[row[0]] = {};
          columns.forEach((col) => {
            newSortedData[row[0]][col] = data[row[0]][col];
          });
        });
        
        return newSortedData;
      }
    }
    
    return Object.keys(sortedDataCat).length > 0 ? sortedDataCat : data;
  } else {
    return data;
  }
}

/**
 * Pure function that computes the data state from the given JSON data,
 * order, and categories.
 */
// interface filteredIdxDict {
//   startX: number;
//   startY: number;
//   endX: number;
//   endY: number;
// }
export function computeDataState(
  jsonData: any,
  order: {
    row: string;
    col: string;
    rowCat: string[];
    sortByRowCat: string;
    colCat: string[];
    sortByColCat: string;
  },
  categories: { row: { [key: string]: string }; col: { [key: string]: string } },
  // filteredIdxDict:filteredIdxDict|null
): DataStateShape | null {
  if (!jsonData || !jsonData.mat || !jsonData.mat.length) return null;

  // Create node maps from row_nodes and col_nodes
  const rowNodeMap = new Map<string, any>();
  if (jsonData.row_nodes) {
    jsonData.row_nodes.forEach((node: { name: string }) => {
      rowNodeMap.set(node.name, node);
    });
  }
  const colNodeMap = new Map<string, any>();
  if (jsonData.col_nodes) {
    jsonData.col_nodes.forEach((node: { name: string }) => {
      colNodeMap.set(node.name, node);
    });
  }

  // Transform the data using your helper function
  // let transformedData = transformClustergrammerData(jsonData);
  let transformedData = null;

  // Create arrays of row and column indices instead of nested objects
  const numRows = jsonData.row_nodes.length;
  const numColumns = jsonData.col_nodes.length;
  let rowIndices = Array.from({ length: numRows }, (_, i) => i);
  let colIndices = Array.from({ length: numColumns }, (_, i) => i);

  


  // Sort the data based on the provided order and node maps
  // transformedData = sortData(transformedData, order, jsonData, rowNodeMap, colNodeMap);

  // Check if we need category-based sorting
// const needsCategorySorting = order.sortByRowCat.trim().length > 0 || order.sortByColCat.trim().length > 0;

// if (needsCategorySorting) {
//   // Apply category-based sorting directly
//   transformedData = sortByCat(transformedData, order, jsonData, categories);
// } else {
//   // Apply regular sorting if no category sorting is needed
//   transformedData = sortData(transformedData, order, jsonData, rowNodeMap, colNodeMap);
// }


// Apply sorting to indices instead of creating nested objects
const needsCategorySorting = order.sortByRowCat.trim().length > 0 || order.sortByColCat.trim().length > 0;

if (needsCategorySorting) {
  // Apply category-based sorting to indices
  applyCategorySorting(rowIndices, colIndices, order, jsonData, categories);
} else {
  // Apply regular sorting to indices
  applyRegularSorting(rowIndices, colIndices, order, jsonData, rowNodeMap, colNodeMap);
}

  // Extract rows and columns, and compute dimensions
  // const rows = Object.keys(transformedData);
  // const columns = Object.keys(transformedData[rows[0]]);
  // const numRows = rows.length;
  // const numColumns = columns.length;

  // Build the Float32Array for heatmap values and compute min/max
  const values = new Float32Array(numRows * numColumns);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;


  // rows.forEach((row, rowIndex) => {
  //   columns.forEach((col, colIndex) => {
  //     const rawVal = transformedData[row][col];
  //     // If rawVal is null, it becomes NaN. Otherwise, it's a number.
  //     const val = rawVal === null ? NaN : parseFloat(rawVal.toFixed(2));
  
  //     values[rowIndex * numColumns + colIndex] = val;
  
  //     // Only update min/max if the value is a valid number
  //     if (!isNaN(val)) {
  //       if (val < min) min = val;
  //       if (val > max) max = val;
  //     }
  //   });
  // });

  // Build Float32Array directly from sorted indices - NO INTERMEDIATE OBJECT!
let index = 0;
for (let r = 0; r < numRows; r++) {
  for (let c = 0; c < numColumns; c++) {
    const rowIdx = rowIndices[r];
    const colIdx = colIndices[c];
    const rawVal = jsonData.mat[rowIdx][colIdx];
    
    // If rawVal is null, it becomes NaN. Otherwise, it's a number.
    const val = rawVal === null ? NaN : parseFloat(rawVal.toFixed(2));

    values[index] = val;
    index++;

    // Only update min/max if the value is a valid number
    if (!isNaN(val)) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }
}

  // Retrieve category arrays for row and column labels
  const colCategory = order.colCat || [];
  const rowCategory = order.rowCat || [];

  const hasCollectionEvent = Object.keys(categories.col).includes('Timepoint');
  const hasCimacPartId = Object.keys(categories.col).includes('PatientId');

  // Build the column labels array
  // const colLabels = columns.map((v, i) => {
  //   const colNode = jsonData.col_nodes.find((d: any) => d.name === v);
  // Build the column labels array using sorted indices
const colLabels = colIndices.map((colIdx, i) => {
  const colNode = jsonData.col_nodes[colIdx];
  const v = cleanLabelName(colNode.name);
    return {
      text: v,
      position: i,
      category: colCategory.length > 0
        ? getCategory(colNode, colCategory, colCategory.map(cat => categories.col[cat]))
        : null,
      categoryColor: colCategory.length > 0
        ? getColor(colNode, jsonData.cat_colors.col, colCategory.map(cat => categories.col[cat]), colCategory)
        : null,
      group: colNode?.group ?? null,
      metadata: hasCollectionEvent && hasCimacPartId
        ? getCategory(colNode, ['Timepoint', 'PatientId'], [categories.col['Timepoint'], categories.col['PatientId']])
        : null,
    };
  });

  // Build the row labels array
  // const rowLabels = rows.map((v, i) => {
  //   const rowNode = jsonData.row_nodes.find((d: any) => d.name === v);
  // Build the row labels array using sorted indices
const rowLabels = rowIndices.map((rowIdx, i) => {
  const rowNode = jsonData.row_nodes[rowIdx];
  const v = cleanLabelName(rowNode.name);
    return {
      text: v,
      position: i,
      category: rowCategory.length > 0
        ? getCategory(rowNode, rowCategory, rowCategory.map(cat => categories.row[cat]))
        : null,
      categoryColor: rowCategory.length > 0
        ? getColor(rowNode, jsonData.cat_colors.row, rowCategory.map(cat => categories.row[cat]), rowCategory)
        : null,
      group: rowNode?.group ?? null,
      metadata: null,
    };
  });

  return {
    values,
    min,
    max,
    numRows,
    numColumns,
    colLabels,
    rowLabels,
  };
}
