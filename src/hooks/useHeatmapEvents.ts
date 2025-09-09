import { AppNotificationHook } from './useAppNotifications'; // Adjust path

// The interface for the hook's return values remains the same.
interface HeatmapEventsHook {
  notifyDataLoading: () => void;
  notifyDataSuccess: (fileName: string) => void;
  notifyDataError: (errorMsg: string) => void;
  notifyClusteringStarted: () => void;
  notifyClusteringSuccess: () => void;
  notifySortStarted: (sortType: string, dimension: 'rows' | 'columns') => void;
  notifySortSuccess: (sortType: string, dimension: 'rows' | 'columns') => void;

}

// ✅ CHANGED: The hook now accepts the generic notification tools as arguments.
export const useHeatmapEvents = (
  { showLoading, hideLoading, addNotification }: AppNotificationHook
): HeatmapEventsHook => {

  // It no longer calls useAppNotifications() itself.

  const notifyDataLoading = () => {
    // It now uses the functions that were passed in from the parent.
    showLoading('Processing your data to generate the heatmap...');
  };

  const notifyDataSuccess = (fileName: string) => {
    hideLoading();
    addNotification({
      type: 'success',
      title: 'Heatmap Ready!',
      message: `Successfully processed ${fileName}. Your visualization is ready.`,
      duration: 4000
    });
  };
  
  const notifyDataError = (errorMsg: string) => {
    hideLoading();
    addNotification({
      type: 'error',
      title: 'Data Processing Failed',
      message: `There was an error processing your file: ${errorMsg}`,
      autoHide: false
    });
  };

    // Function to show the loading overlay for clustering
    const notifyClusteringStarted = () => {
        showLoading('Applying clustering and re-ordering heatmap...');
      };
    
      // Function to show a success pop-up after clustering
      const notifyClusteringSuccess = () => {
        hideLoading(); // Hide the main loading bar
        addNotification({
          type: 'success',
          title: 'Clustering Applied! 🔗',
          message: 'The heatmap has been re-ordered. You can now click on the new cluster dendrograms that appear on the axes to analyze specific groups.',
          autoHide: false, // Keep this helpful message on screen
        });
      };

// A generic function to show the loading overlay for any sort
  const notifySortStarted = (sortType: string, dimension: 'rows' | 'columns') => {
    showLoading(`Sorting ${dimension} by ${sortType}...`);
  };

  // A generic function to show a success pop-up after any sort
  const notifySortSuccess = (sortType: string, dimension: 'rows' | 'columns') => {
    hideLoading(); // Hide the main loading bar
    addNotification({
      type: 'success',
      title: 'Sort Complete!',
      message: `The heatmap ${dimension} have been successfully sorted by ${sortType}.`,
      duration: 4000
    });
  };
    

  // Return the set of specific functions
  return {
    notifyDataLoading,
    notifyDataSuccess,
    notifyDataError,
    notifyClusteringStarted,
    notifyClusteringSuccess,
    notifySortStarted,
    notifySortSuccess
  };
};