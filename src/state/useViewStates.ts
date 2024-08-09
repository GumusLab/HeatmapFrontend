import type { InteractionState } from '@deck.gl/core/typed/controllers/controller';
import { clamp, isNil, merge } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_ZOOM, IDS, MAX_ZOOM } from '../const';
import type {
  DataStateShape,
  HeatmapStateShape,
  ViewState,
  ViewStates,
} from '../types';

export type ViewStateChangeProps = {
  viewId: string;
  viewState: Required<ViewState> & { zoom: number };
  interactionState: InteractionState;
  oldInteractionState?: Record<string, any>;
};

const X = 0;
const Y = 1;

export const useViewStates = (
  container: HTMLDivElement | null,
  dimensions: [number, number] | null,
  heatmapState: HeatmapStateShape | null,
  dataState: DataStateShape | null ,
  // rowIndex: number | null | undefined ,// add new prop for rowIndex
  // labels:any,
) => {
  const initialViewState = useMemo(
    () => ({
      target: [0, 0],
      zoom: BASE_ZOOM,
      minZoom: BASE_ZOOM,
      maxZoom: MAX_ZOOM,
      width: dimensions?.[0],
      height: dimensions?.[1],
    }),
    [dimensions]
  );

  // const viewDict = useMemo(
  //   ()=>{
  //     if(container?.id === 'olinkPatientHeatmap')
  //     {
  //       return {
  //         [IDS.VIEWS.COL_LABELS]: initialViewState,
  //         [IDS.VIEWS.ROW_LABELS]: initialViewState,
  //         [IDS.VIEWS.HEATMAP_GRID]: initialViewState,
  //         ['gender-labels-view']: initialViewState,
  //       }
  //     }
  //     else{
  //       return {
  //         [IDS.VIEWS.COL_LABELS]: initialViewState,
  //         [IDS.VIEWS.ROW_LABELS]: initialViewState,
  //         [IDS.VIEWS.HEATMAP_GRID]: initialViewState,
  //       }
  //     }    
  //   },
  //  [container?.id]
  //  );

  const [viewStates, setViewStates] = useState<ViewStates>({
            [IDS.VIEWS.COL_LABELS]: initialViewState,
            [IDS.VIEWS.ROW_LABELS]: initialViewState,
            [IDS.VIEWS.HEATMAP_GRID]: initialViewState,
          });

  useEffect(()=>{
    if(
      container &&
      isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].width) &&
      isNil(viewStates[IDS.VIEWS.HEATMAP_GRID].height)
    ) {

      setViewStates((oldViewStates) => ({
        [IDS.VIEWS.COL_LABELS]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.COL_LABELS]
        ),
        [IDS.VIEWS.ROW_LABELS]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.ROW_LABELS]
        ),
        [IDS.VIEWS.HEATMAP_GRID]: merge(
          initialViewState,
          oldViewStates[IDS.VIEWS.HEATMAP_GRID]
        ),
      }));

      // if(container.id === 'olinkPatientHeatmap'){
      //   setViewStates((oldViewStates) => ({
      //     [IDS.VIEWS.COL_LABELS]: merge(
      //       initialViewState,
      //       oldViewStates[IDS.VIEWS.COL_LABELS]
      //     ),
      //     [IDS.VIEWS.ROW_LABELS]: merge(
      //       initialViewState,
      //       oldViewStates[IDS.VIEWS.ROW_LABELS]
      //     ),
      //     [IDS.VIEWS.HEATMAP_GRID]: merge(
      //       initialViewState,
      //       oldViewStates[IDS.VIEWS.HEATMAP_GRID]
      //     ),
      //     ['gender-labels-view']: merge(
      //       initialViewState,
      //       oldViewStates['gender-labels-view']
      //     ),
      //   }));
      // }
    //   else{
    //   setViewStates((oldViewStates) => ({
    //     [IDS.VIEWS.COL_LABELS]: merge(
    //       initialViewState,
    //       oldViewStates[IDS.VIEWS.COL_LABELS]
    //     ),
    //     [IDS.VIEWS.ROW_LABELS]: merge(
    //       initialViewState,
    //       oldViewStates[IDS.VIEWS.ROW_LABELS]
    //     ),
    //     [IDS.VIEWS.HEATMAP_GRID]: merge(
    //       initialViewState,
    //       oldViewStates[IDS.VIEWS.HEATMAP_GRID]
    //     ),
    //   }));
    // }
    }
  },[container, initialViewState, viewStates]);

  // useEffect(() => {

  //   if(rowIndex){

  //     /* I have hard coded default label offset which is equal to 4 */

  //     // const offset = labels?.row.offset
  //     // ? labels.row.offset
  //     // : 4;

  //     const cellSize = heatmapState?.cellDimensions.height

  //     const targetY = cellSize ? 0.5 * cellSize + rowIndex * cellSize : 0;
  //     setViewStates((currentViewStates: ViewStates) => ({
  //       [IDS.VIEWS.COL_LABELS]: {
  //         ...currentViewStates[IDS.VIEWS.ROW_LABELS],
  //         zoom: [2, BASE_ZOOM],
  //         target: [currentViewStates[IDS.VIEWS.ROW_LABELS].target[X], 0],
  //       },
  //       [IDS.VIEWS.ROW_LABELS]: {
  //         ...currentViewStates[IDS.VIEWS.ROW_LABELS],
  //         zoom: [BASE_ZOOM, 2],
  //         target: [0, targetY],
  //       },
  //       [IDS.VIEWS.HEATMAP_GRID]: {
  //         ...currentViewStates[IDS.VIEWS.HEATMAP_GRID],
  //         zoom:[2,2],
  //         target:[currentViewStates[IDS.VIEWS.ROW_LABELS].target[X], targetY]
  //       },
  //     }));
  //   }},[container, initialViewState, rowIndex]);
  

  const onViewStateChange = useCallback(
    (params: ViewStateChangeProps) => {
      const { viewId, viewState } = params;
      const { zoom } = viewState;

      const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);

      const matrixRight = viewState.width;
      const matrixBottom = viewState.height;
      const maxTargetX =
        zoom === BASE_ZOOM ? 0 : matrixRight - matrixRight / nextScaleFactor;
      const maxTargetY =
        zoom === BASE_ZOOM ? 0 : matrixBottom - matrixBottom / nextScaleFactor;

      // Manipulate view state target if necessary to keep the user in the window.
      viewState.target = [
        clamp(viewState.target[X], 0, maxTargetX / 2),
        clamp(viewState.target[Y], 0, maxTargetY / 2),
      ];


      if (heatmapState && dataState) {
        const minCellProportionToShow =
          Math.max(dataState.numColumns, dataState.numRows) / 4;
        viewState.maxZoom = BASE_ZOOM + Math.log2(minCellProportionToShow);
      }

      // only allow zooming from action on the heatmap
      // TODO: could allow for zoom/pan by action on the labels
      // but would be locked to one dimension


      // if(rowIndex){
      // const rowHeight = dataState && container
      //                   ? container.clientHeight / dataState.numRows
      //                   : 1;
      // const maxNumRows = Math.floor(viewState.height / rowHeight);
      // const centerRow = Math.floor(maxNumRows / 2);
      // const targetY = rowHeight * (rowIndex - centerRow + 0.5);
      // const maxTargetY = matrixBottom - maxNumRows * rowHeight;

      // viewState.target = [
      //   clamp(viewState.target[X], 0, maxTargetX / 2),
      //   clamp(targetY, maxTargetY / 2, matrixBottom - maxTargetY / 2),
      // ];
      
      // viewState.zoom = 2
      // setViewStates((currentViewStates: ViewStates) => ({
      //   [IDS.VIEWS.COL_LABELS]: {
      //     ...currentViewStates[IDS.VIEWS.COL_LABELS],
      //     zoom: [viewState.zoom, BASE_ZOOM],
      //     target: [viewState.target[X], 0],
      //   },
      //   [IDS.VIEWS.ROW_LABELS]: {
      //     ...currentViewStates[IDS.VIEWS.ROW_LABELS],
      //     zoom: [BASE_ZOOM, viewState.zoom],
      //     target: [0, viewState.target[Y]],
      //   },
      //   [IDS.VIEWS.HEATMAP_GRID]: {
      //     ...viewState,
      //   },
      // }));
      // }

      
      if (viewId === IDS.VIEWS.HEATMAP_GRID) {
        setViewStates((currentViewStates: ViewStates) => ({
          [IDS.VIEWS.COL_LABELS]: {
            ...currentViewStates[IDS.VIEWS.ROW_LABELS],
            zoom: [viewState.zoom, BASE_ZOOM],
            target: [viewState.target[X], 0],
          },
          [IDS.VIEWS.ROW_LABELS]: {
            ...currentViewStates[IDS.VIEWS.ROW_LABELS],
            zoom: [BASE_ZOOM, viewState.zoom],
            target: [0, viewState.target[Y]],
          },
          [IDS.VIEWS.HEATMAP_GRID]: {
            ...viewState,
          },
        }));
      }
      
    },
    [dataState, heatmapState]
    // [dataState, heatmapState, rowIndex]
  );

  return { viewStates, onViewStateChange };
};
