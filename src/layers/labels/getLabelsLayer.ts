import { TextLayer } from '@deck.gl/layers/typed';
import {
  CELL_TO_LABEL_SIZE_PROPORTION,
  DEFAULT_LABEL_MAX_SIZE,
  DEFAULT_LABEL_OFFSET,
  IDS,
  LABEL_SCALE,
  MIN_LABEL_CHARS
} from '../../const';
import type { LabelProps } from './labels.types';

import { maybeTruncateLabel } from './maybeTruncateLabel';
export function getLabelsLayer({
  axis,
  title,
  dataState,
  viewStates,
  heatmapState,
  onClick,
  labelsConfig,
  labelSpace,
  searchTerm,
  order,
  categories
}: LabelProps & { axis: 'row' | 'column'}) {

  if (heatmapState) {
    const { width: cellWidth, height: cellHeight } =
      heatmapState.cellDimensions;
    const cellSize = axis === 'row' ? cellHeight : cellWidth;

    const viewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
    const zoom = viewState.zoom as number;

    const offset = labelsConfig?.offset
      ? labelsConfig.offset
      : DEFAULT_LABEL_OFFSET + 2;

    const sizeMaxPixels = labelsConfig?.maxSize || DEFAULT_LABEL_MAX_SIZE;

    const scale = zoom
      ? Math.max(LABEL_SCALE, LABEL_SCALE * zoom)
      : LABEL_SCALE;


    const getPosition = (d:any) => {

      // console.log('axis is as follows *****', axis)
      // console.log('offset is as follows *****', offset)
      // console.log(order.rowCat)
      const rowPosition = [-offset, 0.5 * cellSize + d.position * cellSize];
      let rowOffset:number = 0;
        if( axis === 'row'){
          if(order.row === 'cluster'){
            rowOffset -= 5
        }
        if(order.rowCat.length>0){
          for(let i=0 ; i< order.rowCat.length;i++){
            rowOffset -= 5
          }
        }
      }
      return (axis === 'row' ? [rowPosition[0]+rowOffset,rowPosition[1]] : rowPosition.reverse()) as [
        number,
        number
      ];
      // return (axis === 'row' ? rowPosition : rowPosition.reverse()) as [
      //   number,
      //   number
      // ];
    }
    return [
      new TextLayer({
        id: axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS,
        data: axis === 'row' ? dataState.rowLabels : dataState.colLabels,
        fontFamily:'Arial, sans-serif',
        getPosition:getPosition,
        getElevation:0,
        background:true,
        getAngle: labelsConfig?.angle
          ? labelsConfig.angle
          : axis === 'row'
          ? 0
          : 90,
        getText:(d:any) => {
          if(axis === 'column' && Object.keys(categories.col).length > 0) return ""
          // .padEnd(10, ' '); 
          if (!labelSpace) return d.text;          
          const maxChars =
            labelsConfig?.maxChars && labelsConfig?.maxChars > 0
              ? labelsConfig.maxChars
              : MIN_LABEL_CHARS;
          return maybeTruncateLabel(d.text, Math.max(0, maxChars));
        },
        // getColor: (d)=> d.text.trim() === searchTerm?.trim() ? [255, 0, 0]:[0,0,0],
        getColor: [0,0,0],
        // getBorderColor: ()=>[0, 0, 0, 255],
        // getBorderWidth: ()=>2,
        getBackgroundColor:(d)=> d.text.trim() === searchTerm?.trim() ? [255, 255, 0,255]:[255,255,255,255],
        
        getSize:
          title && scale < 2 ? 0 : cellSize * CELL_TO_LABEL_SIZE_PROPORTION,
        sizeUnits: 'meters',
        // getTextAnchor: 'middle',
        getTextAnchor: axis === 'row' ? 'end' : 'start',
        sizeMaxPixels,
        sizeScale: scale,
        pickable: true,
        onClick,
        transitions: {
          getPosition: {
            type: 'interpolation',
            duration: 2000,
            easing:(t:any) => {
              return t*t
            },
            delay: 1000,
          },
          getElevation: {
            type: 'interpolation',
            duration: 2000,
            easing: (t:any) => t*t,
            delay: 1000,
            },
        },
        updateTriggers: {
          getPosition: [sizeMaxPixels, cellSize, offset, order],
          // data: [dataState.rowLabels],
          getSize: [cellSize, scale],
          sizeScale: [scale],
          sizeMaxPixels: [sizeMaxPixels],
          getAngle: [labelsConfig],
          getColor: [searchTerm],
          getBackgroundColor: [searchTerm],

        },
      }),
      ...(title
        ? [
            new TextLayer({
              id: `${
                axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS
              }-title`,
              sizeUnits: 'meters',
              data: [{ title }],
              getText: (d) => d.title,
              getPosition: () => {
                const colPosition = [
                  viewState.target[0] +
                    (dataState.numColumns * cellWidth) /
                      2 /
                      2 ** ((viewState.zoom as number) - 1),
                  -(labelSpace / 4),
                ];
                const rowPosition = [
                  -(labelSpace / 4),
                  viewState.target[1] +
                    (dataState.numRows * cellHeight) /
                      2 /
                      2 ** ((viewState.zoom as number) - 1),
                ];
                return (axis === 'row' ? rowPosition : colPosition) as [
                  number,
                  number
                ];
              },

              getTextAnchor: 'middle',
              getAlignmentBaseline: 'center',
              getColor: [0,0,0],
              // getColor: [255,0,0],
              getSize:
                scale < 2
                  ? labelsConfig?.titleSize || DEFAULT_LABEL_MAX_SIZE
                  : 0,
              getAngle: axis === 'row' ? 90 : 45,
              updateTriggers: {
                getSize: [scale],
                getPosition: [
                  dataState.numColumns,
                  dataState.numRows,
                  cellWidth,
                  cellHeight,
                  viewState.zoom,
                  labelSpace,
                  viewState.target,
                ],
              },
            }),
          ]
        : []),
    ];
  }
  return null;
}
