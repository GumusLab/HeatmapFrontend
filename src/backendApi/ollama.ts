import axios from 'axios';
import {processHeatmapCommand} from "./heatmapData"

const OLLAMA_HOST = 'http://10.95.46.94:53880/';
const MODEL_NAME = 'tinyllama:latest';

// System prompt to enforce structured JSON responses
const SYSTEM_PROMPT = `You are an assistant that processes natural language queries related to heatmap visualization and returns structured JSON output.

You handle the following actions:
- Searching for markers
- Sorting rows or columns alphabetically
- Sorting by sum or variance
- Clustering rows or columns

Provide output in the following JSON format:
{
    "action": "[action_type]",
    "target": "[target]",
    "value": "[value]",
    "context": "heatmap"
}

Respond ONLY with valid JSON output and nothing else.`;

export interface PathwayResult {
    name: string;
    description: string;
    gene_count: number;
    library: string;
    match_reason: string;
  }
  
  export interface HeatmapResponse {
    action?: string;
    target?: string;
    value?: string;
    updated_filters?: any;
    clustering_result?: any;
    pathway_results?: PathwayResult[];
    distance?: string;  // For set_clustering action
    linkage?: string;   // For set_clustering action
    error?: string;
  }
  
  
// // Check if model exists
// async function isModelAvailable(model: string): Promise<boolean> {
//     try {
//         const response = await axios.get(`${OLLAMA_HOST}/v1/models`);
//         const models = response.data.data.map((m: any) => m.id);

//         console.log('******* all the models are as follows ************', models)
//         return models.includes(model);
//     } catch (error) {
//         console.error("Failed to check available models:", error);
//         return false;
//     }
// }

// Check if model exists using Fetch API
async function isModelAvailable(model: string): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_HOST}/v1/models`);
        if (!response.ok) {
            console.error("Failed to fetch models. Status:", response.status);
            return false;
        }

        const responseData = await response.json();
        const models = responseData.data.map((m: any) => m.id);

        console.log('******* all the models are as follows ************', models);
        return models.includes(model);
    } catch (error) {
        console.error("Failed to check available models:", error);
        return false;
    }
}


// Pull the model if it doesn't exist
async function pullModel(model: string): Promise<boolean> {
    try {
        console.log(`Pulling model: ${model}...`);
        await axios.post(`${OLLAMA_HOST}/api/pull`, { name: model });
        console.log(`Model ${model} pulled successfully.`);
        return true;
    } catch (error) {
        console.error("Failed to pull model:", error);
        return false;
    }
}

// Main function to query Ollama
// export async function queryOllama(userQuery: string): Promise<HeatmapResponse | { error: string }> {
//     try {

//         console.log('******** ollama request came with query as follows *****',userQuery)
//         const modelExists = await isModelAvailable(MODEL_NAME);


//         if (!modelExists) {
//             console.log(`Model ${MODEL_NAME} not found. Pulling now...`);
//             const pulled = await pullModel(MODEL_NAME);
//             if (!pulled) return { error: "Failed to download model" };
//         }

//         const response = await axios.post(`${OLLAMA_HOST}/v1/chat/completions`, {
//             model: MODEL_NAME,
//             messages: [
//                 { role: 'system', content: SYSTEM_PROMPT },
//                 { role: 'user', content: userQuery }
//             ],
//             stream: false
//         });

//         const content = response.data.choices[0].message.content.trim();

//         try {
//             return JSON.parse(content);
//         } catch (error) {
//             console.error("Invalid JSON in AI response:", content);
//             return { error: 'Invalid JSON response from Ollama' };
//         }
//     } catch (error) {
//         console.error("Failed to connect to Ollama:", error);
//         return { error: 'Failed to connect to Ollama' };
//     }
// }


// Main function to query Ollama
export async function queryOllama(
    userQuery: string,
    sessionId: string,
    filters: any,
    commandHistory: string[] = []
): Promise<HeatmapResponse | { error: string }> {
    try {
        // Send the user query as a "command" to processHeatmapCommand API
        const response = await processHeatmapCommand(sessionId, userQuery, {
            filters,
            commandHistory,
            selections: {},
            clustering: {},
            visualParams: {}
        });

        // Validate and parse response
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch (error) {
                console.error("Invalid JSON in AI response:", response);
                return { error: 'Invalid JSON response from backend' };
            }
        }

        return response;
    } catch (error) {
        console.error("Failed to process Ollama query:", error);
        const message = error instanceof Error ? error.message : 'Failed to process AI query';
        return { error: message };
    }
}