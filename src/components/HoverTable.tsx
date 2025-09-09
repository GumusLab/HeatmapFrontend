// import CloseIcon from '@mui/icons-material/Close';
// import IconButton from '@mui/material/IconButton';
// import React, { useState } from 'react';
// import { Box, Paper, TextareaAutosize } from '@mui/material';
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableRow from '@mui/material/TableRow';

// import { enrich } from '../services/enrichr';
// import { OLINK_PROTEIN_GENE_MAP } from '../const/index';

// // 📝 Type Definitions
// interface NetworkFilters {
//   correlationThreshold?: number;
//   varianceFilterMethod?: 'threshold' | 'percentile';
//   varianceThreshold?: number;
//   variancePercentile?: number;
//   maxCorrelations?: number;
//   pValueThreshold?: number;
//   nProcesses?: number;
//   samples?: any[];
//   genes?: any[];
//   sampleFilters?: Record<string, any>;
//   geneFilters?: Record<string, any>;
// }

// type MySnackbarProps = {
//   setVisibilty: React.Dispatch<React.SetStateAction<boolean>>;
//   setHovering: React.Dispatch<React.SetStateAction<boolean>>;
//   data: {
//     Nodes: string[];
//     Group?: string | number;
//     [key: string]: any;
//   };
//   id: string;
//   sessionId: string;
//   filters?: NetworkFilters;
//   onShowNetwork?: any;

// };

// function MySnackbar({ setVisibilty, setHovering, data, id, sessionId, filters,onShowNetwork }: MySnackbarProps) {
//   const [isLoadingNetwork, setIsLoadingNetwork] = useState<boolean>(false);

//   const handleClose = () => {
//     setVisibilty(false);
//     setHovering(true);
//   };

//   const handleMouseEnter = () => {
//     setHovering(false);
//   };

//   const handleMouseLeave = () => {
//     setHovering(true);
//   };

//   const handleEnrichrClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
//     event.preventDefault();
//     try {
//       const genes: string[] = [];
//       data['Nodes'].forEach((protein: string) => {
//         let proteinParts: string[] | undefined;
//         if (protein.includes('.')) {
//           proteinParts = protein.split('.')
//         }
//         else if (protein.includes('-')) {
//           proteinParts = protein.split('-')
//         }
//         else if (protein.includes('_')) {
//           proteinParts = protein.split('_')
//         }

//         let proteinString: string;
//         if (proteinParts) {
//           proteinString = proteinParts.join('-');
//         }
//         else {
//           proteinString = protein
//         }

//         if (id.includes('olink')) {
//           if (OLINK_PROTEIN_GENE_MAP[proteinString]) {
//             const GENE = OLINK_PROTEIN_GENE_MAP[proteinString];
//             if (GENE.includes('_')) {
//               const parts = GENE.split('_');
//               genes.push(parts[0], parts[1]);
//             } else {
//               genes.push(GENE);
//             }
//           }
//         }
//         else {
//           genes.push(proteinString)
//         }
//       });

//       const geneList = genes.join('\n');
//       const enrichOptions = {
//         list: geneList,
//         description: 'A sample gene',
//         popup: true,
//       };

//       const enrichrData = enrich(enrichOptions);
//       console.log('Enrichr response:', enrichrData);
//     }
//     catch (error) {
//       console.log(error)
//     }
//   }


//   const handleVisualizeClusterClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
//     setIsLoadingNetwork(true);
    
//     try {
//       const networkData = {
//         geneIds: data['Nodes'],
//         sessionId: sessionId,
//         filters: filters || {
//           correlationThreshold: 0.5,
//           varianceFilterMethod: 'threshold',
//           varianceThreshold: 1.0,
//           maxCorrelations: 50000
//         },
//         metadata: {
//           clusterId: data['Group'] || 'unknown',
//           timestamp: new Date().toISOString()
//         }
//       };

//       console.log('********* in hovered table and data is as follows *******', networkData)
  
  
//       // ✅ Just pass the data directly, no sessionStorage needed
//       if (onShowNetwork) {
//         console.log('****** inside the on show network data in hover table and will set the data *******')
//         onShowNetwork(networkData); // Pass full network data
//       }
      
