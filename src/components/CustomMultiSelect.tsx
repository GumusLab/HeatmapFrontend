import CheckIcon from "@mui/icons-material/Check";
import { Autocomplete, MenuItem, TextField, Chip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { MAX_CATEGORIES } from "../const";
import { order } from "../types/index";

type MultiSelectProps = {
  elements: string[];
  order: order;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  axis: 'row' | 'col';
  onSelectionChange?: (
    axis: 'row' | 'col',
    categories: string[]
  ) => void;
};

const CONTROL_COLORS = {
  text: '#777777',
  primary: '#1976d2',
  primaryHover: '#1565c0',
  hover: '#E3F2FD',
  border: '#d0d0d0',
  background: '#FFFFFF',
};

const MultiSelect: React.FC<MultiSelectProps> = ({ elements, order, setOrder, axis, onSelectionChange }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (axis === 'col') {
      setSelectedOptions(order.colCat);
    } else {
      setSelectedOptions(order.rowCat);
    }
  }, [axis, order.colCat, order.rowCat]);

  return (
    <Autocomplete
      sx={{
        m: 0,
        width: '100%',
        height: '80%',

        '& .MuiAutocomplete-inputRoot': {
          flexWrap: 'wrap',
          padding: '8px 4px 4px 4px !important',
          minHeight: '42px',
          columnGap: '2px',
          rowGap: '1px',
          backgroundColor: CONTROL_COLORS.background,
        },

        // Always place "Categories" on a separate line below the chips
        '& .MuiAutocomplete-input': {
          flexBasis: '100% !important',
          width: '100% !important',
          minWidth: '0 !important',
          padding: '1px 4px !important',
          margin: '1px',
          fontSize: '13px'
        },

        // Keep the dropdown arrow aligned with the "Categories" line
        '& .MuiAutocomplete-endAdornment': {
          color: CONTROL_COLORS.text,
          top: 'auto',
          bottom: '2px',
          transform: 'none',
        },

        // Normal outline
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: CONTROL_COLORS.border,
        },

        '&:hover .MuiInputLabel-root': {
          color: CONTROL_COLORS.primary,
        },

        '&:hover .MuiAutocomplete-popupIndicator': {
          color: CONTROL_COLORS.primary,
        },

        '&.Mui-focused .MuiAutocomplete-popupIndicator': {
          color: CONTROL_COLORS.primary,
        },

        '& .MuiAutocomplete-popupIndicator.MuiAutocomplete-popupIndicatorOpen': {
          color: CONTROL_COLORS.primary,
        },

        // Hover outline
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#64B5F6',
        },

        // Focused outline
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: CONTROL_COLORS.primary,
        },

        // Label
        '& .MuiInputLabel-root': {
          color: CONTROL_COLORS.text,
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
        },

        '& .MuiInputLabel-root.Mui-focused': {
          color: CONTROL_COLORS.primary,
        },

        // Typed text
        '& .MuiInputBase-input': {
          color: CONTROL_COLORS.text,
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
        },

        // Dropdown arrow
        '& .MuiAutocomplete-popupIndicator': {
          color: CONTROL_COLORS.border
        },

        '& .MuiAutocomplete-popupIndicator:hover': {
          color: CONTROL_COLORS.primary,
          backgroundColor: CONTROL_COLORS.hover,
        },

        '& .MuiChip-root': {
          maxWidth: 'none',
          margin: '1px',
        },
      }}
      multiple
      options={elements}
      getOptionLabel={(option) => option}
      disableCloseOnSelect
      disableClearable // This removes the big clear (X) button
      value={selectedOptions}
      onChange={(_, value) => {
        setSelectedOptions(value);
        if (axis === 'col') {
          setOrder((prev: any) => ({
            ...prev,
            colCat: value,
            sortColsByRowName: null,
            sortRowsByColName: null
          }));
        } else {
          setOrder((prev: any) => ({
            ...prev,
            rowCat: value,
            sortColsByRowName: null,
            sortRowsByColName: null
          }));
        }
        onSelectionChange?.(axis, value);
      }}
      // Custom chip rendering to ensure full text display
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option}
            label={option}
            size="small"
            sx={{
              maxWidth: 'none',
              backgroundColor: CONTROL_COLORS.hover,
              color: CONTROL_COLORS.primary,
              border: '1px solid #BBDEFB',
              fontFamily: 'Arial, sans-serif',
              fontSize: '10px',
              fontWeight: 500,

              '&:hover': {
                backgroundColor: '#BBDEFB',
              },

              '& .MuiChip-label': {
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip',
              },

              '& .MuiChip-deleteIcon': {
                color: CONTROL_COLORS.primary,
              },

              '& .MuiChip-deleteIcon:hover': {
                color: CONTROL_COLORS.primaryHover,
              },
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={axis === 'col' ? "Metadata Categories (Max 6)" : "Metadata Categories (Max 6)"}
          placeholder="Categories"
          sx={{
            // Ensure the input field can expand vertically
            '& .MuiInputBase-root': {
              minHeight: '42px',
            }
          }}
        />
      )}
      renderOption={(props, option, { selected }) => {
        const isDisabled =
          selectedOptions.length >= MAX_CATEGORIES && !selectedOptions.includes(option);
        return (
          <MenuItem
            {...props}
            key={option}
            value={option}
            disabled={isDisabled}
            sx={{
              justifyContent: "space-between",
              fontSize: '12px',
              fontWeight: 'normal',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {option}
            {selected ? <CheckIcon color="info" /> : null}
          </MenuItem>
        );
      }}
    />
  );
};

export default MultiSelect;