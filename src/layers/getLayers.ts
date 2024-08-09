import { DeckGLHeatmapProps } from '../DeckGLHeatmap.types';
import { DataStateShape, HeatmapStateShape, ViewStates } from '../types';
import { order } from "../types/index";
import { getClusterLayer } from './cluster/getClusterLayer';
import { getHeatmapGridLayer } from './heatmapGrid/getHeatmapGridLayer';
import { getCatLabelsLayer } from './labels/getCatLabelsLayer';
import { getColLabelsLayer } from './labels/getColLabelsLayer';
import { getRowLabelsLayer } from './labels/getRowLabelsLayer';
// export type order = {
//                     row:string;
//                     col:string;
//                     rowCat:string;
//                     sortByRowCat:boolean;
//                     colCat:string;
//                     sortByColCat:boolean;
//                   };
export type UseLayersProps = Pick<
  DeckGLHeatmapProps,
  'onClick' | 'labels' | 'debug' | 'rowLabelsTitle' | 'columnLabelsTitle'| 'categories'
> & {
  dataState: DataStateShape | null;
  heatmapState: HeatmapStateShape | null;
  viewStates: ViewStates;
  colLabelsWidth: number;
  rowLabelsWidth: number;
  rowSliderVal: number;
  colSliderVal: number;
  opacityVal:number;
  order:order;
  searchTerm:string;
  pvalThreshold?:number;
  pvalData?:Record<string, Record<string, number>>
  setOrder:React.Dispatch<React.SetStateAction<{
    row: string;
    col: string;
    rowCat: string[];
    sortByRowCat: string;
    colCat: string[];
    sortByColCat: string;
}>>
};


export const getLayers = ({
  dataState,
  heatmapState,
  viewStates,
  onClick,
  labels,
  debug,
  colLabelsWidth,
  rowLabelsWidth,
  rowLabelsTitle,
  columnLabelsTitle,
  searchTerm,
  order,
  categories,
  rowSliderVal,
  colSliderVal,
  opacityVal,
  pvalThreshold,
  pvalData,
  setOrder
}: UseLayersProps) => {

  

  if (dataState) {

    const Layers = []

    const heatmapGrid = getHeatmapGridLayer(
      dataState,
      heatmapState,
      opacityVal,
      (info, event) => {console.log(info, event, dataState, heatmapState)},//onClick?.heatmapCell,
      debug,
      pvalThreshold,
      pvalData
    );

    
    Layers.push(heatmapGrid)

    const rowLabels = getRowLabelsLayer({
      dataState,
      viewStates,
      heatmapState,
      onClick: (info, _event) => setOrder((prev) => ({...prev, col:info.object.text})),//setOrder((prev)=>({...prev,col: info.object.text})),
      labelsConfig: labels?.row,
      labelSpace: rowLabelsWidth,
      title: rowLabelsTitle,
      searchTerm,
      order,
      categories
    });

    Layers.push(rowLabels)

    const colLabels = getColLabelsLayer({
      dataState,
      viewStates,
      heatmapState,
      onClick: onClick?.columnLabel,
      labelsConfig: labels?.column,
      labelSpace: colLabelsWidth,
      title: columnLabelsTitle,
      searchTerm,
      order,
      categories
    });
    
    Layers.push(colLabels)


    if(order.colCat.length>0||order.rowCat.length>0){
      const yOffset = 8;
      if(order.colCat.length>0){
        const colCats = order.colCat
        for(let i=0 ; i< colCats.length;i++){
        const catLayer = getCatLabelsLayer(
          dataState,
          heatmapState,
          onClick?.heatmapCell,
          colCats[i],
          yOffset*(i+1),
          debug,
          "col"
        );
        Layers.push(catLayer)
      }
    }
     
      if(order.rowCat.length>0){
        const yOffset = 8;
        const rowCats = order.rowCat
        for(let i=0 ; i< rowCats.length;i++){
        const catLayer = getCatLabelsLayer(
          dataState,
          heatmapState,
          onClick?.heatmapCell,
          rowCats[i],
          yOffset*(i+1),
          debug,
          "row"
        );
        Layers.push(catLayer)
      }
    }
    }

  if(order.row === 'cluster'){
  const clusterRowLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'row',order,rowSliderVal);
  Layers.push(clusterRowLayer)
  }

  if(order.col === 'cluster'){
  const clusterColLayer = getClusterLayer(dataState,heatmapState,onClick?.heatmapCell,'col',order,colSliderVal);
  Layers.push(clusterColLayer)
  }
  return Layers
  }
  return null;
};
