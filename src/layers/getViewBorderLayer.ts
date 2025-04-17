import { PolygonLayer } from '@deck.gl/layers/typed';
import { IDS } from '../const';

export function getViewBorderLayer(heatmapState: any, LabelsWidth: any,axis:any) {
  // Calculate the bounds of the column labels view

  let viewHeight;
  let viewWidth;
  if(axis === "row"){
    viewHeight = heatmapState.height;
    viewWidth = LabelsWidth;
  }
  else if(axis === "col"){
    viewHeight = LabelsWidth;
    viewWidth = heatmapState.width;
  }

  
  // Create coordinates for the border rectangle
  // Since the origin is at the center of the view, we need to calculate
  // positions relative to the center
  const halfWidth = viewWidth / 4;
  const halfHeight = viewHeight / 4;
  
  // Create a polygon that traces the boundary
  return new PolygonLayer({
    id: axis === "row" ? 'row-labels-view-border' : 'col-labels-view-border',
    viewId: axis === "row" ? IDS.VIEWS.ROW_LABELS : IDS.VIEWS.COL_LABELS, // Important: assign to column labels view
    data: axis === "row" ? [
      {
        contour: [
          [-halfWidth, -halfHeight], // Top-left
          [-halfWidth, halfHeight],  // Bottom-left
          [halfWidth, halfHeight],   // Bottom-right
          [halfWidth, -halfHeight],  // Top-right
        ]
      }
    ]:[
      {
        contour: [
          [-halfWidth, -halfHeight], // Top-left
          [-halfWidth, halfHeight],  // Bottom-left
          [halfWidth, halfHeight],   // Bottom-right
          [halfWidth, -halfHeight],  // Top-right
        ]
      }
    ],
    pickable: false,
    stroked: true,
    filled: false,
    wireframe: true,
    lineWidthMinPixels: 2,
    getPolygon: d => d.contour,
    getLineColor: [255, 0, 0, 255], // Red border for visibility
    getLineWidth: 2
  });
}