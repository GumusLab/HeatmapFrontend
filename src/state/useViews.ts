// import { OrthographicView} from '@deck.gl/core/typed';

// import { IDS } from '../const';

// export type UseViewsProps = {
//   debug: boolean;
//   dimensions: [number, number] | null;
//   colLabelsWidth: number;
//   rowLabelsWidth: number;
// };

// export const useViews = ({
//   colLabelsWidth,
//   rowLabelsWidth,
//   debug,
//   dimensions,
// }: UseViewsProps) => {
//   // guard
//   if (!(dimensions && rowLabelsWidth && colLabelsWidth)) return [];

//   const heatmapWidth = dimensions[0] - rowLabelsWidth;
//   const heatmapHeight = dimensions[1] - colLabelsWidth;
//   const labelWidth = rowLabelsWidth;
//   const labelHeight = colLabelsWidth;

//   // VIEWS
//   const rowLabelView = new OrthographicView({
//     id: IDS.VIEWS.ROW_LABELS,
//     width: labelWidth,
//     height: heatmapHeight,
//     x: 0,
//     y: labelHeight,
//     padding: {
//       left: labelWidth,
//       bottom: heatmapHeight,
//     },
//     controller: false,
//     ...(debug
//       ? {
//           clear: {
//             color: [1, 0, 0, 1],
//           },
//         }
//       : {}),
//   });
//   const colLabelsView = new OrthographicView({
//     id: IDS.VIEWS.COL_LABELS,
//     width: heatmapWidth,
//     height: labelHeight,
//     x: labelWidth,
//     y: 0,
//     padding: {
//       top: labelHeight,
//       right: heatmapWidth,
//     },
//     controller: false,
//     ...(debug
//       ? {
//           clear: {
//             color: [1, 0, 0, 1],
//           },
//         }
//       : {}),
//   });
//   const heatmapGridView = new OrthographicView({
//     id: IDS.VIEWS.HEATMAP_GRID,
//     width: heatmapWidth,
//     height: heatmapHeight,
//     x: labelWidth,
//     y: labelHeight,
//     padding: {
//       bottom: heatmapHeight,
//       right: heatmapWidth,
//     },
//     controller: true,
//   });


//   return [heatmapGridView, rowLabelView, colLabelsView];
//   // , genderLabelView];
// };


import { OrthographicView } from '@deck.gl/core/typed';
import { IDS,HEATMAP_WIDTH,HEATMAP_HEIGHT } from '../const';

export type UseViewsProps = {
  debug: boolean;
  dimensions: [number, number] | null;
  colLabelsWidth: number;
  rowLabelsWidth: number;
  panelWidth:number;
};

export const useViews = ({
  colLabelsWidth,
  rowLabelsWidth,
  debug,
  dimensions,
  panelWidth
}: UseViewsProps) => {
  // guard
  if (!(dimensions && rowLabelsWidth && colLabelsWidth)) return [];

  const availableWidth = (dimensions[0] - panelWidth)*HEATMAP_WIDTH/100;
  const availableHeight = (dimensions[1])*HEATMAP_HEIGHT/100;

  const heatmapWidth = availableWidth - rowLabelsWidth;
  const heatmapHeight = availableHeight - colLabelsWidth;
  const labelWidth = rowLabelsWidth;
  const labelHeight = colLabelsWidth;

  // VIEWS
  const rowLabelView = new OrthographicView({
    id: IDS.VIEWS.ROW_LABELS,
    width: labelWidth,
    height: heatmapHeight,
    x: 0,
    y: labelHeight,
    // padding: {
    //   left: labelWidth,
    //   bottom: heatmapHeight,
    // },
    controller: false,
    ...(debug
      ? {
          clear: {
            color: [1, 0, 0, 1],
          },
        }
      : {}),
  });
  const colLabelsView = new OrthographicView({
    id: IDS.VIEWS.COL_LABELS,
    width: heatmapWidth,
    height: labelHeight,
    x: labelWidth,
    y: 0,
    // padding: {
    //   top: labelHeight,
    //   right: heatmapWidth,
    // },
    controller: false,
    ...(debug
      ? {
          clear: {
            color: [1, 0, 0, 1],
          },
        }
      : {}),
  });
  const heatmapGridView = new OrthographicView({
    id: IDS.VIEWS.HEATMAP_GRID,
    width: heatmapWidth,
    height: heatmapHeight,
    x: labelWidth,
    y: labelHeight,
    // padding: {
    //   bottom: heatmapHeight,
    //   right: heatmapWidth,
    // },
    controller: true,
  });

  return [heatmapGridView, rowLabelView, colLabelsView];
  // return [heatmapGridView,rowLabelView];

  // return []

  // , genderLabelView];
};