import React, { useState, useEffect } from 'react';

// Types
interface Notification {
  id: number;
  timestamp: Date;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  autoHide?: boolean;
  action?: 'scroll' | string;
  actionText?: string;
}

interface NetworkNotificationHook {
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => number;
  removeNotification: (id: number) => void;
  notifyNetworkStarted: (clusterName: string) => number;
  notifyNetworkSuccess: (clusterName: string, nodeCount: number, originalCount: number) => number;
  notifyNetworkError: (error: string, clusterName: string) => number;
  notifyDataFetchError: (clusterName: string) => number;
}

interface NetworkNotificationSystemProps {
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string;
  onRemove: (id: number) => void;
  onActionClick: (targetSelector: string) => void; // ✅ Changed from onScrollToNetwork
  // onScrollToNetwork: () => void;
}

// Notification Hook
export const useNetworkNotifications = (): NetworkNotificationHook => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): number => {
    const id = Date.now();
    const newNotification: Notification = {
      id,
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration
    if (notification.autoHide !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
    
    return id;
  };

  const removeNotification = (id: number): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showLoading = (message: string = 'Processing...'): void => {
    setIsLoading(true);
    setLoadingMessage(message);
  };

  const hideLoading = (): void => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  // Network-specific notification methods
  const notifyNetworkStarted = (clusterName: string): number => {
    showLoading(`Creating network for cluster: ${clusterName}`);
    return addNotification({
      type: 'info',
      title: 'Network Generation Started',
      message: `Generating network visualization for cluster: ${clusterName}`,
      duration: 3000
    });
  };

//   const notifyNetworkSuccess = (clusterName: string, nodeCount: number): number => {
//     hideLoading();
//     return addNotification({
//       type: 'success',
//       title: 'Network Created Successfully! 🎉',
//       message: `Network with ${nodeCount} nodes created for cluster: ${clusterName}. Scroll down to view the network.`,
//       action: 'scroll',
//       actionText: 'View Network ↓',
//       autoHide: false
//     });
//   };

const notifyNetworkSuccess = (clusterName: string, nodeCount: number, originalCount?: number): number => {
    hideLoading();
    
    let message = `Network with ${nodeCount} nodes created for cluster: ${clusterName}.`;
    let notificationType: 'success' | 'warning' | 'info' = 'success';
    
    if (originalCount && originalCount > nodeCount) {
      const filteredOut = originalCount - nodeCount;
      const filterPercentage = (filteredOut / originalCount) * 100;
      
      if (nodeCount === 0) {
        // All genes filtered out
        notificationType = 'info';
        message = `All ${originalCount} genes from cluster: ${clusterName} were filtered out. You will see an empty network with no nodes or edges. Select some other cluster to view the network.`;
      } else {
        // Some genes filtered out
        message = `Network created for cluster: ${clusterName}. ${nodeCount} of ${originalCount} genes passed filtering (${filteredOut} genes filtered out).`;
        
        // Show warning if more than 50% of genes were filtered
        if (filterPercentage > 50) {
          notificationType = 'warning';
          message += ` Note: ${filterPercentage.toFixed(0)}% of genes were filtered out.`;
        }
      }
    }
    
    if (nodeCount > 0) {
      message += ' Scroll down to view the network.';
    } else {
      message += ' Scroll down to see the empty network visualization.';
    }
    
    // Determine title based on outcome
    let title = 'Network Created Successfully! 🎉';
    if (nodeCount === 0) {
      title = 'Empty Network Created 📊';
    } else if (notificationType === 'warning') {
      title = 'Network Created (Many Genes Filtered) ⚠️';
    }
    
    return addNotification({
      type: notificationType,
      title,
      message,
      action: 'scroll',
      actionText: nodeCount > 0 ? 'View Network ↓' : 'View Empty Network ↓',
      autoHide: false
    });
  };

  const notifyNetworkError = (error: string, clusterName: string): number => {
    hideLoading();
    return addNotification({
      type: 'error',
      title: 'Network Generation Failed ❌',
      message: `Failed to create network for cluster: ${clusterName}. ${error}`,
      duration: 8000
    });
  };

  const notifyDataFetchError = (clusterName: string): number => {
    hideLoading();
    return addNotification({
      type: 'error',
      title: 'Data Fetch Failed ⚠️',
      message: `Unable to fetch network data for cluster: ${clusterName}`,
      duration: 6000
    });
  };

  return {
    notifications,
    isLoading,
    loadingMessage,
    addNotification,
    removeNotification,
    notifyNetworkStarted,
    notifyNetworkSuccess,
    notifyNetworkError,
    notifyDataFetchError
  };
};

// Notification Component
export const NetworkNotificationSystem: React.FC<NetworkNotificationSystemProps> = ({ 
  notifications, 
  isLoading, 
  loadingMessage, 
  onRemove, 
  onActionClick
  // onScrollToNetwork 
}) => {
  const getNotificationStyle = (type: Notification['type']): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      top: isLoading ? '80px' : '20px',
      right: '20px',
      minWidth: '350px',
      maxWidth: '400px',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#d4edda', borderLeft: '4px solid #28a745', color: '#155724' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#f8d7da', borderLeft: '4px solid #dc3545', color: '#721c24' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', color: '#856404' };
      case 'info':
        return { ...baseStyle, backgroundColor: '#d1ecf1', borderLeft: '4px solid #17a2b8', color: '#0c5460' };
      default:
        return { ...baseStyle, backgroundColor: '#f8f9fa', borderLeft: '4px solid #6c757d', color: '#495057' };
    }
  };

  const loadingStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(2px)',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    zIndex: 2000,
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#1976d2'
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    backgroundColor: '#e0e0e0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '8px'
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    backgroundColor: '#1976d2',
    animation: 'progress 2s infinite linear'
  };

  // Add CSS animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .notification-close-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.7;
        transition: opacity 0.2s, background-color 0.2s;
      }
      .notification-close-btn:hover {
        opacity: 1;
        background-color: rgba(0,0,0,0.1);
      }
      .notification-action-btn {
        background: rgba(0,0,0,0.1);
        border: 1px solid rgba(0,0,0,0.2);
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        transition: background-color 0.2s;
        margin-top: 8px;
      }
      .notification-action-btn:hover {
        background: rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={loadingStyle}>
          <div style={{ fontSize: '20px' }}>🔄</div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{loadingMessage}</div>
            <div style={progressBarStyle}>
              <div style={progressFillStyle}></div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            ...getNotificationStyle(notification.type),
            top: `${(isLoading ? 100 : 20) + (index * 120)}px`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                {notification.title}
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                {notification.message}
              </div>
              
              {/* {notification.action === 'scroll' && (
                <button
                  className="notification-action-btn"
                  onClick={() => {
                    onScrollToNetwork();
                    onRemove(notification.id);
                  }}
                >
                  {notification.actionText || 'View Network'}
                </button>
              )} */}

            {notification.action && notification.action.startsWith('scrollTo:') && (
              <button
                className="notification-action-btn"
                onClick={() => {
                  // ✅ Get the target selector from the action string
                  const targetSelector = notification.action.split(':')[1];
                  if (targetSelector) {
                    onActionClick(targetSelector);
                  }
                  onRemove(notification.id);
                }}
              >
                {notification.actionText || 'View'}
              </button>
            )}
            </div>
            
            <button
              className="notification-close-btn"
              onClick={() => onRemove(notification.id)}
              style={{ marginLeft: '8px' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </>
  );
};