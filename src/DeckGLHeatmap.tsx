import DeckGL from '@deck.gl/react/typed';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { merge } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeckGLHeatmapProps } from './DeckGLHeatmap.types';
import { generateTooltipContent } from './GenerateTooltip';
import ClusterInfoBox from './components/HoverTable';
import Legend2 from './components/Legend2';
import PersistentDrawerLeft from './components/Panel';
//import CustomSlider from './components/Slider';
import { DEFAULT_LABEL_OFFSET, MAX_CATEGORIES, OPACITY, HEATMAP_PARENT_HEIGHT_RATIO, HEATMAP_PARENT_WIDTH_RATIO, HEATMAP_WIDTH, HEATMAP_HEIGHT, IDS, BASE_ZOOM, INITIAL_GAP, LAYER_GAP, DEFAULT_LABEL_MAX_SIZE, MIN_LABEL_CHARS } from './const';
import { layerFilter } from './layerFilter';
import { getLayers } from './layers/getLayers';
import { useDimensions } from './state/useDimensions';
import { useLabelState } from './state/useLabelState';
import { useViewStates } from './state/useViewStates';
import { useViews } from './state/useViews';
import getTextWidth from './utils/getTextWidth';
import { queryOllama } from './backendApi/ollama'
import { DataStateShape, HeatmapStateShape } from './types';
import { CATEGORY_LAYER_HEIGHT, CLUSTER_LAYER_HEIGHT, CLUSTER_LAYER_GAP } from "./const";
import { createDataWorker } from './utils/workerFactory';
import { dataWorkerCode } from './workers/data-worker-string';
import HeatmapMinimap from './Heatmapminimap';
import {
  getRefreshHeatmap,
  processWorkflowAction
} from './backendApi/heatmapData'
import ChatBox from './components/ChatBox';
import ToastNotification from './components/ToastNotification';
import { OperatorNodeDependencies } from 'mathjs';
import { usePrevious } from './hooks/usePrevious';
import PathwaySelector from './components/PathwaySelector';
import {
  WorkflowAction,
  WorkflowActionType,
  WorkflowHistoryState,
  WorkflowSource,
  WorkflowTarget,
  appendWorkflowAction,
  createEmptyWorkflowHistory,
  createWorkflowAction,
  getActiveWorkflowActions
} from './workflow';

// NOTE: center of the screen is 0, 0,
//       to center a cell you would place it at [-CELL_SIZE / 2, -CELL_SIZE / 2]

// NOTE: z is cut in half for each zoom level

/**
 * DeckGLHeatmap -- for all your squares and labels needs
 */
function capitalizeFirstLetter(str: string): string {
  const lowerCaseString = str.toLowerCase();
  return lowerCaseString.charAt(0).toUpperCase() + lowerCaseString.slice(1);
}

const getMetadataValues = (catColors: any) => {
  const metadataValues: Record<string, string[]> = {};

  Object.values(catColors || {}).forEach((category: any) => {
    Object.keys(category || {}).forEach(label => {
      const [metadata, ...valueParts] = label.split(':');

      const name = metadata?.trim();
      const value = valueParts.join(':').trim();

      if (!name || !value) return;

      if (!metadataValues[name]) {
        metadataValues[name] = [];
      }

      if (!metadataValues[name].includes(value)) {
        metadataValues[name].push(value);
      }
    });
  });

  return metadataValues;
};

type ZScoreAxis = 'row' | 'col';

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface AnalysisSnapshot {
  order: {
    row: string;
    col: string;
    rowCat: string[];
    sortByRowCat: string;
    colCat: string[];
    sortByColCat: string;
    sortColsByRowName: string | null;
    sortRowsByColName: string | null;
  };

  matrixOrientation: string;

  zScoreAxis: ZScoreAxis;
  reZscoreFilteredSubset: boolean;

  filters: any;

  rowClustGroup: number;
  colClustGroup: number;

  opacityValue: number;

  searchTerm: string;
  pvalThreshold: number;

  filteredData: any | null;
  commandHistory: string[];

  filteredIdxDict: CropBox | null;
  croppedRowIndices: number[] | null;
  croppedColIndices: number[] | null;

  workflowCursor: number;
}

// interface BorderRect {
//   left: number;
//   top: number;
//   width: number;
//   height: number;
// }

let workerCount = 0;


