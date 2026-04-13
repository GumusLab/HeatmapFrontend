import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Filter {
  type: string;
  field?: string;
  value?: any;
  top_n?: number;
}

interface FiltersState {
  row: Filter[];
  col: Filter[];
}

interface FiltersSectionProps {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
  onRenderHeatmap: (currentFilters: FiltersState) => void; // Pass current filters directly
}

const FiltersSection: React.FC<FiltersSectionProps> = ({
  filters,
  setFilters,
  onRenderHeatmap
}) => {
  const [pendingFilters, setPendingFilters] = useState<FiltersState>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Update pending filters when original filters change (e.g., from chatbot)
  useEffect(() => {
    setPendingFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // Check if there are changes between current and pending filters
  useEffect(() => {
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(pendingFilters);
    setHasChanges(filtersChanged);
  }, [filters, pendingFilters]);

  // Format filter display text
  const formatFilterText = (filter: Filter): string => {
    switch (filter.type) {
      case 'sample_filter':
        return `${filter.field}: ${filter.value}`;
      case 'variance':
        return `Top ${filter.top_n} most variant`;
      case 'expression':
        return `Top ${filter.top_n} most expressed`;
      case 'pvalue':
        return `P-value < ${filter.value}`;
      default:
        return `${filter.type}: ${filter.value || filter.top_n || 'Applied'}`;
    }
  };

  // Remove a specific filter from pending filters
  const removeFilter = (axis: 'row' | 'col', index: number) => {
    setPendingFilters(prev => ({
      ...prev,
      [axis]: prev[axis].filter((_, i) => i !== index)
    }));
  };

  // Clear all filters for a specific axis
  const clearAxisFilters = (axis: 'row' | 'col') => {
    setPendingFilters(prev => ({
      ...prev,
      [axis]: []
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPendingFilters({ row: [], col: [] });
  };

  // Apply pending changes
  const applyChanges = () => {
    // Update the state (this can happen asynchronously)
    setFilters(pendingFilters);
    
    // Immediately call render with the current pending filters
    onRenderHeatmap(pendingFilters);
    setHasChanges(false);
  };

  // Cancel pending changes
  const cancelChanges = () => {
    setPendingFilters(filters);
    setHasChanges(false);
  };

  const totalFilters = pendingFilters.row.length + pendingFilters.col.length;

  if (totalFilters === 0 && !hasChanges) {
    return (
      <Box
        sx={{
          mx: '10px',
          mt: '28px',
          border: '1px solid rgba(135, 135, 135, 0.6)',
          borderRadius: '4px',
          padding: '8px',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.87)'
          }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: '13px',
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif',
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <FilterListIcon fontSize="small" />
          Filters
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: '11px',
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          No filters applied
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mx: '10px',
        mt: '25px',
        border: '1px solid rgba(135, 135, 135, 0.6)',
        borderRadius: '4px',
        padding: '8px',
        '&:hover': {
          borderColor: 'rgba(0, 0, 0, 0.87)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '13px',
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'rgba(0, 0, 0, 0.6)'
          }}
        >
          <FilterListIcon fontSize="small" />
          Filters ({totalFilters})
        </Typography>
        
        {totalFilters > 0 && (
          <Tooltip title="Clear all filters">
            <IconButton
              size="small"
              onClick={clearAllFilters}
              sx={{ p: 0.5 }}
            >
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Row Filters */}
      {pendingFilters.row.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: '12px',
                fontWeight: 'normal',
                fontFamily: 'Arial, sans-serif',
                color: 'rgba(0, 0, 0, 0.6)'
              }}
            >
              Row Filters ({pendingFilters.row.length})
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => clearAxisFilters('row')}
              sx={{ 
                fontSize: '10px', 
                minWidth: 'auto',
                p: 0.5,
                textTransform: 'none'
              }}
            >
              Clear
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'flex-start' }}>
            {pendingFilters.row.map((filter, index) => (
              <Chip
                key={index}
                label={formatFilterText(filter)}
                size="small"
                onDelete={() => removeFilter('row', index)}
                sx={{
                  fontSize: '11px',
                  fontFamily: 'Arial, sans-serif',
                  height: '24px',
                  backgroundColor: '#e3f2fd',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Column Filters */}
      {pendingFilters.col.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: '12px',
                fontWeight: 'normal',
                fontFamily: 'Arial, sans-serif',
                color: 'rgba(0, 0, 0, 0.6)'
              }}
            >
              Column Filters ({pendingFilters.col.length})
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={() => clearAxisFilters('col')}
              sx={{ 
                fontSize: '10px', 
                minWidth: 'auto',
                p: 0.5,
                textTransform: 'none'
              }}
            >
              Clear
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'flex-start' }}>
            {pendingFilters.col.map((filter, index) => (
              <Chip
                key={index}
                label={formatFilterText(filter)}
                size="small"
                onDelete={() => removeFilter('col', index)}
                sx={{
                  fontSize: '11px',
                  fontFamily: 'Arial, sans-serif',
                  height: '24px',
                  backgroundColor: '#f3e5f5',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Action Buttons - Only show when there are pending changes */}
      {hasChanges && (
        <>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={applyChanges}
              sx={{
                fontSize: '11px',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'none',
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              Render Heatmap
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={cancelChanges}
              sx={{
                fontSize: '11px',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'none',
                borderColor: '#ccc',
                color: '#666'
              }}
            >
              Cancel
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default FiltersSection;