import { NetworkData } from './network';

const cleanLabelName = (name: string) => {
  return name
  // return name.replace(/(.*:)/, '').trim();
};

export const transformClustergrammerData = (
  data: NetworkData
): Record<string, Record<string, number>> => {
  const ret: { [x: string]: Record<string, number> } = {};
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
  return ret;
};
