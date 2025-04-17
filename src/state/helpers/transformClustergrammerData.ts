import { NetworkData } from './network';

const cleanLabelName = (name: string) => {
  return name
  // return name.replace(/(.*:)/, '').trim();
};
interface filteredIdxDict {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export const transformClustergrammerData = (
  data: NetworkData,
  filteredIdxDict:filteredIdxDict|null,
): Record<string, Record<string, number>> => {
  const ret: { [x: string]: Record<string, number> } = {};
  if(filteredIdxDict){

  data.row_nodes.forEach((row, i) => {
    if (filteredIdxDict.startY <= i && i <= filteredIdxDict.endY) {
      data.col_nodes.forEach((col, j) => {
        if (filteredIdxDict.startX <= j && j <= filteredIdxDict.endX) {
          const transformedRowName = cleanLabelName(row.name);
          if (!(transformedRowName in ret)) {
            ret[transformedRowName] = {};
          }
          const transformedColName = cleanLabelName(col.name);
          ret[transformedRowName][transformedColName] = data.mat[i][j];
         }
      });
    }
  });
  }
  else{
    data.row_nodes.forEach((row, i) => {
      data.col_nodes.forEach((col, j) => {
        const transformedRowName = cleanLabelName(row.name);
        if (!(transformedRowName in ret)) {
          ret[transformedRowName] = {};
        }
        const transformedColName = cleanLabelName(col.name);
        ret[transformedRowName][transformedColName] = data.mat[i][j];
      });
    });
  }

  return ret;
};
