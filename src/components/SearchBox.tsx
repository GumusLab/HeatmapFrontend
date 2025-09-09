// import SearchIcon from '@mui/icons-material/Search';
// import { Autocomplete } from '@mui/material';
// // import IconButton from '@mui/material/IconButton';
// import TextField from '@mui/material/TextField';
// // import { makeStyles } from "@mui/material/styles";
// import React, { useEffect, useState } from 'react';



// type SearchBoxProps = {
//     elements: string[]; // Define the type for the 'elements' prop
//     setSearchTerm:React.Dispatch<React.SetStateAction<string>>;
//   };

// //   const CustomAutocomplete = styled(Autocomplete)({
// //     '& .MuiAutocomplete-listbox': {
// //       fontSize: 14,
// //       fontWeight: 'normal',
// //       fontFamily: 'Arial, sans-serif',
// //     },
// //   });

// const SearchBox:React.FC<SearchBoxProps>  = ({ elements,setSearchTerm}) => {
//   const [searchText, setSearchText] = useState('');
//   const [filteredOptions,setFilteredOptions] = useState<string[]>([]);
  
// //   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
// //     setSearchText(event.target.value);
// //     setSearchTerm(event.target.value);
// //   };

//   useEffect(() => {
//     if(searchText.trim().length === 0){
//       setFilteredOptions([]);
//     }
//     else{
//     setFilteredOptions(elements?.filter((label:string) =>
//       label.toLowerCase().startsWith(searchText.toLowerCase())
//     ));
//     }
//   }, [searchText, elements]);

// //   const classes = useStyles();

//   return (
//     <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '10px' }}>
//       <Autocomplete
//         options={filteredOptions}
//         getOptionLabel={(option:any) => option}
//         value={searchText}
//         onInputChange={(_,value) => {
//           setSearchText(value);
//           setSearchTerm(value);
//         }}
//         openOnFocus={false} 
//         filterOptions={(x) => x}
//         sx={{
//             width: '100%',
//             '& .MuiAutocomplete-popupIndicator': { transform: 'none' },
//           }}
//         popupIcon={<SearchIcon />}
//         renderInput={(params) => (
//           <TextField
//             {...params}
//             InputProps={{ ...params.InputProps, style: { fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' } }}
//             value={searchText}
//             placeholder="Search..."
//             variant="outlined"
//             size="small"
//             fullWidth
//           />
//         )}

//       />
//     </div>
//   );
// };

// export default SearchBox;

import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, IconButton } from '@mui/material';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useRef } from 'react';

type SearchBoxProps = {
  elements: string[]; // Define the type for the 'elements' prop
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
};

const SearchBox: React.FC<SearchBoxProps> = ({ elements, setSearchTerm }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  // const searchIconRef = useRef<HTMLDivElement>(null);
  const searchIconRef = useRef<SVGSVGElement>(null);

  
  // Update filtered options whenever searchText changes, but don't update the search term yet
  useEffect(() => {
    if (searchText.trim().length === 0) {
      setFilteredOptions([]);
      setSearchTerm(''); // Set searchTerm to empty when input is cleared
    } else {
      setFilteredOptions(
        elements?.filter((label: string) =>
          label.toLowerCase().startsWith(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, elements, setSearchTerm]);

  // Function to trigger search
  const triggerSearch = () => {
    setSearchTerm(searchText);
  };

  // Function to handle Enter key press
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      triggerSearch();
    }
  };

  // Function to handle option selection
  const handleOptionSelect = (_event: any, value: string | null) => {
    if (value) {
      setSearchText(value);
      setSearchTerm(value);
    }
  };

  return (
    <div style={{ marginLeft: '10px', marginRight: '10px', marginTop: '10px' }}>
      <Autocomplete
        options={filteredOptions}
        getOptionLabel={(option: any) => option}
        inputValue={searchText}
        onInputChange={(_, value) => {
          setSearchText(value);
          // Not calling setSearchTerm here anymore
        }}
        onChange={handleOptionSelect}
        openOnFocus={false}
        filterOptions={(x) => x}
        sx={{
          width: '100%',
          '& .MuiAutocomplete-popupIndicator': { transform: 'none' },
        }}
        // popupIcon={
        //   <div ref={searchIconRef} onClick={triggerSearch}>
        //     <SearchIcon />
        //   </div>
        // }
        popupIcon={
          <SearchIcon ref={searchIconRef} onClick={triggerSearch} />
        }
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              style: { fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
              endAdornment: (
                <React.Fragment>
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            placeholder="Search..."
            variant="outlined"
            size="small"
            fullWidth
            onKeyDown={handleKeyDown}
          />
        )}
      />
    </div>
  );
};

export default SearchBox;