// import CloseIcon from '@mui/icons-material/Close';
// import IconButton from '@mui/material/IconButton';
// import React from 'react';
// // import Paper from '@mui/material/Paper';
// import { Box, Paper, TextareaAutosize } from '@mui/material';
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableRow from '@mui/material/TableRow';
// // import { analyzeGeneList } from '../services/enrichr';
// import { enrich } from '../services/enrichr';

// import { OLINK_PROTEIN_GENE_MAP } from '../const/index';


// type MySnackbarProps = {
//     setVisibilty:React.Dispatch<React.SetStateAction<any>>;
//     setHovering:React.Dispatch<React.SetStateAction<any>>;
//     data:any;
//   };

// function MySnackbar({setVisibilty,setHovering,data}:MySnackbarProps) {

//     // const initialData = ['Node 1','Node 2','Node 3','Node 4','Node 1','Node 2','Node 3','Node 4']
// //   const [open, setOpen] = useState(true);

//   const handleClose = () => {
//     // if (reason === 'clickaway') {
//     //   return;
//     // }
//     setVisibilty(false);
//     setHovering(true);
//   };

//   const handleMouseEnter = () => {
//     // Disable pointer events for the div
//     setHovering(false);
//   };
  
//   const handleMouseLeave = () => {
//     // Enable pointer events for the div
//     setHovering(true);
//   };
  

//   const handleEnrichrClick =async (event:any) => {

//     event.preventDefault(); // Prevent the default behavior of the anchor link
//     try{
//         const genes: string[] = [];
//         data['Nodes'].forEach((protein: any) => {

//             let proteinParts:any;
//             if(protein.includes('.')){
//                 proteinParts = protein.split('.')
//             }
//             else if(protein.includes('-')){
//                 proteinParts = protein.split('-')
//             }
//             else if(protein.includes('_')){
//                 proteinParts = protein.split('_')
//             }

//             let proteinString:string;
//             if(proteinParts){
//                 proteinString = proteinParts.join('-');
//             }
//             else{
//                 proteinString = protein
//             }


//             if (OLINK_PROTEIN_GENE_MAP[proteinString]) {
//                 const GENE = OLINK_PROTEIN_GENE_MAP[proteinString];
//                 if (GENE.includes('_')) {
//                 const parts = GENE.split('_');
//                 genes.push(parts[0], parts[1]); // Push both parts as separate elements in the array
//                 } else {
//                 genes.push(GENE); // Push the single gene into the array
//                 }
//             }
//             });
//         const geneList = genes.join('\n');        
//         const enrichOptions = {
//             list: geneList,
//             description: 'A sample gene',
//             popup: true,
//           };
          
//         const enrichrData = enrich(enrichOptions);
//         console.log('Enrichr response:', enrichrData);
//     }
//      catch(error) {
//         console.log(error)
//     }
// }
// //     return (
// //         <Box id="tableInfo" style={{ backgroundColor: 'white',width:'300px' , height: '150px', zIndex:'99'}}
// //         onMouseEnter={handleMouseEnter}
// //         onMouseLeave={handleMouseLeave}
// //         >
// //         <TableContainer  style={{ backgroundColor: 'white' , width:'100%' , maxHeight: '100%',height: '100%' , padding:'0px', margin:'0px'}} component={Paper}>
// //         <Table>
// //             <TableBody>
// //             <TableRow style={{maxHeight: '20px'}}>
// //             <TableCell style={{ borderBottom: '1px solid #ccc', textAlign: 'left', fontWeight: 'bold' }} colSpan={2}>
// //               Cluster Information
// //             </TableCell>
// //             <TableCell>
// //             <IconButton
// //           size="small"
// //           aria-label="close"
// //           color="inherit"
// //           onClick={handleClose}
// //           style={{
// //             position: 'absolute',
// //             top: '5px', // Adjust the top position as needed
// //             left: '270px', // Adjust the right position as needed
// //             zIndex: 1000, // Replace 999 with your desired z-index value
// //           }}
// //         >
// //           <CloseIcon fontSize="small" />
// //         </IconButton>
// //         </TableCell>
// //           </TableRow >
// //             {/* <TableRow style={{ borderBottom: '1px solid #ccc'}}>
// //                 <TableCell>Cluster No.</TableCell>
// //                 <TableCell>{data['Group']}</TableCell>
// //             </TableRow> */}
// //             <TableRow style={{ borderBottom: '1px solid #ccc',maxHeight: '30px',paddingTop:'2px', paddingBottom:'2px'}}>
// //                 <TableCell style={{
// //                     width: '10%',
// //                     maxHeight: '30px'
// //                 }}>Nodes</TableCell>
// //                 <TableCell style={{ overflowX: 'auto' , maxHeight: '30px' , paddingTop:'2px', paddingBottom:'2px'}}>
// //                 <div
// //               style={{
// //                 overflowX: 'auto', // Enable horizontal scrolling if content overflows
// //                 // maxWidth: '270px', // Set a maximum width to enable scrolling
// //                 overflowY: 'hidden', // Hide vertical overflow
// //                 width: '100%'     // Set the width to 100% for full cell width
// //               }}
// //             >
// //               <TextareaAutosize
// //                 maxRows={1} // Set the number of visible rows
// //                 defaultValue={data['Nodes']} // Set the initial value here
// //                 placeholder="Input Label" // Add your label or placeholder text here
// //                 style={{
// //                 //   minWidth: '60%', // Ensure the textarea takes full width
// //                   width: '100%',
// //                   maxWidth: '95%',
// //                   resize: 'none',    // Disable textarea resizing
// //                 }}
// //               />
// //               </div>
// //                 </TableCell>
// //             </TableRow>
// //             <TableRow style={{maxHeight: '30px'}}>
// //                 <TableCell style={{maxHeight: '30px'}} colSpan={2}>
// //                 {/* Link to <a href='https://maayanlab.cloud/Enrichr/' target='_blank'>Enrichr</a> */}
// //                 Send genes to <a href='#' onClick={handleEnrichrClick}>Enrichr</a>
// //                 </TableCell>
// //             </TableRow>
// //             {/* Add more rows as needed */}
// //             </TableBody>
// //         </Table>
// //         </TableContainer>
    
