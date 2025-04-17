// import { IDS } from './const';

// const gridNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.COL_LABELS];
// const rowLabelsNoRenderArray = [IDS.LAYERS.COL_LABELS, IDS.LAYERS.HEATMAP_GRID];
// const colLabelsNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.HEATMAP_GRID];

// // only draw the layers we want to see in each view
// export const layerFilter = ({
//   layer,
//   viewport,
// }: {
//   layer: { id: string };
//   viewport: { id: string };
// }) => {
//   if (viewport.id.includes(IDS.VIEWS.DEBUG)) {
//     return false; // don't render anything into debug views
//   }
//   if (
//     viewport.id === IDS.VIEWS.ROW_LABELS &&
//     rowLabelsNoRenderArray.some((id) => id.includes(layer.id))
//   ) {
//     return false;
//   } else if (
//     viewport.id === IDS.VIEWS.COL_LABELS &&
//     colLabelsNoRenderArray.some((id) => id.includes(layer.id))
//   ) {
//     return false;
//   } else if (
//     viewport.id === IDS.VIEWS.HEATMAP_GRID &&
//     gridNoRenderArray.includes(layer.id)
//   ) {
//     return false;
//   }
//   return true;
// };

import { IDS } from './const';

const gridNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.COL_LABELS];
// const rowLabelsNoRenderArray = [IDS.LAYERS.COL_LABELS, IDS.LAYERS.HEATMAP_GRID];
// const colLabelsNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.HEATMAP_GRID];

export const layerFilter = ({
  layer,
  viewport,
}: {
  layer: { id: string };
  viewport: { id: string };
}) => {
  if (viewport.id.includes(IDS.VIEWS.DEBUG)) {
    return false; // don't render anything into debug views
  }
  
  // Check for category layers
  const isCategoryLayer = layer.id.includes(':cat');
  const isRowCluster = layer.id === 'row-clusters';
  const isColCluster = layer.id === 'col-clusters';
  const isRowLabel  = layer.id === "row-labels";
  const isColLabel  = layer.id === "col-labels";
  const rowdebugView = layer.id === 'row-labels-view-border';
  const coldebugView = layer.id === 'col-labels-view-border';

  
  if (viewport.id === IDS.VIEWS.ROW_LABELS) {
    // ONLY show row clusters and row category layers in row labels view
    if (isRowLabel || isRowCluster || (isCategoryLayer && layer.id.startsWith('row_')) || rowdebugView) {
      return true;
    }
    // Don't show other layers in row labels view
    return false;
  } 
  else if (viewport.id === IDS.VIEWS.COL_LABELS) {
    // ONLY show column clusters and column category layers in column labels view
    if (isColLabel || isColCluster || (isCategoryLayer && !layer.id.startsWith('row_')) || coldebugView) {
      return true;
    }
    // Don't show other layers in column labels view
    return false;
  } 
  else if (viewport.id === IDS.VIEWS.HEATMAP_GRID) {
    // Don't render clusters, category layers, or specified layers in heatmap grid
    if (isRowLabel || isColLabel || isRowCluster || isColCluster || isCategoryLayer || gridNoRenderArray.includes(layer.id) || rowdebugView || coldebugView) {
      return false;
    }
    return true;
  }
  
  return true;
};