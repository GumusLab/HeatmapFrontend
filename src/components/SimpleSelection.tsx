import CheckIcon from '@mui/icons-material/Check';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';
import React, { useState } from 'react';

type SimpleSelectionProps = {
    elements: string[];
    setState:React.Dispatch<React.SetStateAction<string>>;
    initialValue:string;
    labelName:string;
  };
const SimpleSelection:React.FC<SimpleSelectionProps> = ({ elements , setState, initialValue, labelName}) => {
  const [selectedOption, setSelectedOption] = useState(initialValue);

  const handleChange = (event:any) => {
    setSelectedOption(event.target.value);
    setState(event.target.value)
  };
  const menuProps:Partial<SelectProps['MenuProps']> = {
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center',
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center',
    },
    marginThreshold: 0,
  };

  return (
    <FormControl fullWidth variant="outlined">
    <InputLabel>{labelName}</InputLabel>
    <Select
      value={selectedOption}
      onChange={handleChange}
      variant="outlined"
      label={labelName}
      displayEmpty
      fullWidth
      sx={{
        m:0,height:'50px',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif'
      }}
      MenuProps={menuProps}
    >
      {elements.map((option) => (
        <MenuItem key={option} value={option} sx={{ustifyContent: 'space-between',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif'}}>
          {option}
          {selectedOption === option ? <CheckIcon color="info" /> : null}
        </MenuItem>
      ))}
    </Select>
    </FormControl>
  );
};

export default SimpleSelection;
