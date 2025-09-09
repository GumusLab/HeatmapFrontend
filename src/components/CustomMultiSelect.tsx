// import CheckIcon from "@mui/icons-material/Check";
// import { Autocomplete, MenuItem, TextField } from "@mui/material";
// import React, { useEffect, useState } from "react";
// import { MAX_CATEGORIES } from "../const";
// import { order } from "../types/index";
// type MultiSelectProps = {
//   elements: string[];
//   order:order;
//   setOrder:React.Dispatch<React.SetStateAction<any>>;
//   axis:string;
// };
// const MultiSelect:React.FC<MultiSelectProps> = ({ elements , order, setOrder, axis}) =>{
//   const [selectedOptions, setSelectedOptions] =useState<string[]>([]);
//   useEffect(() => {
//     if (axis === 'col'){
//       setSelectedOptions(order.colCat)
//     }else{
//       setSelectedOptions(order.rowCat)
//     }

//   },[axis])
//   return (
//     <Autocomplete
//       sx={{ m: 0, width: '100%',height:'80%'}}
//       multiple
//       options={elements}
//       getOptionLabel={(option) => option}
//       disableCloseOnSelect
//       value={selectedOptions}
//       onChange={(_, value) => {
//         setSelectedOptions(value);
//         if(axis === 'col'){
//           setOrder((prev:any)=>({...prev,colCat:value}))
//         }
//         else{
//           setOrder((prev:any)=>({...prev,rowCat:value}))
//         }       
//       }} 
//       // prints the selected value
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           variant="outlined"
//           label={axis === 'col'?"Col Categories":"Row Categories"}
//           placeholder="Categories"
//         />
//       )}
//       renderOption={(props, option, { selected }) => {
//         const isDisabled =
//           selectedOptions.length >= MAX_CATEGORIES && !selectedOptions.includes(option);
//         return (
//           <MenuItem
//             {...props}
//             key={option}
//             value={option}
//             disabled={isDisabled}
//             sx={{ justifyContent: "space-between",fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }}
//           >
//             {option}
//             {selected ? <CheckIcon color="info" /> : null}
//           </MenuItem>
//         );
//       }}
//     />
//   );
// }
// export default MultiSelect;

import CheckIcon from "@mui/icons-material/Check";
import { Autocomplete, MenuItem, TextField, Chip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { MAX_CATEGORIES } from "../const";
import { order } from "../types/index";

type MultiSelectProps = {
  elements: string[];
  order: order;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  axis: string;
};

const MultiSelect: React.FC<MultiSelectProps> = ({ elements, order, setOrder, axis }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    if (axis === 'col') {
      setSelectedOptions(order.colCat);
    } else {
      setSelectedOptions(order.rowCat);
    }
  }, [axis]);

  return (
    <Autocomplete
      sx={{ 
        m: 0, 
        width: '100%', 
        height: '80%',
        // Custom styling for the input container to ensure proper wrapping
        '& .MuiAutocomplete-inputRoot': {
          flexWrap: 'wrap',
          padding: '8px',
          minHeight: '56px', // Ensure minimum height
        },
        // Style the chips to prevent truncation
        '& .MuiChip-root': {
          maxWidth: 'none', // Remove max-width constraint
          margin: '2px',
        }
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
          setOrder((prev: any) => ({ ...prev, colCat: value }));
        } else {
          setOrder((prev: any) => ({ ...prev, rowCat: value }));
        }
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
              maxWidth: 'none', // Allow full width
              '& .MuiChip-label': {
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip',
              }
            }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={axis === 'col' ? "Col Categories" : "Row Categories"}
          placeholder="Categories"
          sx={{
            // Ensure the input field can expand vertically
            '& .MuiInputBase-root': {
              minHeight: '56px',
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
              fontSize: '14px', 
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