export const DeckGLHeatmap = ({
  data,
  dataId,
  container,
  debug = false,
  labels,
  onClick,
  tooltipFunction,
  legend,
  position,
  deckglProps,
  rowLabelsTitle,
  columnLabelsTitle,
  categories,
  // ord,
  resultCategories,
  setResultCategory,
  setValueScale,
  valueScale,
  valueType,
  panelWidth,
  sessionID,
  onShowNetwork,
  onShowPathwayNetwork,
  notifyClusteringStarted,
  notifyClusteringSuccess,
  notifySortStarted,
  notifySortSuccess,
  showLoading,
  hideLoading,
  addNotification,
  pvalData,
  onStatsUpdate,
  sidebarTopContent,
  homepage
}: DeckGLHeatmapProps) => {


  interface Coords {
    x: number,
    y: number
  }
  interface Area {
    start: undefined | Coords;
    end: undefined | Coords;
  }

  const [{ colLabelsWidth, rowLabelsWidth }, setLabelsState] = useState({
    colLabelsWidth: 0,
    rowLabelsWidth: 0,
  });
  const [colClustGroup, setColClusterValue] = useState(5);
  const [rowClustGroup, setRowClusterValue] = useState(5);
  const [OpacityValue, setOpacityValue] = useState(OPACITY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [matrixOrientation, setMatrixOrientation] = useState('Original');


  const [zScoreAxis, setZScoreAxis] =
    useState<ZScoreAxis>('row');

  const [reZscoreFilteredSubset, setReZscoreFilteredSubset] =
    useState(false);

  const displayedZScoreAxis: ZScoreAxis =
    matrixOrientation === 'Transposed'
      ? (zScoreAxis === 'row' ? 'col' : 'row')
      : zScoreAxis;

  const transformation = {
    axis: zScoreAxis,
    reZscoreFilteredSubset
  };
  const [order, setOrder] = useState({
    row: "alphabetically",
    col: "alphabetically",
    rowCat: [] as string[],
    sortByRowCat: "",
    colCat: [] as string[],
    sortByColCat: "",
    sortColsByRowName: null as string | null,
    sortRowsByColName: null as string | null
  });
  // const [order, setOrder] = useState();
  // const [catTemp, setCatTemp] = useState(categories);

  const orderRef = useRef(order);
  orderRef.current = order;

  const isTransposed =
    matrixOrientation === 'Transposed';

  const mapVisualCommandToDataCommand = React.useCallback(
    (command: string): string => {
      if (!isTransposed) {
        return command;
      }

      const axisMap: Record<string, string> = {
        row: 'column',
        rows: 'columns',
        column: 'row',
        columns: 'rows',
        col: 'row',
        cols: 'rows'
      };

      return command.replace(
        /\b(row|rows|column|columns|col|cols)\b/gi,
        (match) =>
          axisMap[match.toLowerCase()] ?? match
      );
    },
    [isTransposed]
  );

  const visualOrder = useMemo(() => {
    if (matrixOrientation !== 'Transposed') {
      return order;
    }

    return {
      ...order,

      // Swap display-axis ordering
      row: order.col,
      col: order.row,

      // Swap displayed metadata tracks
      rowCat: order.colCat,
      colCat: order.rowCat,

      // Swap metadata sorting state
      sortByRowCat: order.sortByColCat,
      sortByColCat: order.sortByRowCat,

      // This operation only makes sense in the original orientation for now
      sortColsByRowName: null
    };
  }, [order, matrixOrientation]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pvalThreshold, setPvalThreshold] = useState(0.05);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [clickedClusterData, setClickedClusterData] = useState<any | null>(null);
  const [isHovering, setHovering] = useState(true)
  const containerRefDeckgl = useRef<any>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isCropping, setIsCropping] = useState(false); // For enabling cropping mode
  const heatmapRef = useRef(null);  // Reference to the heatmap container
  const [filteredIdxDict, setFilteredIdxDict] = useState<CropBox | null>(null);
  // Cropped indices (original data indices from visual selection)
  const [croppedRowIndices, setCroppedRowIndices] = useState<number[] | null>(null);
  const [croppedColIndices, setCroppedColIndices] = useState<number[] | null>(null);

  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);


  const dataStateRef = useRef<DataStateShape | null>(null);
  const heatmapStateRef = useRef<HeatmapStateShape | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const pendingGuiClusterWorkflowRef = useRef<
    'rows' | 'columns' | null
  >(null);

  const pendingGuiSortWorkflowRef = useRef<{
    target: 'rows' | 'columns';
    method: string;
  } | null>(null);

  const pendingGuiMetadataSortWorkflowRef = useRef<{
    target: 'rows' | 'columns';
    field: string;
  } | null>(null);

  const pendingGuiExpressionSortWorkflowRef = useRef<{
    feature: string;
    target: 'rows' | 'columns';
  } | null>(null);

  const pendingGuiClearFiltersWorkflowRef = useRef(false);

  const pendingGuiRemoveFiltersWorkflowRef = useRef<Array<{
    axis: 'row' | 'col';
    type: string;
    field?: string;
    value?: any;
    top_n?: number;
    criteria?: Array<{
      field: string;
      value: any;
    }>;
  }> | null>(null);

  const pendingCropWorkflowRef = useRef<{
    label: string;
    parameters: Record<string, any>;
  } | null>(null);

  const pendingClearCropWorkflowRef = useRef(false);

  const pendingImportedWorkflowReplayRef = useRef<{
    actions: WorkflowAction[];
    preImportSnapshot: AnalysisSnapshot;
    baselineDataStateVersion: number;
    preImportWorkflowHistory: WorkflowHistoryState;
    preImportUndoStack: AnalysisSnapshot[];
    preImportRedoStack: AnalysisSnapshot[];
    phase:
    | 'waiting_for_baseline'
    | 'running_action'
    | 'ready_for_next_action'
    | 'completed'
    | 'failed';
    index: number;
  } | null>(null);

  const [
    isImportedWorkflowRunning,
    setIsImportedWorkflowRunning
  ] = useState(false);

  // Two separate lightweight version counters
  const [datastateVersion, setDataStateVersion] = useState(0);
  const [heatmapstateVersion, setHeatmapStateVersion] = useState(0);
  const [dataVersion, setDataVersion] = useState(0)
  const filteredData = useRef<any>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [showPathwaySelector, setShowPathwaySelector] = useState(false);
  const [pathwayResults, setPathwayResults] = useState([]);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  const [matrixInfoHeight, setMatrixInfoHeight] = useState(0);

  const matrixInfoResizeObserverRef =
    useRef<ResizeObserver | null>(null);

  const matrixInfoRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      matrixInfoResizeObserverRef.current?.disconnect();
      matrixInfoResizeObserverRef.current = null;

      if (!element) {
        return;
      }

      const updateMatrixInfoHeight = () => {
        setMatrixInfoHeight(
          Math.ceil(
            element.getBoundingClientRect().height
          )
        );
      };

      updateMatrixInfoHeight();

      const resizeObserver =
        new ResizeObserver(updateMatrixInfoHeight);

      resizeObserver.observe(element);

      matrixInfoResizeObserverRef.current =
        resizeObserver;
    },
    []
  );


  const [filters, setFilters] = useState<any>({
    row: [],
    col: []
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const [workflowHistory, setWorkflowHistory] =
    useState<WorkflowHistoryState>(
      () => createEmptyWorkflowHistory()
    );

  const activeWorkflowActions =
    getActiveWorkflowActions(workflowHistory);

  const MAX_HISTORY = 20;

  useEffect(() => {
    const activeActions =
      workflowHistory.actions.slice(
        0,
        workflowHistory.cursor
      );

    const redoActions =
      workflowHistory.actions.slice(
        workflowHistory.cursor
      );

    console.log('🧭 WORKFLOW HISTORY', {
      cursor: workflowHistory.cursor,
      total: workflowHistory.actions.length,
      active: activeActions.map(action => action.label),
      redo: redoActions.map(action => action.label)
    });
  }, [workflowHistory]);

  const undoStackRef = useRef<AnalysisSnapshot[]>([]);
  const redoStackRef = useRef<AnalysisSnapshot[]>([]);

  const [, setHistoryVersion] = useState(0);

  const cloneFilters = (value: any) => {
    return JSON.parse(JSON.stringify(value));
  };

  const createAnalysisSnapshot = (): AnalysisSnapshot => ({
    order: {
      ...order,
      rowCat: [...order.rowCat],
      colCat: [...order.colCat],
    },

    matrixOrientation,

    zScoreAxis,
    reZscoreFilteredSubset,

    filters: cloneFilters(filters),

    rowClustGroup,
    colClustGroup,

    opacityValue: OpacityValue,

    searchTerm,
    pvalThreshold,

    // Keep only the existing in-memory reference.
    // Do NOT deep-copy the matrix.
    filteredData: filteredData.current,
    commandHistory: [...commandHistory],

    filteredIdxDict: filteredIdxDict
      ? { ...filteredIdxDict }
      : null,
    croppedRowIndices: croppedRowIndices
      ? [...croppedRowIndices]
      : null,
    croppedColIndices: croppedColIndices
      ? [...croppedColIndices]
      : null,

    workflowCursor: workflowHistory.cursor
  });

  const saveUndoPoint = () => {
    undoStackRef.current.push(createAnalysisSnapshot());

    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }

    // Once a new action is performed, redo history is no longer valid.
    redoStackRef.current = [];

    setHistoryVersion(prev => prev + 1);
  };

  const saveUndoPointRef = useRef(saveUndoPoint);
  saveUndoPointRef.current = saveUndoPoint;

  const recordWorkflowAction = ({
    type,
    source,
    label,
    target,
    parameters = {}
  }: {
    type: WorkflowActionType;
    source: WorkflowSource;
    label: string;
    target?: WorkflowTarget;
    parameters?: Record<string, unknown>;
  }) => {

    const workflowAction = createWorkflowAction({
      type,
      source,
      label,
      target,
      parameters
    });

    setWorkflowHistory(prev =>
      appendWorkflowAction(
        prev,
        workflowAction
      )
    );
  };

  const handleGuiClusterRequest = (
    target: 'rows' | 'columns'
  ) => {
    pendingGuiClusterWorkflowRef.current = target;
  };

  const handleGuiSortRequest = (
    target: 'rows' | 'columns',
    method: string
  ) => {
    pendingGuiSortWorkflowRef.current = {
      target,
      method
    };
  };

  const handleOpacityInteractionEnd = (
    value: number
  ) => {
    recordWorkflowAction({
      type: 'set_opacity',
      source: 'gui',
      label: `Set Opacity to ${value}`,
      target: 'matrix',
      parameters: {
        value
      }
    });
  };

  const handleRowClusterDepthInteractionEnd = (
    value: number
  ) => {
    const canonicalTarget: WorkflowTarget =
      matrixOrientation === 'Transposed'
        ? 'columns'
        : 'rows';

    recordWorkflowAction({
      type: 'set_cluster_depth',
      source: 'gui',
      label: `Set Row Cluster Depth to ${value}`,
      target: canonicalTarget,
      parameters: {
        value
      }
    });
  };

  const handleColumnClusterDepthInteractionEnd = (
    value: number
  ) => {
    const canonicalTarget: WorkflowTarget =
      matrixOrientation === 'Transposed'
        ? 'rows'
        : 'columns';

    recordWorkflowAction({
      type: 'set_cluster_depth',
      source: 'gui',
      label: `Set Column Cluster Depth to ${value}`,
      target: canonicalTarget,
      parameters: {
        value
      }
    });
  };

  const handleMetadataSelectionChange = (
    axis: 'row' | 'col',
    categories: string[]
  ) => {
    const target: WorkflowTarget =
      axis === 'row'
        ? 'rows'
        : 'columns';

    const axisLabel =
      axis === 'row'
        ? 'Row'
        : 'Column';

    recordWorkflowAction({
      type: 'set_metadata_categories',
      source: 'gui',
      label:
        categories.length > 0
          ? `Set ${axisLabel} Metadata Categories: ${categories.join(', ')}`
          : `Clear ${axisLabel} Metadata Categories`,
      target,
      parameters: {
        categories: [...categories]
      }
    });
  };

  const resetAnalysisForImportedWorkflow = () => {
    setMatrixOrientation('Original');

    setZScoreAxis('row');
    setReZscoreFilteredSubset(false);
    setOpacityValue(OPACITY);
    setRowClusterValue(5);
    setColClusterValue(5);

    const baselineRowCategories =
      data?.cat_colors?.row
        ? Object.keys(data.cat_colors.row)
          .map(key => {
            const categoryEntry =
              data.cat_colors.row[key];

            return Object.keys(categoryEntry ?? {})[0]
              ?.split(':')[0]
              ?.trim();
          })
          .filter(
            (value): value is string =>
              typeof value === 'string' &&
              value.length > 0
          )
          .slice(0, MAX_CATEGORIES)
        : [];

    const baselineColumnCategories =
      data?.cat_colors?.col
        ? Object.keys(data.cat_colors.col)
          .map(key => {
            const categoryEntry =
              data.cat_colors.col[key];

            return Object.keys(categoryEntry ?? {})[0]
              ?.split(':')[0]
              ?.trim();
          })
          .filter(
            (value): value is string =>
              typeof value === 'string' &&
              value.length > 0
          )
          .slice(0, MAX_CATEGORIES)
        : [];

    setOrder({
      row: 'alphabetically',
      col: 'alphabetically',
      rowCat: baselineRowCategories,
      sortByRowCat: '',
      colCat: baselineColumnCategories,
      sortByColCat: '',
      sortColsByRowName: null,
      sortRowsByColName: null
    });

    setFilters({
      row: [],
      col: []
    });

    filteredData.current = null;

    setFilteredIdxDict(null);
    setCropBox(null);
    setCroppedRowIndices(null);
    setCroppedColIndices(null);
    setIsCropping(false);
    setIsDrawing(false);

    setDataVersion(prev => prev + 1);
  };

  const failImportedWorkflowReplay = (
    replay: NonNullable<
      typeof pendingImportedWorkflowReplayRef.current
    >
  ) => {
    replay.phase = 'failed';
    setIsImportedWorkflowRunning(false);

    restoreAnalysisSnapshot(
      replay.preImportSnapshot
    );

    setWorkflowHistory(
      replay.preImportWorkflowHistory
    );

    undoStackRef.current = [
      ...replay.preImportUndoStack
    ];

    redoStackRef.current = [
      ...replay.preImportRedoStack
    ];

    setHistoryVersion(prev => prev + 1);

    setToastMessage(
      'Imported workflow failed. Your previous analysis was restored.'
    );
    setToastSeverity('error');
    setToastOpen(true);
  };

  const handleRunImportedWorkflow = (
    actions: WorkflowAction[]
  ) => {
    if (actions.length === 0) {
      return;
    }

    const existingReplay =
      pendingImportedWorkflowReplayRef.current;

    setWorkflowHistory(
      createEmptyWorkflowHistory()
    );

    undoStackRef.current = [];
    redoStackRef.current = [];

    setHistoryVersion(prev => prev + 1);

    if (
      existingReplay?.phase === 'waiting_for_baseline' ||
      existingReplay?.phase === 'running_action' ||
      existingReplay?.phase === 'ready_for_next_action'
    ) {
      console.warn(
        '⚠️ IMPORTED WORKFLOW REPLAY ALREADY RUNNING'
      );
      return;
    }

    setIsImportedWorkflowRunning(true);

    pendingImportedWorkflowReplayRef.current = {
      actions: [...actions],

      preImportSnapshot: createAnalysisSnapshot(),

      preImportWorkflowHistory: {
        actions: [...workflowHistory.actions],
        cursor: workflowHistory.cursor
      },

      preImportUndoStack: [
        ...undoStackRef.current
      ],

      preImportRedoStack: [
        ...redoStackRef.current
      ],

      baselineDataStateVersion:
        datastateVersion + 1,

      phase: 'waiting_for_baseline',
      index: 0
    };

    console.log(
      '🧼 IMPORTED WORKFLOW RESETTING TO BASELINE',
      actions
    );

    resetAnalysisForImportedWorkflow();
  };

  const completeImportedWorkflowAction = (
    action: WorkflowAction
  ) => {
    const replay =
      pendingImportedWorkflowReplayRef.current;

    if (
      !replay ||
      replay.phase !== 'running_action'
    ) {
      return;
    }

    const importedAction: WorkflowAction = {
      ...action,
      source: 'imported'
    };

    setWorkflowHistory(prev =>
      appendWorkflowAction(
        prev,
        importedAction
      )
    );

    replay.index += 1;
    replay.phase = 'ready_for_next_action';

    console.log(
      '✅ IMPORTED ACTION COMPLETED',
      importedAction
    );

    console.log(
      '⏭️ NEXT IMPORTED ACTION INDEX',
      replay.index
    );
  };

  const saveImportedWorkflowUndoPoint = (
    workflowCursor: number
  ) => {
    const snapshot: AnalysisSnapshot = {
      ...createAnalysisSnapshot(),
      workflowCursor
    };

    undoStackRef.current.push(snapshot);

    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }

    redoStackRef.current = [];

    setHistoryVersion(prev => prev + 1);
  };

  const executeImportedWorkflowAction = (
    action: WorkflowAction
  ): boolean => {
    if (action.type === 'zscore') {
      const axis =
        action.parameters.axis as ZScoreAxis;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setZScoreAxis(axis);

      handleRenderHeatmap(
        filters,
        {
          axis,
          reZscoreFilteredSubset
        },
        () => {
          completeImportedWorkflowAction(action);
        }
      );

      return true;
    }

    if (action.type === 'rezscore_filtered_subset') {
      const enabled =
        action.parameters.enabled as boolean;

      const axis =
        action.parameters.axis as ZScoreAxis;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setReZscoreFilteredSubset(enabled);

      handleRenderHeatmap(
        filters,
        {
          axis,
          reZscoreFilteredSubset: enabled
        },
        () => {
          completeImportedWorkflowAction(action);
        }
      );

      return true;
    }

    if (action.type === 'set_distance') {
      const distance =
        action.parameters.distance as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'set_distance',
          parameters: {
            distance
          }
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'set_linkage') {
      const linkage =
        action.parameters.linkage as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'set_linkage',
          parameters: {
            linkage
          }
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'set_clustering') {
      const distance =
        action.parameters.distance as string;

      const linkage =
        action.parameters.linkage as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'set_clustering',
          parameters: {
            distance,
            linkage
          }
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'filter') {
      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'filter',
          target: action.target,
          parameters: action.parameters
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'inverse_filter') {
      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'inverse_filter',
          target: action.target,
          parameters: action.parameters
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'clear_filters') {
      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'clear_filters',
          target: action.target,
          parameters: action.parameters
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'variance_filter') {
      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      void processWorkflowAction(
        sessionID,
        {
          type: 'variance_filter',
          target: action.target,
          parameters: action.parameters
        },
        {
          filters,
          commandHistory,
          transformation: {
            axis: zScoreAxis,
            reZscoreFilteredSubset
          }
        }
      )
        .then((res) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            !replay ||
            replay.phase !== 'running_action'
          ) {
            return;
          }

          if (
            res?.error ||
            !res?.clustering_result
          ) {
            failImportedWorkflowReplay(replay);

            console.error(
              '❌ IMPORTED WORKFLOW REPLAY FAILED',
              {
                index: replay.index,
                action,
                error: res?.error
              }
            );

            return;
          }

          const parsedResult =
            typeof res.clustering_result === 'string'
              ? JSON.parse(res.clustering_result)
              : res.clustering_result;

          if (res.updated_filters) {
            setFilters(res.updated_filters);
          }

          filteredData.current = parsedResult;

          const renderedRowCount =
            parsedResult?.row_nodes?.length ?? 0;

          const renderedColCount =
            parsedResult?.col_nodes?.length ?? 0;

          setOrder(prev => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',
            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: '',
            sortByColCat: '',
            sortColsByRowName: null
          }));

          setDataVersion(prev => prev + 1);
        })
        .catch((error) => {
          const replay =
            pendingImportedWorkflowReplayRef.current;

          if (
            replay &&
            replay.phase === 'running_action'
          ) {
            failImportedWorkflowReplay(replay);
          }

          console.error(
            '❌ IMPORTED WORKFLOW REPLAY FAILED',
            {
              index: replay?.index,
              action,
              error
            }
          );
        });

      return true;
    }

    if (action.type === 'remove_filters') {
      const filtersToRemove =
        action.parameters.filters as Array<{
          axis: 'row' | 'col';
          [key: string]: any;
        }>;

      const nextFilters = {
        row: [...(filters?.row ?? [])],
        col: [...(filters?.col ?? [])]
      };

      for (const descriptor of filtersToRemove) {
        const { axis, ...filterToRemove } = descriptor;

        const matchIndex =
          nextFilters[axis].findIndex(
            candidate =>
              JSON.stringify(candidate) ===
              JSON.stringify(filterToRemove)
          );

        if (matchIndex < 0) {
          console.error(
            '❌ IMPORTED REMOVE_FILTERS MATCH FAILED',
            descriptor
          );

          return false;
        }

        nextFilters[axis].splice(matchIndex, 1);
      }

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setFilters(nextFilters);
      handleRenderHeatmap(nextFilters);

      return true;
    }

    if (action.type === 'crop') {
      const rowIndices =
        action.parameters.rowIndices as number[];

      const columnIndices =
        action.parameters.columnIndices as number[];

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      // Prevent any in-progress GUI crop box from interfering.
      setCropBox(null);

      // Workflow crop indices are stored in canonical matrix space.
      setCroppedRowIndices([...rowIndices]);
      setCroppedColIndices([...columnIndices]);

      // The worker recomputes DataState when the canonical crop
      // index arrays change.
      resetViewToOrigin();

      return true;
    }

    if (action.type === 'clear_crop') {
      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setFilteredIdxDict(null);
      setCropBox(null);
      setIsCropping(false);
      setIsDrawing(false);

      // Clearing the canonical crop indices triggers the worker
      // to rebuild the full matrix.
      setCroppedRowIndices(null);
      setCroppedColIndices(null);

      resetViewToOrigin();

      return true;
    }

    if (action.type === 'sort_by_metadata') {
      const field =
        action.parameters.field as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );


      setOrder(prev => {
        if (action.target === 'rows') {
          return {
            ...prev,
            sortByRowCat: field,
            sortRowsByColName: null
          };
        }

        return {
          ...prev,
          sortByColCat: field,
          sortColsByRowName: null
        };
      });

      return true;
    }

    if (action.type === 'sort_by_expression') {
      const feature =
        action.parameters.feature as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setOrder(prev => {
        if (action.target === 'rows') {
          return {
            ...prev,
            row: '',
            sortByRowCat: '',
            sortRowsByColName: feature
          };
        }

        return {
          ...prev,
          col: '',
          sortByColCat: '',
          sortColsByRowName: feature
        };
      });
      return true;
    }

    if (action.type === 'set_metadata_categories') {
      const categories =
        action.parameters.categories as string[];

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setOrder(prev => {
        if (action.target === 'rows') {
          return {
            ...prev,
            rowCat: [...categories]
          };
        }

        if (action.target === 'columns') {
          return {
            ...prev,
            colCat: [...categories]
          };
        }

        return prev;
      });

      return true;
    }

    if (action.type === 'set_opacity') {
      const value =
        action.parameters.value as number;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setOpacityValue(value);

      return true;
    }

    if (action.type === 'set_cluster_depth') {
      const value =
        action.parameters.value as number;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      if (action.target === 'rows') {
        setRowClusterValue(value);
      } else if (action.target === 'columns') {
        setColClusterValue(value);
      } else {
        return false;
      }

      return true;
    }

    if (action.type === 'transpose') {
      const orientation =
        action.parameters.orientation as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      setMatrixOrientation(orientation);

      return true;
    }

    if (action.type === 'sort') {
      const method =
        action.parameters.method as string;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );


      setOrder(prev => {
        if (action.target === 'rows') {
          return {
            ...prev,
            row: method,
            sortByRowCat: '',
            sortRowsByColName: null
          };
        }

        if (action.target === 'columns') {
          return {
            ...prev,
            col: method,
            sortByColCat: '',
            sortColsByRowName: null
          };
        }

        return {
          ...prev,
          row: method,
          col: method,
          sortByRowCat: '',
          sortByColCat: '',
          sortColsByRowName: null,
          sortRowsByColName: null
        };
      });


      return true;
    }

    if (action.type === 'cluster') {
      const target = action.parameters.target;

      console.log(
        '▶️ REPLAYING IMPORTED ACTION',
        action
      );

      if (target === 'rows') {
        setOrder(prev => ({
          ...prev,
          row: 'cluster',
          sortByRowCat: '',
          sortRowsByColName: null
        }));

        return true;
      }

      if (target === 'columns') {
        setOrder(prev => ({
          ...prev,
          col: 'cluster',
          sortByColCat: '',
          sortColsByRowName: null
        }));

        return true;
      }

      if (target === 'both') {
        setOrder(prev => ({
          ...prev,
          row: 'cluster',
          col: 'cluster',
          sortByRowCat: '',
          sortByColCat: '',
          sortColsByRowName: null,
          sortRowsByColName: null
        }));

        return true;
      }

      return false;
    }

    console.warn(
      '⏸️ IMPORTED REPLAY ACTION NOT IMPLEMENTED YET',
      action
    );

    return false;
  };

  useEffect(() => {
    const replay =
      pendingImportedWorkflowReplayRef.current;

    if (!replay) {
      return;
    }

    if (replay.phase === 'waiting_for_baseline') {
      if (
        datastateVersion <
        replay.baselineDataStateVersion
      ) {
        return;
      }

      console.log(
        '✅ IMPORTED WORKFLOW BASELINE READY',
        replay.actions
      );

      const firstAction =
        replay.actions[replay.index];

      if (!firstAction) {
        return;
      }

      saveImportedWorkflowUndoPoint(
        replay.index
      );

      replay.phase = 'running_action';

      const started =
        executeImportedWorkflowAction(firstAction);

      if (!started) {
        failImportedWorkflowReplay(replay);

        console.error(
          '❌ IMPORTED WORKFLOW REPLAY FAILED',
          {
            index: replay.index,
            action: firstAction
          }
        );
      }

      return;
    }

    if (
      replay.phase === 'ready_for_next_action' &&
      replay.index >= replay.actions.length
    ) {
      replay.phase = 'completed';
      setIsImportedWorkflowRunning(false);

      console.log(
        '🏁 IMPORTED WORKFLOW COMPLETED',
        {
          totalActions: replay.actions.length
        }
      );

      return;
    }

    /*
     * Advance to the next imported workflow action.
     */
    if (
      replay.phase === 'ready_for_next_action' &&
      replay.index < replay.actions.length
    ) {
      const nextAction =
        replay.actions[replay.index];

      if (!nextAction) {
        return;
      }

      saveImportedWorkflowUndoPoint(
        replay.index
      );

      replay.phase = 'running_action';

      const started =
        executeImportedWorkflowAction(nextAction);

      if (!started) {
        failImportedWorkflowReplay(replay);

        console.error(
          '❌ IMPORTED WORKFLOW REPLAY FAILED',
          {
            index: replay.index,
            action: nextAction
          }
        );
      }
    }
  }, [datastateVersion]);

  const handleGuiClearFiltersRequest = () => {
    saveUndoPoint();
    pendingGuiClearFiltersWorkflowRef.current = true;
  };

  const handleGuiRemoveFiltersRequest = (
    removedFilters: Array<{
      axis: 'row' | 'col';
      type: string;
      field?: string;
      value?: any;
      top_n?: number;
      criteria?: Array<{
        field: string;
        value: any;
      }>;
    }>
  ) => {
    saveUndoPoint();
    pendingGuiRemoveFiltersWorkflowRef.current = removedFilters;
  };

  const normalizeWorkflowTarget = (
    targetValue: unknown
  ): WorkflowTarget | undefined => {

    const normalized =
      String(targetValue ?? '').toLowerCase();

    if (
      normalized === 'row' ||
      normalized === 'rows'
    ) {
      return 'rows';
    }

    if (
      normalized === 'col' ||
      normalized === 'cols' ||
      normalized === 'column' ||
      normalized === 'columns'
    ) {
      return 'columns';
    }

    if (normalized === 'both') {
      return 'both';
    }

    return undefined;
  };

  const setMatrixOrientationWithHistory: React.Dispatch<
    React.SetStateAction<string>
  > = (value) => {
    const nextOrientation =
      typeof value === 'function'
        ? value(matrixOrientation)
        : value;

    if (nextOrientation === matrixOrientation) {
      return;
    }

    const willBeTransposed =
      nextOrientation === 'Transposed';

    saveUndoPoint();

    setMatrixOrientation(nextOrientation);

    recordWorkflowAction({
      type: 'transpose',
      source: 'gui',
      label: willBeTransposed
        ? 'Transpose Matrix'
        : 'Restore Original Orientation',
      target: 'matrix',
      parameters: {
        orientation: nextOrientation,
        transposed: willBeTransposed
      }
    });
  };

  const restoreAnalysisSnapshot = (snapshot: AnalysisSnapshot) => {
    setOrder({
      ...snapshot.order,
      rowCat: [...snapshot.order.rowCat],
      colCat: [...snapshot.order.colCat],
    });

    setMatrixOrientation(snapshot.matrixOrientation);

    setZScoreAxis(snapshot.zScoreAxis);
    setReZscoreFilteredSubset(
      snapshot.reZscoreFilteredSubset
    );

    setFilters(cloneFilters(snapshot.filters));

    setRowClusterValue(snapshot.rowClustGroup);
    setColClusterValue(snapshot.colClustGroup);

    setOpacityValue(snapshot.opacityValue);

    setSearchTerm(snapshot.searchTerm);
    setPvalThreshold(snapshot.pvalThreshold);

    // Restore the previous in-memory dataset reference.
    filteredData.current = snapshot.filteredData;

    setFilteredIdxDict(
      snapshot.filteredIdxDict
        ? { ...snapshot.filteredIdxDict }
        : null
    );

    setCroppedRowIndices(
      snapshot.croppedRowIndices
        ? [...snapshot.croppedRowIndices]
        : null
    );

    setCroppedColIndices(
      snapshot.croppedColIndices
        ? [...snapshot.croppedColIndices]
        : null
    );

    setCropBox(null);
    setIsCropping(false);
    setIsDrawing(false);

    // Force the worker to render the restored dataset/state.
    setCommandHistory([...snapshot.commandHistory]);
    setWorkflowHistory(prev => ({
      ...prev,
      cursor: Math.max(
        0,
        Math.min(
          snapshot.workflowCursor,
          prev.actions.length
        )
      )
    }));

    setDataVersion(prev => prev + 1);
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) {
      return;
    }

    const currentSnapshot = createAnalysisSnapshot();
    const previousSnapshot = undoStackRef.current.pop();

    if (!previousSnapshot) {
      return;
    }

    redoStackRef.current.push(currentSnapshot);

    if (redoStackRef.current.length > MAX_HISTORY) {
      redoStackRef.current.shift();
    }

    restoreAnalysisSnapshot(previousSnapshot);

    setHistoryVersion(prev => prev + 1);
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) {
      return;
    }

    const currentSnapshot = createAnalysisSnapshot();
    const nextSnapshot = redoStackRef.current.pop();

    if (!nextSnapshot) {
      return;
    }

    undoStackRef.current.push(currentSnapshot);

    if (undoStackRef.current.length > MAX_HISTORY) {
      undoStackRef.current.shift();
    }

    restoreAnalysisSnapshot(nextSnapshot);

    setHistoryVersion(prev => prev + 1);
  };

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  const previousOrder = usePrevious(order);
  tooltipFunction = generateTooltipContent

  const hasRowMetadata =
    Object.keys(data?.cat_colors?.row ?? {}).length > 0;

  const hasColMetadata =
    Object.keys(data?.cat_colors?.col ?? {}).length > 0;

  let sourceFeatureAxis: 'row' | 'col' | null = null;

  if (hasColMetadata && !hasRowMetadata) {
    sourceFeatureAxis = 'row';
  } else if (hasRowMetadata && !hasColMetadata) {
    sourceFeatureAxis = 'col';
  } else if (!hasRowMetadata && !hasColMetadata) {
    // Preserve existing behavior for matrices without metadata.
    sourceFeatureAxis = 'row';
  }

  const visualFeatureAxis =
    sourceFeatureAxis === null
      ? null
      : matrixOrientation === 'Transposed'
        ? sourceFeatureAxis === 'row'
          ? 'col'
          : 'row'
        : sourceFeatureAxis;

  const clickableClusterId =
    visualFeatureAxis === null
      ? null
      : `${visualFeatureAxis}-cluster`;


  const stableOnClick = useMemo(() => ({
    heatmapCell: (info: any, event: any) => {
      // Handle internal logic first
      // Check if clicking on a cluster (only row not col)
      if (info?.object?.id === clickableClusterId) {
        console.log('Cluster clicked:', info.object);
        setClickedClusterData({
          Nodes: info.object.nodes,
          Group: info.object.text,
          filters: filters // Include current filters
        });
        setIsTableVisible(true);
      }
      // Then, call the handler passed from the parent if it exists
      onClick?.heatmapCell?.(info, event);
    },
    rowLabel: (info: any, event: any) => {
      // Sort columns by this row's values
      console.log('🖱️ Row label clicked:', info);

      if (
        matrixOrientation === 'Transposed' &&
        info?.index !== undefined &&
        info.index >= 0 &&
        dataStateRef.current?.rowLabels
      ) {
        const colName =
          dataStateRef.current.rowLabels[info.index]?.text;

        if (colName) {
          const currentOrder = orderRef.current;

          const willChange =
            currentOrder.row !== "" ||
            currentOrder.sortByRowCat !== "" ||
            currentOrder.sortRowsByColName !== colName;

          if (willChange) {
            saveUndoPointRef.current();

            pendingGuiExpressionSortWorkflowRef.current = {
              feature: colName,
              target: 'rows'
            };

            setOrder((prev) => ({
              ...prev,
              row: "",
              sortByRowCat: "",
              sortRowsByColName: colName
            }));
          }
        }
      }

      if (
        matrixOrientation !== 'Transposed' &&
        info?.index !== undefined &&
        info.index >= 0 &&
        dataStateRef.current?.rowLabels
      ) {
        const rowName =
          dataStateRef.current.rowLabels[info.index]?.text;

        console.log('📍 Row name extracted:', rowName);

        if (rowName) {
          const currentOrder = orderRef.current;

          const willChange =
            currentOrder.col !== "" ||
            currentOrder.sortByColCat !== "" ||
            currentOrder.sortColsByRowName !== rowName;

          if (willChange) {
            saveUndoPointRef.current();

            pendingGuiExpressionSortWorkflowRef.current = {
              feature: rowName,
              target: 'columns'
            };

            console.log(
              '✅ Setting order with sortColsByRowName:',
              rowName
            );

            setOrder((prev) => {
              const newOrder = {
                ...prev,
                col: "",
                sortByColCat: "",
                sortColsByRowName: rowName
              };

              console.log('📝 New order state:', newOrder);
              return newOrder;
            });
          }
        }
      }

      // Then, call the handler passed from the parent if it exists
      onClick?.rowLabel?.(info, event);
    },
    columnLabel: (info: any, event: any) => {
      if (
        matrixOrientation !== 'Transposed' &&
        info?.index !== undefined &&
        info.index >= 0 &&
        dataStateRef.current?.colLabels
      ) {
        const colName =
          dataStateRef.current.colLabels[info.index]?.text;

        if (colName) {
          const currentOrder = orderRef.current;

          const willChange =
            currentOrder.row !== "" ||
            currentOrder.sortByRowCat !== "" ||
            currentOrder.sortRowsByColName !== colName;

          if (willChange) {
            saveUndoPointRef.current();

            pendingGuiExpressionSortWorkflowRef.current = {
              feature: colName,
              target: 'rows'
            };

            setOrder((prev) => ({
              ...prev,
              row: "",
              sortByRowCat: "",
              sortRowsByColName: colName
            }));
          }
        }
      }
      // In Transposed view, visible column labels are original row features.
      // Clicking one should sort the original columns/samples by that feature.
      if (
        matrixOrientation === 'Transposed' &&
        info?.index !== undefined &&
        info.index >= 0 &&
        dataStateRef.current?.colLabels
      ) {
        const rowName =
          dataStateRef.current.colLabels[info.index]?.text;

        if (rowName) {
          const currentOrder = orderRef.current;

          const willChange =
            currentOrder.col !== "" ||
            currentOrder.sortByColCat !== "" ||
            currentOrder.sortColsByRowName !== rowName;

          if (willChange) {
            saveUndoPointRef.current();

            pendingGuiExpressionSortWorkflowRef.current = {
              feature: rowName,
              target: 'columns'
            };

            setOrder((prev) => ({
              ...prev,
              col: "",
              sortByColCat: "",
              sortColsByRowName: rowName
            }));
          }
        }
      }

      onClick?.columnLabel?.(info, event);
    },
  }), [
    onClick,
    filters,
    matrixOrientation,
    sourceFeatureAxis,
    visualFeatureAxis,
    clickableClusterId
  ]);



  // 3. Add these functions after your existing functions
  const handlePathwaySelect = async (selectedPathway) => {
    setShowPathwaySelector(false);

    // Show loading while processing pathway selection
    showLoading(`Filtering heatmap to show genes from ${selectedPathway.name}...`);

    try {
      // Send the selected pathway back to the backend to get filtered data
      const filterMessage = `show genes from pathway: ${selectedPathway.name}`;
      const res = await queryOllama(filterMessage, sessionID, filters, commandHistory, transformation);

      hideLoading();

      if ("error" in res) {
        addNotification({
          type: 'error',
          title: 'Pathway Filter Error',
          message: `Could not filter by pathway: ${res.error}`,
          duration: 5000
        });
        return;
      }

      // Handle the filtered data response
      if (res.clustering_result) {
        // addNotification({
        //   type: 'success',
        //   title: 'Pathway Applied',
        //   message: `Heatmap filtered to show ${selectedPathway.gene_count} genes from "${selectedPathway.description}"`,
        //   duration: 5000,
        // });

        const parsedResult = typeof res.clustering_result === 'string'
          ? JSON.parse(res.clustering_result)
          : res.clustering_result;

        filteredData.current = parsedResult;
        setDataVersion(prev => prev + 1);
      }

      // Update command history
      setCommandHistory((prev) => [...prev, filterMessage]);

    } catch (error) {
      hideLoading();
      addNotification({
        type: 'error',
        title: 'Pathway Selection Error',
        message: error.message || 'Could not apply pathway filter',
        duration: 5000
      });
    }
  };

  const handlePathwaySelectorClose = () => {
    setShowPathwaySelector(false);
    setPathwayResults([]);
    setLastSearchQuery("");
  };

  const handleOllamaSendClick = async (message: string): Promise<{ success: boolean; message: string }> => {
    if (!message.trim()) {
      throw new Error("Please enter a command");
    }

    if (!sessionID) {
      throw new Error(
        "AI Assistant is still initializing for the example dataset. Please try again in a moment."
      );
    }

    // ✅ STEP 1: Show a loading bar for the AI interaction
    showLoading(`Sending command to AI Assistant...`);

    try {
      const backendMessage =
        mapVisualCommandToDataCommand(message);

      console.log(
        '🔄 Command orientation mapping:',
        {
          displayedCommand: message,
          backendCommand: backendMessage,
          matrixOrientation
        }
      );

      const res = await queryOllama(backendMessage, sessionID, filters, commandHistory, transformation);
      hideLoading(); // Hide loading bar as soon as AI responds

      console.log('***** res is as follows *******', res)

      // --- Handle Errors from AI/Backend ---
      if ("error" in res) {
        const suggestions = (res as any).suggestions as string[] | undefined;
        let errorMessage = res.error || "Sorry, I couldn't process that command.";
        let chatMessage = errorMessage; // Short version for chat history
        if (suggestions && suggestions.length > 0) {
          errorMessage += '\n' + suggestions.map(s => `• ${s}`).join('\n');
        }
        addNotification({
          type: suggestions ? 'info' : 'error',
          title: suggestions ? 'Try These Commands' : 'Command Error',
          message: errorMessage,
          duration: 10000
        });
        return { success: false, message: chatMessage };
      }
      if (!("action" in res)) {
        const errorMessage = "I couldn't determine an action from your command. Try: \"Cluster rows\", \"Sort by variance\", or \"Search for BRCA1\".";
        addNotification({ type: 'error', title: 'Command Unclear', message: errorMessage, duration: 8000 });
        throw new Error(errorMessage);
      }

      const {
        action,
        target,
        value = "",
        updated_filters,
        clustering_result,
        pathway_results,
        distance,
        linkage,
        resolved_filters
      } = res;

      let zScoreAxisFromResponse: ZScoreAxis | null = null;

      if (action === 'zscore') {
        zScoreAxisFromResponse =
          target === 'columns' ||
            target === 'cols' ||
            target === 'col'
            ? 'col'
            : 'row';
      }

      const workflowTarget =
        normalizeWorkflowTarget(target);

      const resolvedFilterCriteria =
        Array.isArray(resolved_filters)
          ? resolved_filters
            .filter(
              (filter: any) =>
                filter?.target &&
                filter?.value
            )
            .map((filter: any) => ({
              field: String(filter.target),
              value: filter.value,
              operator: 'equals'
            }))
          : [];

      // ✅ NEW: Handle pathway search results
      if (action === "pathway_search" && pathway_results) {
        setPathwayResults(pathway_results);
        setLastSearchQuery(value || message.replace(/show me |list |find /gi, '')); // Clean up the query for display
        setShowPathwaySelector(true);
        // addNotification({
        //   type: 'success',
        //   title: 'Pathways Found',
        //   message: `Found ${pathway_results.length} pathways. Please select one to filter your heatmap.`,
        //   duration: 3000,
        // });
        setCommandHistory((prev) => [...prev, backendMessage]);
        return { success: true, message: "Pathway search completed" };
      }

      // ✅ Save one undo snapshot before any successful AI action
      // that changes the heatmap or analysis state
      const heatmapChangingActions = new Set([
        "search",
        "sort",
        "cluster",
        "sort_by_meta",
        "sort_by_expression",
        "set_opacity",
        "zscore",
        "set_linkage",
        "set_distance",
        "set_clustering"
      ]);

      const aiChangesHeatmap =
        Boolean(clustering_result) ||
        Boolean(updated_filters) ||
        heatmapChangingActions.has(action);

      if (aiChangesHeatmap) {
        saveUndoPoint();
      }

      if (
        action === 'zscore' &&
        zScoreAxisFromResponse
      ) {
        setZScoreAxis(zScoreAxisFromResponse);

        recordWorkflowAction({
          type: 'zscore',
          source: 'nl',
          label:
            zScoreAxisFromResponse === 'row'
              ? 'Z-score by Row'
              : 'Z-score by Column',
          target:
            zScoreAxisFromResponse === 'row'
              ? 'rows'
              : 'columns',
          parameters: {
            axis: zScoreAxisFromResponse
          }
        });
      }

      if (action === 'set_distance') {
        recordWorkflowAction({
          type: 'set_distance',
          source: 'nl',
          label: `Set distance metric to ${value}`,
          target: 'both',
          parameters: {
            distance: value
          }
        });
      }

      if (action === 'set_linkage') {
        recordWorkflowAction({
          type: 'set_linkage',
          source: 'nl',
          label: `Set linkage method to ${value}`,
          target: 'both',
          parameters: {
            linkage: value
          }
        });
      }

      if (action === 'set_clustering') {
        const resolvedDistance =
          distance || 'correlation';

        const resolvedLinkage =
          linkage || 'average';

        recordWorkflowAction({
          type: 'set_clustering',
          source: 'nl',
          label:
            `Set clustering: ${resolvedDistance} distance + ` +
            `${resolvedLinkage} linkage`,
          target: 'both',
          parameters: {
            distance: resolvedDistance,
            linkage: resolvedLinkage
          }
        });
      }

      if (action === 'cluster') {
        const targetLabel =
          workflowTarget === 'rows'
            ? 'Rows'
            : workflowTarget === 'columns'
              ? 'Columns'
              : workflowTarget === 'both'
                ? 'Rows and Columns'
                : 'Matrix';

        recordWorkflowAction({
          type: 'cluster',
          source: 'nl',
          label: `Cluster ${targetLabel}`,
          target: workflowTarget,
          parameters: {
            target: workflowTarget
          }
        });
      }

      if (action === 'sort') {
        const targetLabel =
          workflowTarget === 'rows'
            ? 'Rows'
            : workflowTarget === 'columns'
              ? 'Columns'
              : workflowTarget === 'both'
                ? 'Rows and Columns'
                : 'Matrix';

        recordWorkflowAction({
          type: 'sort',
          source: 'nl',
          label:
            value
              ? `Sort ${targetLabel} by ${value}`
              : `Sort ${targetLabel}`,
          target: workflowTarget,
          parameters: {
            method: value
          }
        });
      }

      if (action === 'sort_by_meta') {
        const targetLabel =
          workflowTarget === 'rows'
            ? 'Rows'
            : workflowTarget === 'columns'
              ? 'Columns'
              : 'Matrix';

        recordWorkflowAction({
          type: 'sort_by_metadata',
          source: 'nl',
          label:
            `Sort ${targetLabel} by metadata: ${value}`,
          target: workflowTarget,
          parameters: {
            field: value
          }
        });
      }


      if (action === 'sort_by_expression') {
        const expressionSortTarget =
          sourceFeatureAxis === 'col'
            ? 'rows'
            : sourceFeatureAxis === 'row'
              ? 'columns'
              : null;

        if (expressionSortTarget) {
          const targetLabel =
            expressionSortTarget === 'rows'
              ? 'Rows'
              : 'Columns';

          recordWorkflowAction({
            type: 'sort_by_expression',
            source: 'nl',
            label: `Sort ${targetLabel} by ${value} expression`,
            target: expressionSortTarget,
            parameters: {
              feature: value
            }
          });
        }
      }


      if (
        action === 'sample_filter' ||
        action === 'gene_filter'
      ) {
        const filterTarget: WorkflowTarget =
          action === 'sample_filter'
            ? 'columns'
            : 'rows';

        recordWorkflowAction({
          type: 'filter',
          source: 'nl',
          label: `Filter ${String(target)} = ${String(value)}`,
          target: filterTarget,
          parameters: {
            field: target,
            value,
            operator: 'equals'
          }
        });
      }

      if (
        action === 'multi_filter' &&
        resolvedFilterCriteria.length > 0
      ) {
        const criteriaLabel =
          resolvedFilterCriteria
            .map(
              criterion =>
                `${criterion.field} = ${String(criterion.value)}`
            )
            .join(' AND ');

        recordWorkflowAction({
          type: 'filter',
          source: 'nl',
          label: `Filter ${criteriaLabel}`,
          target: 'columns',
          parameters: {
            mode: 'all',
            criteria: resolvedFilterCriteria
          }
        });
      }

      if (
        action === 'variance' &&
        workflowTarget === 'rows'
      ) {
        const topN = Number.parseInt(
          String(value),
          10
        );

        if (Number.isFinite(topN) && topN > 0) {
          recordWorkflowAction({
            type: 'variance_filter',
            source: 'nl',
            label: `Keep Top ${topN} Rows by Variance`,
            target: 'rows',
            parameters: {
              topN,
              metric: 'variance'
            }
          });
        }
      }

      if (
        action === 'multi_exclude' &&
        resolvedFilterCriteria.length > 0
      ) {
        const excludeCriteria =
          resolvedFilterCriteria.map(
            criterion => ({
              ...criterion,
              operator: 'exclude_equals'
            })
          );

        const criteriaLabel =
          excludeCriteria
            .map(
              criterion =>
                `${criterion.field} = ${String(criterion.value)}`
            )
            .join(' OR ');

        recordWorkflowAction({
          type: 'inverse_filter',
          source: 'nl',
          label: `Exclude ${criteriaLabel}`,
          target: 'columns',
          parameters: {
            mode: 'any',
            criteria: excludeCriteria
          }
        });
      }

      if (action === 'exclude_filter') {
        recordWorkflowAction({
          type: 'inverse_filter',
          source: 'nl',
          label:
            `Exclude ${String(target)} = ${String(value)}`,
          target: 'columns',
          parameters: {
            field: target,
            value,
            operator: 'exclude_equals'
          }
        });
      }

      const hadActiveFilters =
        (filters?.row?.length ?? 0) > 0 ||
        (filters?.col?.length ?? 0) > 0;

      if (
        action === 'clear_filters' &&
        hadActiveFilters
      ) {
        recordWorkflowAction({
          type: 'clear_filters',
          source: 'nl',
          label: 'Clear All Filters',
          target: 'matrix',
          parameters: {}
        });
      }

      // ✅ STEP 2: Check if the backend sent a new data payload
      if (clustering_result) {
        // --- This was a "Data Subsetting" Command (e.g., filter, variance) ---
        // addNotification({
        //   type: 'info',
        //   title: 'Applying New Data',
        //   message: 'Backend processing complete. Applying new data and re-rendering the heatmap...',
        //   duration: 4000,
        // });

        const parsedResult = typeof clustering_result === 'string'
          ? JSON.parse(clustering_result)
          : clustering_result;

        const renderedRowCount =
          parsedResult?.row_nodes?.length ?? 0;

        const renderedColCount =
          parsedResult?.col_nodes?.length ?? 0;

        console.log(
          '📊 Filtered heatmap dimensions:',
          {
            rows: renderedRowCount,
            columns: renderedColCount
          }
        );

        // A single row/column cannot be hierarchically ordered
        // along that axis. Fall back to normal ordering rather
        // than leaving the worker in "cluster" mode.
        if (
          renderedRowCount <= 1 ||
          renderedColCount <= 1
        ) {
          setOrder((prev) => ({
            ...prev,

            row:
              renderedRowCount <= 1
                ? 'alphabetically'
                : prev.row,

            col:
              renderedColCount <= 1
                ? 'alphabetically'
                : prev.col,

            sortByRowCat:
              renderedRowCount <= 1
                ? ''
                : prev.sortByRowCat,

            sortByColCat:
              renderedColCount <= 1
                ? ''
                : prev.sortByColCat,

            sortColsByRowName:
              renderedColCount <= 1
                ? null
                : prev.sortColsByRowName
          }));
        }

        filteredData.current = parsedResult;

        // ✅ Auto-switch to cluster order when linkage or distance is changed
        // This ensures the user sees the effect of clustering parameter changes
        if (action === "set_linkage" || action === "set_distance" || action === "set_clustering") {
          setOrder((prev) => ({
            ...prev,
            row:
              renderedRowCount > 1
                ? 'cluster'
                : 'alphabetically',

            col:
              renderedColCount > 1
                ? 'cluster'
                : 'alphabetically',
            sortByRowCat: "",
            sortByColCat: "",
            sortColsByRowName: null,
            sortRowsByColName: null
          }));

          // Build notification message based on action type
          let notificationTitle = 'Clustering Updated';
          let notificationMessage = '';

          if (action === "set_clustering") {
            const resolvedDistance =
              distance || 'correlation';

            const resolvedLinkage =
              linkage || 'average';

            notificationTitle =
              'Clustering Parameters Updated';

            notificationMessage =
              `Distance: "${resolvedDistance}", ` +
              `Linkage: "${resolvedLinkage}". ` +
              `Rows and columns now sorted by cluster order.`;
          } else if (action === "set_linkage") {
            notificationTitle = 'Linkage Updated';
            notificationMessage = `Linkage method set to "${value}". Rows and columns now sorted by cluster order.`;
          } else {
            notificationTitle = 'Distance Updated';
            notificationMessage = `Distance metric set to "${value}". Rows and columns now sorted by cluster order.`;
          }

          // addNotification({
          //   type: 'success',
          //   title: notificationTitle,
          //   message: notificationMessage,
          //   duration: 5000,
          // });
        }

        setDataVersion(prev => prev + 1); // This will trigger the worker and its own notifications

      } else {
        // --- This was a "View State" Command (e.g., sort, cluster, search) ---
        // We just update the local state. The regular notification system will take over.
        if (action === "search") {
          setSearchTerm(value);
        } else if (action === "sort" || action === "cluster") {
          // The existing notifySortStarted/notifyClusteringStarted will be called
          // automatically when the setOrder state change is detected.

          if (target === "rows") {
            setOrder((prev) => ({
              ...prev,
              row: value || 'cluster',
              sortByRowCat: "",
              sortRowsByColName: null
            }));
          } else if (target === "columns" || target === "cols") {
            setOrder((prev) => ({
              ...prev,
              col: value || 'cluster',
              sortByColCat: "",
              sortColsByRowName: null
            }));
          } else if (target === "both") {
            setOrder((prev) => ({
              ...prev,
              row: value || 'cluster',
              col: value || 'cluster',
              sortByRowCat: "",
              sortByColCat: "",
              sortColsByRowName: null,
              sortRowsByColName: null
            }));
          }
        } else if (action === "sort_by_meta") {
          if (target === "rows") {
            setOrder((prev) => ({
              ...prev,
              row: "",
              sortByRowCat: value,
              sortRowsByColName: null
            }));
          } else if (target === "columns" || target === "cols") {
            setOrder((prev) => ({
              ...prev,
              col: "",
              sortByColCat: value,
              sortColsByRowName: null
            }));
          }

        } else if (action === "sort_by_expression") {
          if (sourceFeatureAxis === 'col') {
            // Features are physical columns:
            // sort physical rows by this feature's values.
            setOrder((prev) => ({
              ...prev,
              row: "",
              sortByRowCat: "",
              sortRowsByColName: value
            }));
          } else if (sourceFeatureAxis === 'row') {
            // Features are physical rows:
            // sort physical columns by this feature's values.
            setOrder((prev) => ({
              ...prev,
              col: "",
              sortByColCat: "",
              sortColsByRowName: value
            }));
          }
        } else if (action === "set_opacity") {
          // Parse the opacity value from the command
          let newOpacityValue = OpacityValue; // Start with current value

          // Define opacity range (from Panel.tsx slider configuration)
          const MIN_OPACITY = 0.5;
          const MAX_OPACITY = 3.0;
          const OPACITY_STEP = 0.5;

          if (value) {
            // Handle relative descriptive values
            if (value.toLowerCase() === "dark") {
              // Increase opacity by one step, but don't exceed maximum
              newOpacityValue = Math.min(MAX_OPACITY, OpacityValue + OPACITY_STEP);
            } else if (value.toLowerCase() === "light") {
              // Decrease opacity by one step, but don't go below minimum
              newOpacityValue = Math.max(MIN_OPACITY, OpacityValue - OPACITY_STEP);
            } else if (value.toLowerCase() === "medium" || value.toLowerCase() === "normal") {
              newOpacityValue = 1.0; // Reset to default
            } else if (value.toLowerCase() === "transparent") {
              newOpacityValue = MIN_OPACITY; // Set to minimum
            } else if (value.toLowerCase() === "maximum" || value.toLowerCase() === "max") {
              newOpacityValue = MAX_OPACITY; // Set to maximum
            } else {
              // Handle numeric values
              const numericValue = parseFloat(value.replace('%', ''));
              if (!isNaN(numericValue)) {
                if (value.includes('%')) {
                  // Percentage: convert to decimal (50% -> 0.5)
                  newOpacityValue = numericValue / 100;
                } else {
                  // Direct numeric value
                  newOpacityValue = numericValue;
                }
                // Clamp to valid range
                newOpacityValue = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, newOpacityValue));
              }
            }
          }

          // Create informative message
          let changeDescription = "";
          if (value.toLowerCase() === "dark") {
            changeDescription = newOpacityValue === MAX_OPACITY ? " (maximum reached)" : " (darker)";
          } else if (value.toLowerCase() === "light") {
            changeDescription = newOpacityValue === MIN_OPACITY ? " (minimum reached)" : " (lighter)";
          } else {
            changeDescription = ` (${value})`;
          }

          setOpacityValue(newOpacityValue);
          // addNotification({
          //   type: 'info',
          //   title: 'Visuals Updated',
          //   message: `Opacity: ${OpacityValue.toFixed(1)} → ${newOpacityValue.toFixed(1)}${changeDescription}`
          // });
        }
      }

      // Update filters and command history for non-pathway commands
      if (updated_filters) {
        setFilters(updated_filters);
      }
      if (action !== "pathway_search") { // Don't duplicate command history for pathway searches
        setCommandHistory((prev) => [...prev, backendMessage]);
      }

      return { success: true, message: "Command processed" };

    } catch (error: any) {
      hideLoading(); // Ensure loading is hidden on error
      addNotification({
        type: 'error',
        title: 'An Unexpected Error Occurred',
        message: error.message || 'Could not complete the request.',
        duration: 5000
      });
      throw error;
    }
  };

  // const handleOllamaSendClick = async (message: string): Promise<{ success: boolean; message: string }> => {
  //   if (!message.trim()) {
  //     throw new Error("Please enter a command");
  //   }

  //   // ✅ STEP 1: Show a loading bar for the AI interaction
  //   showLoading(`Sending command to AI Assistant...`);

  //   try {
  //     const res = await queryOllama(message, sessionID, filters, commandHistory);
  //     hideLoading(); // Hide loading bar as soon as AI responds

  //     console.log('***** res is as follows *******',res)

  //     // --- Handle Errors from AI/Backend ---
  //     if ("error" in res) {
  //         // ... (your existing, excellent error parsing logic) ...
  //         const errorMessage = `Sorry, I couldn't process that. ${res.error}`;
  //         addNotification({ type: 'error', title: 'Command Error', message: errorMessage, autoHide: false });
  //         return
  //         // throw new Error(errorMessage);
  //     }
  //     if (!("action" in res)) {
  //         const errorMessage = "I couldn't determine an action from your command. Please try rephrasing.";
  //         addNotification({ type: 'error', title: 'Command Unclear', message: errorMessage, autoHide: false });
  //         throw new Error(errorMessage);
  //     }

  //     const { action, target, value = "", updated_filters, clustering_result } = res;

  //     // ✅ STEP 2: Check if the backend sent a new data payload
  //     if (clustering_result) {
  //         // --- This was a "Data Subsetting" Command (e.g., filter, variance) ---
  //         addNotification({
  //             type: 'info',
  //             title: 'Applying New Data',
  //             message: 'Backend processing complete. Applying new data and re-rendering the heatmap...',
  //             duration: 4000,
  //         });

  //         const parsedResult = typeof clustering_result === 'string' 
  //             ? JSON.parse(clustering_result) 
  //             : clustering_result;

  //         filteredData.current = parsedResult;
  //         setDataVersion(prev => prev + 1); // This will trigger the worker and its own notifications

  //     } else {
  //         // --- This was a "View State" Command (e.g., sort, cluster, search) ---
  //         // We just update the local state. The regular notification system will take over.
  //         if (action === "search") {
  //             setSearchTerm(value);
  //         } else if (action === "sort" || action === "cluster") {
  //             // The existing notifySortStarted/notifyClusteringStarted will be called
  //             // automatically when the setOrder state change is detected.
  //             if (target === "rows") {
  //                 setOrder((prev) => ({ ...prev, row: value || 'cluster', sortByRowCat: "" }));
  //             } else if (target === "columns" || target === "cols") {
  //                 setOrder((prev) => ({ ...prev, col: value || 'cluster', sortByColCat: "" }));
  //             }
  //         } else if (action === "sort_by_meta") {
  //             if (target === "rows") {
  //                 setOrder((prev) => ({ ...prev, row: "", sortByRowCat: value }));
  //             } else if (target === "columns" || target === "cols") {
  //                 setOrder((prev) => ({ ...prev, col: "", sortByColCat: value }));
  //             }
  //         } else if (action === "set_opacity") {
  //             // Your existing opacity logic...
  //             let newOpacityValue = 1.0; // Placeholder
  //             setOpacityValue(newOpacityValue);
  //             addNotification({type: 'info', title: 'Visuals Updated', message: `Opacity set to ${newOpacityValue.toFixed(1)}`});
  //         }
  //     }

  //     // Update filters and command history regardless of the command type
  //     if (updated_filters) {
  //         setFilters(updated_filters);
  //     }
  //     setCommandHistory((prev) => [...prev, message]);

  //     return { success: true, message: "Command processed" };

  //   } catch (error: any) {
  //     hideLoading(); // Ensure loading is hidden on error
  //     // The error notification is now handled by the logic above, 
  //     // but we keep this as a final fallback.
  //     addNotification({
  //         type: 'error',
  //         title: 'An Unexpected Error Occurred',
  //         message: error.message || 'Could not complete the request.',
  //         autoHide: false
  //     });
  //     throw error;
  //   }
  // };

  const rotatingGifUrl = 'https://i.pinimg.com/originals/39/b9/8f/39b98fd9cfae359c9d1fbee154bd279a.gif';




  // ✅ Reset `isOrderValid` whenever `dataId` changes (new data uploaded)


  let catTemporary = { "row": {}, "col": {} }

  const activeData = filteredData.current || data;

  const colMetadataValues = getMetadataValues(
    activeData?.cat_colors?.col
  );

  const rowMetadataValues = getMetadataValues(
    activeData?.cat_colors?.row
  );

  const workflowBaselineColMetadataValues =
    getMetadataValues(
      data?.cat_colors?.col
    );

  const workflowBaselineRowMetadataValues =
    getMetadataValues(
      data?.cat_colors?.row
    );

  let rowCats: Record<string, string> = {};
  let colCats: Record<string, string> = {};

  if (filteredData.current) {

    if (filteredData.current.cat_colors) {
      rowCats = Object.keys(filteredData.current.cat_colors.row || {}).reduce((acc, key) => {
        const catName = Object.keys(filteredData.current.cat_colors.row[key])[0]?.split(":")[0]?.trim() || "";
        acc[catName] = key;
        return acc;
      }, {} as Record<string, string>);

      colCats = Object.keys(filteredData.current.cat_colors.col || {}).reduce((acc, key) => {
        const catName = Object.keys(filteredData.current.cat_colors.col[key])[0]?.split(":")[0]?.trim() || "";
        acc[catName] = key;
        return acc;
      }, {} as Record<string, string>);

    }
  }

  // Extract row and column categories if they exist
  else if (data.cat_colors) {
    rowCats = Object.keys(data.cat_colors.row || {}).reduce((acc, key) => {
      const catName = Object.keys(data.cat_colors.row[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);

    colCats = Object.keys(data.cat_colors.col || {}).reduce((acc, key) => {
      const catName = Object.keys(data.cat_colors.col[key])[0]?.split(":")[0]?.trim() || "";
      acc[catName] = key;
      return acc;
    }, {} as Record<string, string>);
  }

  catTemporary = { "row": rowCats, "col": colCats };



  // ✅ Validate and update `order` (only when `dataId` changes)
  useEffect(() => {
    // setIsOrderValid(false);


    const hasRowCats = Object.keys(rowCats).length > 0;
    const hasColCats = Object.keys(colCats).length > 0;

    const isRowCatValid =
      (!hasRowCats && order.rowCat.length === 0) || // If no row categories exist and order.rowCat is empty, it's valid
      (hasRowCats && order.rowCat.length > 0 && order.rowCat.every((cat: string) => rowCats.hasOwnProperty(cat)));

    const isColCatValid =
      (!hasColCats && order.colCat.length === 0) || // If no column categories exist and order.colCat is empty, it's valid
      (hasColCats && order.colCat.length > 0 && order.colCat.every((cat: string) => colCats.hasOwnProperty(cat)));
    if (!isRowCatValid || !isColCatValid) {
      console.log('⚠️ Invalid order detected. Resetting categories.');

      setOrder((prev) => ({
        ...prev,
        rowCat: hasRowCats ? Object.keys(rowCats).slice(0, MAX_CATEGORIES) : [],
        colCat: hasColCats ? Object.keys(colCats).slice(0, MAX_CATEGORIES) : [],
      }));
    }
    // setIsOrderValid(true);
  }, [dataId, dataVersion]); // ✅ Runs only when `dataId` changes


  // Function to enable cropping mode
  //  const enableCropping = () => {
  //   setIsCropping(true);
  // };

  // const resetFilteredDict = () => {
  //   setFilteredIdxDict(null);
  //   setCropBox(null);
  // }

  // Function to get relative position of the mouse event to the heatmap element
  const getRelativePosition = (event: any, element: any) => {
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left).toFixed(2);  // Force two decimal points
    const y = (event.clientY - rect.top).toFixed(2);   // Force two decimal points

    // setBorderRect({
    //   left: rect.left,
    //   top: rect.top,
    //   width: rect.width,
    //   height: rect.height
    // });
    return { x: parseFloat(x), y: parseFloat(y) };
  };



  // Enhanced mouse down handler 
  // const handleMouseDown = (event: any) => {

  //   console.log('******* again coming in the handle mouse down and is cropping is *********', isCropping)
  //   // Only handle mouse down for cropping, not for panning
  //   if (!isCropping) {
  //     return; // Let DeckGL handle panning
  //   }

  //   console.log('🔍 CROP - Starting crop selection');

  //   const element = heatmapRef.current;
  //   if (!element) return;

  //   const { x, y } = getRelativePosition(event, element);
  //   setIsDrawing(true);
  //   setCropBox({ startX: x, startY: y, endX: x, endY: y });

  //   // Prevent event from interfering with DeckGL
  //   event.preventDefault();
  //   event.stopPropagation();
  // };

  const handleMouseDown = (event: any) => {
    // Only process if cropping mode is enabled
    if (!isCropping) return; // Let DeckGL handle panning

    event.preventDefault();
    event.stopPropagation();

    const element = heatmapRef.current;
    if (!element) return;

    const { x, y } = getRelativePosition(event, element);

    // Only start cropping if click is within the heatmap area (not in label regions)
    if (x >= rowLabelsWidth && y >= colLabelsWidth) {
      setIsDrawing(true);
      setCropBox({ startX: x, startY: y, endX: x, endY: y });
    }
  };

  // Enhanced mouse up handler
  const handleMouseUp = (event: any) => {
    if (!isDrawing) return;

    setIsDrawing(false);
    setIsCropping(false)

    // Show success message
    setToastMessage("✅ Crop area selected! Processing data...");
    setToastSeverity('info');
    setToastOpen(true);
  };

  // Enhanced mouse move handler
  const handleMouseMove = (event: MouseEvent) => {
    if (!isDrawing || !isCropping) return;

    const element = heatmapRef.current;
    if (!element) return;

    const { x, y } = getRelativePosition(event, element);
    setCropBox((prevBox) => {
      if (!prevBox) return null;
      return { ...prevBox, endX: x, endY: y };
    });
  };

  // Enhanced enable cropping
  const enableCropping = () => {
    setIsCropping(true);
    setCropBox(null);
    setIsDrawing(false);

    // Show user instruction
    setToastMessage("🎯 Cropping mode activated! Click and drag to select an area. Press ESC to cancel.");
    setToastSeverity('info');
    setToastOpen(true);
  };

  // Note: resetFilteredDict is defined after useViewStates call to access resetViewToOrigin

  const cancelCropping = () => {
    setIsCropping(false);
    setIsDrawing(false);
    setCropBox(null);

    // Show cancel message
    setToastMessage("❌ Cropping canceled");
    setToastSeverity('info');
    setToastOpen(true);
  };

  // ADD this new useEffect after your existing useEffects
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCropping) {
        cancelCropping();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCropping]);

  // ✅ Update the handleRenderHeatmap function to accept current filters
  const handleRenderHeatmap = (
    currentFilters: any,
    transformationOverride?: {
      axis: ZScoreAxis;
      reZscoreFilteredSubset: boolean;
    },
    onSuccess?: () => void
  ) => {
    showLoading('Applying filters and re-rendering heatmap...');

    let filtersWithCrop = { ...currentFilters };

    if (filteredIdxDict && dataStateRef.current) {
      const { rowLabels, colLabels } = dataStateRef.current;

      const croppedRows = rowLabels
        .slice(filteredIdxDict.startY, filteredIdxDict.endY + 1)
        .map((label: any) => label.text);

      const croppedCols = colLabels
        .slice(filteredIdxDict.startX, filteredIdxDict.endX + 1)
        .map((label: any) => label.text);

      filtersWithCrop = {
        ...currentFilters,
        cropFilter: {
          rows: croppedRows,
          cols: croppedCols,
          rowIndices: {
            start: filteredIdxDict.startY,
            end: filteredIdxDict.endY
          },
          colIndices: {
            start: filteredIdxDict.startX,
            end: filteredIdxDict.endX
          }
        }
      };
    }

    const activeTransformation =
      transformationOverride ?? {
        axis: zScoreAxis,
        reZscoreFilteredSubset
      };

    getRefreshHeatmap(sessionID, filtersWithCrop, activeTransformation)
      .then((res) => {
        if ("error" in res) {
          console.error("Heatmap Error:", res.error);

          addNotification({
            type: 'error',
            title: 'Heatmap Error',
            message:
              typeof res.error === 'string'
                ? res.error
                : 'Failed to refresh heatmap data.',
          });

          pendingGuiClearFiltersWorkflowRef.current = false;
          pendingGuiRemoveFiltersWorkflowRef.current = null;
          return;
        }

        const { clustering_result } = res;

        if (clustering_result) {
          try {
            const parsedResult =
              typeof clustering_result === 'string'
                ? JSON.parse(clustering_result)
                : clustering_result;

            filteredData.current = parsedResult;

            if (filteredIdxDict) {
              setFilteredIdxDict(null);
              setCropBox(null);
              resetViewToOrigin();
            }

            setDataVersion(prev => prev + 1);

            if (
              pendingGuiClearFiltersWorkflowRef.current &&
              (currentFilters?.row?.length ?? 0) === 0 &&
              (currentFilters?.col?.length ?? 0) === 0
            ) {
              pendingGuiClearFiltersWorkflowRef.current = false;

              recordWorkflowAction({
                type: 'clear_filters',
                source: 'gui',
                label: 'Clear All Filters',
                target: 'matrix',
                parameters: {}
              });
            }

            const removedFilters =
              pendingGuiRemoveFiltersWorkflowRef.current;

            if (removedFilters && removedFilters.length > 0) {
              pendingGuiRemoveFiltersWorkflowRef.current = null;

              const removedAxes = new Set(
                removedFilters.map(filter => filter.axis)
              );

              const target =
                removedAxes.size > 1
                  ? 'both'
                  : removedAxes.has('row')
                    ? 'rows'
                    : 'columns';

              recordWorkflowAction({
                type: 'remove_filters',
                source: 'gui',
                label:
                  removedFilters.length === 1
                    ? 'Remove 1 Filter'
                    : `Remove ${removedFilters.length} Filters`,
                target,
                parameters: {
                  filters: removedFilters
                }
              });
            }

            onSuccess?.();

          } catch (err) {
            pendingGuiClearFiltersWorkflowRef.current = false;
            pendingGuiRemoveFiltersWorkflowRef.current = null;
            console.error("❌ Error processing clustering result:", err);

            addNotification({
              type: 'error',
              title: 'Processing Error',
              message: 'Failed to parse clustering result from server.',
            });
          }
        } else {
          pendingGuiClearFiltersWorkflowRef.current = false;
          pendingGuiRemoveFiltersWorkflowRef.current = null;
        }
      })
      .catch((err) => {
        pendingGuiClearFiltersWorkflowRef.current = false;
        pendingGuiRemoveFiltersWorkflowRef.current = null;
        console.error("❌ Network error refreshing heatmap:", err);

        addNotification({
          type: 'error',
          title: 'Connection Error',
          message:
            'Failed to connect to the server. Please check that the backend is running.',
        });
      })
      .finally(() => {
        hideLoading();
      });
  };

  const handleReZscoreToggle = (enabled: boolean) => {
    if (enabled === reZscoreFilteredSubset) {
      return;
    }

    saveUndoPoint();

    setReZscoreFilteredSubset(enabled);

    handleRenderHeatmap(
      filters,
      {
        axis: zScoreAxis,
        reZscoreFilteredSubset: enabled
      },
      () => {
        recordWorkflowAction({
          type: 'rezscore_filtered_subset',
          source: 'gui',
          label: enabled
            ? 'Enable Re-Z-score Filtered Subset'
            : 'Disable Re-Z-score Filtered Subset',
          target:
            zScoreAxis === 'row'
              ? 'rows'
              : 'columns',
          parameters: {
            enabled,
            axis: zScoreAxis
          }
        });
      }
    );
  };

  const handleZScoreAxisChange = (
    displayedAxis: ZScoreAxis
  ) => {

    // Backend/data axes remain in original matrix orientation.
    // When transposed, displayed Row = original Column
    // and displayed Column = original Row.
    const actualAxis: ZScoreAxis =
      matrixOrientation === 'Transposed'
        ? (
          displayedAxis === 'row'
            ? 'col'
            : 'row'
        )
        : displayedAxis;

    const axisChanged =
      actualAxis !== zScoreAxis;

    if (axisChanged) {
      saveUndoPoint();
    }

    setZScoreAxis(actualAxis);

    handleRenderHeatmap(
      filters,
      {
        axis: actualAxis,
        reZscoreFilteredSubset
      },
      () => {
        if (!axisChanged) {
          return;
        }

        recordWorkflowAction({
          type: 'zscore',
          source: 'gui',
          label:
            actualAxis === 'row'
              ? 'Z-score by Row'
              : 'Z-score by Column',
          target:
            actualAxis === 'row'
              ? 'rows'
              : 'columns',
          parameters: {
            axis: actualAxis
          }
        });
      }
    );
  };


  // Add event listeners for mouse move and mouse up when drawing starts
  useEffect(() => {
    if (isDrawing) {
      // Attach listeners to the document for mouse movement and release
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      // Remove the listeners when drawing stops
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    // Cleanup event listeners when component unmounts
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing]);


  const ID: string = container.id
  let unit = "";
  if (ID?.includes('cytof')) {

    if (ID === 'cytofHeatmap') {
      if (valueType) {
        unit = valueType
      }
    }
    else {
      unit = 'Freq'
    }
  }
  else if (ID?.includes('olink')) {

    if (ID === 'olinkHeatmap') {
      if (valueType) {
        unit = valueType
      }
    }
    else {
      unit = `NPX-${valueScale}`
    }
  }
  else if (ID?.includes('serology')) {
    if (ID === 'serologyHeatmap') {
      if (valueType) {
        unit = valueType
      }
    }
    else {
      unit = 'Titers'
    }
  }
  else if (ID?.includes('rnaseq')) {
    if (ID === 'rnaseqHeatmap') {
      if (valueType) {
        unit = valueType
      }
    }
    else {
      unit = 'FPKM'
    }
  }

  const dimensions = useDimensions(container);

  // useEffect(() => {  
  //   try {
  //     // Try to create the worker
  //     workerCount++;
  //     workerRef.current = createDataWorker(dataWorkerCode);
  //     // Set up message handler
  //     workerRef.current.onmessage = (event) => {
  //       if (event.data.dataState) {
  //         dataStateRef.current = event.data.dataState;
  //         setDataStateVersion(prev => prev + 1);
  //       }
  //       if (event.data.heatmapState) {
  //         heatmapStateRef.current = event.data.heatmapState;
  //         setHeatmapStateVersion(prev => prev + 1);
  //       }
  //     };

  //     // Add error handler for worker
  //     workerRef.current.onerror = (error) => {
  //       console.error("Worker error:", error);
  //     };

  //   } catch (error) {
  //     console.error("Worker initialization failed:", error);
  //     // Here you would implement fallback processing
  //   }

  //   return () => {
  //     if (workerRef.current) {
  //       console.log("Terminating worker");
  //       workerRef.current.terminate();
  //     }
  //   };
  // }, []);

  // useEffect(() => {
  //   // Determine which data to use
  //   const dataToUse = filteredData.current || data;

  //   // Log which data source we're using
  //   console.log("Data source for worker:", filteredData.current ? "Using filtered data" : "Using original data");

  //   if (workerRef.current && dataToUse) {
  //     try {
  //       console.log("Sending data to worker");
  //       workerRef.current.postMessage({
  //         data: dataToUse,
  //         order,
  //         catTemporary,
  //         // filteredIdxDict,
  //         messageType: 'dataState',
  //       });
  //     } catch (error) {
  //       console.error("Failed to send data to worker:", error);
  //     }
  //   } else {
  //     console.log("Cannot send data to worker:", {
  //       workerExists: !!workerRef.current,
  //       dataExists: !!dataToUse
  //     });
  //   }
  // }, [data, order, dataVersion]); // Added catTemporary to dependencies

  //   useEffect(() => {
  //     if (workerRef.current && dimensions) {
  //       workerRef.current.postMessage({
  //         dimensions,
  //         colLabelsWidth,
  //         rowLabelsWidth,
  //         ID,
  //         panelWidth,
  //         messageType: 'heatmapState',
  //       });
  //     }
  //   }, [dimensions, colLabelsWidth, rowLabelsWidth, panelWidth,datastateVersion]);

  // ====================================================================
  // ✅ START: This is the complete and final worker management code.
  // ====================================================================

  // HOOK 1: Manages Worker Lifecycle (Create/Destroy). Runs only ONCE.
  useEffect(() => {
    try {
      console.log("Initializing Web Worker...");
      workerRef.current = createDataWorker(dataWorkerCode);
    } catch (error) {
      console.error("Worker initialization failed:", error);
      // You could add a critical error notification here
    }

    // This cleanup function runs when the component unmounts
    return () => {
      if (workerRef.current) {
        console.log("Terminating worker");
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once.


  // HOOK 2: Manages Worker Event Handlers. Updates when state/props change.
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return; // Do nothing if the worker isn't ready yet.

    // This function will handle all messages coming FROM the worker
    const handleMessage = (event: MessageEvent) => {
      console.log('📥 Received message from worker:', event.data);
      let wasDataUpdated = false;

      // Check if the worker sent back a new data state (from a sort/cluster)
      if (event.data.dataState) {
        console.log('✅ DataState received from worker, updating...');
        dataStateRef.current = event.data.dataState;
        setDataStateVersion(prev => prev + 1);
        wasDataUpdated = true;

        const importedReplay =
          pendingImportedWorkflowReplayRef.current;

        if (
          importedReplay?.phase === 'running_action'
        ) {
          const currentImportedAction =
            importedReplay.actions[
            importedReplay.index
            ];

          if (
            currentImportedAction?.type === 'sort_by_metadata' ||
            currentImportedAction?.type === 'sort_by_expression' ||
            currentImportedAction?.type === 'transpose' ||
            currentImportedAction?.type === 'sort' ||
            currentImportedAction?.type === 'cluster' ||
            currentImportedAction?.type === 'set_distance' ||
            currentImportedAction?.type === 'set_linkage' ||
            currentImportedAction?.type === 'set_clustering' ||
            currentImportedAction?.type === 'filter' ||
            currentImportedAction?.type === 'inverse_filter' ||
            currentImportedAction?.type === 'clear_filters' ||
            currentImportedAction?.type === 'variance_filter' ||
            currentImportedAction?.type === 'remove_filters' ||
            currentImportedAction?.type === 'crop' ||
            currentImportedAction?.type === 'clear_crop'
          ) {
            completeImportedWorkflowAction(
              currentImportedAction
            );
          }
        }

        if (pendingCropWorkflowRef.current) {
          const pendingCrop =
            pendingCropWorkflowRef.current;

          pendingCropWorkflowRef.current = null;

          recordWorkflowAction({
            type: 'crop',
            source: 'gui',
            label: pendingCrop.label,
            target: 'matrix',
            parameters: pendingCrop.parameters
          });
        }

        if (pendingClearCropWorkflowRef.current) {
          pendingClearCropWorkflowRef.current = false;

          recordWorkflowAction({
            type: 'clear_crop',
            source: 'gui',
            label: 'Clear Crop',
            target: 'matrix',
            parameters: {}
          });
        }

        // Calculate and report stats
        if (onStatsUpdate && event.data.dataState) {
          const sampleSize = event.data.dataState.rowLabels?.length || 0;
          const numColumns = event.data.dataState.colLabels?.length || 0;
          const dataPoints = sampleSize * numColumns;
          console.log('📊 DeckGL stats calculated:', { sampleSize, numColumns, dataPoints });
          if (sampleSize > 0 && numColumns > 0) {
            onStatsUpdate({ sampleSize, dataPoints });
          }
        }
      }

      // Check if the worker sent back a new heatmap state (from a resize)
      if (event.data.heatmapState) {
        console.log('✅ HeatmapState received from worker:', {
          width: event.data.heatmapState.width,
          height: event.data.heatmapState.height,
          cellDimensions: event.data.heatmapState.cellDimensions
        });
        heatmapStateRef.current = event.data.heatmapState;
        setHeatmapStateVersion(prev => prev + 1);
      }

      // NOTIFICATION LOGIC:
      // If the data was recomputed, fire the appropriate success notification.
      // Because this effect depends on 'order', the 'order' variable here is always up-to-date.
      if (wasDataUpdated && previousOrder) {
        // Existing success notifications
        if (order.row !== previousOrder.row) {
          if (order.row === 'cluster') {
            notifyClusteringSuccess();
          } else {
            notifySortSuccess(order.row, 'rows');
          }
        } else if (order.col !== previousOrder.col) {
          if (order.col === 'cluster') {
            notifyClusteringSuccess();
          } else {
            notifySortSuccess(order.col, 'columns');
          }
        }

        // Record a pending GUI clustering action only after
        // the corresponding canonical order change succeeds.
        const pendingClusterTarget =
          pendingGuiClusterWorkflowRef.current;

        if (pendingClusterTarget) {
          const clusterChangeSucceeded =
            pendingClusterTarget === 'rows'
              ? (
                order.row === 'cluster' &&
                (
                  order.row !== previousOrder.row ||
                  order.sortByRowCat !== previousOrder.sortByRowCat ||
                  order.sortColsByRowName !== previousOrder.sortColsByRowName ||
                  order.sortRowsByColName !== previousOrder.sortRowsByColName
                )
              )
              : (
                order.col === 'cluster' &&
                (
                  order.col !== previousOrder.col ||
                  order.sortByColCat !== previousOrder.sortByColCat ||
                  order.sortColsByRowName !== previousOrder.sortColsByRowName ||
                  order.sortRowsByColName !== previousOrder.sortRowsByColName
                )
              );

          if (clusterChangeSucceeded) {
            pendingGuiClusterWorkflowRef.current = null;

            const targetLabel =
              pendingClusterTarget === 'rows'
                ? 'Rows'
                : 'Columns';

            recordWorkflowAction({
              type: 'cluster',
              source: 'gui',
              label: `Cluster ${targetLabel}`,
              target: pendingClusterTarget,
              parameters: {
                target: pendingClusterTarget
              }
            });
          }
        }

        const pendingSort =
          pendingGuiSortWorkflowRef.current;

        if (pendingSort) {
          const sortChangeSucceeded =
            pendingSort.target === 'rows'
              ? (
                order.row === pendingSort.method &&
                (
                  order.row !== previousOrder.row ||
                  order.sortByRowCat !== previousOrder.sortByRowCat ||
                  order.sortRowsByColName !== previousOrder.sortRowsByColName
                )
              )
              : (
                order.col === pendingSort.method &&
                (
                  order.col !== previousOrder.col ||
                  order.sortByColCat !== previousOrder.sortByColCat ||
                  order.sortColsByRowName !== previousOrder.sortColsByRowName
                )
              );


          if (sortChangeSucceeded) {
            pendingGuiSortWorkflowRef.current = null;

            const targetLabel =
              pendingSort.target === 'rows'
                ? 'Rows'
                : 'Columns';

            recordWorkflowAction({
              type: 'sort',
              source: 'gui',
              label: `Sort ${targetLabel} by ${pendingSort.method}`,
              target: pendingSort.target,
              parameters: {
                method: pendingSort.method
              }
            });
          }
        }

        const pendingMetadataSort =
          pendingGuiMetadataSortWorkflowRef.current;

        if (pendingMetadataSort) {

          const metadataSortChangeSucceeded =
            pendingMetadataSort.target === 'rows'
              ? (
                order.sortByRowCat === pendingMetadataSort.field &&
                (
                  order.sortByRowCat !== previousOrder.sortByRowCat ||
                  order.sortRowsByColName !== previousOrder.sortRowsByColName
                )
              )
              : (
                order.sortByColCat === pendingMetadataSort.field &&
                (
                  order.sortByColCat !== previousOrder.sortByColCat ||
                  order.sortColsByRowName !== previousOrder.sortColsByRowName
                )
              );


          if (metadataSortChangeSucceeded) {
            pendingGuiMetadataSortWorkflowRef.current = null;

            const targetLabel =
              pendingMetadataSort.target === 'rows'
                ? 'Rows'
                : 'Columns';

            recordWorkflowAction({
              type: 'sort_by_metadata',
              source: 'gui',
              label:
                `Sort ${targetLabel} by metadata: ${pendingMetadataSort.field}`,
              target: pendingMetadataSort.target,
              parameters: {
                field: pendingMetadataSort.field
              }
            });
          }
        }
        const pendingExpressionSort =
          pendingGuiExpressionSortWorkflowRef.current;

        if (pendingExpressionSort) {
          const { feature, target } = pendingExpressionSort;

          const expressionSortChangeSucceeded =
            target === 'rows'
              ? (
                order.sortRowsByColName === feature &&
                (
                  order.sortRowsByColName !== previousOrder.sortRowsByColName ||
                  order.row !== previousOrder.row ||
                  order.sortByRowCat !== previousOrder.sortByRowCat
                )
              )
              : (
                order.sortColsByRowName === feature &&
                (
                  order.sortColsByRowName !== previousOrder.sortColsByRowName ||
                  order.col !== previousOrder.col ||
                  order.sortByColCat !== previousOrder.sortByColCat
                )
              );

          if (expressionSortChangeSucceeded) {
            pendingGuiExpressionSortWorkflowRef.current = null;

            const targetLabel =
              target === 'rows' ? 'Rows' : 'Columns';

            recordWorkflowAction({
              type: 'sort_by_expression',
              source: 'gui',
              label: `Sort ${targetLabel} by ${feature} expression`,
              target,
              parameters: {
                feature
              }
            });
          }
        }
      }
    };

    const handleError = (error: ErrorEvent) => {
      pendingCropWorkflowRef.current = null;
      pendingGuiClusterWorkflowRef.current = null;
      pendingGuiSortWorkflowRef.current = null;
      pendingGuiMetadataSortWorkflowRef.current = null;
      pendingGuiExpressionSortWorkflowRef.current = null;
      pendingClearCropWorkflowRef.current = false;

      console.error("Worker error:", error);
      addNotification({
        type: 'error',
        title: 'Processing Error',
        message: 'An error occurred while processing heatmap data. Please try reloading.',
      });
    };

    // Attach the fresh, up-to-date handlers to the worker
    worker.onmessage = handleMessage;
    worker.onerror = handleError;

    // This cleanup function detaches the handlers before the effect runs again
    return () => {
      worker.onmessage = null;
      worker.onerror = null;
    };

    // This effect re-runs whenever these values change, keeping the handlers up-to-date.
  }, [order, notifyClusteringSuccess, notifySortSuccess]);


  // HOOK 3: Sends Data/Order updates TO the worker. (This is your original code, it's correct)
  useEffect(() => {
    const dataToUse = filteredData.current || data;
    if (workerRef.current && dataToUse) {
      try {
        workerRef.current.postMessage({
          data: dataToUse,
          order,
          catTemporary,
          croppedRowIndices,
          croppedColIndices,
          transpose: matrixOrientation === 'Transposed',
          messageType: 'dataState',
        });
      } catch (error) {
        pendingCropWorkflowRef.current = null;
        pendingGuiClusterWorkflowRef.current = null;
        pendingGuiSortWorkflowRef.current = null;
        pendingGuiMetadataSortWorkflowRef.current = null;
        pendingGuiExpressionSortWorkflowRef.current = null;
        pendingClearCropWorkflowRef.current = false;

        console.error("Failed to send data to worker:", error);
      }
    }
  }, [data, order, dataVersion, croppedRowIndices, croppedColIndices, matrixOrientation]);


  // HOOK 4: Sends UI Dimension updates TO the worker.
  useEffect(() => {
    if (workerRef.current && dimensions) {
      workerRef.current.postMessage({
        dimensions,
        colLabelsWidth,
        rowLabelsWidth,
        ID,
        panelWidth,
        messageType: 'heatmapState',
      });
    }
  }, [dimensions, colLabelsWidth, rowLabelsWidth, panelWidth, datastateVersion]);

  // ====================================================================
  // ✅ END: of the worker management block.
  // ====================================================================

  const displayedLabels = useMemo(() => ({
    ...labels,
    column: {
      ...labels?.column,
      maxChars:
        matrixOrientation === 'Transposed'
          ? labels?.column?.maxChars
          : Math.max(
            labels?.column?.maxChars ?? MIN_LABEL_CHARS,
            12
          ),
    },
  }), [labels, matrixOrientation]);

  useLabelState(
    dataStateRef.current,
    heatmapStateRef.current,
    displayedLabels,
    container,
    visualOrder,
    ID,
    datastateVersion,
    heatmapstateVersion,
    matrixInfoHeight,
    setLabelsState
  );

  // Category label DOM — only rebuild when order/layout actually changes, not on every zoom frame
  useEffect(() => {
    if (!container) return;
    const containerElement = container as HTMLDivElement;

    const metadataHeadingFontSize = 10;

    // --- Column category labels ---
    if (visualOrder.colCat.length >= 0 && rowLabelsWidth > 0 && colLabelsWidth > 0) {
      const oldLabels = containerElement.querySelectorAll('.col-category-label');
      oldLabels.forEach(label => containerElement.removeChild(label));

      for (let i = 0; i < visualOrder.colCat.length; i++) {
        const label = document.createElement('label');
        let labelId = visualOrder.colCat[i].split(' ').join('_');
        if (labelId.includes('#')) labelId = labelId.replace('#', 'no');
        label.id = labelId;
        label.className = 'col-category-label';
        label.style.position = 'absolute';
        const initialGap = INITIAL_GAP;
        const gap = LAYER_GAP;
        const clusterOffset = visualOrder.col === 'cluster' ? (CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP) : 0;
        const yPosition = colLabelsWidth - initialGap - clusterOffset - ((i + 1) * (CATEGORY_LAYER_HEIGHT + gap));
        label.style.top = `${yPosition}px`;
        label.textContent = `${capitalizeFirstLetter(visualOrder.colCat[i])}`;
        if (visualOrder.col !== 'cluster') {
          const catName = visualOrder.colCat[i];

          label.addEventListener('click', () => {
            const target =
              matrixOrientation === 'Transposed'
                ? 'rows'
                : 'columns';

            const currentField =
              target === 'rows'
                ? order.sortByRowCat
                : order.sortByColCat;

            const willChange =
              currentField !== catName ||
              (
                target === 'rows'
                  ? order.sortRowsByColName !== null
                  : order.sortColsByRowName !== null
              );

            if (!willChange) return;

            saveUndoPoint();

            pendingGuiMetadataSortWorkflowRef.current = {
              target,
              field: catName
            };

            if (matrixOrientation === 'Transposed') {
              setOrder((prevOrder: any) => ({
                ...prevOrder,
                sortByRowCat: catName,
                sortRowsByColName: null
              }));
            } else {
              setOrder((prevOrder: any) => ({
                ...prevOrder,
                sortByColCat: catName,
                sortColsByRowName: null
              }));
            }
          });
        }
        const fullName = label.textContent || '';
        const fontSize = metadataHeadingFontSize;

        label.textContent = fullName;
        label.title = fullName;

        label.title = fullName;
        label.style.fontSize = `${fontSize}px`;
        label.style.lineHeight = `${fontSize}px`;
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = 'bold';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.color = '#333333';
        label.style.textAlign = 'right';

        const labelFont = `bold ${fontSize}px Arial, sans-serif`;
        const rowTrackWidth =
          visualOrder.rowCat.length *
          (CATEGORY_LAYER_HEIGHT + LAYER_GAP) +
          (visualOrder.row === 'cluster'
            ? CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP
            : 0);

        const width = Math.ceil(
          getTextWidth(fullName, labelFont) + 4
        );

        label.style.width = `${width}px`;

        // Angle column metadata headings upward.
        label.style.transform = 'none';
        label.style.overflow = 'visible';
        label.style.textOverflow = 'clip';
        label.style.whiteSpace = 'nowrap';

        label.style.zIndex = '30';
        label.style.pointerEvents = 'auto';
        label.style.userSelect = 'none';
        label.style.cursor =
          visualOrder.col !== 'cluster' ? 'pointer' : 'default';

        const heatmapLeft =
          (isDrawerOpen ? panelWidth : 0) + rowLabelsWidth;

        label.style.left =
          `${heatmapLeft - rowTrackWidth - width - 4}px`;
        label.style.cursor =
          visualOrder.col !== 'cluster' ? 'pointer' : 'default';

        containerElement.appendChild(label);
      }
    }

    // --- Row category labels ---
    // Always remove previously rendered row-category labels first.
    // This is necessary when switching Transposed -> Original,
    // because visualOrder.rowCat may become empty.
    const oldRowLabels =
      containerElement.querySelectorAll('.row-category-label');

    oldRowLabels.forEach(label =>
      containerElement.removeChild(label)
    );

    if (
      visualOrder.rowCat.length > 0 &&
      rowLabelsWidth > 0 &&
      colLabelsWidth > 0
    ) {
      visualOrder.rowCat.forEach((cat, i) => {
        let labelId = cat.split(' ').join('_');
        if (labelId.includes('#')) labelId = labelId.replace('#', 'no');
        const label = document.createElement('label');
        label.id = labelId;
        label.className = 'row-category-label';
        label.style.position = 'absolute';
        const fullCategoryName = capitalizeFirstLetter(cat);

        label.title = fullCategoryName;
        label.textContent = fullCategoryName;
        if (visualOrder.row !== 'cluster') {
          label.addEventListener('click', () => {
            const target =
              matrixOrientation === 'Transposed'
                ? 'columns'
                : 'rows';

            const currentField =
              target === 'rows'
                ? order.sortByRowCat
                : order.sortByColCat;

            const willChange =
              currentField !== cat ||
              (
                target === 'rows'
                  ? order.sortRowsByColName !== null
                  : order.sortColsByRowName !== null
              );

            if (!willChange) return;

            saveUndoPoint();

            pendingGuiMetadataSortWorkflowRef.current = {
              target,
              field: cat
            };

            if (matrixOrientation === 'Transposed') {
              setOrder(prev => ({
                ...prev,
                sortByColCat: cat,
                sortColsByRowName: null
              }));
            } else {
              setOrder(prev => ({
                ...prev,
                sortByRowCat: cat,
                sortRowsByColName: null
              }));
            }
          });
        }
        label.style.fontSize = '7px';
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = 'normal';
        label.style.color = '#333333';
        label.style.textAlign = 'center';
        label.style.whiteSpace = 'nowrap';
        label.style.lineHeight = '8px';
        label.style.cursor =
          visualOrder.row !== 'cluster' ? 'pointer' : 'default';

        const gap = LAYER_GAP;
        const catH = CATEGORY_LAYER_HEIGHT;
        const initialGap = INITIAL_GAP;

        const clusterOffset =
          visualOrder.row === 'cluster'
            ? CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP
            : 0;

        const xPos =
          (isDrawerOpen ? panelWidth : 0) +
          rowLabelsWidth -
          initialGap -
          clusterOffset -
          ((i + 1) * (catH + gap)) +
          catH;

        // Display full metadata names vertically above their tracks.
        label.style.fontSize = `${metadataHeadingFontSize}px`;
        label.style.lineHeight = `${metadataHeadingFontSize + 2}px`;
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = 'bold';
        label.style.color = '#333333';
        label.style.whiteSpace = 'nowrap';
        label.style.textAlign = 'right';

        const rowHeadingWidth = Math.ceil(
          getTextWidth(
            fullCategoryName,
            `bold ${metadataHeadingFontSize}px Arial, sans-serif`
          ) + 2
        );

        const columnMetadataStackHeight =
          visualOrder.colCat.length *
          (CATEGORY_LAYER_HEIGHT + LAYER_GAP);

        const columnClusterOffset =
          visualOrder.col === 'cluster'
            ? CLUSTER_LAYER_HEIGHT + CLUSTER_LAYER_GAP
            : 0;

        // Position row headings immediately above the column metadata stack.
        const headerBaselineY =
          colLabelsWidth -
          columnMetadataStackHeight -
          columnClusterOffset -
          INITIAL_GAP -
          4;

        const trackCenterX = xPos - catH / 2;

        label.style.width = `${rowHeadingWidth}px`;
        label.style.textAlign = 'left';
        label.style.lineHeight = `${metadataHeadingFontSize + 2}px`;

        // Anchor the beginning of the text at the
        // center of its corresponding metadata track.
        label.style.left = `${trackCenterX}px`;
        label.style.top = `${headerBaselineY - metadataHeadingFontSize - 2
          }px`;
        label.style.transform = 'rotate(-60deg)';
        label.style.transformOrigin = 'left bottom';

        label.style.zIndex = '30';
        label.style.pointerEvents = 'auto';
        label.style.userSelect = 'none';
        label.style.cursor =
          visualOrder.row !== 'cluster' ? 'pointer' : 'default';

        containerElement.appendChild(label);
      });
    }
  }, [visualOrder, matrixOrientation, rowLabelsWidth, colLabelsWidth, panelWidth, isDrawerOpen, labels?.row?.offset, container]);

  const { viewStates, onViewStateChange, visibleBounds, isZoomedOut, resetViewToOrigin } = useViewStates(
    container,
    dimensions,
    heatmapStateRef.current,
    dataStateRef.current,
    panelWidth,
    searchTerm, // Add the search term parameter
    colLabelsWidth, // Add the column labels width parameter
    null, // Data is already cropped by computeDataState, pan constraints use dataState dimensions
    visualFeatureAxis
  );

  // Reset function - clears crop and resets view to show full heatmap
  const resetFilteredDict = () => {
    const hasActiveCrop =
      filteredIdxDict !== null ||
      croppedRowIndices !== null ||
      croppedColIndices !== null;

    if (!hasActiveCrop) return;

    saveUndoPoint();
    pendingClearCropWorkflowRef.current = true;

    setFilteredIdxDict(null);
    setCropBox(null);
    setIsCropping(false);
    setIsDrawing(false);

    // Clear cropped indices to trigger worker to load full data
    setCroppedRowIndices(null);
    setCroppedColIndices(null);

    // Reset view to origin for the full heatmap
    resetViewToOrigin();

    // Show reset message
    setToastMessage("🔄 Crop filter cleared! Showing full heatmap.");
    setToastSeverity('success');
    setToastOpen(true);
  };

  const views = useViews({
    colLabelsWidth,
    rowLabelsWidth,
    dimensions,
    debug,
    panelWidth
  });

  // const layers = useMemo(
  //   () =>
  //     getLayers({
  //       dataState: dataStateRef.current,
  //       heatmapState: heatmapStateRef.current,
  //       visibleIndices,
  //       viewStates,
  //       onClick,
  //       labels,
  //       debug,
  //       colLabelsWidth,
  //       rowLabelsWidth,
  //       rowLabelsTitle,
  //       columnLabelsTitle,
  //       searchTerm,
  //       order,
  //       categories:catTemporary,
  //       rowSliderVal:rowClustGroup,
  //       colSliderVal:colClustGroup,
  //       opacityVal:OpacityValue,
  //       pvalThreshold,
  //       pvalData,
  //       isZoomedOut,
  //       filteredIdxDict
  //     }),
  // [
  //   colLabelsWidth,
  //   // columnLabelsTitle,
  //   labels,
  //   onClick,
  //   visibleIndices,
  //   // rowLabelsTitle,
  //   rowLabelsWidth,
  //   viewStates,
  //   searchTerm,
  //   order,
  //   colClustGroup,
  //   rowClustGroup,
  //   // pvalData,
  //   datastateVersion,
  //   heatmapstateVersion,
  //   OpacityValue,
  //   isZoomedOut,
  //   filteredIdxDict
  // ]
  // );

  const layers = useMemo(() => {
    // Return null if the data isn't ready, preventing errors.
    if (!dataStateRef.current || !heatmapStateRef.current) {
      return [];
    }

    // Note: When filteredIdxDict is active, computeDataState already produces cropped data.
    // So we pass null to layers - they don't need to filter again since data is already cropped.
    // The layers will use dataState.numRows/numColumns which reflect the cropped dimensions.
    return getLayers({
      dataState: dataStateRef.current,
      heatmapState: heatmapStateRef.current,
      visibleBounds,
      viewStates,
      onClick: stableOnClick, // Use the new stable onClick object
      labels: displayedLabels,
      debug,
      colLabelsWidth,
      rowLabelsWidth,
      rowLabelsTitle,
      columnLabelsTitle,
      searchTerm,
      featureAxis: visualFeatureAxis,
      order: visualOrder,
      categories: categories, // Assuming `categories` is stable or correctly memoized
      rowSliderVal:
        matrixOrientation === 'Transposed'
          ? colClustGroup
          : rowClustGroup,

      colSliderVal:
        matrixOrientation === 'Transposed'
          ? rowClustGroup
          : colClustGroup,
      opacityVal: OpacityValue,
      pvalThreshold: 0.05, // Example pvalThreshold
      pvalData,
      isZoomedOut,
      filteredIdxDict: null // Data is already cropped by computeDataState, no need to filter in layers
    });
  }, [
    // ZOOM OPTIMIZATION (2026-01-04):
    // - viewStates REMOVED: Changes every zoom frame, causing expensive layer recreation.
    //   DeckGL handles viewState internally via its viewState prop.
    // - visibleIndices REPLACED with visibleBounds: Bounds is more stable and sufficient
    //   for layer rendering. visibleIndices changed too frequently during zoom.
    // See ZOOM_OPTIMIZATION_NOTES.md for full details.
    datastateVersion,
    heatmapstateVersion,
    visibleBounds, // OPTIMIZATION: Use bounds instead of visibleIndices
    // visibleIndices, // REMOVED - changes too frequently during zoom
    // viewStates, // REMOVED - changes every zoom frame
    stableOnClick,
    labels,
    colLabelsWidth,
    rowLabelsWidth,
    searchTerm,
    visualOrder,
    matrixOrientation,
    rowClustGroup,
    colClustGroup,
    OpacityValue,
    pvalData,
    isZoomedOut,
    filteredIdxDict,
  ]);



  const legendComponent = <Legend2
    min={dataStateRef.current?.min || 0}
    max={dataStateRef.current?.max || 0}
    maxColor="#FF0000"
    minColor="#0000FF"
    legendWidth={legend?.width}
    legendHeight={legend?.height}
    fontSize={legend?.fontSize}
    unit={unit}
    compactHorizontal={true}
  />

  const currentMatrixRows = dataStateRef.current?.numRows ?? 0;
  const currentMatrixColumns = dataStateRef.current?.numColumns ?? 0;

  // onClick handler to download matrix as TSV file (using current dataState - what user sees)
  const downloadMatrix = () => {
    const currentDataState = dataStateRef.current;

    if (!currentDataState) {
      console.warn('No data available for download');
      return;
    }

    const { values, numRows, numColumns, rowLabels, colLabels } = currentDataState;

    // Get unique category keys for rows and columns
    const rowCategoryKeys: string[] = [];
    const colCategoryKeys: string[] = [];

    const rowCatSet = new Set<string>();
    rowLabels.forEach(row => {
      if (row.category) {
        Object.keys(row.category).forEach(key => rowCatSet.add(key));
      }
    });
    rowCategoryKeys.push(...Array.from(rowCatSet));

    const colCatSet = new Set<string>();
    colLabels.forEach(col => {
      if (col.category) {
        Object.keys(col.category).forEach(key => colCatSet.add(key));
      }
    });
    colCategoryKeys.push(...Array.from(colCatSet));

    // Number of empty prefix cells = 1 (row name) + number of row categories
    const numPrefixCells = 1 + rowCategoryKeys.length;

    const tsvRows: string[] = [];

    // Row 1: Empty cells + Column names
    const headerRow: string[] = Array(numPrefixCells).fill('');
    headerRow.push(...colLabels.map(col => col.text));
    tsvRows.push(headerRow.join('\t'));

    // Column metadata rows (one row per column category key)
    for (const categoryKey of colCategoryKeys) {
      const metadataRow: string[] = Array(numPrefixCells).fill('');
      for (const col of colLabels) {
        const value = col.category?.[categoryKey] || '';
        // Check if value already contains the key prefix to avoid duplication
        const formattedValue = value.startsWith(`${categoryKey}:`) ? value : `${categoryKey}:${value}`;
        metadataRow.push(formattedValue);
      }
      tsvRows.push(metadataRow.join('\t'));
    }

    // Data rows: Row name + Row categories + values
    for (let row = 0; row < numRows; row++) {
      const rowLabel = rowLabels[row];
      const rowData: (string | number)[] = [rowLabel.text];

      // Add each row category value
      for (const categoryKey of rowCategoryKeys) {
        const value = rowLabel.category?.[categoryKey] || '';
        // Check if value already contains the key prefix to avoid duplication
        const formattedValue = value.startsWith(`${categoryKey}:`) ? value : `${categoryKey}:${value}`;
        rowData.push(formattedValue);
      }

      // Add values
      for (let col = 0; col < numColumns; col++) {
        const value = values[row * numColumns + col];
        rowData.push(isNaN(value) ? '' : value);
      }

      tsvRows.push(rowData.join('\t'));
    }

    const tsvString = tsvRows.join('\r\n');
    const blob = new Blob([tsvString], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    // Use different filename if data is cropped
    const isCropped = croppedRowIndices !== null || croppedColIndices !== null;
    a.download = isCropped ? 'heatmap_cropped.tsv' : 'heatmap.tsv';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const downloadPdf = async () => {
    // Use the container element which includes both DeckGL canvas and category labels
    const containerElement = container as HTMLElement;

    if (!containerElement) {
      console.warn('Container element not found for snapshot');
      return;
    }

    try {
      // Force DeckGL to redraw before capture
      if (containerRefDeckgl.current?.deck) {
        containerRefDeckgl.current.deck.redraw(true);
      }

      // Use html2canvas to capture the entire container including HTML overlays (category labels)
      const canvas = await html2canvas(containerElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        // Ensure WebGL canvas is captured
        onclone: (clonedDoc) => {
          // Copy WebGL canvas content to the cloned document
          const originalCanvas = containerElement.querySelector('canvas');
          const clonedCanvas = clonedDoc.querySelector('canvas');
          if (originalCanvas && clonedCanvas) {
            const ctx = clonedCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(originalCanvas, 0, 0);
            }
          }
        }
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.addImage(dataUrl, 'png', 0, 0, pdfWidth, pdfHeight);

      pdf.save('HeatmapImg.pdf');
    } catch (error) {
      console.error('Error generating PDF snapshot:', error);
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate PDF snapshot. Please try again.',
      });
    }
  };

  // // REPLACE your existing crop calculation useEffect with this:
  // useEffect(() => {
  //   if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current) {
  //     try {
  //       console.log('🔍 CROP - Processing crop area...');


  //       // Your existing calculation logic here (keep it the same)
  //       const startX = Math.max(0, cropBox.startX - rowLabelsWidth);
  //       const endX = Math.max(0, cropBox.endX - rowLabelsWidth);
  //       const startY = Math.max(0, cropBox.startY - colLabelsWidth);
  //       const endY = Math.max(0, cropBox.endY - colLabelsWidth);


  //       const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
  //       const baseCellHeight = heatmapStateRef.current.cellDimensions.height;

  //       const minX = Math.min(startX, endX);
  //       const maxX = Math.max(startX, endX);
  //       const minY = Math.min(startY, endY);
  //       const maxY = Math.max(startY, endY);

  //       const colStartIdx = Math.floor(minX / (2*baseCellWidth));
  //       const colEndIdx = Math.floor(maxX / (2*baseCellWidth));
  //       const rowStartIdx = Math.floor(minY / (2*baseCellHeight));
  //       const rowEndIdx = Math.floor(maxY / (2*baseCellHeight));

  //       const finalColStartIdx = Math.max(0, colStartIdx);
  //       const finalColEndIdx = Math.min(dataStateRef.current.numColumns - 1, colEndIdx);
  //       const finalRowStartIdx = Math.max(0, rowStartIdx);
  //       const finalRowEndIdx = Math.min(dataStateRef.current.numRows - 1, rowEndIdx);

  //       const filteredDict = {
  //         startX: finalColStartIdx,
  //         startY: finalRowStartIdx,
  //         endX: finalColEndIdx,
  //         endY: finalRowEndIdx,
  //       };

  //       // Calculate selected area info
  //       const selectedCols = finalColEndIdx - finalColStartIdx + 1;
  //       const selectedRows = finalRowEndIdx - finalRowStartIdx + 1;
  //       const totalCells = selectedCols * selectedRows;

  //       console.log(`🔍 CROP FINAL - Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);

  //       setFilteredIdxDict(filteredDict);

  //       // Auto-disable cropping after processing
  //       setTimeout(() => {
  //         setIsCropping(false);

  //         // Show success message with details
  //         setToastMessage(`✅ Crop applied! Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);
  //         setToastSeverity('success');
  //         setToastOpen(true);
  //       }, 500);

  //     } catch (error) {
  //       console.error('❌ Error in crop box calculation:', error);
  //       setCropBox(null);
  //       setIsCropping(false);

  //       // Show error message
  //       setToastMessage("❌ Error processing crop area. Please try again.");
  //       setToastSeverity('error');
  //       setToastOpen(true);
  //     }
  //   }
  // }, [isDrawing, cropBox]);

  // REPLACE your existing crop calculation useEffect with this:
  // REPLACE your existing crop calculation useEffect with this:
  // Your original working code with just zoom awareness added


  const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
  const zoomValue = currentViewState?.zoom;
  const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);

  // Determine if aggregation is happening (same logic as getHeatmapGridLayerScatter.ts)
  // Aggregation starts when zoom < BASE_ZOOM (i.e., zoom < 0)
  const isAggregated = currentZoom < BASE_ZOOM;

  // useEffect(() => {
  //   if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current) {
  //     try {
  //       console.log('🔍 CROP - Processing crop area...');

  //       // Get current zoom level and pan position
  //       const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
  //       const zoomValue = currentViewState?.zoom;
  //       const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);

  //       // GET CURRENT PAN POSITION
  //       const targetArray = currentViewState?.target;
  //       const targetX = Array.isArray(targetArray) && targetArray.length > 0 ? targetArray[0] : 0;
  //       const targetY = Array.isArray(targetArray) && targetArray.length > 1 ? targetArray[1] : 0;

  //       console.log(`🔍 CROP - Current zoom: ${currentZoom}, Pan position: [${targetX}, ${targetY}]`);

  //       // Your existing calculation logic here (keep it the same)
  //       const startX = Math.max(0, cropBox.startX - rowLabelsWidth);
  //       const endX = Math.max(0, cropBox.endX - rowLabelsWidth);
  //       const startY = Math.max(0, cropBox.startY - colLabelsWidth);
  //       const endY = Math.max(0, cropBox.endY - colLabelsWidth);

  //       const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
  //       const baseCellHeight = heatmapStateRef.current.cellDimensions.height;

  //       const minX = Math.min(startX, endX);
  //       const maxX = Math.max(startX, endX);
  //       const minY = Math.min(startY, endY);
  //       const maxY = Math.max(startY, endY);

  //       // CONVERT SCREEN COORDINATES TO WORLD COORDINATES (ACCOUNTING FOR PAN)
  //       const zoomFactor = Math.pow(2, currentZoom);

  //       console.log('********* zoomFactor is as follows *********',zoomFactor)
  //       // Convert from screen space to world space
  //       const worldMinX = (minX / zoomFactor) + targetX;
  //       const worldMaxX = (maxX / zoomFactor) + targetX;
  //       const worldMinY = (minY / zoomFactor) + targetY;
  //       const worldMaxY = (maxY / zoomFactor) + targetY;

  //       console.log('********* targetX is as follows *********',targetX)
  //       console.log('********* targetY is as follows *********',targetY)

  //       // 🔍 DEBUG: Check if target values are changing unexpectedly
  //       console.log('🔍 VIEWPORT DEBUG - Current zoom:', currentZoom);
  //       console.log('🔍 VIEWPORT DEBUG - Target should only change on PAN, not ZOOM');
  //       console.log('🔍 VIEWPORT DEBUG - Are target values stable across zoom levels?');
  //       console.log('********* worldMinX is as follows *********',worldMinX)
  //       console.log('********* worldMaxX is as follows *********',worldMaxX)
  //       console.log('********* worldMinY is as follows *********',worldMinY)
  //       console.log('********* worldMaxY is as follows *********',worldMaxY)


  //       // Account for heatmap centering offset (same as in your getHeatmapState)
  //       const heatmapWidth = heatmapStateRef.current.width;
  //       const heatmapHeight = heatmapStateRef.current.height;
  //       // const offsetX = heatmapWidth / 4;
  //       // const offsetY = heatmapHeight / 4;
  //       const offsetX = 0;
  //       const offsetY = 0;

  //       const adjustedWorldMinX = worldMinX + offsetX;
  //       const adjustedWorldMaxX = worldMaxX + offsetX;
  //       const adjustedWorldMinY = worldMinY + offsetY;
  //       const adjustedWorldMaxY = worldMaxY + offsetY;

  //       console.log(`🔍 CROP - World coordinates: (${worldMinX}, ${worldMinY}) to (${worldMaxX}, ${worldMaxY})`);
  //       console.log(`🔍 CROP - Adjusted coordinates: (${adjustedWorldMinX}, ${adjustedWorldMinY}) to (${adjustedWorldMaxX}, ${adjustedWorldMaxY})`);

  //       // Calculate cell indices using base cell size
  //       const colStartIdx = Math.floor(adjustedWorldMinX / baseCellWidth);
  //       const colEndIdx = Math.floor(adjustedWorldMaxX / baseCellWidth);
  //       const rowStartIdx = Math.floor(adjustedWorldMinY / baseCellHeight);
  //       const rowEndIdx = Math.floor(adjustedWorldMaxY / baseCellHeight);

  //       const finalColStartIdx = Math.max(0, colStartIdx);
  //       const finalColEndIdx = Math.min(dataStateRef.current.numColumns - 1, colEndIdx);
  //       const finalRowStartIdx = Math.max(0, rowStartIdx);
  //       const finalRowEndIdx = Math.min(dataStateRef.current.numRows - 1, rowEndIdx);

  //       const filteredDict = {
  //         startX: finalColStartIdx,
  //         startY: finalRowStartIdx,
  //         endX: finalColEndIdx,
  //         endY: finalRowEndIdx,
  //       };

  //       // Calculate selected area info
  //       const selectedCols = finalColEndIdx - finalColStartIdx + 1;
  //       const selectedRows = finalRowEndIdx - finalRowStartIdx + 1;
  //       const totalCells = selectedCols * selectedRows;

  //       console.log(`🔍 CROP FINAL - Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells) at zoom ${currentZoom}`);
  //       console.log('******** filtered dict is as follows ********', filteredDict);

  //       // 🚀 ENHANCED DEBUG: Print startX, startY, endX, endY at current zoom resolution
  //       console.log('🎯 CROP DEBUG - Zoom Resolution:', currentZoom);
  //       console.log('🎯 CROP DEBUG - startX:', filteredDict.startX);
  //       console.log('🎯 CROP DEBUG - startY:', filteredDict.startY); 
  //       console.log('🎯 CROP DEBUG - endX:', filteredDict.endX);
  //       console.log('🎯 CROP DEBUG - endY:', filteredDict.endY);
  //       console.log('🎯 CROP DEBUG - Box dimensions:', `${filteredDict.endX - filteredDict.startX + 1} x ${filteredDict.endY - filteredDict.startY + 1}`);

  //       setFilteredIdxDict(filteredDict);

  //       const currentZoomNumber = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || 1);

  //       const resetViewState = {
  //         target: [0, 0], // Reset to center
  //         zoom: currentZoomNumber, // Use the extracted number value
  //         minZoom: currentViewState?.minZoom || 0,
  //         maxZoom: currentViewState?.maxZoom || 10,
  //         height: currentViewState?.height || 600, // Provide default height
  //         width: currentViewState?.width || 800,   // Provide default width
  //         rotationOrbit: currentViewState?.rotationOrbit || 0,
  //         rotationX: currentViewState?.rotationX || 0,
  //         minRotationX: currentViewState?.minRotationX || -90,
  //         maxRotationX: currentViewState?.maxRotationX || 90,
  //       };

  //       onViewStateChange({
  //         viewId: IDS.VIEWS.HEATMAP_GRID,
  //         viewState: resetViewState,
  //         interactionState: {}, // Add this required property
  //       });


  //       // Auto-disable cropping after processing
  //       setTimeout(() => {
  //         setIsCropping(false);

  //         // Show success message with details
  //         setToastMessage(`✅ Crop applied! Selected ${selectedCols} columns × ${selectedRows} rows (${totalCells} cells)`);
  //         setToastSeverity('success');
  //         setToastOpen(true);
  //       }, 500);

  //     } catch (error) {
  //       console.error('❌ Error in crop box calculation:', error);
  //       setCropBox(null);
  //       setIsCropping(false);

  //       // Show error message
  //       setToastMessage("❌ Error processing crop area. Please try again.");
  //       setToastSeverity('error');
  //       setToastOpen(true);
  //     }
  //   }
  // }, [isDrawing, cropBox]);


  useEffect(() => {
    if (!isDrawing && cropBox && heatmapStateRef.current?.cellDimensions && dataStateRef.current && dimensions) {
      try {
        // Compute screen coords relative to the heatmap grid view
        // cropBox coords are relative to the heatmap container (which starts after the panel)
        // We need to subtract rowLabelsWidth to get coords relative to the heatmap grid
        const sx = Math.max(0, cropBox.startX - rowLabelsWidth);
        const ex = Math.max(0, cropBox.endX - rowLabelsWidth);
        const sy = Math.max(0, cropBox.startY - colLabelsWidth);
        const ey = Math.max(0, cropBox.endY - colLabelsWidth);

        // Get cell dimensions
        const { width: cellW, height: cellH } = heatmapStateRef.current.cellDimensions;

        // IMPORTANT: Use heatmapState dimensions for offset calculation (matches scatter layer)
        // These are the dimensions used for centering cells in the scatter layer
        const heatmapStateWidth = heatmapStateRef.current.width;
        const heatmapStateHeight = heatmapStateRef.current.height;

        // Calculate actual deck.gl view dimensions (matches useViews.ts)
        // The view is larger than heatmapState dimensions by rowLabelsWidth/colLabelsWidth
        const availableWidth = (dimensions[0] - panelWidth) * HEATMAP_WIDTH / 100;
        const availableHeight = dimensions[1] * HEATMAP_PARENT_HEIGHT_RATIO / 100 * HEATMAP_HEIGHT / 100;
        const viewWidth = availableWidth - rowLabelsWidth;
        const viewHeight = availableHeight - colLabelsWidth;

        // Get current view state for zoom
        const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
        const zoomValue = currentViewState?.zoom;
        const zoom: number = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);
        const target = currentViewState?.target || [0, 0];

        // Calculate scale factor based on zoom
        const scale = Math.pow(2, zoom - BASE_ZOOM);
        const baseScaleFactor = Math.pow(2, BASE_ZOOM);

        // Offset uses heatmapState dimensions (same as scatter layer centering)
        const offsetX = heatmapStateWidth / 2 / baseScaleFactor;
        const offsetY = heatmapStateHeight / 2 / baseScaleFactor;

        // Convert screen coords to world coords
        const minScreenX = Math.min(sx, ex);
        const maxScreenX = Math.max(sx, ex);
        const minScreenY = Math.min(sy, ey);
        const maxScreenY = Math.max(sy, ey);

        // The viewport center is at the center of the actual deck.gl view
        // This is where world coordinate [0,0] appears on screen when target=[0,0]
        const viewportCenterX = viewWidth / 2;
        const viewportCenterY = viewHeight / 2;

        // Convert screen to world coordinates using deck.gl OrthographicView formula
        const wx1 = ((minScreenX - viewportCenterX) / scale) + target[0];
        const wy1 = ((minScreenY - viewportCenterY) / scale) + target[1];
        const wx2 = ((maxScreenX - viewportCenterX) / scale) + target[0];
        const wy2 = ((maxScreenY - viewportCenterY) / scale) + target[1];

        // Convert world coords to cell indices
        // Cell position formula in scatter layer: x = col * cellW + cellW/2 - offsetX
        // Inverse: col = (x + offsetX - cellW/2) / cellW
        // For left edge of selection, use floor to get first cell that overlaps
        // For right edge, use floor to get last cell that overlaps
        const colStart = Math.floor((wx1 + offsetX) / cellW);
        const colEnd = Math.floor((wx2 + offsetX) / cellW);
        const rowStart = Math.floor((wy1 + offsetY) / cellH);
        const rowEnd = Math.floor((wy2 + offsetY) / cellH);

        // Clamp visual indices to valid ranges
        const maxCols = dataStateRef.current.numColumns - 1;
        const maxRows = dataStateRef.current.numRows - 1;
        const visualColStart = Math.max(0, Math.min(colStart, maxCols));
        const visualColEnd = Math.max(0, Math.min(colEnd, maxCols));
        const visualRowStart = Math.max(0, Math.min(rowStart, maxRows));
        const visualRowEnd = Math.max(0, Math.min(rowEnd, maxRows));

        // Get the index mappings from dataState
        // These map: visualPosition -> originalIndex
        const { sortedRowIndices, sortedColIndices } = dataStateRef.current;

        if (!sortedRowIndices || !sortedColIndices) {
          throw new Error('sortedRowIndices or sortedColIndices not available');
        }

        // Convert visual indices to ORIGINAL indices using the mapping
        // This ensures we select the same data the user sees on screen
        const originalRowIndices: number[] = [];
        for (let v = visualRowStart; v <= visualRowEnd; v++) {
          originalRowIndices.push(sortedRowIndices[v]);
        }

        const originalColIndices: number[] = [];
        for (let v = visualColStart; v <= visualColEnd; v++) {
          originalColIndices.push(sortedColIndices[v]);
        }

        const canonicalRowIndices =
          matrixOrientation === 'Transposed'
            ? originalColIndices
            : originalRowIndices;

        const canonicalColIndices =
          matrixOrientation === 'Transposed'
            ? originalRowIndices
            : originalColIndices;

        // Store visual bounds for pan constraints (still needed for view management)
        const filtered = {
          startX: visualColStart,
          endX: visualColEnd,
          startY: visualRowStart,
          endY: visualRowEnd
        };

        saveUndoPoint();

        // Clear cropBox FIRST to prevent re-triggering this useEffect
        setCropBox(null);

        // Update states
        setFilteredIdxDict(filtered);  // Visual bounds for pan constraints
        setCroppedRowIndices(canonicalRowIndices);  // Canonical indices for worker
        setCroppedColIndices(canonicalColIndices);  // Canonical indices for worker

        pendingCropWorkflowRef.current = {
          label:
            `Crop Matrix to ${canonicalRowIndices.length} Rows × ` +
            `${canonicalColIndices.length} Columns`,
          parameters: {
            rowIndices: [...canonicalRowIndices],
            columnIndices: [...canonicalColIndices],
            rowCount: canonicalRowIndices.length,
            columnCount: canonicalColIndices.length,
            orientationAtSelection: matrixOrientation,
            indexSpace: 'canonical',
            requiresCompatibleOrdering: true
          }
        };

        // Reset view to origin so cropped data starts at top-left
        resetViewToOrigin();

        setToastMessage(`✅ Crop applied! ${originalRowIndices.length} rows × ${originalColIndices.length} cols`);
        setToastSeverity('success');
        setToastOpen(true);

        // Auto-disable cropping mode
        setIsCropping(false);
      } catch (error) {
        console.error('❌ Crop error:', error);
        setCropBox(null);
        setIsCropping(false);
        setToastMessage("❌ Error processing crop area. Please try again.");
        setToastSeverity('error');
        setToastOpen(true);
      }
    }
  }, [
    isDrawing,
    cropBox,
    rowLabelsWidth,
    colLabelsWidth,
    dimensions,
    panelWidth,
    // Note: viewStates is intentionally NOT in deps - we read it at crop time but don't want to re-run on viewState changes
    heatmapStateRef.current?.cellDimensions?.height,
    heatmapStateRef.current?.cellDimensions?.width,
    dataStateRef.current?.numColumns,
    dataStateRef.current?.numRows,
    resetViewToOrigin
  ]);

  // Also add this helper function for debugging crop coordinates
  const debugCropCoordinates = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!heatmapRef.current || !heatmapStateRef.current) return;

    const rect = (heatmapRef.current as HTMLDivElement).getBoundingClientRect();
    const screenX = event.clientX - rect.left - rowLabelsWidth;
    const screenY = event.clientY - rect.top - colLabelsWidth;

    const currentViewState = viewStates[IDS.VIEWS.HEATMAP_GRID];
    const zoomValue = currentViewState?.zoom;
    const currentZoom = Array.isArray(zoomValue) ? zoomValue[0] : (zoomValue || BASE_ZOOM);
    const zoomFactor = Math.pow(2, currentZoom);
    const targetX = currentViewState?.target?.[0] || 0;
    const targetY = currentViewState?.target?.[1] || 0;

    const worldX = (screenX / zoomFactor) + targetX;
    const worldY = (screenY / zoomFactor) + targetY;

    const offsetX = heatmapStateRef.current.width / 4;
    const offsetY = heatmapStateRef.current.height / 4;

    const adjustedWorldX = worldX + offsetX;
    const adjustedWorldY = worldY + offsetY;

    const baseCellWidth = heatmapStateRef.current.cellDimensions.width;
    const baseCellHeight = heatmapStateRef.current.cellDimensions.height;

    const colIdx = Math.floor(adjustedWorldX / baseCellWidth);
    const rowIdx = Math.floor(adjustedWorldY / baseCellHeight);

    console.log(`🐛 DEBUG - Mouse at screen(${screenX}, ${screenY}) -> world(${worldX}, ${worldY}) -> cell(${colIdx}, ${rowIdx}) at zoom ${currentZoom}`);

    return { colIdx, rowIdx };
  };

  // Optional: Add this to your mouse move handler for real-time debugging
  const handleMouseMoveWithDebug = (event: React.MouseEvent<HTMLDivElement>) => {
    // Your existing mouse move logic

    // Add debug info (remove in production)
    if (process.env.NODE_ENV === 'development') {
      debugCropCoordinates(event);
    }
  };

  useEffect(() => {
    if (containerRefDeckgl.current) {
      const deckInstance = containerRefDeckgl.current.deck;
    }

  }, [containerRefDeckgl.current])


  let deckGlInstance;
  if (heatmapStateRef.current?.cellData && container && layers) {
    deckGlInstance =
      <DeckGL
        ref={containerRefDeckgl}
        getCursor={(cursorState) => cursorState.isDragging ? 'grab' : 'crosshair'}
        {...deckglProps}
        width="100%"
        height="100%"
        // useDevicePixels={false}
        // parent={container}
        style={merge({ position: "relative" }, deckglProps?.style || {})} // ✅ Changed to relative
        views={views}
        layerFilter={layerFilter}
        // @ts-ignore
        onViewStateChange={onViewStateChange}
        viewState={viewStates}
        layers={layers}
        getTooltip={tooltipFunction && isHovering ? tooltipFunction : null}
        controller={!isCropping ? {
          scrollZoom: {
            speed: 0.03,  // Increased from 0.01 for faster zoom
            smooth: true  // Enable smooth zoom transitions
          },
          inertia: 300,  // Momentum after gestures (ms)
          dragPan: true,
          doubleClickZoom: true,  // Double click = zoom in
          keyboard: true  // Shift + Double click = zoom out
        } : false}
        onClick={(event) => {
          const obj = event.object;
          console.log('DeckGL onClick:', obj);
          if (obj?.id === clickableClusterId) {
            setClickedClusterData({
              Nodes: obj.nodes,
              Group: obj.text,
              filters: filters // Include current filters
            });
            setIsTableVisible(true);
          }
        }}
      >

        {isTableVisible && clickedClusterData && (
          <div>
            <ClusterInfoBox
              setVisibilty={setIsTableVisible}
              setHovering={setHovering}
              data={clickedClusterData}
              dataType={ID}
              onShowNetwork={(networkData: any) => {
                setIsDrawerOpen(false);
                onShowNetwork?.(networkData);
              }}
              onShowPathwayNetwork={(pathwayData: any) => {
                setIsDrawerOpen(false);
                onShowPathwayNetwork?.(pathwayData);
              }}
            />
          </div>
        )}
      </DeckGL>

  }


  return heatmapStateRef.current?.cellData && container && layers ? (
    <div style={{ height: '100%', width: '100%' }}>
      {/* Pathway Selector Modal */}
      {showPathwaySelector && (
        <PathwaySelector
          pathwayResults={pathwayResults}
          searchQuery={lastSearchQuery}
          onPathwaySelect={handlePathwaySelect}
          onClose={handlePathwaySelectorClose}
        />
      )}
      <div
        style={{
          height: `100%`,
          width: `${HEATMAP_PARENT_WIDTH_RATIO}%`,
          display: 'flex',
          gap: '0px',
        }}>
        <PersistentDrawerLeft
          parentContainerRef={container}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          setOpacityValue={setOpacityValue}
          setOrder={setOrder}
          categories={catTemporary}
          colMetadataValues={colMetadataValues}
          rowMetadataValues={rowMetadataValues}
          order={order}
          //Legend={legendComponent}
          panelWidth={panelWidth}
          ID={ID}
          dataState={dataStateRef.current}
          workflowBaselineRowCount={data?.row_nodes?.length}
          workflowBaselineColumnCount={data?.col_nodes?.length}
          workflowBaselineRowFeatures={
            data?.row_nodes?.map((node: any) => node.name) ?? []
          }
          workflowBaselineColumnFeatures={
            data?.col_nodes?.map((node: any) => node.name) ?? []
          }
          workflowBaselineColMetadataValues={
            workflowBaselineColMetadataValues
          }
          workflowBaselineRowMetadataValues={
            workflowBaselineRowMetadataValues
          }
          setState={setValueScale}
          resultCategories={resultCategories}
          setResultCategory={setResultCategory}
          setSearchTerm={setSearchTerm}
          setPvalThreshold={setPvalThreshold}
          downloadHeatmap={downloadPdf}
          downloadMatrix={downloadMatrix}
          setCropping={enableCropping}
          setFilteredIdxDict={resetFilteredDict}
          cropBox={filteredIdxDict}
          isMinimapEnabled={isMinimapEnabled}
          setIsMinimapEnabled={setIsMinimapEnabled}
          filters={filters}
          setFilters={setFilters}
          onRenderHeatmap={handleRenderHeatmap}
          notifyClusteringStarted={notifyClusteringStarted}
          notifySortStarted={notifySortStarted}
          setRowClusterValue={setRowClusterValue}
          setColClusterValue={setColClusterValue}
          rowClusterValue={rowClustGroup}
          colClusterValue={colClustGroup}
          opacityValue={OpacityValue}
          pvalThreshold={pvalThreshold}
          onSliderInteractionStart={saveUndoPoint}
          onOpacityInteractionEnd={handleOpacityInteractionEnd}
          onRowClusterDepthInteractionEnd={
            handleRowClusterDepthInteractionEnd
          }
          onColumnClusterDepthInteractionEnd={
            handleColumnClusterDepthInteractionEnd
          }
          onMetadataSelectionChange={
            handleMetadataSelectionChange
          }
          reZscoreFilteredSubset={reZscoreFilteredSubset}
          zScoreAxis={displayedZScoreAxis}
          onReZscoreToggle={handleReZscoreToggle}
          onZScoreAxisChange={handleZScoreAxisChange}
          matrixOrientation={matrixOrientation}
          featureAxis={visualFeatureAxis}
          setMatrixOrientation={setMatrixOrientationWithHistory}
          onAnalysisChangeStart={saveUndoPoint}
          onGuiClusterRequest={handleGuiClusterRequest}
          onGuiSortRequest={handleGuiSortRequest}
          onGuiClearFiltersRequest={handleGuiClearFiltersRequest}
          onGuiRemoveFiltersRequest={handleGuiRemoveFiltersRequest}
          activeWorkflowActions={activeWorkflowActions}
          onRunImportedWorkflow={handleRunImportedWorkflow}
          isImportedWorkflowRunning={isImportedWorkflowRunning}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          sidebarTopContent={sidebarTopContent}
          homepage={homepage}
          chatContent={(
            onCommandRun,
            onSuggestionsClose,
            externalCommand,
            onExternalCommandHandled
          ) => (
            <ChatBox
              onSendMessage={(message: string) => handleOllamaSendClick(message)}
              commandHistory={commandHistory}
              rotatingGifUrl={rotatingGifUrl}
              placeholder="Chat with AI Assistant"
              showSuggestions={true}
              disabled={false}
              width="100%"
              onCommandRun={onCommandRun}
              onSuggestionsClose={onSuggestionsClose}
              externalCommand={externalCommand}
              onExternalCommandHandled={onExternalCommandHandled}
              colMetadataValues={colMetadataValues}
              rowMetadataValues={rowMetadataValues}
              backgroundColor="transparent"
              matrixOrientation={matrixOrientation}
            />
          )}
        />
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 0,
            boxSizing: 'border-box'
          }}
        >  {/* This will be a container for the heatmap and whitespace */}
          <div id="heatmapDiv" style={{
            height: `${HEATMAP_HEIGHT}%`,
            width: `${HEATMAP_WIDTH}%`,  // Take 95% of the parent container's width
            overflow: 'visible',
            position: 'relative',
            transform: `translateX(${isDrawerOpen ? `${0}px` : `${-panelWidth}px`})`,
            transition: 'transform 0.3s ease',
          }}
            ref={heatmapRef}
            onMouseDown={handleMouseDown}
          >

            {/* Matrix information */}
            <div
              ref={matrixInfoRef}
              style={{
                position: 'absolute',
                top: '4px',
                left: `${rowLabelsWidth - 10}px`,
                right: 'auto',
                zIndex: 20,

                width: legend?.width ?? 228,

                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '0px',

                fontFamily: 'Arial, sans-serif',
                fontSize: '12.5px',
                color: '#555',

                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Current matrix dimensions */}
              <div
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontWeight: 500,
                  lineHeight: 1.1,
                }}
              >
                Matrix Size: {currentMatrixColumns} Columns × {currentMatrixRows} Rows
              </div>

              {/* Matrix value scale */}
              {legendComponent}
            </div>

            {deckGlInstance}

            {/* Aggregation indicator badge - shown when cells are being averaged, positioned at bottom right */}
            {isAggregated && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  right: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  color: 'white',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 1000,
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                Aggregated view - Zoom in for gene-level detail
              </div>
            )}

            {/* ADD THIS OVERLAY - it sits on top of DeckGL and captures events first */}
            {isCropping && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999, // High z-index to be above DeckGL
                  cursor: isDrawing ? 'grabbing' : 'crosshair',
                  backgroundColor: 'transparent',
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  console.log('🔍 CROP - Starting crop selection from overlay');

                  const element = heatmapRef.current;
                  if (!element) return;

                  const { x, y } = getRelativePosition(event, element);
                  setIsDrawing(true);
                  setCropBox({ startX: x, startY: y, endX: x, endY: y });
                }}
                onMouseMove={(event) => {
                  if (!isDrawing) return;

                  event.preventDefault();
                  event.stopPropagation();

                  const element = heatmapRef.current;
                  if (!element) return;

                  const { x, y } = getRelativePosition(event, element);
                  setCropBox((prevBox) => {
                    if (!prevBox) return null;
                    return { ...prevBox, endX: x, endY: y };
                  });
                }}
                onMouseUp={(event) => {
                  if (!isDrawing) return;

                  event.preventDefault();
                  event.stopPropagation();

                  console.log('🔍 CROP - Crop selection completed from overlay');
                  setIsDrawing(false);
                }}
              />
            )}

            {isCropping && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'rgba(255, 193, 7, 0.95)',
                color: 'black',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 1002,
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '2px solid #ffc107'
              }}>
                🎯 CROP MODE: Click and drag to select area • Press ESC to cancel
              </div>
            )}

            {/* Enhanced crop box visualization */}
            {cropBox && isDrawing && (
              <>
                <div style={{
                  position: 'absolute',
                  left: Math.min(cropBox.startX, cropBox.endX),
                  top: Math.min(cropBox.startY, cropBox.endY),
                  width: Math.abs(cropBox.endX - cropBox.startX),
                  height: Math.abs(cropBox.endY - cropBox.startY),
                  backgroundColor: 'rgba(0, 123, 255, 0.15)',
                  border: '3px dashed rgba(0, 123, 255, 0.8)',
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 0 10px rgba(0, 123, 255, 0.3)'
                }} />

                {/* Enhanced size indicator */}
                <div style={{
                  position: 'absolute',
                  left: Math.max(cropBox.endX, cropBox.startX) + 15,
                  top: Math.min(cropBox.startY, cropBox.endY) - 5,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  pointerEvents: 'none',
                  zIndex: 1001,
                  fontFamily: 'monospace',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  📐 {Math.abs(cropBox.endX - cropBox.startX).toFixed(0)} × {Math.abs(cropBox.endY - cropBox.startY).toFixed(0)}px
                </div>
              </>
            )}
            {isMinimapEnabled && heatmapStateRef.current && dataStateRef.current && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  zIndex: 10,
                }}
              >
                <HeatmapMinimap
                  viewState={viewStates.main || viewStates[IDS.VIEWS.HEATMAP_GRID]}
                  onViewStateChange={onViewStateChange}
                  dataState={dataStateRef.current}
                  heatmapState={heatmapStateRef.current}
                  width={150} // Give padding room
                  height={150}
                  colLabelsWidth={colLabelsWidth}
                  rowLabelsWidth={rowLabelsWidth}
                  opacity={OpacityValue}
                />
              </div>
            )}
            {/* Pathway Selector Modal
{showPathwaySelector && (
  <PathwaySelector
    pathwayResults={pathwayResults}
    searchQuery={lastSearchQuery}
    onPathwaySelect={handlePathwaySelect}
    onClose={handlePathwaySelectorClose}
  />
)} */}
          </div>
          {/* {order.col === "cluster" && (
            <CustomSlider
              direction="vertical"
              setClusterValue={setColClusterValue}
              width={order.colCat.length > 0 ? colLabelsWidth : 8}
            />
          )}

          {order.row === "cluster" && (
            <CustomSlider
              direction="horizontal"
              setClusterValue={setRowClusterValue}
              width={rowLabelsWidth + panelWidth}
            />
          )} */}
        </div>
      </div>

      {/* Zoom controls hint */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        padding: '4px 0',
        fontSize: '13px',
        color: '#888',
        fontFamily: 'Arial, sans-serif'
      }}>
        Scroll to zoom • Double-click to zoom in • Shift/Cmd + double-click to zoom out • Drag to pan
      </div>

      {/* Toast Notifications - ADD THIS */}
      <ToastNotification
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={() => setToastOpen(false)}
        duration={3000}
      />
    </div>
  ) : null;
}; 
