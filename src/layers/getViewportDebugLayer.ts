import { PolygonLayer, LineLayer } from '@deck.gl/layers/typed';
import { CompositeLayer } from '@deck.gl/core/typed';
import { IDS, BASE_ZOOM } from '../const';
import { HeatmapStateShape } from '../types';

export function getViewportDebugLayer(
  heatmapState: HeatmapStateShape | null,
  viewState: any,
  visible: boolean = true
) {
  if (!heatmapState || !viewState || !visible) {
    return null;
  }

  const { zoom, target } = viewState;
  const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);
  
  // Calculate visible area bounds (same as in useViewStates)
  const actualViewWidth = heatmapState.width / nextScaleFactor;
  const actualViewHeight = heatmapState.height / nextScaleFactor;
  
  const visibleArea = {
    minX: target[0] - (actualViewWidth / 4),
    minY: target[1] - (actualViewHeight / 4),
    maxX: target[0] + (actualViewWidth / 4),
    maxY: target[1] + (actualViewHeight / 4)
  };

  // Create a red bounding box with small adjustment to make bottom boundary visible
  const pixelAdjustment = 17; // Small pixel adjustment
  const boundingBoxPolygon = [
    [visibleArea.minX, visibleArea.minY],  // Bottom-left (moved down to be more visible)
    [visibleArea.minX, visibleArea.maxY - pixelAdjustment],  // Top-left
    [visibleArea.maxX, visibleArea.maxY - pixelAdjustment],  // Top-right
    [visibleArea.maxX, visibleArea.minY],  // Bottom-right (moved down to be more visible)
  ];

  // Create cross lines at the target center
  const crossSize = 10;
  const crossLines = [
    {
      id: 'horizontal-line',
      start: [target[0] - crossSize, target[1]],
      end: [target[0] + crossSize, target[1]]
    },
    {
      id: 'vertical-line', 
      start: [target[0], target[1] - crossSize],
      end: [target[0], target[1] + crossSize]
    }
  ];

  console.log('🔴 Viewport Debug Layer:', {
    zoom,
    target,
    nextScaleFactor,
    actualViewWidth,
    actualViewHeight,
    visibleArea,
    boundingBoxPolygon
  });

  // Return an array of layers instead of a single layer
  return [
    // Bounding box layer
    new PolygonLayer({
      id: 'viewport-bounds-layer',
      viewId: IDS.VIEWS.HEATMAP_GRID,
      data: [{ polygon: boundingBoxPolygon }],
      pickable: false,
      filled: false,
      stroked: true,
      getPolygon: (d: any) => d.polygon,
      getLineColor: [255, 0, 0, 255], // Red outline
      getLineWidth: 2,
      updateTriggers: {
        getPolygon: [viewState, heatmapState.width, heatmapState.height],
      },
    }),
    // Cross lines layer
    new LineLayer({
      id: 'viewport-center-cross',
      viewId: IDS.VIEWS.HEATMAP_GRID,
      data: crossLines,
      pickable: false,
      getSourcePosition: (d: any) => d.start,
      getTargetPosition: (d: any) => d.end,
      getColor: [255, 0, 0, 255], // Red
      getWidth: 3,
      updateTriggers: {
        getSourcePosition: [viewState],
        getTargetPosition: [viewState],
      },
    })
  ];
}