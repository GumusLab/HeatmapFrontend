// export type CellDatum = { contour: number[][]; value: number; row: string; col:string; colCategory:{[key: string]: string;}|null}; 
//   // ; position: [number, number, number]};

// export type ViewState = {
//   target: [number, number] | number[];
//   zoom: number | number[];
//   minZoom: number;
//   maxZoom: number;
//   height?: number;
//   width?: number;
//   rotationOrbit?: number;
//   rotationX?: number;
//   minRotationX?: number;
//   maxRotationX?: number;
// };

// export type ViewStates = {
//   [x: string]: ViewState;
// };

// export type DataStateShape = {
//   values: number[] | Float32Array; 
//   min: number;
//   max: number;
//   numRows: number;
//   numColumns: number;
//   colLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null; metadata:{[key: string]: string}|null;}[];
//   rowLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null;}[];
// };

// export type HeatmapStateShape = {
//   cellData: CellDatum[] | null;
//   cellDimensions: {
//     width: number;
//     height: number;
//   };
// };

// export type order = {
//   row:string;
//   col:string;
//   rowCat:string[];
//   sortByRowCat:string;
//   colCat:string[];
//   sortByColCat:string;
// }


export type CellDatum = {
  rowIndices:Int32Array,
  colIndices:Int32Array,
  values: Float32Array,
}

// Update HeatmapStateShape to use the new structure
export type HeatmapStateShape = {
cellData: OptimizedCellData;  // Changed from CellDatum[]
cellDimensions: {
width: number;
height: number;
};
colors: Uint8ClampedArray;
contourData: Float32Array;
rowLabels: string[];
colLabels: string[];
width:number;
height:number;
};

// export type HeatmapStateShape = {
//   cellData: CellDatum;
//   cellDimensions: {
//     width: number;
//     height: number;
//   };
//   colors: Uint8ClampedArray;
//   contourData:Float32Array;
// };



export type ViewState = {
target: [number, number] | number[];
zoom: number | number[];
minZoom: number;
maxZoom: number;
height?: number;
width?: number;
rotationOrbit?: number;
rotationX?: number;
minRotationX?: number;
maxRotationX?: number;
};

export type ViewStates = {
[x: string]: ViewState;
};

export type DataStateShape = {
values: number[] | Float32Array;
min: number;
max: number;
numRows: number;
numColumns: number;
colLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null; metadata:{[key: string]: string}|null;}[];
rowLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null;}[];
};

// type DataStateShape = {
//   values: number[] | Float32Array; // ✅ Allow both types
//   min: number;
//   max: number;
//   numRows: number;
//   numColumns: number;
//   colLabels: LabelType[];
//   rowLabels: LabelType[];
// };


export type order = {
row:string;
col:string;
rowCat:string[];
sortByRowCat:string;
colCat:string[];
sortByColCat:string;
}

declare module '@deck.gl/core';

/*Added by Osho for the row order and col order state */
// export type orderState = {
//   row:string;
//   col:string;
// }