//     } catch (error) {
//       console.error("Error showing network visualization:", error);
//     } finally {
//       setIsLoadingNetwork(false);
//     }
//   };

//   return (
//     <Box 
//       id="tableInfo" 
//       style={{ backgroundColor: 'white', width: '250px', height: '120px', zIndex: '99' }}
//       onMouseEnter={handleMouseEnter}
//       onMouseLeave={handleMouseLeave}
//     >
//       <TableContainer style={{ backgroundColor: 'white', width: '100%', maxHeight: '100%', height: '100%' }} component={Paper}>
//         <Table style={{ maxHeight: '100%', padding: 0, margin: 0 }}>
//           <TableBody style={{ height: '100%', maxHeight: '100%', padding: 0, margin: 0 }}>
//             <TableRow style={{ height: '33%' }}>
//               <TableCell style={{ textAlign: 'left', fontWeight: 'bold', padding: '2px', margin: 0, fontSize: '15px' }} colSpan={2}>
//                 Cluster Information
//               </TableCell>
//               <TableCell style={{ padding: 0, margin: 0 }}>
//                 <IconButton
//                   size="small"
//                   aria-label="close"
//                   color="inherit"
//                   onClick={handleClose}
//                   style={{
//                     position: 'absolute',
//                     top: '0px',
//                     left: '220px',
//                     zIndex: 1000,
//                   }}
//                 >
//                   <CloseIcon fontSize="small" />
//                 </IconButton>
//               </TableCell>
//             </TableRow>
            
//             <TableRow style={{ height: '33%', padding: 0, margin: 0 }}>
//               <TableCell style={{ width: '10%', padding: '2px', margin: 0, fontSize: '15px' }}>
//                 Nodes
//               </TableCell>
//               <TableCell style={{ overflowX: 'auto', paddingTop: '2px', paddingBottom: '2px', padding: '2px', margin: 0 }}>
//                 <div style={{ overflowX: 'auto', overflowY: 'hidden', width: '100%', paddingTop: '2px' }}>
//                   <TextareaAutosize
//                     maxRows={1}
//                     defaultValue={data['Nodes']}
//                     placeholder="Input Label"
//                     style={{
//                       width: '100%',
//                       maxWidth: '95%',
//                       resize: 'none',
//                       padding: 0,
//                       marginTop: '2px',
//                       marginLeft: '5px'
//                     }}
//                   />
//                 </div>
//               </TableCell>
//             </TableRow>
            
//             <TableRow style={{ height: '33%', padding: 0, margin: 0 }}>
//               <TableCell style={{ padding: '2px', margin: 0, fontSize: '15px' }} colSpan={2}>
//                 Send genes to <a href='#' onClick={handleEnrichrClick}>Enrichr</a>
//               </TableCell>
//             </TableRow>
            
//             <TableRow style={{ height: '33%', padding: 0, margin: 0 }}>
//               <TableCell style={{ padding: '2px', margin: 0, fontSize: '15px' }} colSpan={2}>
//                 {isLoadingNetwork ? (
//                   <span>Opening network...</span>
//                 ) : (
//                   <span>
//                     Visualize cluster through <a href="#" onClick={handleVisualizeClusterClick}>network</a>
//                   </span>
//                 )}
//               </TableCell>
//             </TableRow>
//             <TableRow style={{ height: '33%', padding: 0, margin: 0 }}>
//               <TableCell style={{ padding: '2px', margin: 0, fontSize: '15px' }} colSpan={2}>
//                 {isLoadingNetwork ? (
//                   <span>Opening network...</span>
//                 ) : (
//                   <span>
//                     Visualize pathways for the cluster <a href="#" onClick={handleVisualizeClusterClick}>markers</a>
//                   </span>
//                 )}
//               </TableCell>
//             </TableRow>
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   );
// }

// export default MySnackbar;

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Tooltip,
  Link as MuiLink, // For the new Enrichr link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Assuming these are defined elsewhere
