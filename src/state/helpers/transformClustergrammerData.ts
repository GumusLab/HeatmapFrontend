import { NetworkData } from './network';

const cleanLabelName = (name: string) => {
  return name
  // return name.replace(/(.*:)/, '').trim();
};
interface filteredIdxDict {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export const transformClustergrammerData = (
  data: NetworkData,
  filteredIdxDict?:filteredIdxDict|null,
): Record<string, Record<string, number>> => {
  const ret: { [x: string]: Record<string, number> } = {};
  if(filteredIdxDict){

  data.row_nodes.forEach((row, i) => {
    if (filteredIdxDict.startY <= i && i <= filteredIdxDict.endY) {
      data.col_nodes.forEach((col, j) => {
        if (filteredIdxDict.startX <= j && j <= filteredIdxDict.endX) {
          const transformedRowName = cleanLabelName(row.name);
          if (!(transformedRowName in ret)) {
            ret[transformedRowName] = {};
          }
          const transformedColName = cleanLabelName(col.name);
          ret[transformedRowName][transformedColName] = data.mat[i][j];
         }
      });
    }
  });
  }
  else{
    data.row_nodes.forEach((row, i) => {
      data.col_nodes.forEach((col, j) => {
        const transformedRowName = cleanLabelName(row.name);
        if (!(transformedRowName in ret)) {
          ret[transformedRowName] = {};
        }
        const transformedColName = cleanLabelName(col.name);
        ret[transformedRowName][transformedColName] = data.mat[i][j];
      });
    });
  }

  return ret;
};

// import { NetworkData } from './network';

// const cleanLabelName = (name: string): string => {
//   return name;
//   // return name.replace(/(.*:)/, '').trim();
// };

// interface filteredIdxDict {
//   startX: number;
//   startY: number;
//   endX: number;
//   endY: number;
// }

// // The function now returns a record that can hold numbers or nulls.
// export const transformClustergrammerData = (
//   data: NetworkData,
//   filteredIdxDict?: filteredIdxDict | null
// ): Record<string, Record<string, number | null>> => {
  
//   const ret: { [x: string]: Record<string, number | null> } = {};

//   // Check if we are using the new, optimized "flattened" format
//   if (data.mat && (data.mat as any).shape && (data.mat as any).flat) {
//     console.log("INFO: Processing optimized flat matrix format.");
    
//     const { shape, flat } = data.mat as any;
//     const [numRows, numCols] = shape;
    
//     // Determine start and end indices for iteration, considering filtering
//     const startY = filteredIdxDict ? filteredIdxDict.startY : 0;
//     const endY = filteredIdxDict ? filteredIdxDict.endY : numRows - 1;
//     const startX = filteredIdxDict ? filteredIdxDict.startX : 0;
//     const endX = filteredIdxDict ? filteredIdxDict.endX : numCols - 1;

//     for (let i = startY; i <= endY; i++) {
//       if (i >= numRows) continue; // Boundary check

//       const row = data.row_nodes[i];
//       const transformedRowName = cleanLabelName(row.name);
//       ret[transformedRowName] = {};

//       for (let j = startX; j <= endX; j++) {
//         if (j >= numCols) continue; // Boundary check

//         const col = data.col_nodes[j];
//         const transformedColName = cleanLabelName(col.name);

//         // Calculate index in the flat array and get the value
//         const flatIndex = i * numCols + j;
//         const value = flat[flatIndex]; // This value can be a number or null

//         ret[transformedRowName][transformedColName] = value;
//       }
//     }
//   } else {
//     // Fallback for the old, non-optimized list-of-lists format
//     console.warn("WARN: Processing legacy (non-optimized) matrix format. High memory usage may occur.");
    
//     // The original logic is kept here as a fallback
//     const startY = filteredIdxDict ? filteredIdxDict.startY : 0;
//     const endY = filteredIdxDict ? filteredIdxDict.endY : data.row_nodes.length - 1;
//     const startX = filteredIdxDict ? filteredIdxDict.startX : 0;
//     const endX = filteredIdxDict ? filteredIdxDict.endX : data.col_nodes.length - 1;

//     for (let i = startY; i <= endY; i++) {
//         const row = data.row_nodes[i];
//         const transformedRowName = cleanLabelName(row.name);
//         ret[transformedRowName] = {};
//         for (let j = startX; j <= endX; j++) {
//             const col = data.col_nodes[j];
//             const transformedColName = cleanLabelName(col.name);
//             ret[transformedRowName][transformedColName] = (data.mat as number[][])[i][j];
//         }
//     }
//   }

//   return ret;
// };

