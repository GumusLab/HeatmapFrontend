import { range } from 'lodash';
import { CellDatum, DataStateShape } from '../types';

export const getHeatmapState = (
  dataState: DataStateShape | null,
  colLabelsWidth: number,
  rowLabelsWidth: number,
  dimensions: [number, number] | null,
  ID: string,
) => {
  if (dataState) {
    const { values, numColumns, numRows,colLabels,rowLabels } = dataState;
    if (values.length && dimensions) {
      // Notes from deckgl docs
      // 1 meter unit equals 1 common unit
      // The conversion between common sizes and pixel sizes: 1 common unit equals
      // 2 ** z pixel where z is the zoom of the current viewport.
      // So to go from pixels (clientHeight, clientWidth) to meters we
      // have to reverse the equation 1 cu = (2**z) * p
      // p = (1 cu) / (2**z)
      const cellWidth =
        (dimensions[0] - rowLabelsWidth) / dataState.numColumns / 2;
      const cellHeight =
        (dimensions[1] - colLabelsWidth) / dataState.numRows / 2 ;

      const newData: CellDatum[] = [];

      range(numColumns).map((i) => {
        range(numRows).map((j) => {
          const firstAndLastPoint = [i * cellWidth, j * cellHeight];
          newData.push({
            contour: [
              firstAndLastPoint,
              [i * cellWidth, j * cellHeight + cellHeight],
              [i * cellWidth + cellWidth, j * cellHeight + cellHeight],
              [i * cellWidth + cellWidth, j * cellHeight],
              firstAndLastPoint,
            ],
            value: ID.includes('cytof')? parseFloat(values[numColumns * j + i].toFixed(4)):parseFloat(values[numColumns * j + i].toFixed(2)),
            row: rowLabels[j].text,
            col: colLabels[i].text,
            colCategory: colLabels[i].metadata?colLabels[i].metadata:null,
          });
        });
      });

      return {
        cellData: newData,
        cellDimensions: {
          width: cellWidth,
          height: cellHeight,
        },
      };
    }
    return null;
  }
  return null;
};
