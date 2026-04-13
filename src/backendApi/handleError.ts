// handleError.js - Common Error Handler Function
// Re-throws with a user-friendly message so callers can display it
export default (error: any) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
  let userMessage: string;

  switch (status) {
    case 401:
      userMessage = "Authentication required. Please log in and try again.";
      break;
    case 403:
      userMessage = "You don't have permission to perform this action.";
      break;
    case 404:
      userMessage = serverMessage || "The requested resource was not found on the server.";
      break;
    case 500:
      userMessage = serverMessage || "Internal server error. Please try again later.";
      break;
    case 503:
      userMessage = serverMessage || "Service unavailable. Please try again later.";
      break;
    default:
      if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        userMessage = "Cannot connect to the server. Please check that the backend is running.";
      } else {
        userMessage = serverMessage || error?.message || "An unexpected error occurred.";
      }
  }

  console.error(`API Error (${status || 'network'}):`, userMessage, error);

  // Re-throw so callers can catch and show notifications
  throw new Error(userMessage);
};