// //         </Box>
// //       );    
    
// //   }


//   return (
//     <Box id="tableInfo" style={{ backgroundColor: 'white',width:'250px' , height: '80px', zIndex:'99'}}
//     onMouseEnter={handleMouseEnter}
//     onMouseLeave={handleMouseLeave}
//     >
//     <TableContainer  style={{ backgroundColor: 'white' , width:'100%' , maxHeight: '100%',height: '100%'}} component={Paper}>
//     <Table style={{maxHeight:'100%',padding:0,margin:0}}>
//         <TableBody style={{height:'100%',maxHeight:'100%',padding:0,margin:0}}>
//         {/* <TableRow style={{maxHeight:'33%', borderBottom: '1px solid #ccc'}}> */}
//         <TableRow style={{height:'33%'}}>
//         <TableCell style={{textAlign: 'left', fontWeight: 'bold',padding:'2px',margin:0,fontSize:'15px'}} colSpan={2}>
//           Cluster Information
//         </TableCell>
//         <TableCell style={{padding:0,margin:0}}>
//         <IconButton
//       size="small"
//       aria-label="close"
//       color="inherit"
//       onClick={handleClose}
//       style={{
//         position: 'absolute',
//         top: '0px', // Adjust the top position as needed
//         left: '220px', // Adjust the right position as needed
//         zIndex: 1000, // Replace 999 with your desired z-index value
//       }}
//     >
//       <CloseIcon fontSize="small" />
//     </IconButton>
//     </TableCell>
//       </TableRow >
//         {/* <TableRow style={{ borderBottom: '1px solid #ccc'}}>
//             <TableCell>Cluster No.</TableCell>
//             <TableCell>{data['Group']}</TableCell>
//         </TableRow> */}
//         <TableRow style={{height:'33%',padding:0,margin:0}}>
//             <TableCell style={{
//                 width: '10%',
//                 padding:'2px',
//                 margin:0,
//                 fontSize:'15px'
//             }}>Nodes</TableCell>
//             <TableCell style={{ overflowX: 'auto', paddingTop:'2px', paddingBottom:'2px',padding:'2px',margin:0}}>
//             <div
//           style={{
//             overflowX: 'auto', // Enable horizontal scrolling if content overflows
//             // maxWidth: '270px', // Set a maximum width to enable scrolling
//             overflowY: 'hidden', // Hide vertical overflow
//             width: '100%',     // Set the width to 100% for full cell width
//             paddingTop:'2px'
//           }}
//         >
//           <TextareaAutosize
//             maxRows={1} // Set the number of visible rows
//             defaultValue={data['Nodes']} // Set the initial value here
//             placeholder="Input Label" // Add your label or placeholder text here
//             style={{
//             //   minWidth: '60%', // Ensure the textarea takes full width
//               width: '100%',
//               maxWidth: '95%',
//               resize: 'none',    // Disable textarea resizing
//               padding:0,
//               marginTop:'2px',
//               marginLeft:'5px'
//             }}
//           />
//           </div>
//             </TableCell>
//         </TableRow>
//         <TableRow style={{height:'33%',padding:0,margin:0}}>
//             <TableCell style={{padding:'2px',margin:0,fontSize:'15px'}} colSpan={2}>
//             {/* Link to <a href='https://maayanlab.cloud/Enrichr/' target='_blank'>Enrichr</a> */}
//             Send genes to <a href='#' onClick={handleEnrichrClick}>Enrichr</a>
//             </TableCell>
//         </TableRow>
//         {/* Add more rows as needed */}
//         </TableBody>
//     </Table>
//     </TableContainer>

