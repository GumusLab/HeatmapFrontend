import { IDS } from './const';

const gridNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.COL_LABELS];
const rowLabelsNoRenderArray = [IDS.LAYERS.COL_LABELS, IDS.LAYERS.HEATMAP_GRID];
const colLabelsNoRenderArray = [IDS.LAYERS.ROW_LABELS, IDS.LAYERS.HEATMAP_GRID];

// only draw the layers we want to see in each view
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
  if (
    viewport.id === IDS.VIEWS.ROW_LABELS &&
    rowLabelsNoRenderArray.some((id) => id.includes(layer.id))
  ) {
    return false;
  } else if (
    viewport.id === IDS.VIEWS.COL_LABELS &&
    colLabelsNoRenderArray.some((id) => id.includes(layer.id))
  ) {
    return false;
  } else if (
    viewport.id === IDS.VIEWS.HEATMAP_GRID &&
    gridNoRenderArray.includes(layer.id)
  ) {
    return false;
  }
  return true;
};
