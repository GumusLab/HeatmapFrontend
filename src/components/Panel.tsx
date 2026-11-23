
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import MenuIcon from '@mui/icons-material/Menu';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CropIcon from '@mui/icons-material/Crop';
import {
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Box,
  Switch,
  Select,
  MenuItem
} from '@mui/material';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { styled, useTheme } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';
import FiltersSection from './Filters';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type {
  DataStateShape
} from '../types';
import {
  WORKFLOW_FORMAT,
  WORKFLOW_SCHEMA_VERSION,
  createImportedWorkflowSteps,
  isValidWorkflowAction,
  validateWorkflowActionAgainstDataset,
  buildWorkflowPreflightResult,
  resolveImportedWorkflowStepParameter,
  type ImportedWorkflowStep,
  type WorkflowAction,
  type WorkflowIssue,
  type WorkflowRecipe
} from '../workflow';
import { order } from '../types';
import MultiSelect from './CustomMultiSelect';
import ListComponent from './ListComponent';
import SearchBox from './SearchBox';
import CustomSlider from './Slider';
import SimpleSelection from './SimpleSelection';
import MultipurposeSlider from './opcatiySlider';
import ReplayIcon from '@mui/icons-material/Replay';
import MapIcon from '@mui/icons-material/Map'; // If you want to add a toggle button
import { ORDER_INDEX } from '../const';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

const orderArray = ['alphabetically', 'cluster', 'sum', 'variance']

const SIDEBAR_FONT = 'Arial, sans-serif';

const SIDEBAR_COLORS = {
  text: '#777777',
  secondaryText: '#666666',
  primary: '#1976d2',
  primaryHover: '#1565c0',
  disabled: '#bdbdbd',
  border: '#d0d0d0',
  background: '#ffffff',
  subtleBackground: '#f8f9fa',
  chip: '#e3f2fd'
};

const sidebarSectionLabelStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  fontFamily: SIDEBAR_FONT,
  fontSize: '13px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: SIDEBAR_COLORS.text,
};

const sidebarControlText = {
  fontFamily: SIDEBAR_FONT,
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'none' as const,
};

// Liquid-glass surfaces used only for the AI controls.
// These are intentionally self-contained so the rest of the sidebar keeps
// the styling you already chose.
const GlassSurface = styled('div')({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '10px',
  border: '1px solid rgba(102, 102, 102, 0.55)',
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(245,250,255,0.66) 42%, rgba(224,242,254,0.46) 100%)',
  WebkitBackdropFilter: 'blur(16px) saturate(155%)',
  backdropFilter: 'blur(16px) saturate(155%)',
  boxShadow:
    '0 7px 20px rgba(30, 90, 150, 0.10), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(25,118,210,0.08)',
  isolation: 'isolate',
  transition:
    'border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease',

  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.30) 20%, transparent 46%), radial-gradient(circle at 92% 100%, rgba(120,190,255,0.18) 0%, transparent 42%)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: '1px',
    zIndex: 0,
    pointerEvents: 'none',
    background:
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
  },

  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
});

const GlassInteractive = styled(GlassSurface)({
  cursor: 'pointer',

  '&:hover': {
    borderColor: 'rgba(100, 181, 246, 0.95)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.90) 0%, rgba(235,247,255,0.78) 48%, rgba(207,235,255,0.58) 100%)',
    boxShadow:
      '0 9px 24px rgba(25,118,210,0.14), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(25,118,210,0.10)',
    transform: 'translateY(-1px)',
  },

  '&:active': {
    borderColor: SIDEBAR_COLORS.primary,
    background:
      'linear-gradient(135deg, rgba(232,244,255,0.96) 0%, rgba(219,238,255,0.86) 50%, rgba(196,226,255,0.70) 100%)',
    boxShadow:
      '0 4px 12px rgba(25,118,210,0.15), inset 0 1px 2px rgba(25,118,210,0.10)',
    transform: 'translateY(0) scale(0.995)',
  },
});

const GlassChatSurface = styled(GlassInteractive)({
  padding: 0,

  // Make the ChatBox's MUI text field visually merge into the glass shell.
  '& .MuiTextField-root': {
    margin: 0,
  },

  '& .MuiOutlinedInput-root': {
    borderRadius: '9px',
    backgroundColor: 'rgba(255,255,255,0.10)',
    color: '#666666',
    fontFamily: SIDEBAR_FONT,
    transition: 'background-color 160ms ease, box-shadow 160ms ease',
  },

  '& .MuiOutlinedInput-root:hover': {
    backgroundColor: 'rgba(227,242,253,0.24)',
  },

  '& .MuiOutlinedInput-root.Mui-focused': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },

  '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
    border: 'none !important',
  },

  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    border: 'none !important',
  },

  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: 'none !important',
  },

  '& .MuiInputLabel-root': {
    color: '#1976d2',
    backgroundColor: 'transparent',
    fontWeight: 500,
    fontFamily: SIDEBAR_FONT,
    fontSize: '15px',
  },

  '& .MuiInputLabel-root.Mui-focused': {
    color: SIDEBAR_COLORS.primary,
  },

  '& .MuiSvgIcon-root': {
    color: '#1976d2'
  },

  '&:hover .MuiSvgIcon-root': {
    color: SIDEBAR_COLORS.primary,
  },
});

