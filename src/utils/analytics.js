import ReactGA from 'react-ga4';

// Your Google Analytics Measurement ID
const TRACKING_ID = 'G-ZBT6X3PEEJ';

// Initialize Google Analytics
export const initializeGA = () => {
  ReactGA.initialize(TRACKING_ID, {
    debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
  });
};

// Track page views
export const trackPageView = (path) => {
  ReactGA.send({ 
    hitType: 'pageview', 
    page: path,
    title: document.title 
  });
};

// Track custom events
export const trackEvent = (category, action, label = null, value = null) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Track user interactions
export const trackUserInteraction = (action, details = {}) => {
  ReactGA.event({
    category: 'User Interaction',
    action,
    ...details,
  });
};

// Track heatmap interactions
export const trackHeatmapEvent = (action, details = {}) => {
  ReactGA.event({
    category: 'Heatmap',
    action,
    ...details,
  });
};

// Track file uploads
export const trackFileUpload = (fileType, fileSize = null) => {
  ReactGA.event({
    category: 'File Upload',
    action: 'Upload',
    label: fileType,
    value: fileSize,
  });
};

// Track analysis completion
export const trackAnalysisComplete = (analysisType, duration = null) => {
  ReactGA.event({
    category: 'Analysis',
    action: 'Complete',
    label: analysisType,
    value: duration,
  });
};

// Track errors
export const trackError = (errorType, errorMessage) => {
  ReactGA.event({
    category: 'Error',
    action: errorType,
    label: errorMessage,
  });
};

export default {
  initializeGA,
  trackPageView,
  trackEvent,
  trackUserInteraction,
  trackHeatmapEvent,
  trackFileUpload,
  trackAnalysisComplete,
  trackError,
}; 