//     </Box>
//   );    

// }



// export default MySnackbar;


import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import React from 'react';
// import Paper from '@mui/material/Paper';
import { Box, Paper, TextareaAutosize } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
// import { analyzeGeneList } from '../services/enrichr';
import { enrich } from '../services/enrichr';

import { OLINK_PROTEIN_GENE_MAP } from '../const/index';


type MySnackbarProps = {
    setVisibilty:React.Dispatch<React.SetStateAction<any>>;
    setHovering:React.Dispatch<React.SetStateAction<any>>;
    data:any;
    id:string;
    corr_matrix:any
  };

function MySnackbar({setVisibilty,setHovering,data,id,corr_matrix}:MySnackbarProps) {

    // const initialData = ['Node 1','Node 2','Node 3','Node 4','Node 1','Node 2','Node 3','Node 4']
//   const [open, setOpen] = useState(true);

  const handleClose = () => {
    // if (reason === 'clickaway') {
    //   return;
    // }
    setVisibilty(false);
    setHovering(true);
  };

  const handleMouseEnter = () => {
    // Disable pointer events for the div
    setHovering(false);
  };
  
  const handleMouseLeave = () => {
    // Enable pointer events for the div
    setHovering(true);
  };
  

  const handleEnrichrClick =async (event:any) => {

    event.preventDefault(); // Prevent the default behavior of the anchor link
    try{
        const genes: string[] = [];
        data['Nodes'].forEach((protein: any) => {

            let proteinParts:any;
            if(protein.includes('.')){
                proteinParts = protein.split('.')
            }
            else if(protein.includes('-')){
                proteinParts = protein.split('-')
            }
            else if(protein.includes('_')){
                proteinParts = protein.split('_')
            }

            let proteinString:string;
            if(proteinParts){
                proteinString = proteinParts.join('-');
            }
            else{
                proteinString = protein
            }

            if(id.includes('olink')){
              if (OLINK_PROTEIN_GENE_MAP[proteinString]) {
                const GENE = OLINK_PROTEIN_GENE_MAP[proteinString];
                if (GENE.includes('_')) {
                const parts = GENE.split('_');
                genes.push(parts[0], parts[1]); // Push both parts as separate elements in the array
                } else {
                genes.push(GENE); // Push the single gene into the array
                }
            }
            }
            else{
              genes.push(proteinString)
            }
           
            });
        const geneList = genes.join('\n');        
        const enrichOptions = {
            list: geneList,
            description: 'A sample gene',
            popup: true,
          };
          
        const enrichrData = enrich(enrichOptions);
        console.log('Enrichr response:', enrichrData);
    }
     catch(error) {
        console.log(error)
    }
}

// Function to generate random data for nodes
// Function to generate random network data for nodes (KinaseID and TargetID)
function generateRandomNetworkData() {
  const nodes = [];
  const allFiles = []; // This will store the generated network for localStorage


  // Iterate over each node (kinase)
  for (let i = 0; i < data.Nodes.length; i++) {
    const kinaseID = data.Nodes[i];

    // Initialize KinaseSize counter for this specific kinase
    let kinaseSize = 1;

    // Count the number of correlations above the threshold for this kinase
    for (let j = 0; j < data.Nodes.length; j++) {
      // Skip if KinaseID and TargetID are the same
      if (i === j) continue;

      const targetID = data.Nodes[j];

      // Ensure the correlation data exists
      if (corr_matrix[kinaseID] && corr_matrix[kinaseID][targetID] !== undefined) {
        const correlation = Math.abs(corr_matrix[kinaseID][targetID]);

        // Count if correlation is above the threshold
        if (correlation > 0.5) {
          kinaseSize += 1; // Increase KinaseSize for each correlation above the threshold
        }
      }
    }

    // Now that we have the KinaseSize, add the network data for this kinase with all its target nodes
    for (let j = 0; j < data.Nodes.length; j++) {
      // Skip if KinaseID and TargetID are the same
      if (i === j) continue;

      const targetID = data.Nodes[j];

      // Ensure the correlation data exists
      if (corr_matrix[kinaseID] && corr_matrix[kinaseID][targetID] !== undefined) {
        const correlation = corr_matrix[kinaseID][targetID];

        // Add nodes (Kinase and Target)
        nodes.push({
          KinaseID: kinaseID,
          TargetID: targetID,
          EdgeHue: correlation, // Use correlation as EdgeHue
          EdgeWeight: Math.abs(correlation), // EdgeWeight as the correlation value
          KinaseSize: kinaseSize // Add KinaseSize once per KinaseID
        });
      }
    }
  }

  // Store the generated data in allFiles (the format you're using in your localStorage)
  allFiles.push(nodes);

  // Store in localStorage (simulating your earlier method)
  window.localStorage.setItem("file_names", JSON.stringify(['customized-network.csv']));
  window.localStorage.setItem("idx", String(0));  // Storing the index
  window.localStorage.setItem("customized-network.csv", JSON.stringify(allFiles[0]));  // Store the first data frame

  console.log("Generated Network Data:", nodes); // Output the generated data for debugging
}


const handleVisualizeClusterClick = (event:any) => {
  // Prevent the default anchor tag behavior (navigation)
  event.preventDefault(); 
  
  console.log("Opening new page...");
  generateRandomNetworkData();

  // Open the new visualization-2d.html in a new tab
  // window.open('/visualization-2d.html', '_blank');
   // Open Visualization2D route in a new tab
  window.open(`${window.location.origin}/#/network-2d`, '_blank');
  console.log("Page opened!");
};

  return (
    <Box id="tableInfo" style={{ backgroundColor: 'white',width:'250px' , height: '120px', zIndex:'99'}}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
    >
    <TableContainer  style={{ backgroundColor: 'white' , width:'100%' , maxHeight: '100%',height: '100%'}} component={Paper}>
    <Table style={{maxHeight:'100%',padding:0,margin:0}}>
        <TableBody style={{height:'100%',maxHeight:'100%',padding:0,margin:0}}>
        {/* <TableRow style={{maxHeight:'33%', borderBottom: '1px solid #ccc'}}> */}
        <TableRow style={{height:'33%'}}>
        <TableCell style={{textAlign: 'left', fontWeight: 'bold',padding:'2px',margin:0,fontSize:'15px'}} colSpan={2}>
          Cluster Information
        </TableCell>
        <TableCell style={{padding:0,margin:0}}>
        <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={handleClose}
      style={{
        position: 'absolute',
        top: '0px', // Adjust the top position as needed
        left: '220px', // Adjust the right position as needed
        zIndex: 1000, // Replace 999 with your desired z-index value
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
    </TableCell>
      </TableRow >
        {/* <TableRow style={{ borderBottom: '1px solid #ccc'}}>
            <TableCell>Cluster No.</TableCell>
            <TableCell>{data['Group']}</TableCell>
        </TableRow> */}
        <TableRow style={{height:'33%',padding:0,margin:0}}>
            <TableCell style={{
                width: '10%',
                padding:'2px',
                margin:0,
                fontSize:'15px'
            }}>Nodes</TableCell>
            <TableCell style={{ overflowX: 'auto', paddingTop:'2px', paddingBottom:'2px',padding:'2px',margin:0}}>
            <div
          style={{
            overflowX: 'auto', // Enable horizontal scrolling if content overflows
            // maxWidth: '270px', // Set a maximum width to enable scrolling
            overflowY: 'hidden', // Hide vertical overflow
            width: '100%',     // Set the width to 100% for full cell width
            paddingTop:'2px'
          }}
        >
          <TextareaAutosize
            maxRows={1} // Set the number of visible rows
            defaultValue={data['Nodes']} // Set the initial value here
            placeholder="Input Label" // Add your label or placeholder text here
            style={{
            //   minWidth: '60%', // Ensure the textarea takes full width
              width: '100%',
              maxWidth: '95%',
              resize: 'none',    // Disable textarea resizing
              padding:0,
              marginTop:'2px',
              marginLeft:'5px'
            }}
          />
          </div>
            </TableCell>
        </TableRow>
        <TableRow style={{height:'33%',padding:0,margin:0}}>
            <TableCell style={{padding:'2px',margin:0,fontSize:'15px'}} colSpan={2}>
            {/* Link to <a href='https://maayanlab.cloud/Enrichr/' target='_blank'>Enrichr</a> */}
            Send genes to <a href='#' onClick={handleEnrichrClick}>Enrichr</a>
            </TableCell>
        </TableRow>
        {/* Add more rows as needed */}
        <TableRow style={{ height: '33%', padding: 0, margin: 0 }}>
  <TableCell style={{ padding: '2px', margin: 0, fontSize: '15px' }} colSpan={2}>
    Visualize cluster through <a href="#" onClick={(e) => handleVisualizeClusterClick(e)}>network</a>
  </TableCell>
</TableRow>
        </TableBody>
    </Table>
    </TableContainer>

    </Box>
  );    

}



export default MySnackbar;

