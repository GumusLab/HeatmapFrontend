import { useState } from 'react';

// Types remain the same
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

// The Hook interface is now simpler and more generic
export interface AppNotificationHook {
  notifications: Notification[];
  isLoading: boolean;
  loadingMessage: string;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => number;
  removeNotification: (id: number) => void;
  showLoading: (message: string) => void;
  hideLoading: () => void;
}

export const useAppNotifications = (): AppNotificationHook => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // This core function remains the same
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>): number => {
    const id = Date.now();
    const newNotification: Notification = { id, timestamp: new Date(), ...notification };
    setNotifications(prev => [newNotification, ...prev]); // Prepend for visibility
    
    if (notification.autoHide !== false) {
      setTimeout(() => removeNotification(id), notification.duration || 7000);
    }
    return id;
  };

  const removeNotification = (id: number): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // These helpers are now exposed directly
  const showLoading = (message: string): void => {
    setIsLoading(true);
    setLoadingMessage(message);
  };

  const hideLoading = (): void => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  // ✅ The old, specific methods are removed.
  // The logic from them will be moved into HeatmapWrapper.

  return {
    notifications,
    isLoading,
    loadingMessage,
    addNotification,
    removeNotification,
    showLoading,
    hideLoading,
  };
};

// You should also rename NetworkNotificationSystem to AppNotificationSystem
// The component code itself doesn't need to change, just the name.
export { NetworkNotificationSystem as AppNotificationSystem } from '../components/NetworkNotificationSystem';