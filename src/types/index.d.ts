export type CellDatum = { contour: number[][]; value: number; row: string; col:string; colCategory:{[key: string]: string;}|null}; 
  // ; position: [number, number, number]};

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
  values: number[];
  min: number;
  max: number;
  numRows: number;
  numColumns: number;
  colLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null; metadata:{[key: string]: string}|null;}[];
  rowLabels: { text: string; position: number; category:{[key: string]: string}|null; categoryColor:{[key: string]: string}|null; group:number[]|null;}[];
};

export type HeatmapStateShape = {
  cellData: CellDatum[] | null;
  cellDimensions: {
    width: number;
    height: number;
  };
};

export type order = {
  row:string;
  col:string;
  rowCat:string[];
  sortByRowCat:string;
  colCat:string[];
  sortByColCat:string;
}

/*Added by Osho for the row order and col order state */
// export type orderState = {
//   row:string;
//   col:string;
// }