import { enrich } from '../services/enrichr'; // This is used again for the direct link
import { mapFeaturesToGeneList, DataType } from '../utils/bioinformatics';

interface ClusterInfoBoxProps {
  setVisibilty: (visible: boolean) => void;
  setHovering: (hovering: boolean) => void;
  data: {
    Nodes: string[];
    Group?: string | number;
    [key: string]: any;
  };
  dataType: string; // Using the exported type
  onShowNetwork?: (networkData: any) => void;
  onShowPathwayNetwork?: (pathwayData: any) => void;
}

function ClusterInfoBox({
  setVisibilty,
  setHovering,
  data,
  dataType,
  onShowNetwork,
  onShowPathwayNetwork,
}: ClusterInfoBoxProps) {
  const [isNetworkLoading, setNetworkLoading] = useState(false);
  const [isPathwayLoading, setPathwayLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleClose = () => setVisibilty(false);
  const handleMouseEnter = () => setHovering(false);
  const handleMouseLeave = () => setHovering(true);

  const nodeCount = data.Nodes?.length || 0;

  const handleCopyNodes = () => {
    // This correctly joins with newlines for line-separated pasting
    const geneList = data.Nodes.join('\n');
    navigator.clipboard.writeText(geneList).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const handleVisualizeNetwork = () => {
    setNetworkLoading(true);
    if (onShowNetwork) onShowNetwork({ geneIds: data.Nodes,metadata:{clusterId:data.Group} });
    setTimeout(() => setNetworkLoading(false), 500);
  };
  
  const handlePathwayNetworkAnalysis = async () => {
    setPathwayLoading(true);
    // This is where your backend logic will go to call the Enrichr API
    // and then trigger your internal visualization.
    if (onShowPathwayNetwork) {
        onShowPathwayNetwork({ genes: data.Nodes,metadata:{clusterId:data.Group}});
    }
    setTimeout(() => setPathwayLoading(false), 500);
  };

  // ✅ NEW: Handler to open the classic Enrichr pop-up
  const handleOpenEnrichr = async () => {
    const geneList = mapFeaturesToGeneList(data.Nodes, dataType);
    if (geneList) {
      await enrich({
        list: geneList,
        description: `Cluster ${data.Group || ''} genes`,
        popup: true,
      });
    }
  };

  return (
    <Paper
      elevation={5}
      sx={{ width: '280px', zIndex: 99, borderRadius: '8px' }} // Softer corners
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box sx={{ p: 1.5 }}>
        {/* --- HEADER --- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25,fontSize:12 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Cluster {data.Group}
          </Typography>
          <Stack direction="row" alignItems="center">
            <Tooltip title={copyStatus === 'copied' ? 'Copied!' : 'Copy node list'}>
              <IconButton size="small" onClick={handleCopyNodes}>
                <ContentCopyIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" aria-label="close" onClick={handleClose}>
              <CloseIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
          Contains {nodeCount} nodes
        </Typography>

        <Divider />

        {/* --- ACTIONS --- */}
        <Stack spacing={1} sx={{ mt: 0.25 }}>
           {/* ✅ Prettier buttons with space between them */}
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={handlePathwayNetworkAnalysis}
            disabled={isNetworkLoading || isPathwayLoading}
            startIcon={isPathwayLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: '6px' }}
          >
            Analyze Pathways
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={handleVisualizeNetwork}
            disabled={isNetworkLoading || isPathwayLoading}
            startIcon={isNetworkLoading ? <CircularProgress size={16} /> : null}
            sx={{ borderRadius: '6px' }}
          >
            View Gene Network
          </Button>
        </Stack>
        
        {/* --- FOOTER LINK --- */}
        <Box sx={{ textAlign: 'center', pt: 0.5 }}>
            <MuiLink
                component="button"
                variant="caption"
                onClick={handleOpenEnrichr}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
            >
                Open full analysis in Enrichr <OpenInNewIcon sx={{ fontSize: '14px' }} />
            </MuiLink>
        </Box>

      </Box>
    </Paper>
  );
}

export default ClusterInfoBox;