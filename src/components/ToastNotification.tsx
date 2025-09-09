// ToastNotification.tsx
import React from 'react';
import { Snackbar, Alert, AlertProps, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ToastNotificationProps {
  open: boolean;
  message: string;
  severity: AlertProps['severity'];
  onClose: () => void;
  duration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  duration = 3000 // Changed from 4000 to 3000
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        sx={{ width: '100%' }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;