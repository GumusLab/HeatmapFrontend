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
  CircularProgress
  //Alert,
  //Fade,
  //LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<{ success: boolean; message: string }>;
  commandHistory?: string[];
  rotatingGifUrl?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  disabled?: boolean;
  width?: string;
  onCommandRun?: () => void;
  onSuggestionsClose?: () => void;
  externalCommand?: string | null;
  onExternalCommandHandled?: () => void;
  colMetadataValues?: Record<string, string[]>;
  rowMetadataValues?: Record<string, string[]>;
  matrixOrientation?: string;
  backgroundColor?: string;
}

// interface SuggestionItem {
//   label: string;
//   command: string;
//   execute: boolean;
// }

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
  width = "100%",
  onCommandRun,
  onSuggestionsClose,
  externalCommand,
  onExternalCommandHandled,
  backgroundColor = 'transparent',
  colMetadataValues = {},
  rowMetadataValues = {},
  commandHistory = [],
  matrixOrientation = 'Original'
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suppressNextFocusSuggestionsRef = useRef(false);

  useEffect(() => {
    const historyMessages: ChatMessage[] = commandHistory
      .slice(-10)
      .reverse()
      .map((text, index) => ({
        id: `history-${commandHistory.length - 1 - index}`,
        text,
        timestamp: new Date(),
        status: 'success' as const
      }));

    setRecentMessages(historyMessages);
  }, [commandHistory]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsPanel(false); // Keep suggestions closed when clicking inside the chat container
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
  // useEffect(() => {
  //   const cleanup = setInterval(() => {
  //     const now = new Date();
  //     setRecentMessages(prev =>
  //       prev.filter(msg => {
  //         const messageAge = now.getTime() - msg.timestamp.getTime();
  //         return messageAge < 90000; // Keep messages for 90 seconds in state
  //       })
  //     );
  //   }, 5000); // Check every 5 seconds

  //   return () => clearInterval(cleanup);
  // }, []);

  const isTransposed =
    matrixOrientation === 'Transposed';

  const hasColMetadataValues =
    Object.keys(colMetadataValues).length > 0;

  const hasRowMetadataValues =
    Object.keys(rowMetadataValues).length > 0;

  const sampleMetadataSourceAxis: 'row' | 'col' | null =
    hasColMetadataValues && !hasRowMetadataValues
      ? 'col'
      : hasRowMetadataValues && !hasColMetadataValues
        ? 'row'
        : !hasColMetadataValues && !hasRowMetadataValues
          ? 'col'
          : null;

  const sampleMetadataValues =
    sampleMetadataSourceAxis === 'row'
      ? rowMetadataValues
      : sampleMetadataSourceAxis === 'col'
        ? colMetadataValues
        : {};

  const sampleMetadataDisplayAxis =
    sampleMetadataSourceAxis === null
      ? null
      : isTransposed
        ? sampleMetadataSourceAxis === 'row'
          ? 'columns'
          : 'rows'
        : sampleMetadataSourceAxis === 'row'
          ? 'rows'
          : 'columns';

  const dynamicFilterSuggestions = Object.entries(sampleMetadataValues)
    // Avoid PatientID-like fields with dozens/hundreds of values
    .filter(([_, values]) => values.length >= 2 && values.length <= 6)
    .flatMap(([metadata, values]) =>
      values.map(value => `Filter ${metadata} to ${value}`)
    )
    .slice(0, 6);

  const dynamicSortSuggestions =
    sampleMetadataDisplayAxis === null
      ? []
      : Object.keys(sampleMetadataValues)
        .slice(0, 3)
        .map(
          metadata =>
            `Sort ${sampleMetadataDisplayAxis} by ${metadata}`
        );

  // Suggestions based on meta-data and valid backend actions
  const suggestions = {
    filtering: [
      ...dynamicFilterSuggestions.slice(0, 2),
      "Clear all filters"
    ].slice(0, 3),

    selection: [
      "Select top 20 most variant features",
      "Select top 100 most variant features"
    ].slice(0, 3),

    sorting: [
      "Sort rows by variance",
      "Sort columns by sum",
      ...dynamicSortSuggestions
    ].slice(0, 3),

    clustering: [
      "Cluster rows",
      "Cluster columns"
    ].slice(0, 3),

    normalization: [
      "zscore: rows",
      "zscore: cols"
    ].slice(0, 3),

    distance: [
      "Use euclidean distance",
      "Use cosine distance",
      "Use correlation distance"
    ].slice(0, 3),

    linkage: [
      "Use average linkage",
      "Use complete linkage",
      "Use single linkage"
    ].slice(0, 3),

    search: [
      "Search for [gene/feature]"
    ],

    visualization: [
      "Make it dark",
      "Make it light",
      "Set opacity to 0.8"
    ].slice(0, 3)
  };

  const handleSendClick = async (
    messageOverride?: string,
    options: {
      collapsePanel?: boolean;
      reopenSuggestions?: boolean;
    } = {}
  ): Promise<void> => {

    const {
      collapsePanel = true,
      reopenSuggestions = true
    } = options;
    const command = (messageOverride ?? inputValue).trim();

    if (command && !disabled && !isProcessing) {
      // Collapse AI panel back to default sidebar
      if (collapsePanel) {
        onCommandRun?.();
      }
      const messageId = Date.now().toString();
      const newMessage: ChatMessage = {
        id: messageId,
        text: command,
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

        const result = await onSendMessage(command);

        // Success - use the actual feedback message from the handler
        //setCurrentStatus(result.message || 'Command executed successfully!');
        setCurrentStatus('');
        setRecentMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? {
                ...msg,
                status: result.success ? 'success' : 'error',
                response: result.success ? result.message : undefined,
                errorMessage: result.success ? undefined : result.message
              }
              : msg
          )
        );

        // Clear any existing timeout
        if (statusTimeoutId) {
          clearTimeout(statusTimeoutId);
        }

        // Clear success message after 3 seconds (increased from 2)
        // const timeoutId = setTimeout(() => setCurrentStatus(''), 1000);
        // setStatusTimeoutId(timeoutId);
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
        setShowSuggestionsPanel(reopenSuggestions);
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
    if (suggestion === "Search for [gene/feature]") {
      setInputValue("Search for ");
      setShowSuggestionsPanel(true);

      // switch from compact/default sidebar view to expanded suggestion view
      onCommandRun?.();

      // optional: focus cursor into input after opening
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      return;
    }

    setInputValue('');
    setShowSuggestionsPanel(false);
    void handleSendClick(suggestion);
  };

  useEffect(() => {
    if (!externalCommand) return;

    // Commands containing placeholders should NOT be sent to the backend.
    // Instead, place the partial command into the ChatBox.
    if (/\[[^\]]+\]/.test(externalCommand)) {
      const partialCommand = externalCommand
        .replace(/\[[^\]]+\]/g, '')
        .replace(/\s+/g, ' ')
        .trimEnd();

      setInputValue(`${partialCommand} `);

      // Keep Example Commands closed
      setShowSuggestionsPanel(false);

      // Prevent the automatic focus handler from reopening Example Commands
      suppressNextFocusSuggestionsRef.current = true;

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      onExternalCommandHandled?.();
      return;
    }

    // Complete commands execute immediately.
    // Keep focused AI view open and Example Commands closed.
    void handleSendClick(externalCommand, {
      collapsePanel: false,
      reopenSuggestions: false
    });

    onExternalCommandHandled?.();
  }, [externalCommand]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setInputValue(e.target.value);

    if (e.target.value !== '') {
      setShowSuggestionsPanel(true);
    }
  };

  const handleInputFocus = (): void => {
    if (suppressNextFocusSuggestionsRef.current) {
      suppressNextFocusSuggestionsRef.current = false;
      return;
    }

    if (showSuggestions && !isProcessing) {
      setShowSuggestionsPanel(true);
    }
  };

  const closeSuggestions = (): void => {
    setShowSuggestionsPanel(false);
    onSuggestionsClose?.();
  };

  // const closeStatusMessage = (): void => {
  //   if (statusTimeoutId) {
  //     clearTimeout(statusTimeoutId);
  //     setStatusTimeoutId(null);
  //   }
  //   setCurrentStatus('');
  // };

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
      {/* Chat Input */}
      <TextField
        inputRef={inputRef}
        id="outlined-basic"
        label={placeholder}
        variant="outlined"
        multiline={true}
        minRows={1}
        maxRows={5}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onFocus={handleInputFocus}
        fullWidth={true}
        disabled={disabled || isProcessing}
        sx={{
          backgroundColor,
          border: 'none',
          color: '#1976d2',



          '& .MuiOutlinedInput-root': {
            color: '#1976d2',
            backgroundColor,
            border: 'none',

          },

          // Remove the inner TextField border
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
            color: '#1976d2',

          },

          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            border: 'none',
            color: '#1976d2',
          },

          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: 'none',
            color: '#1976d2',
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                style={{ cursor: isProcessing ? "not-allowed" : "pointer" }}
                aria-label="send message"
                onClick={() => handleSendClick()}
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
          border: '0px transparent',
          overflow: 'visible',
          backgroundImage: rotatingGifUrl ? `url(${rotatingGifUrl})` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Recent messages panel - positioned higher to avoid overlap */}
      {recentMessages.length > 0 && !isProcessing && !currentStatus && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            overflow: 'hidden',

            border: '0px solid rgba(102,102,102,0.48)',
            borderRadius: '0 0 9px 9px',

            background: 'linear-gradient(135deg, rgba(255,255,255,0.78), rgba(235,247,255,0.58))',

            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',

            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 10px rgba(25,118,210,0.08)`,
          }}
        >
          {/* Header with clear all button */}
          <Box style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 12px',
            borderBottom: '1px solid #ddd',
            backgroundColor: "white"
          }}>
            <Typography variant="caption" style={{ fontSize: '11px', fontWeight: 600, color: '#555' }}>
              Recent Commands
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setRecentMessages([]);
              }}
              style={{ padding: '2px' }}
            >
              <CloseIcon style={{ fontSize: 12 }} />
            </IconButton>
          </Box>

          {/* Scrollable recent command list */}
          <Box
            style={{
              maxHeight: '86px',
              overflowY: recentMessages.length > 3 ? 'auto' : 'hidden',
            }}
          >
            {recentMessages.map((message) => (
              <Box
                key={message.id}
                style={{
                  height: '32px',
                  padding: '0 8px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxSizing: 'border-box'
                }}
              >
                {getStatusIcon(message.status)}

                <Typography
                  variant="caption"
                  style={{
                    flex: 1,
                    fontSize: '10px',
                    color: '#444',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {message.text}
                </Typography>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecentMessages(prev =>
                      prev.filter(msg => msg.id !== message.id)
                    );
                  }}
                  style={{ padding: '2px' }}
                >
                  <CloseIcon style={{ fontSize: 10, color: '#999' }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Paper>
      )
      }

      {/* Enhanced Suggestions Panel - only show when not processing and no status */}
      {/* Enhanced Suggestions Panel - centered and compact */}
      {
        showSuggestions && showSuggestionsPanel && !disabled && !isProcessing && !currentStatus && (
          <Paper
            ref={suggestionsRef}
            elevation={1}
            style={{
              width: "100%",
              minWidth: "0",
              maxWidth: "100%",
              boxSizing: "border-box",
              padding: "5px",
              marginTop: "4px",
              backgroundColor: "transparent",
              position: "relative",
              border: "1px solid #e0e0e0",
              borderRadius: "6px"
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
                fontSize: '12px',           // Slightly smaller,
                color: '#555',
              }}>
                Example Commands
              </Typography>
              <Box
                component="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeSuggestions();
                  onSuggestionsClose?.();
                }}
                sx={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  color: '#1976d2',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                For more
                <ArrowForwardIcon sx={{ fontSize: '12px' }} />
              </Box>
            </Box>

            {Object.entries(suggestions).map(([category, items]) => (
              <Box
                key={category}
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  width: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  style={{
                    fontWeight: 600,
                    color: '#666',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {category}
                </Typography>

                <Box
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    width: "100%"
                  }}
                >
                  {items.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestionClick(suggestion);
                      }}
                      size="small"
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        height: '24px',
                        boxShadow: 'none',

                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                        },

                        '&:active': {
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          boxShadow: 'none',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Paper>
        )
      }

      {/* Only show status while processing */}
      {
        isProcessing && (
          <Box
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CircularProgress size={16} />
              <Typography
                variant="caption"
                style={{ color: '#666', fontSize: '12px' }}
              >
                {currentStatus}
              </Typography>
            </Box>
          </Box>
        )
      }


    </Box >
  );
};

export default ChatBox;