import CheckIcon from "@mui/icons-material/Check";
import { Autocomplete, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { MAX_CATEGORIES } from "../const";
import { order } from "../types/index";
type MultiSelectProps = {
  elements: string[];
  order:order;
  setOrder:React.Dispatch<React.SetStateAction<any>>;
  axis:string;
};
const MultiSelect:React.FC<MultiSelectProps> = ({ elements , order, setOrder, axis}) =>{
  const [selectedOptions, setSelectedOptions] =useState<string[]>([]);
  useEffect(() => {
    if (axis === 'col'){
      setSelectedOptions(order.colCat)
    }else{
      setSelectedOptions(order.rowCat)
    }

  },[axis])
  return (
    <Autocomplete
      sx={{ m: 0, width: '100%',height:'80%'}}
      multiple
      options={elements}
      getOptionLabel={(option) => option}
      disableCloseOnSelect
      value={selectedOptions}
      onChange={(_, value) => {
        setSelectedOptions(value);
        if(axis === 'col'){
          setOrder((prev:any)=>({...prev,colCat:value}))
        }
        else{
          setOrder((prev:any)=>({...prev,rowCat:value}))
        }       
      }} 
      // prints the selected value
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={axis === 'col'?"Col Categories":"Row Categories"}
          placeholder="Categories"
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
            sx={{ justifyContent: "space-between",fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }}
          >
            {option}
            {selected ? <CheckIcon color="info" /> : null}
          </MenuItem>
        );
      }}
    />
  );
}
export default MultiSelect;
