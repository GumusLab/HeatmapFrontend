import axios from 'axios';

const OLLAMA_HOST = 'http://10.95.46.94:59908';
const MODEL_NAME = 'tinyllama';

// SYSTEM PROMPT for structured JSON response
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

// Type for valid responses
interface HeatmapResponse {
    action: string;
    target: string;
    value: string;
    context: string;
}

// Function to check if model exists
async function isModelAvailable(model: string): Promise<boolean> {
    try {
        const response = await axios.get(`${OLLAMA_HOST}/api/list`);
        const models = response.data.models.map((m: any) => m.name);
        return models.includes(model);
    } catch (error) {
        console.error("Failed to check available models:", error);
        return false;
    }
}

// Function to pull the model if not available
async function pullModel(model: string): Promise<boolean> {
    try {
        console.log(`Pulling model: ${model}...`);
        await axios.post(`${OLLAMA_HOST}/api/pull`, { name: model });
        console.log(`Model ${model} downloaded successfully.`);
        return true;
    } catch (error) {
        console.error("Failed to pull model:", error);
        return false;
    }
}

// Query Ollama function with model check
export async function queryOllama(userQuery: string): Promise<HeatmapResponse | { error: string }> {
    try {
        // Ensure model is available
        const modelExists = await isModelAvailable(MODEL_NAME);
        if (!modelExists) {
            console.log(`Model ${MODEL_NAME} not found, pulling it now...`);
            const pulled = await pullModel(MODEL_NAME);
            if (!pulled) {
                return { error: "Failed to download model" };
            }
        }

        // Now query the model
        const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
            model: MODEL_NAME,
            // messages: [
            //     { role: 'system', content: SYSTEM_PROMPT },
            //     { role: 'user', content: userQuery }
            // ],
            // stream: false
            messages: [
                { role: 'user', content: 'Why is the sky blue?' }
            ],
            stream: false
        });

        const responseData = response.data;
        console.log('******* response data is as follows ******')
        console.log(response)

        try {
            return JSON.parse(responseData.message.content);
        } catch (error) {
            return { error: 'Invalid JSON response' };
        }
    } catch (error) {
        return { error: 'Failed to connect to Ollama' };
    }
}
