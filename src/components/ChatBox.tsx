// Enhanced ChatInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Paper, 
  Typography, 
  Chip, 
  Box,
  CircularProgress,
  Alert,
  Fade,
  LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<{ success: boolean; message: string }>;
  rotatingGifUrl?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  disabled?: boolean;
  width?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'processing' | 'success' | 'error';
  response?: string;
  errorMessage?: string;
}

const ChatBox: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  rotatingGifUrl, 
  placeholder = "Chat with AI",
  showSuggestions = true,
  disabled = false,
  width = "100%"
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [statusTimeoutId, setStatusTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Refs for click outside detection
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatContainerRef.current && 
        !chatContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
      }
    };
  }, [statusTimeoutId]);

  // Auto-cleanup old messages after 30 seconds (keep more in memory)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setRecentMessages(prev => 
        prev.filter(msg => {
          const messageAge = now.getTime() - msg.timestamp.getTime();
          return messageAge < 30000; // Keep messages for 30 seconds in state
        })
      );
    }, 5000); // Check every 5 seconds

    return () => clearInterval(cleanup);
  }, []);

  // Default suggestions based on valid backend actions
  const suggestions = {
    filtering: ["Select males", "Select females", "Show dead patients"],
    selection: ["Select top 20 most variant genes", "Select top 100 variant rows"],
    sorting: ["Sort rows by variance", "Sort columns by sum", "Sort by sex"],
    clustering: ["Cluster the genes", "Cluster the rows", "Cluster columns"],
    normalization: ["zscore: rows", "zscore: cols"],
    distance: ["Use euclidean distance", "Use cosine distance", "Use correlation distance", "Use manhattan distance"],
    search: ["Search for C4BPA", "Find gene CCL2"],
    visualization: ["Make it dark", "Make it light", "Set opacity to 0.8"]
  };

  const handleSendClick = async (): Promise<void> => {
    if (inputValue.trim() && !disabled && !isProcessing) {
      const messageId = Date.now().toString();
      const newMessage: ChatMessage = {
        id: messageId,
        text: inputValue.trim(),
        timestamp: new Date(),
        status: 'sending'
      };

      // Add message to recent messages - store up to 10, but display only latest 3
      setRecentMessages(prev => [newMessage, ...prev.slice(0, 9)]); // Keep up to 10 in state
      setIsProcessing(true);
      setCurrentStatus('Sending command...');
      
      try {
        // Update status to processing
        setCurrentStatus('Processing your request...');
        setRecentMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'processing' }
              : msg
          )
        );

        const result = await onSendMessage(inputValue.trim());
        
        // Success - use the actual feedback message from the handler
        setCurrentStatus(result.message || 'Command executed successfully!');
        setRecentMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'success', response: result.message || 'Heatmap updated' }
              : msg
          )
        );

        // Clear any existing timeout
        if (statusTimeoutId) {
          clearTimeout(statusTimeoutId);
        }

        // Clear success message after 3 seconds (increased from 2)
        const timeoutId = setTimeout(() => setCurrentStatus(''), 3000);
        setStatusTimeoutId(timeoutId);
        
      } catch (error) {
        // Error handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setCurrentStatus('');
        setRecentMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'error', errorMessage }
              : msg
          )
        );
      } finally {
        setIsProcessing(false);
        setInputValue('');
        setShowSuggestionsPanel(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setInputValue(suggestion);
    setShowSuggestionsPanel(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
    // Only show suggestions when input is empty and user focuses
    if (e.target.value !== '') {
      setShowSuggestionsPanel(false);
    }
  };

  const handleInputFocus = (): void => {
    if (inputValue === '' && showSuggestions && !isProcessing) {
      setShowSuggestionsPanel(true);
    }
  };

  const closeSuggestions = (): void => {
    setShowSuggestionsPanel(false);
  };

  const closeStatusMessage = (): void => {
    if (statusTimeoutId) {
      clearTimeout(statusTimeoutId);
      setStatusTimeoutId(null);
    }
    setCurrentStatus('');
  };

  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
      case 'processing':
        return <CircularProgress size={16} />;
      case 'success':
        return <CheckCircleIcon style={{ color: '#4caf50', fontSize: 16 }} />;
      case 'error':
        return <ErrorIcon style={{ color: '#f44336', fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <Box ref={chatContainerRef} style={{ width, position: 'relative' }}>
      {/* Processing indicator and status messages - combined into one area */}
      {(isProcessing || (currentStatus && !isProcessing)) && (
        <Box style={{ 
          position: 'absolute', 
          top: '-60px', 
          width: '100%', 
          zIndex: 100,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {isProcessing ? (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircularProgress size={16} />
              <Typography variant="caption" style={{ color: '#666', fontSize: '12px' }}>
                {currentStatus}
              </Typography>
            </Box>
          ) : (
            <Fade in={true}>
              <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircleIcon style={{ color: '#4caf50', fontSize: 16 }} />
                  <Typography variant="caption" style={{ color: '#4caf50', fontSize: '12px' }}>
                    {currentStatus}
                  </Typography>
                </Box>
                {/* Close button for success messages */}
                <IconButton 
                  size="small" 
                  onClick={closeStatusMessage}
                  style={{ padding: '2px' }}
                >
                  <CloseIcon style={{ fontSize: 14, color: '#666' }} />
                </IconButton>
              </Box>
            </Fade>
          )}
        </Box>
      )}

      {/* Recent messages panel - positioned higher to avoid overlap */}
      {recentMessages.length > 0 && !isProcessing && !currentStatus && (
        <Paper 
          elevation={1}
          style={{
            position: 'absolute',
            bottom: '60px',
            width: '100%',
            maxHeight: '120px',
            overflow: 'auto',
            zIndex: 99,
            backgroundColor: 'rgba(255,255,255,0.95)'
          }}
        >
          {/* Header with clear all button */}
          <Box style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f5f5f5'
          }}>
            <Typography variant="caption" style={{ fontSize: '11px', fontWeight: 600, color: '#666' }}>
              Recent Commands
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setRecentMessages([])}
              style={{ padding: '2px' }}
            >
              <CloseIcon style={{ fontSize: 12 }} />
            </IconButton>
          </Box>

          {recentMessages.slice(0, 3).map((message) => ( // Only display latest 3 messages
            <Box 
              key={message.id}
              style={{ 
                padding: '8px 12px', 
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {getStatusIcon(message.status)}
              <Typography variant="caption" style={{ flex: 1, fontSize: '11px' }}>
                {message.text}
              </Typography>
              {message.status === 'error' && (
                <Typography variant="caption" style={{ color: '#f44336', fontSize: '10px' }}>
                  {message.errorMessage}
                </Typography>
              )}
              {/* Individual close button for each message */}
              <IconButton 
                size="small" 
                onClick={() => setRecentMessages(prev => prev.filter(msg => msg.id !== message.id))}
                style={{ padding: '2px' }}
              >
                <CloseIcon style={{ fontSize: 10, color: '#999' }} />
              </IconButton>
            </Box>
          ))}
        </Paper>
      )}

      {/* Chat Input */}
      <TextField
        id="outlined-basic"
        label={placeholder}
        variant="outlined"
        multiline={true}
        rows={1}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleInputFocus}
        fullWidth={true}
        disabled={disabled || isProcessing}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                style={{ cursor: isProcessing ? "not-allowed" : "pointer" }}
                aria-label="send message"
                onClick={handleSendClick}
                disabled={!inputValue.trim() || disabled || isProcessing}
              >
                {isProcessing ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        style={{
          backgroundImage: rotatingGifUrl ? `url(${rotatingGifUrl})` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Enhanced Suggestions Panel - only show when not processing and no status */}
   {/* Enhanced Suggestions Panel - centered and compact */}
   {showSuggestions && showSuggestionsPanel && inputValue === '' && !disabled && !isProcessing && !currentStatus && (
        <Paper 
          ref={suggestionsRef}
          elevation={3} 
          style={{
            width: "auto",               // Auto width instead of fixed
            minWidth: "400px",           // Minimum width
            maxWidth: "700px",           // Maximum width
            padding: "12px",             // Reduced from 16px
            backgroundColor: "#f8f9fa",
            position: "absolute",
            zIndex: 1000,
            bottom: "80px",              // More space above input
            left: "50%",                 // Center horizontally
            transform: "translateX(-50%)", // Perfect centering
            border: "1px solid #e0e0e0",
            borderRadius: "8px"
          }}
        >
          {/* Header with close button - more compact */}
          <Box style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'          // Reduced from 12px
          }}>
            <Typography variant="body2" style={{ 
              fontWeight: 600,
              fontSize: '13px'           // Slightly smaller
            }}>
              Type in commands to transform heatmap:
            </Typography>
            <IconButton 
              size="small" 
              onClick={closeSuggestions}
              style={{ padding: '2px' }}  // Reduced padding
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {Object.entries(suggestions).map(([category, items]) => (
            <Box key={category} style={{ 
              marginBottom: '8px',        // Reduced from 12px
              display: 'flex',
              alignItems: 'center',
              gap: '10px',               // Reduced from 12px
              flexWrap: 'nowrap',
              width: '100%'
            }}>
              <Typography variant="caption" style={{ 
                fontWeight: 600, 
                color: '#666', 
                textTransform: 'uppercase',
                fontSize: '11px',         // Reduced from 10px
                minWidth: '75px',        // Reduced from 80px
                whiteSpace: 'nowrap',
                textAlign: 'left'
              }}>
                {category}:
              </Typography>
              
              <Box style={{ 
                display: "flex", 
                flexWrap: "nowrap",
                gap: "4px",               // Reduced from 6px
                flex: 1,
                overflow: 'hidden'
              }}>
                {items.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#e3f2fd",
                      color: "#1976d2",
                      fontSize: "12px",    // Reduced from 10px
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      height: '24px'      // Consistent height
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default ChatBox;