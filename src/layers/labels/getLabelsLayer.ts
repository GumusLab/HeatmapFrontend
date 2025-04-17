import { TextLayer } from '@deck.gl/layers/typed';
import {
  BASE_ZOOM,
  CELL_TO_LABEL_SIZE_PROPORTION,
  DEFAULT_LABEL_MAX_SIZE,
  DEFAULT_LABEL_OFFSET,
  IDS,
  LABEL_SCALE,
  MIN_LABEL_CHARS,
  CATEGORY_LAYER_HEIGHT,
  INITIAL_GAP,
  LAYER_GAP,
  DEFAULT_LABEL_GAP
} from '../../const';
import type { LabelProps } from './labels.types';

import { maybeTruncateLabel } from './maybeTruncateLabel';
import { useState } from 'react';
import { hover } from '@testing-library/user-event/dist/hover';
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
  categories,
  // setHoveredLabel,
  // hoveredLabel
}: LabelProps & { axis: 'row' | 'column'}) {


  if (heatmapState) {
    const { width: cellWidth, height: cellHeight } =
      heatmapState.cellDimensions;
    const heatmapHeight = heatmapState.height;


    // console.log('******** heatmap one fourth height is as follows ********', heatmapHeight/4)
    // 141.05

    const cellSize = axis === 'row' ? cellHeight : cellWidth;

    const viewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
    const zoom = viewState.zoom as number;

    let offset = labelsConfig?.offset
      ? labelsConfig.offset
      : DEFAULT_LABEL_OFFSET - 5;
    let totalGap = 0

    if(axis === "row"){
      if(order.rowCat.length > 0) {
        totalGap += order.rowCat.length*(CATEGORY_LAYER_HEIGHT + LAYER_GAP) + INITIAL_GAP
      }
      if(order.row === "cluster"){
        totalGap += 5 + INITIAL_GAP
      }

    }
    offset = -labelSpace/4 + totalGap + DEFAULT_LABEL_GAP

    const sizeMaxPixels = labelsConfig?.maxSize || DEFAULT_LABEL_MAX_SIZE;
  //   let scale:number;

  //   if(zoom >= 0){
  //     scale = Math.max(LABEL_SCALE, LABEL_SCALE * zoom)
  //   }
  //   else if(zoom < 0){
  //   scale = LABEL_SCALE * Math.exp(zoom);   
  //  }
  //   else{
  //     scale = LABEL_SCALE
  //   }

    let scale: number;

    // BASE_ZOOM is 1, so we'll normalize around that
    const normalizedZoom = zoom - BASE_ZOOM; // This makes zoom=1 the "normal" size point

    // Use exponential scaling that matches deck.gl's internal scaling
    scale = LABEL_SCALE * Math.pow(2, normalizedZoom);

    // Add constraints to prevent extreme sizes at zoom boundaries
    // Assuming you want labels to be at most 8x larger and at most 8x smaller than the base size
    const minScale = LABEL_SCALE * 0.125; // 1/8th of base size
    const maxScale = LABEL_SCALE * 8;     // 8x base size
    scale = Math.min(Math.max(scale, minScale), maxScale);
    // const scale = zoom
    //   ? Math.max(LABEL_SCALE, LABEL_SCALE * zoom)
    //   : LABEL_SCALE;

    console.log('******* scale is as follows ********',scale)
    console.log('********* Label scale is as follows *******',LABEL_SCALE)
    console.log('******** zoom is as follows *********', zoom)


      const getPosition = (d:any) => {
        // const rowPosition = [-offset,d.position * cellSize];
        // const rowPosition = [-offset,d.position * cellHeight + 0.5*cellHeight - heatmapHeight/4];
        const rowPosition = [-offset,d.position * cellHeight + 0.5*cellHeight - heatmapHeight/4];


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
      }

    // const getPosition = (d:any) => {

    //   const rowPosition = [-offset, 0.5 * cellSize + d.position * cellSize];
    //   let rowOffset:number = 0;
    //     if( axis === 'row'){
    //       if(order.row === 'cluster'){
    //         rowOffset -= 5
    //     }
    //     if(order.rowCat.length>0){
    //       for(let i=0 ; i< order.rowCat.length;i++){
    //         rowOffset -= 5
    //       }
    //     }
    //   }

    //   return (axis === 'row' ? [rowPosition[0]+rowOffset,rowPosition[1]] : rowPosition.reverse()) as [number,number];
    // }
    return [
      new TextLayer({
        id: axis === 'row' ? IDS.LAYERS.ROW_LABELS : IDS.LAYERS.COL_LABELS,
        data: axis === 'row' ? dataState.rowLabels : dataState.colLabels,
        fontFamily:'Arial, sans-serif',
        getPosition:getPosition,
        background:true,
        // onHover: ({ object, index }) => {
        //   if (object) {
        //     setHoveredLabelIdx((prev:any) => ({
        //       ...prev,
        //       [axis]: index,
        //     })); // Update only the hovered label for the current axis
        //   } else {
        //     setHoveredLabelIdx((prev:any) => ({
        //       ...prev,
        //       [axis]: null,
        //     })); // Reset hover for the current axis
        //   }
        // },

        // onHover: ({ object, index }) => {
        //   if (object) {
        //     setHoveredLabel(index); // Update only the hovered label for the current axis
        //   } else {
        //     setHoveredLabel(null); // Reset hover for the current axis
        //   }
        // },
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
        // getBorderColor: ()=>[0, 0, 255, 255],
        // getBorderWidth: ()=>2,
        getBackgroundColor:(d)=> d.text.trim() === searchTerm?.trim() ? [255, 255, 0,255]:[255,255,255,255],

        // getSize: (d, { index }) => {
        //   // Soft zoom effect logic for labels
        //   if (hoveredLabel === index) {
        //     return 10; // Increase size on hover
        //   }
        //   return cellSize * CELL_TO_LABEL_SIZE_PROPORTION; // Default size
        // },

        // getSize:
        //   title && scale < 2 ? 0 : cellSize * CELL_TO_LABEL_SIZE_PROPORTION,
        sizeUnits: 'meters',
        // getTextAnchor: 'middle',
        getTextAnchor: axis === 'row' ? 'end' : 'start',
        sizeMaxPixels:cellSize,
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
          getSize: {
              type: 'interpolation',
              duration: 200,
              easing: (t:any) => t * (2 - t), // Ease-out effect
            },
        },
        updateTriggers: {
          getPosition: [sizeMaxPixels, cellSize, offset, order, heatmapHeight],
          // data: [dataState.rowLabels],
          // getSize: [cellSize, scale, hoveredLabel],
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
