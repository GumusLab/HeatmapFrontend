// import React, { useEffect } from 'react';
// import { DeckGLHeatmapProps } from '../DeckGLHeatmap.types';
// import {
//   DEFAULT_LABEL_MAX_SIZE,
//   DEFAULT_LABEL_OFFSET,
//   MIN_LABEL_CHARS,
// } from '../const';
// import { DataStateShape, HeatmapStateShape, order } from '../types';
// import getTextWidth from '../utils/getTextWidth';

// export const useLabelState = (
//   dataState: DataStateShape | null,
//   heatmapState: HeatmapStateShape | null,
//   labels: DeckGLHeatmapProps['labels'],
//   container: HTMLDivElement | null,
//   order:order,
//   ID:string,
//   setLabelsState: React.Dispatch<
//     React.SetStateAction<{
//       colLabelsWidth: number;
//       rowLabelsWidth: number;
//     }>
//   >
// ): void => {
//   const canvas = container?.querySelector('canvas');
//   useEffect(() => {
//     let col = 0;
//     let row = 0;
//     if (dataState && canvas) {
//       if (canvas) {
//         // https://deck.gl/docs/api-reference/layers/text-layer#fontfamily
//         // const fontFamily = 'Monaco, monospace';
//         const fontFamily = 'Arial, sans-serif';

//         const columnFontSize =
//           labels?.column?.maxSize || DEFAULT_LABEL_MAX_SIZE;
//         const rowFontSize = labels?.row?.maxSize || DEFAULT_LABEL_MAX_SIZE;

//         // const columnFontSize = heatmapState?.cellDimensions.width || 0;
//         // const rowFontSize = heatmapState?.cellDimensions.height || 0;


//         const columnFont = `normal ${columnFontSize}px ${fontFamily}`;
//         const rowFont = `normal ${rowFontSize}px ${fontFamily}`;

//         // In the or statement previously there was ID.includes('Patient')
//         col = order.colCat.length > 0 ? 8*(order.colCat.length+1)*2: Math.max(
//           ...dataState.colLabels.map((l) =>
//             getTextWidth(
//               l.text.slice(
//                 0,
//                 (labels?.column?.maxChars || MIN_LABEL_CHARS) + 3 // add 3 for ellipsis when truncating
//               ),
//               columnFont
//             )
//           )
//         ) 
//         - (labels?.column?.offset || DEFAULT_LABEL_OFFSET);

//         /*
//           So col labels and row labels are in commmon unit. I have each layer of size 8pixel and 1 extra layer is clustering layer
//           So From deckgl docs 1common Unit = 2**Zoom*Pixel
//          */
    
//         row =
//           Math.max(
//             ...dataState.rowLabels.map((l) =>
//               getTextWidth(
//                 l.text.slice(0, (labels?.row?.maxChars || MIN_LABEL_CHARS) + 3), // add 3 for ellipsis when truncating
//                 rowFont
//               )
//             )
//           ) 
//           // - (labels?.row?.offset || DEFAULT_LABEL_OFFSET);
//       }
//     }
//     setLabelsState({
//       rowLabelsWidth: row,
//       colLabelsWidth: col,
//     });
//   }, [
//     canvas,
//     dataState,
//     heatmapState?.cellDimensions.height,
//     heatmapState?.cellDimensions.width,
//     labels?.column,
//     labels?.row,
//     order.colCat.length,
//     ID,
//     setLabelsState,
//   ]);
// };


import React, { useEffect } from 'react';
import { DeckGLHeatmapProps } from '../DeckGLHeatmap.types';
import {
  DEFAULT_LABEL_MAX_SIZE,
  DEFAULT_LABEL_OFFSET,
  MIN_LABEL_CHARS,
} from '../const';
import { DataStateShape, HeatmapStateShape, order } from '../types';
import getTextWidth from '../utils/getTextWidth';

export const useLabelState = (
  dataState: DataStateShape | null,
  heatmapState: HeatmapStateShape | null,
  labels: DeckGLHeatmapProps['labels'],
  container: HTMLDivElement | null,
  order:order,
  ID:string,
  datastateVersion:any,
  heatmapstateVersion:any,
  setLabelsState: React.Dispatch<
    React.SetStateAction<{
      colLabelsWidth: number;
      rowLabelsWidth: number;
    }>
  >
): void => {
  const canvas = container?.querySelector('canvas');

  console.log(heatmapstateVersion)

  useEffect(() => {
    let col = 0;
    let row = 0;
    if (dataState && canvas) {

      if (canvas) {
        // https://deck.gl/docs/api-reference/layers/text-layer#fontfamily

        // const fontFamily = 'Monaco, monospace';
        const fontFamily = 'Arial, sans-serif';

        const columnFontSize =
          labels?.column?.maxSize || DEFAULT_LABEL_MAX_SIZE;
        const rowFontSize = labels?.row?.maxSize || DEFAULT_LABEL_MAX_SIZE;

        // const columnFontSize = heatmapState?.cellDimensions.width || 0;
        // const rowFontSize = heatmapState?.cellDimensions.height || 0;


        const columnFont = `normal ${columnFontSize}px ${fontFamily}`;
        const rowFont = `normal ${rowFontSize}px ${fontFamily}`;
        col = order.colCat.length > 0 || ID.includes('Patient') ? 8*(order.colCat.length+1)*2: Math.max(
          ...dataState.colLabels.map((l) =>
            getTextWidth(
              l.text.slice(
                0,
                (labels?.column?.maxChars || MIN_LABEL_CHARS) + 3 // add 3 for ellipsis when truncating
              ),
              columnFont
            )
          )
        ) - (labels?.column?.offset || DEFAULT_LABEL_OFFSET);

        /*
          So col labels and row labels are in commmon unit. I have each layer of size 8pixel and 1 extra layer is clustering layer
          So From deckgl docs 1common Unit = 2**Zoom*Pixel
         */
    
        row =
          Math.max(
            ...dataState.rowLabels.map((l) =>
              getTextWidth(
                l.text.slice(0, (labels?.row?.maxChars || MIN_LABEL_CHARS) + 3), // add 3 for ellipsis when truncating
                rowFont
              )
            )
          ) 
          // - (labels?.row?.offset || DEFAULT_LABEL_OFFSET);
      }
    }
    setLabelsState({
      rowLabelsWidth: row,
      colLabelsWidth: col,
    });
  }, [
    canvas,
    dataState,
    heatmapState?.cellDimensions.height,
    heatmapState?.cellDimensions.width,
    labels?.column,
    labels?.row,
    order.colCat.length,
    ID,
    datastateVersion,
    // heatmapstateVersion,
    setLabelsState,
  ]);
};
