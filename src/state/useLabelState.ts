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
  CATEGORY_LAYER_HEIGHT,
  LAYER_GAP,
  INITIAL_GAP,
  CLUSTER_LAYER_HEIGHT,
  CLUSTER_LAYER_GAP,
  MAX_CATEGORIES,
} from '../const';
import { DataStateShape, HeatmapStateShape, order } from '../types';
import getTextWidth from '../utils/getTextWidth';

export const useLabelState = (
  dataState: DataStateShape | null,
  heatmapState: HeatmapStateShape | null,
  labels: DeckGLHeatmapProps['labels'],
  container: HTMLDivElement | null,
  order: order,
  ID: string,
  datastateVersion: any,
  heatmapstateVersion: any,
  matrixInfoHeight: number,
  setLabelsState: React.Dispatch<
    React.SetStateAction<{
      colLabelsWidth: number;
      rowLabelsWidth: number;
    }>
  >
): void => {
  const canvas = container?.querySelector('canvas');


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
        const baseColumnLabelWidth =
          dataState.colLabels.length > 0
            ? Math.max(
              ...dataState.colLabels.map((l) =>
                getTextWidth(
                  l.text.slice(
                    0,
                    (labels?.column?.maxChars || MIN_LABEL_CHARS) + 3
                  ),
                  columnFont
                )
              )
            ) - (labels?.column?.offset || DEFAULT_LABEL_OFFSET)
            : 0;

        const metadataStackHeight =
          order.colCat.length *
          (CATEGORY_LAYER_HEIGHT + LAYER_GAP);

        const clusterStackHeight =
          order.col === 'cluster'
            ? CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP
            : 0;

        // Match the actual metadata heading font in DeckGLHeatmap.tsx.
        const metadataHeadingFontSize = 10;
        const metadataHeadingFont =
          `bold ${metadataHeadingFontSize}px ${fontFamily}`;

        const tiltRadians = Math.PI / 3; // 60 degrees

        // Measure the vertical space occupied by tilted column names.
        const actualColumnLabelWidth = Math.max(
          0,
          baseColumnLabelWidth +
          (labels?.column?.offset || DEFAULT_LABEL_OFFSET)
        );

        const columnNameClearance =
          actualColumnLabelWidth * Math.sin(Math.PI / 3) +
          columnFontSize * Math.cos(Math.PI / 3) +
          20;

        // Measure the actual bold, tilted row metadata headings.
        const rowMetadataHeadingClearance =
          order.rowCat.length > 0
            ? Math.max(
              ...order.rowCat.map(cat =>
                getTextWidth(cat, metadataHeadingFont) *
                Math.sin(tiltRadians) +
                metadataHeadingFontSize *
                Math.cos(tiltRadians)
              )
            ) + 12
            : 0;

        // Reserve the largest required clearance, not their sum.
        const labelClearance = Math.max(
          columnNameClearance,
          rowMetadataHeadingClearance
        );

        const legendClearance =
          matrixInfoHeight > 0
            ? matrixInfoHeight + 8
            : 0;

        const headerClearance =
          labelClearance + legendClearance;

        col =
          headerClearance +
          metadataStackHeight +
          clusterStackHeight;
        /*
          So col labels and row labels are in commmon unit. I have each layer of size 8pixel and 1 extra layer is clustering layer
          So From deckgl docs 1common Unit = 2**Zoom*Pixel
         */

        const baseRowLabelWidth =
          dataState.rowLabels.length > 0
            ? Math.max(
              ...dataState.rowLabels.map((l) =>
                getTextWidth(
                  l.text.slice(
                    0,
                    (labels?.row?.maxChars || MIN_LABEL_CHARS) + 3
                  ),
                  rowFont
                )
              )
            )
            : 0;

        // Display variable names on the axis with fewer
        // selected metadata tracks.
        const rowSelectedCount = order.rowCat.length;
        const colSelectedCount = order.colCat.length;

        const showRowNames =
          rowSelectedCount < colSelectedCount;

        const rowMetadataWidth =
          order.rowCat.length > 0
            ? order.rowCat.length *
            (CATEGORY_LAYER_HEIGHT + LAYER_GAP) +
            INITIAL_GAP
            : 0;

        const rowClusterWidth =
          order.row === 'cluster'
            ? CLUSTER_LAYER_HEIGHT +
            CLUSTER_LAYER_GAP +
            INITIAL_GAP
            : 0;

        const columnMetadataHeadingWidth =
          order.colCat.length > 0
            ? Math.max(
              ...order.colCat.map(cat =>
                getTextWidth(cat, metadataHeadingFont)
              )
            ) + 8
            : 0;

        row =
          Math.max(
            baseRowLabelWidth,
            columnMetadataHeadingWidth
          ) +
          rowMetadataWidth +
          rowClusterWidth;
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
    order.col,
    order.rowCat.length,
    order.row,
    order.rowCat,
    matrixInfoHeight,
    ID,
    datastateVersion,
    // heatmapstateVersion,
    setLabelsState,
  ]);
};
