import { DeckProps, LayerProps } from '@deck.gl/core/typed';
import React, { CSSProperties } from 'react';

export type LabelConfig = {
  /** NOTE: You should not need to set this, the labels automatically scale and truncate
   * set the max font size **in pixels** you want for the labels in either axis
   * @default 10
   */
  maxSize?: number;
  /** sets the max number of characters to show of a label, after which the label will be truncated
   *  @default 6
   */
  maxChars?: number;
  /**
   * How much to offset/pad the labels (in pixels) from the heatmap/categories
   * @default 4
   */
  offset?: number;
  /** the angle of the labels, for row labels the default is 0 and for column labels the default
   * is 90
   */
  angle?: number;
  /**
   * The size of the title that is shown when the zoom is high enough that labels don't show
   *
   * @default 10
   */
  titleSize?: number;
};

export type OnClickType = LayerProps['onClick'];
export type getTooltipType = DeckProps['getTooltip'];
export interface DeckGLHeatmapProps {

  key: number;
  /** the data to display
   * this can either be a Clustergrammer JSON 
   * or a JSON
   * file that fits Record<string, Record<string, number>>
   */
  data: any;
  /** a ref to the div that is a container in the dom
   * to the heatmap, so the heatmap can figure out its
   * dimensions accordingly and be responsive
   */

  dataId: string;
  
  container: HTMLDivElement;
  /**
   * title for row labels (replaced by the actual labels when zoomed in enough)
   * if not provided the row labels will all be shown at max zoom
   */
  rowLabelsTitle?: string;
  /**
   * title for column labels (replaced by the actual labels when zoomed in enough)
   * if not provided the column labels will all be shown at max zoom
   */
  columnLabelsTitle?: string;
  /** pass true if you want to debug the component */
  debug?: boolean;
  /** config objects for each label axis */
  labels?: {
    row?: LabelConfig;
    column?: LabelConfig;
  };
  /** onclick handlers for row and column labels and heatmap cells */
  onClick?: {
    [x: string]: OnClickType | undefined;
    rowLabel?: OnClickType;
    columnLabel?: OnClickType;
    heatmapCell?: OnClickType;
  };
  /** tooltip function */
  tooltipFunction?: DeckProps['getTooltip'];
  /** whether to show a legend or not
   * @default false
   */
  /** legend parameters */
  legend?: {
    height?: number | string;
    width?: number | string;
    fontSize?: number | string;
    offsetFromChart?: number;
  };
  /* Prop for ranking the rows*/
  // order:{
  //   row:string;
  //   col:string;
  //   rowCat:string;
  //   sortByRowCat:boolean;
  //   colCat:string;
  //   sortByColCat:boolean;
  // };

  /* Prop used for transferring category data to heatmap*/
  categories:{
    row:{[key: string]: string};
    col:{[key: string]: string};
  }

  // ord:{
  //   row:string;
  //   col:string;
  //   rowCat: string[];
  //   sortByRowCat:string;
  //   colCat:string[];
  //   sortByColCat:string
  // }
  
  /* Parameter for setting the result table categories */
  resultCategories?:string[]

  /* Prop for setting the current result category */
  setResultCategory?:React.Dispatch<React.SetStateAction<string>>;

  /* Prop for setting value scale for data whether to show raw value or normalized one*/
  setValueScale?:React.Dispatch<React.SetStateAction<string>>;

  /*Prop for setting the result  */
  valueScale?: string;

  /* Prop for setting the results legend text */
  valueType?: string;

  /* Prop for setting the heatmap pannel width */
  panelWidth:number;

  /* Prop for current user session id */
  sessionID:string;

  onShowNetwork?:any; // ✅ Required nodes parameter
  
  onShowPathwayNetwork?:any;

  notifyClusteringStarted: () => void;
  notifyClusteringSuccess: () => void;

  notifySortStarted: (sortType, dimension) => void;
  notifySortSuccess: (sortType, dimension) => void;

  showLoading:any;
  hideLoading:any;
  addNotification:any;

  onStatsUpdate?: (stats: { sampleSize: number; dataPoints: number }) => void;

  /*P vlaue json for results files */
  pvalData?:Record<string, Record<string, number>>;

  /** positioning of the chart, as in the `position` css style */
  position?: CSSProperties['position'];
  /** pass any properties that aren't controlled (e.g. layers, layerFilter etc.) down to
   * the deckgl instance
   */
  deckglProps?: Omit<
    DeckProps,
    | 'width'
    | 'height'
    | 'parent'
    | 'views'
    | 'layerFilter'
    | 'onViewStateChange'
    | 'viewState'
    | 'layers'
    | 'getTooltip'
  >;
}
