export const LABEL_SCALE = 1;
export const BASE_ZOOM = 0; // Changed from 1 to 0 for proper centering calculations
export const MAX_ZOOM = 15;
export const DEFAULT_LABEL_OFFSET = 4;
export const DEFAULT_LABEL_MAX_SIZE = 10;
export const MIN_LABEL_CHARS = 10; //previously its value was 6 Osho  changed to 10
export const MONOSPACE_CHAR_WIDTH_PROPORTION = 0.7;
export const CELL_TO_LABEL_SIZE_PROPORTION = 0.75;
export const MAX_CATEGORIES = 3;
export const OPACITY = 1;
export const CATEGORY_LAYER_HEIGHT = 10;
export const INITIAL_GAP = 1;
export const LAYER_GAP = 1;
export const CLUSTER_LAYER_HEIGHT = 10;  // Height of cluster trapezoids (both row and column)
export const CLUSTER_LAYER_GAP = 2;      // Gap between last category layer and cluster layer
export const HEATMAP_PARENT_HEIGHT_RATIO = 90;
export const HEATMAP_PARENT_WIDTH_RATIO = 100;
export const HEATMAP_HEIGHT = 100;
export const HEATMAP_WIDTH = 97;
export const DEFAULT_LABEL_GAP = 2;
export const ORDER_INDEX:any = {
  "alphabetically":0,
  "cluster":1,
  "sum":2,
  "variance":3
}

export const COLOR_BLUE = "#1E90FF"

export const IDS = {
  VIEWS: {
    ROW_LABELS: 'row-labels-view',
    COL_LABELS: 'col-labels-view',
    HEATMAP_GRID: 'heatmap-grid-view',
    DEBUG: 'debug-view',
 },
  LAYERS: {
    ROW_LABELS: 'row-labels',
    COL_LABELS: 'col-labels',
    HEATMAP_GRID: 'heatmap-grid-layer',
    GENDER_LABELS: 'gender-labels',
  },
};

export const OLINK_PROTEIN_GENE_MAP:any = {"ADA": "ADA", "ADGRG1": "ADGRG1", "ANGPT1": "ANGPT1", "TIE2": "TEK", "ANGPT2": "ANGPT2", "ARG1": "ARG1", "CAIX": "CA9", "CASP-8": "CASP8", "MCP-4": "CCL13", "CCL17": "CCL17", "CCL19": "CCL19", "MCP-1": "CCL2", "CCL20": "CCL20", "CCL23": "CCL23", "CCL3": "CCL3", "CCL4": "CCL4", "MCP-3": "CCL7", "MCP-2": "CCL8", "CD27": "CD27", "CD40-L": "CD40LG", "CD70": "CD70", "CD83": "CD83", "CXCL10": "CXCL10", "CXCL11": "CXCL11", "CXCL13": "CXCL13", "CXCL5": "CXCL5", "CXCL9": "CXCL9", "CRTAM": "CRTAM", "DCN": "DCN", "FGF2": "FGF2", "CX3CL1": "CX3CL1", "Gal-1": "LGALS1", "Gal-9": "LGALS9", "GZMA": "GZMA", "GZMB": "GZMB", "GZMH": "GZMH", "HO-1": "HMOX1", "HGF": "HGF", "ICOSLG": "ICOSLG", "IFN-gamma": "IFNG", "IL-1-alpha": "IL1A", "IL10": "IL10", "IL12": "IL12A_IL12B", "IL12RB1": "IL12RB1", "IL13": "IL13", "IL15": "IL15", "IL18": "IL18", "IL2": "IL2", "IL33": "IL33", "IL4": "IL4", "IL5": "IL5", "IL6": "IL6", "IL7": "IL7", "IL8": "CXCL8", "KIR3DL1": "KIR3DL1", "LAG3": "LAG3", "LAMP3": "LAMP3", "CSF-1": "CSF1", "MUC-16": "MUC16", "CD244": "CD244", "KLRD1": "KLRD1", "NOS3": "NOS3", "PGF": "PGF", "PDGF subunit B": "PDGFB", "PTN": "PTN", "EGF": "EGF", "PD-L1": "CD274", "PD-L2": "PDCD1LG2", "PDCD1": "PDCD1", "CXCL12": "CXCL12", "CD4": "CD4", "CD5": "CD5", "CD8A": "CD8A", "CD28": "CD28", "TNF": "TNF", "TWEAK": "TNFSF12", "TNFSF14": "TNFSF14", "FASLG": "FASLG", "TNFRSF12A": "TNFRSF12A", "TNFRSF21": "TNFRSF21", "TNFRSF4": "TNFRSF4", "TNFRSF9": "TNFRSF9", "VEGFA": "VEGFA", "VEGFR-2": "KDR"}