const LiquidGlassCommandChip = styled('button')({
  appearance: 'none',
  WebkitAppearance: 'none',

  border: '1px solid rgba(25, 118, 210, 0.28)',
  borderRadius: '10px',

  padding: '5px 8px',

  background:
    'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(227,242,253,0.62))',

  color: '#1976d2',
  fontFamily: SIDEBAR_FONT,
  fontSize: '11px',
  lineHeight: '15px',
  fontWeight: 500,

  cursor: 'pointer',
  textAlign: 'left',

  backdropFilter: 'blur(10px) saturate(150%)',
  WebkitBackdropFilter: 'blur(10px) saturate(150%)',

  boxShadow: `
    inset 0 1px 0 rgba(255,255,255,0.9),
    0 1px 3px rgba(25,118,210,0.06)
  `,

  transition:
    'background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, color 0.16s ease, transform 0.1s ease',

  '&:hover': {
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(187,222,251,0.75))',

    borderColor: '#64b5f6',

    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,1),
      0 2px 7px rgba(25,118,210,0.18)
    `,

    transform: 'translateY(-1px)',
  },

  '&:active': {
    background:
      'linear-gradient(135deg, #1976d2, #1565c0)',

    borderColor: '#1565c0',
    color: '#ffffff',

    boxShadow: `
      inset 0 2px 4px rgba(0,0,0,0.12),
      0 1px 3px rgba(25,118,210,0.18)
    `,

    transform: 'translateY(0)',
  },

  '&:focus-visible': {
    outline: '2px solid rgba(25,118,210,0.30)',
    outlineOffset: '2px',
  },
});

// interface order{
//     row:string;
//     col:string;
//     rowCat:string[];
//     sortByRowCat:boolean;
//     colCat:string[];
//     sortByColCat:boolean;
// }
interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export default function PersistentDrawerLeft({
  parentContainerRef,
  isDrawerOpen,
  setIsDrawerOpen,
  setOpacityValue,
  setPvalThreshold,
  setOrder,
  categories,
  resultCategories,
  order,
  // Legend,
  panelWidth,
  ID,
  dataState,
  setState,
  setResultCategory,
  setSearchTerm,
  downloadHeatmap,
  downloadMatrix,
  setCropping,
  setFilteredIdxDict,
  cropBox,
  isMinimapEnabled,
  setIsMinimapEnabled,
  filters,
  setFilters,
  onRenderHeatmap,
  notifyClusteringStarted,
  notifySortStarted,
  setRowClusterValue,
  setColClusterValue,
  rowClusterValue,
  colClusterValue,
  opacityValue,
  pvalThreshold,
  onAnalysisChangeStart,
  onGuiClusterRequest,
  onGuiSortRequest,
  onGuiClearFiltersRequest,
  onGuiRemoveFiltersRequest,
  onSliderInteractionStart,
  onOpacityInteractionEnd,
  onRowClusterDepthInteractionEnd,
  onColumnClusterDepthInteractionEnd,
  onMetadataSelectionChange,
  matrixOrientation,
  featureAxis,
  setMatrixOrientation,
  reZscoreFilteredSubset,
  zScoreAxis,
  onReZscoreToggle,
  onZScoreAxisChange,
  activeWorkflowActions,
  onRunImportedWorkflow,
  isImportedWorkflowRunning = false,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  chatContent,
  sidebarTopContent,
  homepage,
  workflowBaselineRowCount,
  workflowBaselineColumnCount,
  workflowBaselineRowFeatures = [],
  workflowBaselineColumnFeatures = [],
  workflowBaselineColMetadataValues = {},
  workflowBaselineRowMetadataValues = {},
  colMetadataValues = {},
  rowMetadataValues = {}
}: {
  parentContainerRef: HTMLDivElement;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpacityValue: React.Dispatch<React.SetStateAction<number>>;
  setPvalThreshold?: React.Dispatch<React.SetStateAction<number>>;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  categories: { row: {}; col: {}; };
  resultCategories?: string[];
  workflowBaselineRowCount?: number;
  workflowBaselineColumnCount?: number;
  workflowBaselineRowFeatures?: string[];
  workflowBaselineColumnFeatures?: string[];
  workflowBaselineColMetadataValues?: Record<string, string[]>;
  workflowBaselineRowMetadataValues?: Record<string, string[]>;
  order: order;
  // Legend: React.ReactElement;
  panelWidth: number;
  ID: string;
  dataState: DataStateShape | null;
  setState?: React.Dispatch<React.SetStateAction<string>>;
  setResultCategory?: React.Dispatch<React.SetStateAction<string>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  downloadHeatmap: any;
  downloadMatrix: any;
  setCropping: any;
  setFilteredIdxDict: any;
  cropBox: CropBox | null;
  isMinimapEnabled: boolean;
  setIsMinimapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  filters: { row: any[], col: any[] };
  setFilters: React.Dispatch<React.SetStateAction<{ row: any[], col: any[] }>>;
  onRenderHeatmap: (currentFilters: any) => void; // ✅ Requires filters parameter
  notifyClusteringStarted: any;
  notifySortStarted: any;
  setRowClusterValue: React.Dispatch<React.SetStateAction<number>>;
  setColClusterValue: React.Dispatch<React.SetStateAction<number>>;
  matrixOrientation: string;
  featureAxis: 'row' | 'col' | null;
  setMatrixOrientation: React.Dispatch<React.SetStateAction<string>>;
  rowClusterValue: number;
  colClusterValue: number;
  opacityValue: number;
  pvalThreshold: number;
  onSliderInteractionStart: () => void;
  onOpacityInteractionEnd?: (value: number) => void;
  onRowClusterDepthInteractionEnd?: (value: number) => void;
  onColumnClusterDepthInteractionEnd?: (value: number) => void;
  onMetadataSelectionChange?: (
    axis: 'row' | 'col',
    categories: string[]
  ) => void;
  reZscoreFilteredSubset: boolean;
  zScoreAxis: 'row' | 'col';

  onReZscoreToggle: (enabled: boolean) => void;
  onZScoreAxisChange: (axis: 'row' | 'col') => void;
  onAnalysisChangeStart: () => void;
  onGuiClusterRequest?: (
    target: 'rows' | 'columns'
  ) => void;
  onGuiSortRequest?: (
    target: 'rows' | 'columns',
    method: string
  ) => void;
  onGuiClearFiltersRequest?: () => void;
  onGuiRemoveFiltersRequest?: (
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
  ) => void;
  activeWorkflowActions: WorkflowAction[];
  onRunImportedWorkflow?: (
    actions: WorkflowAction[]
  ) => void;
  isImportedWorkflowRunning?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  chatContent?: (
    onCommandRun: () => void,
    onSuggestionsClose: () => void,
    externalCommand: string | null,
    onExternalCommandHandled: () => void
  ) => React.ReactNode;
  colMetadataValues?: Record<string, string[]>;
  rowMetadataValues?: Record<string, string[]>;
  sidebarTopContent?: React.ReactNode;
  homepage: boolean;
}) {
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [isTrackChangesExpanded, setIsTrackChangesExpanded] = useState(false);
  const [isMetadataGuideOpen, setIsMetadataGuideOpen] = useState(false);
  const [pendingGuideCommand, setPendingGuideCommand] = useState<string | null>(null);
  const [isWorkflowReviewOpen, setIsWorkflowReviewOpen] =
    useState(false);
  const aiPanelRef = React.useRef<HTMLDivElement>(null);
  const workflowUploadInputRef =
    React.useRef<HTMLInputElement>(null);

  const [uploadedWorkflow, setUploadedWorkflow] =
    useState<WorkflowRecipe | null>(null);

  const [uploadedWorkflowSteps, setUploadedWorkflowSteps] =
    useState<ImportedWorkflowStep[]>([]);

  const [
    uploadedWorkflowRecipeIssues,
    setUploadedWorkflowRecipeIssues
  ] = useState<WorkflowIssue[]>([]);


  const getIncludedMeta = (included: boolean) => {
    return included
      ? {
        label: 'Included',
        icon: <CheckCircleIcon sx={{ fontSize: 14, color: SIDEBAR_COLORS.primary }} />,
        textColor: SIDEBAR_COLORS.primary,
        bgColor: SIDEBAR_COLORS.chip,
        borderColor: SIDEBAR_COLORS.primary,
      }
      : {
        label: 'Excluded',
        icon: <RemoveCircleOutlineIcon sx={{ fontSize: 14, color: '#757575' }} />,
        textColor: '#616161',
        bgColor: '#f5f5f5',
        borderColor: '#e0e0e0',
      };
  };

  const getValidationMeta = (status?: string) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Ready',
          icon: <CheckCircleIcon sx={{ fontSize: 14, color: '#2e7d32' }} />,
          textColor: '#2e7d32',
          bgColor: '#e8f5e9',
          borderColor: '#c8e6c9',
        };

      case 'needs_resolution':
        return {
          label: 'Needs resolution',
          icon: <ErrorOutlineIcon sx={{ fontSize: 14, color: '#ed6c02' }} />,
          textColor: '#b26a00',
          bgColor: '#fff3e0',
          borderColor: '#ffddb0',
        };

      case 'blocked':
        return {
          label: 'Blocked',
          icon: <BlockIcon sx={{ fontSize: 14, color: '#d32f2f' }} />,
          textColor: '#c62828',
          bgColor: '#ffebee',
          borderColor: '#ffcdd2',
        };

      default:
        return {
          label: 'Review',
          icon: <ErrorOutlineIcon sx={{ fontSize: 14, color: '#0288d1' }} />,
          textColor: '#0277bd',
          bgColor: '#e1f5fe',
          borderColor: '#b3e5fc',
        };
    }
  };

  const renderStatusPill = ({
    icon,
    label,
    textColor,
    bgColor,
    borderColor
  }: {
    icon: React.ReactNode;
    label: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
  }) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '10px',
        fontWeight: 600,
        color: textColor,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );

  const handleWorkflowParameterResolution = (
    actionId: string,
    parameter: string,
    resolvedValue: unknown
  ) => {
    setUploadedWorkflowSteps(prev =>
      prev.map(step =>
        step.originalAction.id === actionId
          ? resolveImportedWorkflowStepParameter(
            step,
            parameter,
            resolvedValue
          )
          : step
      )
    );
  };

  const handleDownloadWorkflow = () => {
    const recipe: WorkflowRecipe = {
      format: WORKFLOW_FORMAT,
      schemaVersion: WORKFLOW_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      actions: activeWorkflowActions
    };

    const blob = new Blob(
      [JSON.stringify(recipe, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `clusterchirp-workflow-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const handleWorkflowUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<WorkflowRecipe>;

      if (parsed.format !== WORKFLOW_FORMAT) {
        window.alert(
          'Invalid workflow file: unrecognized workflow format.'
        );
        return;
      }

      const recipeIssues: WorkflowIssue[] = [];

      if (parsed.schemaVersion !== WORKFLOW_SCHEMA_VERSION) {
        recipeIssues.push({
          code: 'INCOMPATIBLE_WORKFLOW_VERSION',
          message:
            `Workflow schema version "${String(
              parsed.schemaVersion
            )}" is incompatible with this version of ClusterChirp. ` +
            `Expected "${WORKFLOW_SCHEMA_VERSION}".`
        });
      }

      if (!Array.isArray(parsed.actions)) {
        window.alert(
          'Invalid workflow file: actions must be an array.'
        );
        return;
      }

      const invalidActionIndex =
        parsed.actions.findIndex(
          action => !isValidWorkflowAction(action)
        );

      if (invalidActionIndex >= 0) {
        window.alert(
          `Invalid workflow file: action ${invalidActionIndex + 1
          } has an invalid or unsupported structure.`
        );
        return;
      }

      if (typeof parsed.createdAt !== 'string') {
        window.alert(
          'Invalid workflow file: missing or invalid createdAt.'
        );
        return;
      }

      const validatedRecipe: WorkflowRecipe = {
        format: WORKFLOW_FORMAT,
        schemaVersion: WORKFLOW_SCHEMA_VERSION,
        createdAt: parsed.createdAt,
        actions: parsed.actions as WorkflowAction[]
      };

      setUploadedWorkflow(validatedRecipe);
      setUploadedWorkflowRecipeIssues(recipeIssues);

      setUploadedWorkflowSteps(
        createImportedWorkflowSteps(
          validatedRecipe.actions,
          {
            columnMetadataFields: Object.keys(
              workflowBaselineColMetadataValues
            ),
            rowMetadataFields: Object.keys(
              workflowBaselineRowMetadataValues
            ),
            columnMetadataValues:
              workflowBaselineColMetadataValues,
            rowMetadataValues:
              workflowBaselineRowMetadataValues,
            rowFeatures: workflowBaselineRowFeatures,
            columnFeatures: workflowBaselineColumnFeatures,
            rowCount: workflowBaselineRowCount,
            columnCount: workflowBaselineColumnCount
          }
        )
      );

      setIsAIExpanded(false);
      setIsTrackChangesExpanded(false);
      setIsWorkflowReviewOpen(true);

      console.log(
        '📥 WORKFLOW UPLOAD VALIDATED',
        validatedRecipe
      );
    } catch (err) {
      console.error('Failed to parse workflow file:', err);

      window.alert(
        'Invalid workflow file: could not parse JSON.'
      );
    } finally {
      // Allows selecting the same file again afterward.
      input.value = '';
    }
  };


  /* Keep drawer independent from heatmap height */
  const drawerHostRef = React.useRef<HTMLDivElement>(null);
  const [drawerTop, setDrawerTop] = useState(0);

  const theme = useTheme();
  // const [selectedRowIndex, setSelectedRowIndex] = useState(0)
  const [selectedRowIndex, setSelectedRowIndex] = useState(ORDER_INDEX[order["row"]]);
  const [selectedColIndex, setSelectedColIndex] = useState(ORDER_INDEX[order["col"]]);

  const isTransposed = matrixOrientation === 'Transposed';

  const displayedRowOrder = isTransposed
    ? order.col
    : order.row;

  const displayedColOrder = isTransposed
    ? order.row
    : order.col;

  const featureLabels = useMemo(
    () => {
      if (!dataState || featureAxis === null) {
        return null;
      }

      const labels =
        featureAxis === 'col'
          ? dataState.colLabels
          : dataState.rowLabels;

      return labels?.map(
        (ele: { text: string }) => ele.text
      );
    },
    [dataState?.rowLabels, dataState?.colLabels, featureAxis]
  );

  const drawerWidth = panelWidth;
  const colCategorynames = Object.keys(categories.col);
  const rowCategorynames = Object.keys(categories.row);

  const uploadedWorkflowPreflight =
    buildWorkflowPreflightResult(
      uploadedWorkflowSteps,
      {
        columnMetadataFields: Object.keys(
          workflowBaselineColMetadataValues
        ),
        rowMetadataFields: Object.keys(
          workflowBaselineRowMetadataValues
        ),
        columnMetadataValues:
          workflowBaselineColMetadataValues,
        rowMetadataValues:
          workflowBaselineRowMetadataValues,
        rowFeatures: workflowBaselineRowFeatures,
        columnFeatures: workflowBaselineColumnFeatures,
        rowCount: workflowBaselineRowCount,
        columnCount: workflowBaselineColumnCount
      },
      uploadedWorkflowRecipeIssues
    );

  const uploadedWorkflowValidatedSteps =
    uploadedWorkflowPreflight.steps;

  const uploadedWorkflowIncludedCount =
    uploadedWorkflowPreflight.includedSteps;

  const uploadedWorkflowExcludedCount =
    uploadedWorkflowPreflight.excludedSteps;

  const uploadedWorkflowModifiedCount =
    uploadedWorkflowPreflight.modifiedSteps;

  const uploadedWorkflowUnresolvedCount =
    uploadedWorkflowPreflight.unresolvedSteps;

  const uploadedWorkflowReadyCount =
    uploadedWorkflowValidatedSteps.filter(
      step => step.validation.status === 'ready'
    ).length;

  const uploadedWorkflowNeedsResolutionCount =
    uploadedWorkflowValidatedSteps.filter(
      step => step.validation.status === 'needs_resolution'
    ).length;

  const uploadedWorkflowBlockedCount =
    uploadedWorkflowValidatedSteps.filter(
      step => step.validation.status === 'blocked'
    ).length;

  const uploadedWorkflowCanRun =
    uploadedWorkflowPreflight.canRun;

  const uploadedWorkflowActionsToRun =
    uploadedWorkflowValidatedSteps
      .filter(step => step.included)
      .map(step => {
        const effectiveAction =
          step.resolvedAction ?? step.originalAction;

        if (step.resolutionChanges.length === 0) {
          return effectiveAction;
        }

        return {
          ...effectiveAction,
          importProvenance: {
            originalAction: step.originalAction,
            resolutionChanges: step.resolutionChanges
          }
        };
      });

  const hasColMetadataValues =
    Object.keys(colMetadataValues).length > 0;

  const hasRowMetadataValues =
    Object.keys(rowMetadataValues).length > 0;

  const sampleMetadataSourceAxis: 'row' | 'col' | null =
    hasColMetadataValues && !hasRowMetadataValues
      ? 'col'
      : hasRowMetadataValues && !hasColMetadataValues
        ? 'row'
        : !hasColMetadataValues && !hasRowMetadataValues
          ? 'col'
          : null;

  const sampleMetadataValues =
    sampleMetadataSourceAxis === 'row'
      ? rowMetadataValues
      : sampleMetadataSourceAxis === 'col'
        ? colMetadataValues
        : {};

  const appliedSampleMetadataFields = new Set(
    (
      sampleMetadataSourceAxis === 'row'
        ? filters?.row || []
        : filters?.col || []
    )
      .map((filter: any) => filter?.field)
      .filter(Boolean)
      .map((field: string) => field.toLowerCase())
  );

  const sampleMetadataDisplayAxis =
    sampleMetadataSourceAxis === null
      ? null
      : isTransposed
        ? sampleMetadataSourceAxis === 'row'
          ? 'columns'
          : 'rows'
        : sampleMetadataSourceAxis === 'row'
          ? 'rows'
          : 'columns';

  const metadataFilterCommands = Object.entries(sampleMetadataValues)
    .filter(
      ([metadata]) =>
        !appliedSampleMetadataFields.has(metadata.toLowerCase())
    )
    .filter(
      ([_, values]) =>
        values.length >= 2 && values.length <= 12
    )
    .flatMap(([metadata, values]) =>
      values.map(
        value => `Filter ${metadata} to ${value}`
      )
    );

  const metadataPlaceholderFilterCommands =
    Object.entries(sampleMetadataValues)
      .filter(
        ([metadata]) =>
          !appliedSampleMetadataFields.has(metadata.toLowerCase())
      )
      .filter(
        ([_, values]) =>
          values.length > 12
      )
      .map(
        ([metadata]) =>
          `Filter ${metadata} to [value]`
      );

  const metadataSortCommands =
    sampleMetadataDisplayAxis === null
      ? []
      : Object.keys(sampleMetadataValues)
        .map(
          metadata =>
            `Sort ${sampleMetadataDisplayAxis} by ${metadata}`
        );

  const metadataCommandGuide = {
    filtering: [
      ...metadataFilterCommands,
      ...metadataPlaceholderFilterCommands,
      "Clear all filters"
    ],

    selection: [
      "Select top 20 most variant features",
      "Select top 50 most variant features",
      "Select top 100 most variant features"
    ],

    sorting: [
      "Sort rows by variance",
      "Sort rows by sum",
      "Sort columns by variance",
      "Sort columns by sum",
      ...metadataSortCommands
    ],

    clustering: [
      "Cluster rows",
      "Cluster columns"
    ],

    normalization: [
      "zscore: rows",
      "zscore: cols"
    ],

    distance: [
      "Use euclidean distance",
      "Use cosine distance",
      "Use correlation distance",
      "Use manhattan distance"
    ],

    linkage: [
      "Use average linkage",
      "Use complete linkage",
      "Use single linkage"
    ],

    search: [
      "Search for [gene/feature]"
    ],

    visualization: [
      "Make it dark",
      "Make it light",
      "Set opacity to 0.8"
    ]
  };

  // const handleRowItemClick = (index: number) => {
  //   console.log('rowitemclick')
  //   setSelectedRowIndex(index);
  //   setOrder((prevOrder:any) => ({ ...prevOrder, row: orderArray[index], sortByRowCat:""}));
  // };

  // const handleColItemClick = (index: number) => {
  //   setSelectedColIndex(index);
  //   setOrder((prevOrder:any) => ({ ...prevOrder, col: orderArray[index], sortByColCat:""}));
  // };
  const handleRowItemClick = (index: number) => {
    const actionType = orderArray[index];


    const willChange =
      displayedRowOrder !== actionType ||
      (
        isTransposed
          ? order.sortByColCat !== ""
          : order.sortByRowCat !== ""
      ) ||
      (
        isTransposed
          ? order.sortColsByRowName !== null
          : order.sortRowsByColName !== null
      );


    if (!willChange) return;

    onAnalysisChangeStart();

    if (actionType === 'cluster') {
      onGuiClusterRequest?.(
        isTransposed ? 'columns' : 'rows'
      );

      notifyClusteringStarted();
    } else {
      onGuiSortRequest?.(
        isTransposed ? 'columns' : 'rows',
        actionType
      );

      notifySortStarted(actionType, 'rows');
    }

    setSelectedRowIndex(index);


    setOrder((prevOrder: any) => {
      if (isTransposed) {
        return {
          ...prevOrder,
          col: actionType,
          sortByColCat: "",
          sortColsByRowName: null
        };
      }

      return {
        ...prevOrder,
        row: actionType,
        sortByRowCat: "",
        sortRowsByColName: null
      };
    });

  };

  const handleColItemClick = (index: number) => {
    const actionType = orderArray[index];


    const willChange =
      displayedColOrder !== actionType ||
      (
        isTransposed
          ? order.sortByRowCat !== ""
          : order.sortByColCat !== ""
      ) ||
      (
        isTransposed
          ? order.sortRowsByColName !== null
          : order.sortColsByRowName !== null
      );


    if (!willChange) return;

    onAnalysisChangeStart();

    if (actionType === 'cluster') {
      onGuiClusterRequest?.(
        isTransposed ? 'rows' : 'columns'
      );

      notifyClusteringStarted();
    } else {
      onGuiSortRequest?.(
        isTransposed ? 'rows' : 'columns',
        actionType
      );

      notifySortStarted(actionType, 'columns');
    }

    setSelectedColIndex(index);


    setOrder((prevOrder: any) => {
      if (isTransposed) {
        return {
          ...prevOrder,
          row: actionType,
          sortByRowCat: "",
          sortRowsByColName: null
        };
      }

      return {
        ...prevOrder,
        col: actionType,
        sortByColCat: "",
        sortColsByRowName: null
      };
    });
  };

  const setOrderWithUndo: React.Dispatch<React.SetStateAction<any>> = (update) => {
    onAnalysisChangeStart();
    setOrder(update);
  };

  React.useLayoutEffect(() => {
    const updateDrawerPosition = () => {
      if (!drawerHostRef.current) return;

      const hostTop =
        drawerHostRef.current.getBoundingClientRect().top;

      const header = document.querySelector('.header-grid');

      const headerBottom =
        header instanceof HTMLElement
          ? header.getBoundingClientRect().bottom
          : 0;

      /*
       * Initially: sidebar begins where it naturally sits.
       * When page scrolls: keep it below the sticky navbar.
       */
      setDrawerTop(Math.max(headerBottom, hostTop));
    };

    updateDrawerPosition();

    window.addEventListener('resize', updateDrawerPosition);
    window.addEventListener('scroll', updateDrawerPosition, true);

    return () => {
      window.removeEventListener('resize', updateDrawerPosition);
      window.removeEventListener('scroll', updateDrawerPosition, true);
    };
  }, []);

  // AI Assistant: collapse when clicking outside
  useEffect(() => {
    if (!isAIExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        aiPanelRef.current &&
        !aiPanelRef.current.contains(event.target as Node)
      ) {
        setIsAIExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAIExpanded]);

  const DrawerHeader = styled('div')(({ }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingTop: '2px', // Adjust the top padding to control the height
    paddingBottom: '2px',
    justifyContent: 'flex-end',
  }));

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div
      ref={drawerHostRef}
      style={{
        width: drawerWidth,
        height: '100%',
        margin: '0px'
      }}
    >
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerOpen}
        edge="start"
        sx={{
          position: 'absolute',
          top: 1,
          left: 2,
          zIndex: 1000, // Add this line to set the z-index of the IconButton
          mr: 0, ...(isDrawerOpen && { display: 'none' })
        }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',

            position: 'fixed',
            top: `${drawerTop}px`,
            left: 2,

            height: `calc(100vh - ${drawerTop}px)`,
            maxHeight: `calc(100vh - ${drawerTop}px)`,

            overflowY: 'auto',
            overflowX: 'hidden',

            fontFamily: SIDEBAR_FONT,
            color: SIDEBAR_COLORS.text,

            '& .MuiButton-root': {
              fontFamily: SIDEBAR_FONT,
            },

            '& .MuiToggleButton-root': {
              fontFamily: SIDEBAR_FONT,
            },

            '& .MuiInputBase-root': {
              fontFamily: SIDEBAR_FONT,
            },

            '& .MuiInputLabel-root': {
              fontFamily: SIDEBAR_FONT,
            },

            '& .MuiChip-label': {
              fontFamily: SIDEBAR_FONT,
            },
          },
          position: 'relative',
          height: '100%',
          maxHeight: '100%',
          alignSelf: 'stretch',
          zIndex: 1
        }}
        variant="persistent"
        anchor="left"
        open={isDrawerOpen}
      >
        {homepage ? (
          sidebarTopContent
        ) : (
          <Box
            sx={{
              padding: '8px 10px 6px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              gap: '6px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setIsAIExpanded(false);
                setIsTrackChangesExpanded(true);
              }}
              sx={{
                height: '30px',
                minWidth: 0,
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Track Changes
            </Button>

            <input
              ref={workflowUploadInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleWorkflowUpload}
            />

            <Button
              variant="outlined"
              fullWidth
              onClick={() => workflowUploadInputRef.current?.click()}
              sx={{
                height: '30px',
                minWidth: 0,
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Upload Workflow
            </Button>
          </Box>
        )}

        <DrawerHeader>
          <Tooltip
            title="Track Changes"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -14],
                    },
                  },
                ],
              },
            }}
          >
            <IconButton
              onClick={() => {
                setIsAIExpanded(false);
                setIsTrackChangesExpanded(true);
              }}
            >
              <TrackChangesIcon />
            </IconButton>
          </Tooltip>

          <Tooltip
            title="Take snapshot"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -14],
                    },
                  },
                ],
              },
            }}>
            <IconButton onClick={downloadHeatmap}>
              <PhotoCameraIcon />
            </IconButton>

          </Tooltip>
          <Tooltip
            title="Download Matrix"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -14],
                    },
                  },
                ],
              },
            }}>
            <IconButton onClick={downloadMatrix}>
              <DownloadIcon />
            </IconButton>

          </Tooltip>
          {
            cropBox ?
              <IconButton onClick={setFilteredIdxDict} >
                <ReplayIcon />
              </IconButton> :
              <Tooltip
                title="Crop Mode"
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, -14],
                        },
                      },
                    ],
                  },
                }}>
                <IconButton onClick={setCropping} >
                  <CropIcon />
                </IconButton>

              </Tooltip>
          }
          {/* ✅ NEW: Toggle Minimap Button */}
          <Tooltip
            title="Toggle Minimap"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, -14],
                    },
                  },
                ],
              },
            }}
          >
            <IconButton onClick={() => setIsMinimapEnabled(!isMinimapEnabled)}>
              <MapIcon color={isMinimapEnabled ? "primary" : "action"} />
            </IconButton>
          </Tooltip>

          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        <div
          style={{
            marginLeft: '10px',
            marginRight: '10px',
            marginTop: '4px',
            marginBottom: '6px'
          }}
        >
          <ToggleButton
            value="transpose"
            selected={matrixOrientation === 'Transposed'}
            fullWidth
            size="small"
            onClick={() => {
              setMatrixOrientation((prev) =>
                prev === 'Transposed' ? 'Original' : 'Transposed'
              );
            }}
            sx={{
              ...sidebarControlText,
              height: '30px',
              width: '100%',

              color: '#1976d2',
              backgroundColor: '#ffffff',
              borderColor: '#bdbdbd',
              borderRadius: '6px',

              transition:
                'background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease',

              '&:hover': {
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                borderColor: '#64B5F6',
              },

              '&.Mui-selected': {
                backgroundColor: '#1976d2',
                color: '#ffffff',
                borderColor: '#1976d2',

                '&:hover': {
                  backgroundColor: '#1565c0',
                  color: '#ffffff',
                  borderColor: '#1565c0',
                },
              },
            }}
          >
            Transpose
          </ToggleButton>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginLeft: '10px',
            marginRight: '10px',
            //marginTop: '10px',
            marginBottom: '6px'
          }}
        >
          <Button
            size="small"
            variant="outlined"
            fullWidth
            disabled={!canUndo}
            onClick={onUndo}
            sx={{
              ...sidebarControlText,
              height: '32px',
              color: SIDEBAR_COLORS.primary,
              borderColor: SIDEBAR_COLORS.border,

              '&:hover': {
                borderColor: SIDEBAR_COLORS.primary,
                backgroundColor: '#e3f2fd',
              },

              '&.Mui-disabled': {
                color: SIDEBAR_COLORS.disabled,
                borderColor: '#e0e0e0',
              },
            }}
          >
            Undo ↺
          </Button>

          <Button
            size="small"
            variant="outlined"
            fullWidth
            disabled={!canRedo}
            onClick={onRedo}
            sx={{
              ...sidebarControlText,
              height: '32px',
              color: SIDEBAR_COLORS.primary,
              borderColor: SIDEBAR_COLORS.border,

              '&:hover': {
                borderColor: SIDEBAR_COLORS.primary,
                backgroundColor: '#e3f2fd',
              },

              '&.Mui-disabled': {
                color: SIDEBAR_COLORS.disabled,
                borderColor: '#e0e0e0',
              },
            }}
          >
            Redo ↻
          </Button>
        </div>

        {colCategorynames.length > 0 &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <MultiSelect
              elements={colCategorynames}
              order={order}
              setOrder={setOrderWithUndo}
              axis='col'
              onSelectionChange={onMetadataSelectionChange}
            />
          </div>}

        {rowCategorynames.length > 0 &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <MultiSelect
              elements={rowCategorynames}
              order={order}
              setOrder={setOrderWithUndo}
              axis='row'
              onSelectionChange={onMetadataSelectionChange}
            />
          </div>}

        <div
          style={{
            marginLeft: '10px',
            marginTop: '4px',
            marginRight: '10px',
            display: 'flex',
            flexDirection: 'row',
            gap: '6px',
            alignItems: 'flex-start'
          }}
        >
          <div
            style={{
              width: '50%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
          >
            <h3
              style={{
                ...sidebarSectionLabelStyle,
                textAlign: 'center',
                width: '100%',
                marginBottom: '0px'
              }}
            >
              Row Order
            </h3>

            <ListComponent
              selectedIndex={ORDER_INDEX[displayedRowOrder]}
              handleItemClick={handleRowItemClick}
            />
          </div>

          <div
            style={{
              width: '50%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start'
            }}
          >
            <h3
              style={{
                ...sidebarSectionLabelStyle,
                textAlign: 'center',
                width: '100%',
                marginBottom: '0px'
              }}
            >
              Column Order
            </h3>

            <ListComponent
              selectedIndex={ORDER_INDEX[displayedColOrder]}
              handleItemClick={handleColItemClick}
            />
          </div>
        </div>

        {/* Cluster depth controls */}
        {(displayedRowOrder === 'cluster' ||
          displayedColOrder === 'cluster') && (
            <div
              style={{
                marginLeft: '10px',
                marginRight: '10px',
                marginTop: '1px',
                marginBottom: '1px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >

              {displayedRowOrder === 'cluster' && (
                <div>
                  <div
                    style={{
                      ...sidebarSectionLabelStyle,
                      marginBottom: '3px'
                    }}
                  >
                    Row Cluster Depth
                  </div>

                  <CustomSlider
                    setClusterValue={
                      isTransposed
                        ? setColClusterValue
                        : setRowClusterValue
                    }
                    clusterValue={
                      isTransposed
                        ? colClusterValue
                        : rowClusterValue
                    }
                    onInteractionStart={onSliderInteractionStart}
                    onInteractionEnd={onRowClusterDepthInteractionEnd}
                  />
                </div>
              )}

              {displayedColOrder === 'cluster' && (
                <div>
                  <div
                    style={{
                      ...sidebarSectionLabelStyle,
                      marginBottom: '3px'
                    }}
                  >
                    Column Cluster Depth
                  </div>

                  <CustomSlider
                    setClusterValue={
                      isTransposed
                        ? setRowClusterValue
                        : setColClusterValue
                    }
                    clusterValue={
                      isTransposed
                        ? rowClusterValue
                        : colClusterValue
                    }
                    onInteractionStart={onSliderInteractionStart}
                    onInteractionEnd={onColumnClusterDepthInteractionEnd}
                  />
                </div>
              )}

            </div>
          )}
        {featureLabels && (
          <SearchBox
            elements={featureLabels}
            setSearchTerm={setSearchTerm}
          />
        )}
        <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '4px', marginBottom: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h3 style={sidebarSectionLabelStyle}>
            Opacity Slider
          </h3>
          <MultipurposeSlider
            direction='horizontal'
            setOpacityValue={setOpacityValue}
            value={opacityValue}
            minVal={0.5}
            maxVal={3}
            step={0.25}
            initialVal={1}
            onInteractionStart={onSliderInteractionStart}
            onInteractionEnd={onOpacityInteractionEnd}
          />
          {/* <MultipurposeSlider direction='horizontal' setOpacityValue={setOpacityValue} minVal={0} maxVal={1} step={0.05} initialVal={0.05} calculateSteps={true}/> */}
        </div>

        <div
          style={{
            marginLeft: '10px',
            marginRight: '10px',
            marginTop: '7px',
            marginBottom: '5px'
          }}
        >
          <h3
            style={{
              ...sidebarSectionLabelStyle,
              margin: 0,
              marginBottom: '3px'
            }}
          >
            Z-score normalization
          </h3>

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={zScoreAxis}
            onChange={(_, value) => {
              if (value !== null) {
                onZScoreAxisChange(value);
              }
            }}
            sx={{
              '& .MuiToggleButton-root': {
                height: '27px',
                minHeight: '27px',
                padding: '2px 6px',
                fontSize: '10.5px',
                textTransform: 'none'
              }
            }}
          >
            <ToggleButton value="row">
              By Row
            </ToggleButton>

            <ToggleButton value="col">
              By Column
            </ToggleButton>
          </ToggleButtonGroup>

          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h3
              style={{
                ...sidebarSectionLabelStyle,
                margin: 0
              }}
            >
              Re-z-score filtered subset
            </h3>

            <Switch
              size="small"
              checked={reZscoreFilteredSubset}
              onChange={(e) =>
                onReZscoreToggle(e.target.checked)
              }
            />
          </div>

          <div
            style={{
              marginTop: '1px',
              marginBottom: '0px',
              fontSize: '9px',
              lineHeight: 1.2,
              color: '#777'
            }}
          >
            OFF preserves normalization from the full matrix.
          </div>
        </div>

        {['olinkHeatmap', 'cytofHeatmap', 'serologyHeatmap', 'rnaseqHeatmap'].includes(ID) && setPvalThreshold &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <h3 style={{ ...sidebarSectionLabelStyle, marginBottom: '2px' }}>
              P-value Slider
            </h3>
            <MultipurposeSlider
              direction='horizontal'
              setOpacityValue={setPvalThreshold}
              value={pvalThreshold}
              minVal={0}
              maxVal={1}
              step={0.05}
              initialVal={0.05}
              calculateSteps={true}
              onInteractionStart={onSliderInteractionStart}
            />
          </div>
        }

        {/* <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h3 style={sidebarSectionLabelStyle}>
            Matrix Values Legend
          </h3>
        </div>
        <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '0px', marginBottom: '5px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {Legend}
        </div> */}

        {/* 🆕 ADD FILTERS SECTION HERE */}
        <FiltersSection
          filters={filters}
          setFilters={setFilters}
          onRenderHeatmap={onRenderHeatmap}
          onGuiClearFiltersRequest={onGuiClearFiltersRequest}
          onGuiRemoveFiltersRequest={onGuiRemoveFiltersRequest}
        />

        {isTrackChangesExpanded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1600,
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              padding: '16px 10px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setIsTrackChangesExpanded(false);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                cursor: 'pointer',
                width: 'fit-content',
                color: SIDEBAR_COLORS.text,

                '&:hover': {
                  color: SIDEBAR_COLORS.primary,
                },
              }}
            >
              <IconButton
                size="small"
                aria-label="Back to controls"
                sx={{
                  pointerEvents: 'none',
                  color: 'inherit',
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>

              <span
                style={{
                  fontFamily: SIDEBAR_FONT,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'inherit',
                }}
              >
                Back to controls
              </span>
            </Box>

            <div
              style={{
                display: 'flex',
                gap: '6px',
                marginTop: '-6px',
                marginBottom: '10px'
              }}
            >
              <Button
                size="small"
                variant="outlined"
                fullWidth
                disabled={!canUndo}
                onClick={onUndo}
                sx={{
                  ...sidebarControlText,
                  height: '32px',
                  color: SIDEBAR_COLORS.primary,
                  borderColor: SIDEBAR_COLORS.border,

                  '&:hover': {
                    borderColor: SIDEBAR_COLORS.primary,
                    backgroundColor: '#e3f2fd',
                  },

                  '&.Mui-disabled': {
                    color: SIDEBAR_COLORS.disabled,
                    borderColor: '#e0e0e0',
                  },
                }}
              >
                Undo ↺
              </Button>

              <Button
                size="small"
                variant="outlined"
                fullWidth
                disabled={!canRedo}
                onClick={onRedo}
                sx={{
                  ...sidebarControlText,
                  height: '32px',
                  color: SIDEBAR_COLORS.primary,
                  borderColor: SIDEBAR_COLORS.border,

                  '&:hover': {
                    borderColor: SIDEBAR_COLORS.primary,
                    backgroundColor: '#e3f2fd',
                  },

                  '&.Mui-disabled': {
                    color: SIDEBAR_COLORS.disabled,
                    borderColor: '#e0e0e0',
                  },
                }}
              >
                Redo ↻
              </Button>
            </div>

            <Button
              size="small"
              variant="contained"
              fullWidth
              disabled={activeWorkflowActions.length === 0}
              onClick={handleDownloadWorkflow}
              sx={{
                ...sidebarControlText,
                height: '32px',
                marginBottom: '10px',
                textTransform: 'none',
              }}
            >
              Download Workflow
            </Button>

            <div
              style={{
                ...sidebarSectionLabelStyle,
                marginTop: '4px',
                marginBottom: '8px',
              }}
            >
              Track Changes
            </div>

            {activeWorkflowActions.length === 0 ? (
              <div
                style={{
                  fontFamily: SIDEBAR_FONT,
                  fontSize: '12px',
                  color: SIDEBAR_COLORS.text,
                }}
              >
                No changes yet
              </div>
            ) : (
              <ol
                style={{
                  margin: 0,
                  paddingLeft: '22px',
                }}
              >
                {activeWorkflowActions.map(action => (
                  <li
                    key={action.id}
                    style={{
                      fontFamily: SIDEBAR_FONT,
                      fontSize: '12px',
                      color: SIDEBAR_COLORS.text,
                      marginBottom: '6px',
                      lineHeight: 1.35,
                    }}
                  >
                    {action.label}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {isWorkflowReviewOpen && uploadedWorkflow && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1700,
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              padding: '16px 10px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setIsWorkflowReviewOpen(false);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                cursor: 'pointer',
                width: 'fit-content',
                color: SIDEBAR_COLORS.text,

                '&:hover': {
                  color: SIDEBAR_COLORS.primary,
                },
              }}
            >
              <IconButton
                size="small"
                aria-label="Back to controls"
                sx={{
                  pointerEvents: 'none',
                  color: 'inherit',
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>

              <span
                style={{
                  fontFamily: SIDEBAR_FONT,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'inherit',
                }}
              >
                Back to controls
              </span>
            </Box>

            <Divider
              sx={{
                marginTop: '-4px',
                marginBottom: '10px',
              }}
            />

            <div
              style={{
                ...sidebarSectionLabelStyle,
                color: SIDEBAR_COLORS.text,
                fontWeight: 550,
                marginBottom: '4px',
              }}
            >
              Workflow Review
            </div>

            {uploadedWorkflowPreflight.recipeIssues.map(
              (issue, index) => (
                <div
                  key={`${issue.code}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    padding: '8px',
                    marginBottom: '10px',
                    border: '1px solid #ef9a9a',
                    borderRadius: '6px',
                    backgroundColor: '#ffebee',
                    fontFamily: SIDEBAR_FONT,
                    fontSize: '12px',
                    color: '#b71c1c',
                    lineHeight: 1.35,
                  }}
                >
                  <BlockIcon
                    sx={{
                      fontSize: 16,
                      marginTop: '1px',
                      flexShrink: 0,
                    }}
                  />

                  <span>{issue.message}</span>
                </div>
              )
            )}

            <div
              style={{
                fontFamily: SIDEBAR_FONT,
                fontSize: '12px',
                color: SIDEBAR_COLORS.secondaryText,
                marginBottom: '10px',
              }}
            >
              {/* Total */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '7px',
                  fontWeight: 500,
                }}
              >
                <FormatListNumberedIcon
                  sx={{
                    fontSize: 18,
                    color: '#616161',
                  }}
                />
                {uploadedWorkflow.actions.length} Total Steps Detected
              </div>

              {/* Two-column summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr',
                  columnGap: '5px',
                  rowGap: '5px',
                }}
              >
                {/* Left: Ready */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 16,
                      color: '#2e7d32',
                    }}
                  />
                  {uploadedWorkflowReadyCount} Ready
                </div>

                {/* Right: Included */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckBoxIcon
                    sx={{
                      fontSize: 16,
                      color: '#1976d2',
                    }}
                  />
                  {uploadedWorkflowIncludedCount} Included
                </div>

                {/* Left: Needs Resolution */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <ErrorOutlineIcon
                    sx={{
                      fontSize: 16,
                      color: '#ed6c02',
                    }}
                  />
                  {uploadedWorkflowNeedsResolutionCount} Need Resolution
                </div>

                {/* Right: Excluded */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckBoxOutlineBlankIcon
                    sx={{
                      fontSize: 16,
                      color: '#757575',
                    }}
                  />
                  {uploadedWorkflowExcludedCount} Excluded
                </div>

                {/* Left: Blocked */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    gridColumn: '1',
                  }}
                >
                  <BlockIcon
                    sx={{
                      fontSize: 16,
                      color: '#d32f2f',
                    }}
                  />
                  {uploadedWorkflowBlockedCount} Blocked
                </div>

                {/* Right: Modified */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <EditOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: '#1976d2',
                    }}
                  />
                  {uploadedWorkflowModifiedCount} Modified
                </div>

                {/* Left: Unresolved */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    gridColumn: '1',
                  }}
                >
                  <ErrorOutlineIcon
                    sx={{
                      fontSize: 16,
                      color: '#d32f2f',
                    }}
                  />
                  {uploadedWorkflowUnresolvedCount} Unresolved
                </div>
              </div>
            </div>

            <Divider
              sx={{
                marginTop: '6px',
                marginBottom: '6px',
              }}
            />

            <ol
              style={{
                margin: 0,
                paddingLeft: '22px',
              }}
            >
              {uploadedWorkflow.actions.map((action, index) => {
                const step = uploadedWorkflowValidatedSteps[index];
                const included =
                  step?.included ?? true;

                const validation =
                  step?.validation;

                const includedMeta =
                  getIncludedMeta(included);

                const validationMeta =
                  getValidationMeta(validation?.status);

                return (
                  <li
                    key={action.id}
                    style={{
                      fontFamily: SIDEBAR_FONT,
                      fontSize: '12px',
                      color: SIDEBAR_COLORS.text,
                      marginBottom: '2px',
                      lineHeight: 1.35,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 500,
                        wordBreak: 'break-word',
                      }}
                    >
                      {action.label}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {renderStatusPill(validationMeta)}
                        {renderStatusPill(includedMeta)}
                      </div>

                      <Checkbox
                        size="small"
                        checked={included}
                        onChange={(event) => {
                          const nextIncluded =
                            event.target.checked;

                          setUploadedWorkflowSteps(prev =>
                            prev.map(step =>
                              step.originalAction.id === action.id
                                ? {
                                  ...step,
                                  included: nextIncluded
                                }
                                : step
                            )
                          );
                        }}
                        icon={
                          <CheckBoxOutlineBlankIcon
                            sx={{
                              color: '#1976d2',
                              fontSize: 22
                            }}
                          />
                        }
                        checkedIcon={
                          <CheckBoxIcon
                            sx={{
                              color: '#1976d2',
                              fontSize: 22
                            }}
                          />
                        }
                        sx={{
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    {validation?.issues?.length > 0 && (
                      <div
                        style={{
                          marginTop: '6px',
                          paddingLeft: '2px',
                        }}
                      >
                        {validation.issues.map(
                          (issue, issueIndex) => (
                            <div
                              key={`${action.id}-issue-${issueIndex}`}
                              style={{
                                fontSize: '10.5px',
                                color:
                                  validation.status === 'blocked'
                                    ? '#c62828'
                                    : '#9a6700',
                                lineHeight: 1.35,
                                marginBottom: '6px',
                              }}
                            >
                              <div>
                                • {issue.message}
                              </div>

                              {issue.dependsOnActionId && (() => {
                                const dependencyIndex =
                                  uploadedWorkflow.actions.findIndex(
                                    workflowAction =>
                                      workflowAction.id ===
                                      issue.dependsOnActionId
                                  );

                                if (dependencyIndex < 0) {
                                  return null;
                                }

                                return (
                                  <div
                                    style={{
                                      marginTop: '2px',
                                      fontSize: '10px',
                                      color: '#616161',
                                    }}
                                  >
                                    Depends on step {dependencyIndex + 1}
                                  </div>
                                );
                              })()}

                              {issue.parameter &&
                                issue.availableValues &&
                                issue.availableValues.length > 0 && (
                                  <Select
                                    size="small"
                                    displayEmpty
                                    value={(() => {
                                      const effectiveAction =
                                        step?.resolvedAction ??
                                        step?.originalAction;

                                      if (
                                        !effectiveAction ||
                                        !issue.parameter
                                      ) {
                                        return '';
                                      }

                                      const currentValue =
                                        issue.parameter === 'target'
                                          ? effectiveAction.target
                                          : effectiveAction.parameters[
                                          issue.parameter
                                          ];

                                      if (
                                        currentValue === undefined ||
                                        currentValue === null
                                      ) {
                                        return '';
                                      }

                                      const currentValueString =
                                        String(currentValue);

                                      return issue.availableValues?.includes(
                                        currentValueString
                                      )
                                        ? currentValueString
                                        : '';
                                    })()}
                                    onChange={(event) => {
                                      const selectedValue =
                                        event.target.value;

                                      const effectiveAction =
                                        step?.resolvedAction ??
                                        step?.originalAction;

                                      const currentValue =
                                        issue.parameter === 'target'
                                          ? effectiveAction?.target
                                          : effectiveAction?.parameters[
                                          issue.parameter
                                          ];

                                      let resolvedValue: unknown =
                                        selectedValue;

                                      if (typeof currentValue === 'boolean') {
                                        resolvedValue =
                                          selectedValue === 'true';
                                      } else if (
                                        typeof currentValue === 'number'
                                      ) {
                                        resolvedValue =
                                          Number(selectedValue);
                                      }

                                      handleWorkflowParameterResolution(
                                        action.id,
                                        issue.parameter,
                                        resolvedValue
                                      );
                                    }}
                                    sx={{
                                      marginTop: '4px',
                                      minWidth: '150px',
                                      height: '28px',
                                      fontSize: '11px',
                                      backgroundColor: '#ffffff',
                                    }}
                                  >
                                    <MenuItem
                                      value=""
                                      disabled
                                      sx={{ fontSize: '11px' }}
                                    >
                                      Select replacement...
                                    </MenuItem>

                                    {issue.availableValues.map(
                                      availableValue => (
                                        <MenuItem
                                          key={availableValue}
                                          value={availableValue}
                                          sx={{ fontSize: '11px' }}
                                        >
                                          {availableValue}
                                        </MenuItem>
                                      )
                                    )}
                                  </Select>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {step?.resolutionChanges?.length > 0 && (
                      <div
                        style={{
                          marginTop: '5px',
                          paddingLeft: '2px',
                          fontSize: '10.5px',
                          color: '#1976d2',
                          lineHeight: 1.4,
                        }}
                      >
                        {step.resolutionChanges.map(
                          (change, changeIndex) => (
                            <div
                              key={`${action.id}-resolution-${changeIndex}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginBottom: '2px',
                              }}
                            >
                              <EditOutlinedIcon
                                sx={{
                                  fontSize: 12,
                                  flexShrink: 0,
                                }}
                              />

                              <span>
                                {change.parameter}:{' '}
                                {String(change.originalValue)}
                                {' → '}
                                {String(change.resolvedValue)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            <Divider
              sx={{
                marginTop: '10px',
                marginBottom: '8px',
              }}
            />

            <Button
              size="small"
              variant="contained"
              fullWidth
              disabled={
                !uploadedWorkflowCanRun ||
                isImportedWorkflowRunning
              }
              onClick={(event) => {
                event.stopPropagation();

                if (
                  !uploadedWorkflowCanRun ||
                  isImportedWorkflowRunning
                ) {
                  return;
                }

                onRunImportedWorkflow?.(
                  uploadedWorkflowActionsToRun
                );
                setIsWorkflowReviewOpen(false);
                setIsTrackChangesExpanded(false);
              }}
              sx={{
                ...sidebarControlText,
                height: '32px',
                textTransform: 'none',

                '&.Mui-disabled': {
                  backgroundColor: '#e0e0e0',
                  color: SIDEBAR_COLORS.disabled,
                },
              }}
            >
              Run Workflow
            </Button>
          </div>
        )
        }

        {chatContent && (
          <div
            ref={aiPanelRef}
            style={
              isAIExpanded
                ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1500,
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                  padding: '16px 10px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }
                : {
                  marginLeft: '10px',
                  marginRight: '10px',
                  marginTop: '6px',
                  paddingTop: '0px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }
            }
          >

            {/* Back button only in expanded AI view */}
            {isAIExpanded && (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAIExpanded(false);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  width: 'fit-content',
                  color: SIDEBAR_COLORS.text,

                  '&:hover': {
                    color: SIDEBAR_COLORS.primary,
                  },
                }}
              >
                <IconButton
                  size="small"
                  aria-label="Back to controls"
                  sx={{
                    pointerEvents: 'none',
                    color: 'inherit',
                  }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>

                <span
                  style={{
                    fontFamily: SIDEBAR_FONT,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'inherit',
                  }}
                >
                  Back to controls
                </span>
              </Box>
            )}

            {isAIExpanded && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginLeft: '0px',
                  marginRight: '0px',
                  marginTop: '-6px',
                  marginBottom: '6px'
                }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  disabled={!canUndo}
                  onClick={onUndo}
                  sx={{
                    ...sidebarControlText,
                    height: '32px',
                    color: SIDEBAR_COLORS.primary,
                    borderColor: SIDEBAR_COLORS.border,

                    '&:hover': {
                      borderColor: SIDEBAR_COLORS.primary,
                      backgroundColor: '#e3f2fd',
                    },

                    '&.Mui-disabled': {
                      color: SIDEBAR_COLORS.disabled,
                      borderColor: '#e0e0e0',
                    },
                  }}
                >
                  Undo ↺
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  disabled={!canRedo}
                  onClick={onRedo}
                  sx={{
                    ...sidebarControlText,
                    height: '32px',
                    color: SIDEBAR_COLORS.primary,
                    borderColor: SIDEBAR_COLORS.border,

                    '&:hover': {
                      borderColor: SIDEBAR_COLORS.primary,
                      backgroundColor: '#e3f2fd',
                    },

                    '&.Mui-disabled': {
                      color: SIDEBAR_COLORS.disabled,
                      borderColor: '#e0e0e0',
                    },
                  }}
                >
                  Redo ↻
                </Button>
              </div>
            )}

            {/* ChatBox section */}
            <GlassChatSurface
              onClick={
                isAIExpanded
                  ? undefined
                  : () => setIsAIExpanded(true)
              }
              style={{
                cursor: isAIExpanded ? 'default' : 'pointer',
                paddingTop: isAIExpanded ? '10px' : '8px'
              }}
            >
              {chatContent(
                () => setIsAIExpanded(false),
                () => setIsMetadataGuideOpen(true),
                pendingGuideCommand,
                () => setPendingGuideCommand(null)
              )}
            </GlassChatSurface>

            {/* Metadata-Aware Command Guide */}
            <div
              style={{
                marginTop: '6px',
                marginBottom: '6px'
              }}
            >
              <GlassInteractive
                onClick={(e) => {
                  e.stopPropagation();

                  if (isMetadataGuideOpen) {
                    // ▲ Close the guide and return to normal controls
                    setIsMetadataGuideOpen(false);
                    setIsAIExpanded(false);
                  } else {
                    // ▼ Open the guide and enter the focused AI view
                    setIsMetadataGuideOpen(true);
                    setIsAIExpanded(true);
                  }
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: '42px',
                  padding: '8px 15px'
                }}
              >
                <span
                  style={{
                    fontFamily: SIDEBAR_FONT,
                    fontSize: '15px',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color: '#1976d2'
                  }}
                >
                  Metadata-Aware <br /> Command Guide
                </span>

                <ArrowDropDownIcon
                  className="metadata-guide-arrow"
                  sx={{
                    fontSize: '33px',
                    color: isMetadataGuideOpen
                      ? SIDEBAR_COLORS.primary
                      : SIDEBAR_COLORS.primary,

                    transform: isMetadataGuideOpen
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)',

                    transition: 'transform 160ms ease, color 160ms ease',
                  }}
                />
              </GlassInteractive>

              {isMetadataGuideOpen && (
                <GlassSurface
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: '6px',
                    maxHeight: isAIExpanded ? 'none' : '320px',
                    overflowY: isAIExpanded ? 'visible' : 'auto',
                    padding: '10px'
                  }}
                >
                  {Object.entries(metadataCommandGuide).map(
                    ([category, commands]) => (
                      <div
                        key={category}
                        style={{
                          marginBottom: '10px'
                        }}
                      >
                        <div
                          style={{
                            fontFamily: SIDEBAR_FONT,
                            fontSize: '10px',
                            fontWeight: 600,
                            color: SIDEBAR_COLORS.secondaryText,
                            textTransform: 'uppercase',
                            marginBottom: '4px'
                          }}
                        >
                          {category}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}
                        >
                          {commands.map((command, index) => (
                            <LiquidGlassCommandChip
                              type="button"
                              key={`${category}-${index}`}
                              onClick={(e) => {
                                e.stopPropagation();

                                setIsAIExpanded(true);
                                setPendingGuideCommand(command);
                              }}
                            >
                              {command}
                            </LiquidGlassCommandChip>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </GlassSurface>
              )}
            </div>
          </div>
        )}

        {/* previous line */}
        {/* {ID==='olinkPatientHeatmap' && setState &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['Zscore','Raw']} setState={setState} initialValue='Zscore' labelName='Value Scale'/>
        </div>} */}

        {['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap', 'rnaseqPatientHeatmap'].includes(ID) && setState &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <SimpleSelection elements={['Zscore', 'Raw']} setState={setState} initialValue='Zscore' labelName='Value Scale' />
          </div>}


        {['olinkHeatmap', 'cytofHeatmap', 'serologyHeatmap', 'rnaseqHeatmap'].includes(ID) && setResultCategory && resultCategories &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <SimpleSelection elements={resultCategories} setState={setResultCategory} initialValue={resultCategories[0]} labelName='Result Type' />
          </div>}
        {['olinkHeatmap', 'cytofHeatmap', 'serologyHeatmap', 'rnaseqHeatmap'].includes(ID) && setState &&
          <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <SimpleSelection elements={['logFC', 'nLogP']} setState={setState} initialValue='logFC' labelName='Value Type' />
          </div>
        }
        {/* <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['logFC','nLogP']} setState={setState} initialValue='logFC' labelName='Distance Type'/>
        </div> */}
      </Drawer>
    </div>
    // </div> 
  );
}