// https://medium.com/code-well-live-forever/dry-up-your-api-requests-b4337049a2c1
// handleError.js - Common Error Handler Function
export default (error: any) => {
  const { status, message } = error;
  switch (status) {
    case 401:
      // do something when you're unauthenticated
      console.error("Status 401, unauthenticated request");
      break;
    case 403:
      // do something when you're unauthorized to access a resource
      console.error("Status 403, unauthorized request");
      break;
    case 500:
      // do something when your server exploded
      console.error("Status 500, internal server error");
      break;
    default:
      // handle normal errors with some alert or whatever
      console.error("operation failed");
  }
  return message; // I like to get my error message back
};
