import axios from 'axios';

const apiKey = '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';  // Replace with your actual API key

export const callChatGPT = async (userInput: string) => {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const requestBody = {
    model: "gpt-4o-mini",  // Use 'gpt-4-turbo' if available, or the specific model
    messages: [
      {
        role: 'system',
        content: 'You are an assistant that processes natural language queries related to heatmap visualization and returns structured JSON output. You handle the following actions: searching for markers, sorting rows or columns alphabetically, sorting by sum or variance, and clustering rows or columns. Provide output in the following JSON format: {"action": "[action_type]", "target": "[target]", "value": "[value]", "context": "heatmap"}.'
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    temperature: 0.0,  // Low temperature for predictable, structured responses
    max_tokens: 150    // Limit tokens to control cost
  };

  try {
    const response = await axios.post(apiUrl, requestBody, { headers });
    const structuredResponse = response.data.choices[0].message.content;
    console.log('Structured Response:', structuredResponse);
    return JSON.parse(structuredResponse);  // Return parsed JSON for the front end
  } catch (error) {
    console.error('Error calling GPT API:', error);
  }
};

// // Example usage:
// callChatGPT("search for PDL1 marker in my heatmap").then((response) => {
//   if (response) {
//     handleResponse(response);
//   }
// });
