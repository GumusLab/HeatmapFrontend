import { PolygonLayer } from '@deck.gl/layers/typed';
import clamp from 'lodash/clamp';
import { OnClickType } from '../../DeckGLHeatmap.types';
import { IDS } from '../../const';
import { CellDatum, DataStateShape, HeatmapStateShape } from '../../types';
import { getColorRange } from './getColorRange';


// import { TransitionInterpolator } from '@deck.gl/core';


const getColorFromRange = (
  value: number,
  posColorRange: [number, number, number, number][],
  negColorRange: [number, number, number, number][],
  min: number,
  max: number
): [number, number, number, number] => {

  if (value >= 0) {
    const index = clamp(
      Math.floor((value / max) * posColorRange.length),
      0,
      posColorRange.length - 1
    );
    return posColorRange[index];
  }
  const index = clamp(
    Math.floor((value / min) * negColorRange.length),
    0,
    negColorRange.length - 1
  );
  return negColorRange[index];
};

export function getHeatmapGridLayer(
  dataState: DataStateShape,
  heatmapState: HeatmapStateShape | null,
  opacityVal:number,
  onClick: OnClickType,
  debug?: boolean,
  pvalThreshold?:number,
  pvalData?:Record<string, Record<string, number>>
) {

  // console.log('****** data state is as follows *****',dataState)
  // console.log(pvalData)
  
  const posColorRange = getColorRange(0,opacityVal);
  const negColorRange = getColorRange(dataState.min,opacityVal);

  if (heatmapState?.cellData) {
    return new PolygonLayer<CellDatum>({
      id: IDS.LAYERS.HEATMAP_GRID,
      data: heatmapState.cellData,
      pickable: true,
      stroked: true,
      filled: true,
      wireframe: debug,
      getLineColor: [255, 255, 255],    
      getLineWidth: 0.1,  
      getPolygon: (d) => d.contour,
      getFillColor: (d) => {
        if (pvalData !== undefined && pvalThreshold !== undefined){
          if(pvalData[d.row][d.col] <= pvalThreshold){
            return  getColorFromRange(
              d.value,
              posColorRange,
              negColorRange,
              dataState.min,
              dataState.max
            );
          }
          else{
            return [255,255,255,255]
            // return [255,0,0,255]

          }
        }
        else{ 
        return getColorFromRange(
          d.value,
          posColorRange,
          negColorRange,
          dataState.min,
          dataState.max
        );
      }
    },
    // getFillColor:[255,0,0,255],
      onClick,
      autoHighlight: true,
      transitions: {
        getFillColor: {
          type: 'interpolation',
          duration: 2000,
          easing: (t: number) => t,
        },
      },
      updateTriggers: {
        getFillColor: [opacityVal,pvalThreshold],
      },
    });
  }
  return null;
}
