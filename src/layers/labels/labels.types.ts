// import type { LabelConfig, OnClickType } from '../../DeckGLHeatmap.types';
// import type {
//   DataStateShape,
//   HeatmapStateShape,
//   ViewStates,
// } from '../../types';

// export type LabelProps = {
//   dataState: DataStateShape;
//   viewStates: ViewStates;
//   heatmapState: HeatmapStateShape | null;
//   onClick?: OnClickType;
//   labelsConfig?: LabelConfig;
//   labelSpace: number;
//   title?: string;
//   searchTerm?: string;
//   // order: {
//   //   row:string;
//   //   col:string;
//   // };
//   order:any;
//   categories:{
//     row:{[key: string]: string};
//     col:{[key: string]: string};
//   };
//   setHoveredLabel:any|null;
//   hoveredLabel:any|null;
// };


import type { LabelConfig, OnClickType } from '../../DeckGLHeatmap.types';
import type {
  DataStateShape,
  HeatmapStateShape,
  ViewStates,
} from '../../types';

export type LabelProps = {
  dataState: DataStateShape;
  viewStates: ViewStates;
  heatmapState: HeatmapStateShape | null;
  onClick?: OnClickType;
  labelsConfig?: LabelConfig;
  labelSpace: number;
  title?: string;
  searchTerm?: string;
  // order: {
  //   row:string;
  //   col:string;
  // };
  order:any;
  categories:{
    row:{[key: string]: string};
    col:{[key: string]: string};
  }
};
