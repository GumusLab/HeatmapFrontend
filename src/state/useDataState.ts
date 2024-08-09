import { flatten } from 'lodash';
import { useMemo, useRef } from 'react';
import { DataStateShape } from '../types';
import { transformClustergrammerData } from './helpers/transformClustergrammerData';

export const useDataState = (
  jsonData: any,
  order: {
    row: string;
    col: string;
    rowCat: string[];
    sortByRowCat: string;
    colCat: string[];
    sortByColCat: string;
  },
  categories: { row: { [key: string]: string }; col: { [key: string]: string } }
) => {
  const doubleClickFlag = useRef('');

  function calculateVariance(data: number[]): number {
    const n = data.length;
    const mean = data.reduce((a, b) => a + b) / n;
    const sum = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const variance = (1 / n) * sum;
    return variance;
  }

  function getCategory(node: any, cat: string[], catIndex: string[]) {
    type categoriesDict = { [key: string]: string };
    let categories: categoriesDict = {};
    for (let i = 0; i < cat.length; i++) {
      categories[cat[i]] = node[catIndex[i]];
    }
    return categories;
  }

  function getColor(node: any, colors: any, catIndex: string[], cat: string[]) {
    //jsonData.cat_colors.col[colCatIndex][jsonData.col_nodes.filter((d: { name: string;})=>d.name === v)[0][colCatIndex]]:null,

    type categoriesColors = { [key: string]: string };
    let catColors: categoriesColors = {};
    // console.log('Node is' , node)
    // console.log('colrs are ', colors)
    // console.log('catindex is',catIndex)
    // console.log('category is', cat)
    // console.log('categories are',categories)
    for (let i = 0; i < cat.length; i++) {
      catColors[cat[i]] = colors[catIndex[i]][node[catIndex[i]]];
    }
    return catColors;
  }

  const sortData = (
    data: Record<string, Record<string, number>>,
    order: {
      row: string;
      col: string;
      rowCat: string[];
      sortByRowCat: string;
      colCat: string[];
      sortByColCat: string;
    },
    jsonData: any
  ): Record<string, Record<string, number>> | Map<string, Map<string, any>> => {
    let newData: Record<string, Record<string, number>> = {};
    switch (order.row) {
      case 'sum':
        const rowSums = Object.entries(data).map(([key, row]) => [
          key,
          Object.values(row).reduce((acc, val) => acc + Number(val), 0),
        ]);
        rowSums.sort((a: any, b: any) => b[1] - a[1]);
        for (const [key] of rowSums) {
          newData[key] = data[key];
        }
        break;
      case 'alphabetically':
        const rows = Object.keys(data).sort();
        for (let i = 0; i < rows.length; i++) {
          newData[rows[i]] = data[rows[i]];
        }
        break;
      case 'variance':
        const rowVar = Object.entries(data).map(([key, row]) => [
          key,
          calculateVariance(Object.values(row)),
        ]);
        rowVar.sort((a: any, b: any) => b[1] - a[1]);
        for (const [key] of rowVar) {
          newData[key] = data[key];
        }
        break;
      case 'cluster':
        if (jsonData.row_nodes && jsonData.col_nodes && jsonData.mat) {
          const rowNodes: [string, number][] = jsonData.row_nodes.map(
            (d: { name: any; clust: any }) => [d.name, d.clust]
          );
          const sortedResult = rowNodes.sort((a, b) => b[1] - a[1]);
          for (const [key] of sortedResult) {
            newData[key] = data[key];
          }
        } else {
          newData = data;
        }
        break;
      default:
        newData = data;
    }
    // let sortedData: Record<string, Record<string, number>> = {};

    let sortedData: Map<string, Map<string, any>> = new Map();
    const rows = Object.keys(newData);
    switch (order.col) {
      case 'sum':
        const cols = Object.keys(newData[rows[0]]);
        const colSums = cols.map((colLabel) => {
          const sum = rows.reduce((acc, rowLabel) => {
            return acc + newData[rowLabel][colLabel];
          }, 0);
          return { colLabel, sum };
        });

        const sortedColSums = colSums.sort((a, b) => b.sum - a.sum);
        rows.forEach((rowLabel) => {
          // sortedData[rowLabel] = {};
          let innerMap = new Map();
          sortedColSums.forEach(({ colLabel }) => {
            innerMap.set(colLabel, newData[rowLabel][colLabel]);
            // sortedData[rowLabel][colLabel] = newData[rowLabel][colLabel];
          });
          sortedData.set(rowLabel, innerMap);
        });
        return sortedData;
      case 'alphabetically':
        console.log('here alpha');

        const sortedCols = Object.keys(newData[rows[0]]).sort();
        rows.forEach((rowLabel) => {
          // sortedData[rowLabel] = {};
          let innerMap = new Map();
          sortedCols.forEach((colLabel) => {
            // sortedData[rowLabel][colLabel] = newData[rowLabel][colLabel];
            innerMap.set(colLabel, newData[rowLabel][colLabel]);
          });
          sortedData.set(rowLabel, innerMap);
        });

        return sortedData;

      case 'variance':
        const columns = Object.keys(newData[rows[0]]);
        const colVariances = columns.map((colLabel) => {
          const values = rows.map((rowLabel) => newData[rowLabel][colLabel]);
          return [colLabel, calculateVariance(values)];
        });
        const sortedColVariances = colVariances
          .sort((a: any, b: any) => b[1] - a[1])
          .map((colLabel) => colLabel[0]);

        rows.forEach((rowLabel) => {
          // sortedData[rowLabel] = {};
          let innerMap = new Map();
          sortedColVariances.forEach((colLabel) => {
            // sortedData[rowLabel][colLabel] = newData[rowLabel][colLabel];\
            innerMap.set(colLabel, newData[rowLabel][colLabel]);
          });
          sortedData.set(rowLabel, innerMap);
        });

        return sortedData;

      case 'cluster':
        if (jsonData.row_nodes && jsonData.col_nodes && jsonData.mat) {
          let sortedData: Map<string, Map<string, any>> = new Map();
          const colNodes: [string, number][] = jsonData.col_nodes.map(
            (d: { name: any; clust: any }) => [d.name, d.clust]
          );
          const sortedCols = colNodes.sort((a, b) => b[1] - a[1]);

          rows.forEach((rowLabel) => {
            let innerMap = new Map();
            // sortedData[rowLabel] = {};
            sortedCols.forEach((colLabel) => {
              innerMap.set(
                colLabel[0].trim(),
                newData[rowLabel][colLabel[0].trim()]
              );
              // sortedData[rowLabel][colLabel[0]] = newData[rowLabel][colLabel[0]];
            });
            sortedData.set(rowLabel, innerMap);
          });
          return sortedData;
        } else {
          return newData;
        }

      default:
        let sortFunction = (
          a: (string | number)[],
          b: (string | number)[]
        ): number => {
          return (b[0] as number) - (a[0] as number);
        };
        console.log('flag test', doubleClickFlag.current, order.col);
        if (doubleClickFlag.current == order.col) {
          console.log('case1');
          doubleClickFlag.current = '';
          sortFunction = (a, b) => {
            return (a[0] as number) - (b[0] as number);
          };
        } else {
          console.log('case2');
          doubleClickFlag.current = order.col;
          console.log('after case2', doubleClickFlag.current);
        }

        const keys = Object.keys(newData[rows[0]]);

        let temp = [];
        for (let i = 0; i < keys.length; i++) {
          temp[i] = [
            Object.entries(newData[order.col])[i][1],
            Object.entries(newData[rows[0]])[i][0],
          ];
        }
        temp.sort(sortFunction);
        let tempcols = [];
        for (let i = 0; i < temp.length; i++) {
          tempcols[i] = temp[i][1];
        }
        const sortCols = tempcols;

        rows.forEach((rowLabel) => {
          // sortedData[rowLabel] = {};
          let innerMap = new Map();
          sortCols.forEach((colLabel) => {
            // sortedData[rowLabel][colLabel] = newData[rowLabel][colLabel];
            innerMap.set(colLabel, newData[rowLabel][colLabel]);
          });
          sortedData.set(rowLabel, innerMap);
        });

        return sortedData;
    }
  };

  const sortByCat = (
    data: Map<string, Map<string, any>>,
    order: {
      row: string;
      col: string;
      rowCat: string[];
      sortByRowCat: string;
      colCat: string[];
      sortByColCat: string;
    },
    jsonData: any,
    categories: {
      row: { [key: string]: string };
      col: { [key: string]: string };
    }
  ): Map<string, Map<string, any>> => {
    // let sortedDataCat: Record<string, Record<string, number>> = {};
    let sortedDataCat: Map<string, Map<string, any>> = new Map();
    // const rows = Object.keys(data);
    //const rows = Array.from(data.keys());
    if (jsonData.row_nodes && jsonData.col_nodes && jsonData.mat) {
      let rows: string[] = Array.from(data.keys());
      if (order.sortByRowCat.trim().length > 0){
        const indexName = categories.row[order.sortByRowCat];
        let indexStringArray = indexName.split('-');
        indexStringArray.push('index');
        let idxString = indexStringArray.join('_');
        const rowNodes: [string, number][] = jsonData.row_nodes.map(
          (d: any) => [d.name, d[idxString]]
        );
        const sortedRows = rowNodes.sort((a, b) => a[1] - b[1]);
        rows = sortedRows.map((r: [string, number]) => r[0]);
      }
      let cols: string[] = Array.from(data.entries().next().value[1].keys())
      if (order.sortByColCat.trim().length >0){
        const indexName = categories.col[order.sortByColCat];
        let indexStringArray = indexName.split('-');
        indexStringArray.push('index');
        let idxString = indexStringArray.join('_');
        const colNodes: [string, number][] = jsonData.col_nodes.map(
          (d: any) => [d.name, d[idxString]]
        );
        const sortedCols = colNodes.sort((a, b) => a[1] - b[1]);
        cols = sortedCols.map((r: [string, number]) => r[0])
      }
      rows.forEach((rowLabel) => {
        const innerMap = new Map();
        cols.forEach((colLabel) => {
          innerMap.set(colLabel, data.get(rowLabel)?.get(colLabel));
        });
        sortedDataCat.set(rowLabel, innerMap);
      });

      return sortedDataCat;
    } else {
      return data;
    }
  };

  const dataState = useMemo<DataStateShape | null>(() => {
    // make sure we've loaded the data and only load it once
    if (jsonData) {
      let transformedData = jsonData;
      if (jsonData.mat.length > 0) {
        transformedData = transformClustergrammerData(jsonData);
      }

      transformedData = sortData(transformedData, order, jsonData);

      if (
        order.sortByColCat.trim().length > 0 ||
        order.sortByRowCat.trim().length > 0
      ) {
        transformedData = sortByCat(
          transformedData,
          order,
          jsonData,
          categories
        );
      }

      // const columns:string[] = order.col === "cluster"?Array.from(transformedData.values().next().value.keys()):Object.keys(transformedData[Object.keys(transformedData)[0]])
      const columns: string[] = Array.from(
        transformedData.values().next().value.keys()
      );

      // const rows = order.col !== "cluster"?Object.keys(transformedData):Array.from(transformedData.keys());
      const rows = Array.from(transformedData.keys());
      // const numColumns = Object.keys(columns).length;
      const numColumns = columns.length;
      const numRows = rows.length;
      // const values: number[] = order.col !== "cluster"?flatten(
      //   rows.map((rowKey:any) => Object.values(transformedData[rowKey]))
      // ):flatten(rows.map((rowKey:any) => Array.from(transformedData.get(rowKey).values())));

      const values: number[] = flatten(
        rows.map((rowKey: any) =>
          Array.from(transformedData.get(rowKey).values())
        )
      );

      // const values: number[] = flatten(
      //   (
      //     Object.values(transformedData) as unknown as Record<string, number>[]
      //   ).map((valuesObj) => Object.values(valuesObj))
      // );

      // const min = Math.min(...values);
      // const max = Math.max(...values);

      let min = values[0];
      let max = values[0];

      for (let i = 1; i < values.length; i++) {
        if (values[i] < min) {
          min = values[i];
        }
        if (values[i] > max) {
          max = values[i];
        }
      }

      const colCategory = order.colCat;
      const rowCategory = order.rowCat;
      // const colCategory  = ""
      // const rowCategory = ""

      let colCatIndex: string[] = [];
      let rowCatIndex: string[] = [];
      if (colCategory.length > 0) {
        for (let i = 0; i < colCategory.length; i++) {
          colCatIndex.push(categories.col[colCategory[i]]);
        }
      }
      if (rowCategory.length > 0) {
        for (let i = 0; i < rowCategory.length; i++) {
          rowCatIndex.push(categories.row[rowCategory[i]]);
        }
      }

      // const colCatIndex = colCategory.length>0?categories.col[colCategory]:null;
      // const rowCatIndex = rowCategory.length>0?categories.row[rowCategory]:null;

      const hasCollectionEvent = Object.keys(categories.col).includes(
        'Collection_Event'
      );
      const hasCimacPartId = Object.keys(categories.col).includes(
        'cimac_part_id'
      );

      return {
        values,
        min,
        max,
        numRows,
        numColumns,
        colLabels: columns.map((v, i) => ({
          text: v,
          position: i,
          // category: colCatIndex?{[colCategory]:jsonData.col_nodes.filter((d: { name: string;})=>d.name === v)[0][colCatIndex]}:null,
          category:
            colCatIndex?.length > 0
              ? getCategory(
                  jsonData.col_nodes.filter(
                    (d: { name: string }) => d.name === v
                  )[0],
                  colCategory,
                  colCatIndex
                )
              : null,

          // categoryColor: colCatIndex?jsonData.cat_colors.col[colCatIndex][jsonData.col_nodes.filter((d: { name: string;})=>d.name === v)[0][colCatIndex]]:null,
          categoryColor:
            colCatIndex?.length > 0
              ? getColor(
                  jsonData.col_nodes.filter(
                    (d: { name: string }) => d.name === v
                  )[0],
                  jsonData.cat_colors.col,
                  colCatIndex,
                  colCategory
                )
              : null,

          // group: ID === 'olinkPatientHeatmap' || ID === 'cytofPatientHeatmap'?jsonData.col_nodes.filter((d: { name: string;})=>d.name.trim() === v.trim())[0]?.["group"]:null,
          group: jsonData.col_nodes.filter(
            (d: { name: string }) => d.name.trim() === v.trim()
          )[0]?.['group'],
          visibility:
            Object.keys(categories.row).length > 0 ||
            Object.keys(categories.col).length > 0
              ? false
              : true,
          metadata:
            hasCollectionEvent && hasCimacPartId
              ? getCategory(
                  jsonData.col_nodes.filter(
                    (d: { name: string }) => d.name === v
                  )[0],
                  ['Collection_Event', 'cimac_part_id'],
                  [
                    categories.col['Collection_Event'],
                    categories.col['cimac_part_id'],
                  ]
                )
              : null,
        })),
        rowLabels: rows.map((v: any, i: any) => ({
          text: v,
          position: i,
          // category: rowCatIndex?{[rowCategory]:jsonData.row_nodes.filter((d: { name: string;})=>d.name === v)[0][rowCatIndex]}:null,
          category:
            rowCatIndex?.length > 0
              ? getCategory(
                  jsonData.row_nodes.filter(
                    (d: { name: string }) => d.name === v
                  )[0],
                  rowCategory,
                  rowCatIndex
                )
              : null,
          // categoryColor: rowCatIndex?jsonData.cat_colors.row[rowCatIndex][jsonData.row_nodes.filter((d: { name: string;})=>d.name === v)[0][rowCatIndex]]:null,
          categoryColor:
            rowCatIndex?.length > 0
              ? getColor(
                  jsonData.row_nodes.filter(
                    (d: { name: string }) => d.name === v
                  )[0],
                  jsonData.cat_colors.row,
                  rowCatIndex,
                  rowCategory
                )
              : null,

          // group: ID === 'olinkPatientHeatmap' || ID === 'cytofPatientHeatmap'?jsonData.row_nodes.filter((d: { name: string;})=>d.name === v)[0]["group"]:null,
          // group: jsonData.row_nodes.filter((d: { name: string;})=>d.name.trim() === v.trim())[0]["group"],
          group: jsonData.row_nodes.filter(
            (d: { name: string }) => d.name.trim() === v.trim()
          )[0]['group'],
          // group: jsonData.row_nodes.filter((d: { name: string;})=>d.name === v.trim())[0]["group"],
        })),
      };
    }
    return null;
  }, [jsonData, order]);

  return dataState;
};
