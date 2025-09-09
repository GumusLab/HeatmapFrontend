import { get, post } from './apiUtils';  // Adjust the path to where your post function is defined

export const processHeatmapData = async (data: File): Promise<any> => {

//   console.log('********* data is *******',data)
   // Use FileReader to read the content as text

  const formData = new FormData();
  formData.append('data', data);

  try {
    console.log('***** sending data to backend ******')
    const response = await post<any>('api/heatmapdata/process/', formData);
    console.log('***** response from backend ******',response)
    return response;
  } catch (error) {
    console.error('Error processing heatmap data:', error);
    throw error;
  }
};


/**
 * Process heatmap data with a specific imputation strategy after missing value analysis.
 * This is the second step in the two-phase workflow when missing values are detected.
 * 
 * @param sessionId The unique session ID returned from the initial data upload
 * @param strategy The imputation strategy to apply ('mean' | 'median' | 'mode' | 'forward_fill' | 'backward_fill' | 'drop')
 * @param parameters Optional object containing strategy-specific parameters
 * @returns Promise with the final processed heatmap data and clustering results
 */
export const processWithStrategy = async (
  sessionId: string, 
  strategy: string, 
  parameters?: any,
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('imputation_strategy', strategy);
    
    if (parameters) {
      formData.append('strategy_parameters', JSON.stringify(parameters));
    }

    const response = await post<any>('api/heatmapdata/process/', formData);
    console.log(`🔧 Data processed with ${strategy} imputation strategy`);
    return response;
  } catch (error) {
    console.error('Error processing with imputation strategy:', error);
    throw error;
  }
};



/**
 * Cleanup session on the backend by deleting the uploaded file.
 * @param sessionId The unique session ID returned from the backend.
 * @returns Promise<void>
 */
export const cleanupSession = async (sessionId: string): Promise<void> => {
  const data = { session_id: sessionId };
  
  try {
    await post<any>('api/heatmapdata/cleanup/', data);
    console.log(`🗑️ Session ${sessionId} cleaned up successfully.`);
  } catch (error) {
    console.error(`❌ Failed to clean up session ${sessionId}:`, error);
    // Even if cleanup fails, don't block the UI
  }
};


/**
 * Process an AI command for the heatmap visualization.
 * 
 * @param sessionId The unique session ID for the current heatmap data
 * @param command The natural language command from the user
 * @param currentState Object containing current filters, selections, and visualization state
 * @returns Promise with the processed data and command interpretation
 */
export const processHeatmapCommand = async (
  sessionId: string, 
  command: string,
  currentState?: {
    filters?: Record<string, any>; // Current applied filters
    selections?: Record<string, any>; // Current selections (e.g., selected genes, samples)
    clustering?: Record<string, any>; // Current clustering parameters
    visualParams?: Record<string, any>; // Current visualization parameters
    commandHistory?: string[]; // Optional: history of previous commands for context
  }
): Promise<any> => {
  try {
    const requestData = {
      session_id: sessionId,
      command: command,
      current_state: currentState || {
        filters: {},
        selections: {},
        clustering: {},
        visualParams: {},
        commandHistory: []
      }
    };
    
    const response = await post<any>('api/heatmapdata/command/', requestData);
    console.log(`🤖 Command processed: "${command}"`);
    return response;
  } catch (error) {
    console.error('Error processing heatmap command:', error);
    throw error;
  }
};

/**
 * Get correlation network data for specified nodes
 * 
 * @param sessionId The unique session ID for the current heatmap data
 * @param nodes Array of node names to create correlation network for
 * @param filters Object containing filters to select specific samples or genes
 * @returns Promise with the correlation network data
 */
export const getCorrelationNetwork = async (
  sessionId: string,
  nodes: string[],
  filters?:any
): Promise<any> => {
  try {
    const requestData = {
      sessionId: sessionId,
      geneIds: nodes,
      filters: filters || {
        correlationThreshold: 0.5,
        samples: [],
        genes: [],
        sampleFilters: {},
        geneFilters: {}
      }
    };
    
    const response = await post<any>('api/heatmapdata/network-correlation/', requestData);
    console.log(`🌐 Network correlation data retrieved for ${nodes.length} nodes`);
    return response;
  } catch (error) {
    console.error('Error getting correlation network data:', error);
    throw error;
  }
};


/**
 * Get correlation network data for specified nodes
 * 
 * @param sessionId The unique session ID for the current heatmap data
 * @param filters Object containing filters to select specific samples or genes
 * @returns Promise with the correlation network data
 */
export const getRefreshHeatmap = async (
  sessionId: string,
  filters?:any
): Promise<any> => {
  try {
    const requestData = {
      sessionId: sessionId,
      filters: filters || {
        correlationThreshold: 0.5,
        samples: [],
        genes: [],
        sampleFilters: {},
        geneFilters: {}
      }
    };
    
    const response = await post<any>('api/heatmapdata/refresh-heatmap/', requestData);
    return response;
  } catch (error) {
    console.error('Error getting correlation network data:', error);
    throw error;
  }
};

/**
 * Load example dataset that's already processed and stored on the server
 * 
 * @param exampleId The ID of the example dataset (gene-expression, proteomics, immunogenomics)
 * @returns Promise with the processed example data ready for heatmap
 */
export const loadExampleData = async (exampleId: string): Promise<any> => {
  try {
    const requestData = { 
      example_id: exampleId
    };
    
    const response = await post<any>('api/heatmapdata/examples/load/', requestData);
    console.log(`📊 Example data loaded: ${exampleId}`);
    return response;
  } catch (error) {
    console.error(`Error loading example data ${exampleId}:`, error);
    throw error;
  }
};

/**
 * Get enrichment data for a list of genes from the backend.
 * 
 * @param genes An array of gene symbols to be analyzed.
 * @param sessionId The unique session ID (optional, for logging or context).
 * @returns Promise with the structured enrichment data from Enrichr.
 */
export const getEnrichmentData = async (
  genes: string[],
  sessionId?: string
): Promise<any> => {
  try {
    const requestData = {
      genes: genes,
      sessionId: sessionId, // Pass sessionId for potential logging on the backend
    };

    const response = await post<any>('api/heatmapdata/enrich/', requestData);
    console.log(`🔬 Enrichment data received for ${genes.length} genes.`);
    return response;
  } catch (error) {
    console.error('Error getting enrichment data:', error);
    throw error;
  }
};

/**
 * Fetches pre-computed global 3D coordinates for network visualization.
 * * @param sessionId The unique session ID for the current data.
 * @returns Promise with the status and global 3D positions data.
 */
export const get3DCoords = async (sessionId: string): Promise<any> => {
  try {
    // Assuming your backend endpoint is /api/get_3d_coords/<session_id>
    const response = await get<any>(`api/heatmapdata/get_3d_coords/${sessionId}`); 
    console.log(`🌐 3D coordinates status received for session ${sessionId}:`, response.status);
    return response;
  } catch (error) {
    console.error(`❌ Error fetching 3D coordinates for session ${sessionId}:`, error);
    throw error;
  }
};