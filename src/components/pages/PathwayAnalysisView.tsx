// import React, { useState } from 'react';
// import { 
//     Box, 
//     Paper, 
//     Typography, 
//     IconButton, 
//     Tabs, 
//     Tab, 
//     Grid, 
//     Accordion, 
//     AccordionSummary,
//     AccordionDetails,
//     List,
//     ListItemButton,
//     ListItemText,
//     Chip
// } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import GenePathwayNetwork from './GenePathwayNetwork'; // Import our new component

// interface PathwayAnalysisViewProps {
//   analysisData: {
//     clusterName: string;
//     enrichmentResults: Record<string, Record<string, any[]>>;
//   };
//   onClose: () => void;
// }

// const PathwayAnalysisView: React.FC<PathwayAnalysisViewProps> = ({ analysisData, onClose }) => {
//   const { clusterName, enrichmentResults } = analysisData;
//   const categories = Object.keys(enrichmentResults);

//   const [activeTab, setActiveTab] = useState(0);
//   const [selectedTerm, setSelectedTerm] = useState<any>(null);

//   const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
//     setActiveTab(newValue);
//     setSelectedTerm(null); // Reset selection when changing tabs
//   };

//   const handleTermSelect = (termData: any) => {
//     setSelectedTerm(termData);
//   };
  
//   const currentCategoryName = categories[activeTab];
//   const libraries = enrichmentResults[currentCategoryName] || {};

//   return (
//     <Paper elevation={4} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//       {/* Header */}
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
//         <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
//           Enrichment Analysis: <span style={{ color: '#03a9f4' }}>{clusterName}</span>
//         </Typography>
//         <IconButton onClick={onClose}><CloseIcon /></IconButton>
//       </Box>

//       {/* Category Tabs */}
//       <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
//         <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
//           {categories.map(cat => <Tab label={cat} key={cat} />)}
//         </Tabs>
//       </Box>

//       {/* Main Content Grid */}
//       <Grid container spacing={2} sx={{ flexGrow: 1, mt: 0, overflow: 'hidden' }}>

//         {/* Left Panel: Results */}
//         <Grid item xs={12} md={5} sx={{ overflowY: 'auto', height: 'calc(100% - 16px)' }}>
//           {Object.entries(libraries).map(([libraryName, terms]) => (
//             <Accordion key={libraryName} defaultExpanded>
//               <AccordionSummary expandIcon={<ExpandMoreIcon />}>
//                 <Typography sx={{ fontWeight: 500 }}>{libraryName.replace(/_/g, ' ')}</Typography>
//                 <Chip label={terms.length} size="small" sx={{ ml: 2 }} />
//               </AccordionSummary>
//               <AccordionDetails sx={{ p: 0 }}>
//                 <List dense disablePadding>
//                   {terms.map(term => (
//                     <ListItemButton 
//                       key={term.name} 
//                       onClick={() => handleTermSelect(term)}
//                       selected={selectedTerm?.name === term.name}
//                     >
//                       <ListItemText primary={term.name} secondary={`p-value: ${term.pValue.toExponential(2)}`} />
//                     </ListItemButton>
//                   ))}
//                 </List>
//               </AccordionDetails>
//             </Accordion>
//           ))}
//         </Grid>
        
//         {/* Right Panel: Visualization */}
//         <Grid item xs={12} md={7} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
//           {selectedTerm ? (
//             <GenePathwayNetwork term={selectedTerm} />
//           ) : (
//             <Box textAlign="center">
//                 <Typography variant="h6" color="text.secondary">Select a Term</Typography>
//                 <Typography color="text.secondary">Click on an enriched term from the list on the left to visualize its gene network.</Typography>
//             </Box>
//           )}
//         </Grid>

//       </Grid>
//     </Paper>
//   );
// };

// export default PathwayAnalysisView;

import React, { useState } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    IconButton, 
    Tabs, 
    Tab, 
    Grid, 
    Accordion, 
    AccordionSummary,
    AccordionDetails,
    List,
    ListItemButton,
    ListItemText,
    Chip
} from '@mui/material';
import { X, ChevronDown, Network } from 'lucide-react';
import GenePathwayNetwork from './GenePathwayNetwork'; 


interface PathwayAnalysisViewProps {
  analysisData?: {
    clusterName: string;
    enrichmentResults: Record<string, Record<string, any[]>>;
  };
  onClose?: () => void;
}

const PathwayAnalysisView: React.FC<PathwayAnalysisViewProps> = ({ 
  analysisData = {
    clusterName: "Cluster 1",
    enrichmentResults: {
      "BIOLOGICAL PROCESS": {
        "GO_Biological_Process": [
          { name: "Cell cycle regulation", pValue: 1.2e-15, genes: ["TP53", "RB1", "CDKN1A"] },
          { name: "DNA repair", pValue: 3.4e-12, genes: ["BRCA1", "ATM", "CHEK1"] },
          { name: "Apoptosis", pValue: 5.6e-10, genes: ["TP53", "BAX", "BCL2"] },
          { name: "Cell division", pValue: 7.8e-9, genes: ["CDK2", "CCND1", "E2F1"] }
        ],
        "KEGG_Pathway": [
          { name: "p53 signaling pathway", pValue: 2.1e-8, genes: ["TP53", "MDM2", "CDKN1A"] },
          { name: "Cell cycle", pValue: 4.3e-7, genes: ["RB1", "CDK2", "CCND1"] }
        ]
      },
      "MOLECULAR FUNCTION": {
        "GO_Molecular_Function": [
          { name: "Protein kinase activity", pValue: 1.5e-6, genes: ["CDK2", "ATM", "CHEK1"] },
          { name: "Transcription factor activity", pValue: 2.7e-5, genes: ["TP53", "E2F1"] }
        ]
      }
    }
  },
  onClose = () => {} 
}) => {
  const { clusterName, enrichmentResults } = analysisData;
  const categories = Object.keys(enrichmentResults);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedTerm(null);
  };

  const handleTermSelect = (termData: any) => {
    setSelectedTerm(termData);
  };
  
  const currentCategoryName = categories[activeTab];
  const libraries = enrichmentResults[currentCategoryName] || {};

  // return (
  //   <Paper 
  //     elevation={4} 
  //     sx={{ 
  //       padding: '10px',
  //       height: '100%', 
  //       display: 'flex', 
  //       flexDirection: 'column', 
  //       overflow: 'hidden',
  //       background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  //       borderRadius: '16px'
  //     }}
  //   >
  //     {/* Header */}
  //     <Box sx={{ 
  //       display: 'flex', 
  //       justifyContent: 'space-between', 
  //       alignItems: 'center', 
  //       // mb: 3, 
  //       flexShrink: 0,
  //       // pb: 2,
  //       borderBottom: '2px solid #e2e8f0'
  //     }}>
  //       <Typography variant="h6" sx={{ 
  //         fontWeight: 700,
  //         background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  //         backgroundClip: 'text',
  //         WebkitBackgroundClip: 'text',
  //         color: 'transparent'
  //       }}>
  //         Enrichment Analysis
  //       </Typography>
  //       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
  //         <Chip 
  //           label={clusterName} 
  //           sx={{ 
  //             background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  //             color: 'white',
  //             fontWeight: 600,
  //             fontSize: '14px',
  //             marginBottom:'5px'
  //           }} 
  //         />
  //         <IconButton 
  //           onClick={onClose}
  //           sx={{ 
  //             background: '#f1f5f9',
  //             '&:hover': { background: '#e2e8f0' }
  //           }}
  //         >
  //           <X size={20} />
  //         </IconButton>
  //       </Box>
  //     </Box>

  //     {/* Category Tabs */}
  //     <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, mb: 2 }}>
  //       <Tabs 
  //         value={activeTab} 
  //         onChange={handleTabChange} 
  //         variant="scrollable" 
  //         scrollButtons="auto"
  //         sx={{
  //           '& .MuiTab-root': {
  //             fontWeight: 600,
  //             textTransform: 'none',
  //             fontSize: '14px'
  //           },
  //           '& .MuiTabs-indicator': {
  //             background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  //             height: '3px',
  //             borderRadius: '2px'
  //           }
  //         }}
  //       >
  //         {categories.map(cat => <Tab label={cat.replace(/_/g, ' ')} key={cat} />)}
  //       </Tabs>
  //     </Box>

  //     {/* Main Content Grid */}
  //     <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>

  //       {/* Left Panel: Results - Much more compact */}
  //       <Grid item xs={12} md={4} lg={3.5} sx={{ 
  //         overflowY: 'auto', 
  //         height: '100%',
  //         '&::-webkit-scrollbar': {
  //           width: '6px',
  //         },
  //         '&::-webkit-scrollbar-track': {
  //           background: '#f1f5f9',
  //           borderRadius: '3px',
  //         },
  //         '&::-webkit-scrollbar-thumb': {
  //           background: '#cbd5e1',
  //           borderRadius: '3px',
  //         },
  //         '&::-webkit-scrollbar-thumb:hover': {
  //           background: '#94a3b8',
  //         },
  //       }}>
  //         {Object.entries(libraries).map(([libraryName, terms]) => (
  //           <Accordion 
  //             key={libraryName} 
  //             defaultExpanded
  //             sx={{
  //               mb: 1,
  //               background: 'white',
  //               borderRadius: '12px !important',
  //               boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  //               '&:before': { display: 'none' },
  //               overflow: 'hidden'
  //             }}
  //           >
  //             <AccordionSummary 
  //               expandIcon={<ChevronDown size={18} />}
  //               sx={{
  //                 background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  //                 minHeight: '48px !important',
  //                 '& .MuiAccordionSummary-content': {
  //                   margin: '8px 0 !important',
  //                   alignItems: 'center'
  //                 }
  //               }}
  //             >
  //               <Typography sx={{ 
  //                 fontWeight: 600, 
  //                 fontSize: '13px',
  //                 color: '#374151',
  //                 flex: 1
  //               }}>
  //                 {libraryName.replace(/_/g, ' ')}
  //               </Typography>
  //               <Chip 
  //                 label={terms.length} 
  //                 size="small" 
  //                 sx={{ 
  //                   height: '22px',
  //                   fontSize: '11px',
  //                   fontWeight: 600,
  //                   background: '#e0f2fe',
  //                   color: '#0369a1'
  //                 }} 
  //               />
  //             </AccordionSummary>
  //             <AccordionDetails sx={{ p: 0 }}>
  //               <List dense disablePadding>
  //                 {terms.map((term, index) => (
  //                   <ListItemButton 
  //                     key={term.name} 
  //                     onClick={() => handleTermSelect(term)}
  //                     selected={selectedTerm?.name === term.name}
  //                     sx={{
  //                       py: 1,
  //                       px: 2,
  //                       borderBottom: index < terms.length - 1 ? '1px solid #f1f5f9' : 'none',
  //                       '&.Mui-selected': {
  //                         background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
  //                         borderLeft: '3px solid #3b82f6'
  //                       },
  //                       '&:hover': {
  //                         background: '#f8fafc'
  //                       }
  //                     }}
  //                   >
  //                     <ListItemText 
  //                       primary={
  //                         <Typography sx={{ 
  //                           fontSize: '13px', 
  //                           fontWeight: 500,
  //                           color: '#1f2937',
  //                           lineHeight: 1.3
  //                         }}>
  //                           {term.name}
  //                         </Typography>
  //                       }
  //                       secondary={
  //                         <Typography sx={{ 
  //                           fontSize: '11px',
  //                           color: '#6b7280',
  //                           mt: 0.5
  //                         }}>
  //                           p = {term.pValue.toExponential(1)}
  //                         </Typography>
  //                       }
  //                     />
  //                   </ListItemButton>
  //                 ))}
  //               </List>
  //             </AccordionDetails>
  //           </Accordion>
  //         ))}
  //       </Grid>
        
  //       {/* Right Panel: Visualization - Much more space */}
  //       <Grid item xs={12} md={8} lg={8.5} sx={{ 
  //         display: 'flex', 
  //         alignItems: 'center', 
  //         justifyContent: 'center', 
  //         height: '100%',
  //         background: 'white',
  //         borderRadius: '16px',
  //         boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  //         p: 2
  //       }}>
  //         {selectedTerm ? (
  //           <GenePathwayNetwork term={selectedTerm} />
  //         ) : (
  //           <Box textAlign="center" sx={{ p: 4 }}>
  //             <Network size={64} style={{ 
  //               color: '#cbd5e1', 
  //               margin: '0 auto 24px' 
  //             }} />
  //             <Typography variant="h6" sx={{ 
  //               color: '#64748b',
  //               fontWeight: 600,
  //               mb: 1
  //             }}>
  //               Select a Pathway Term
  //             </Typography>
  //             <Typography sx={{ 
  //               color: '#94a3b8',
  //               fontSize: '14px',
  //               maxWidth: '300px',
  //               margin: '0 auto'
  //             }}>
  //               Click on an enriched term from the sidebar to visualize its gene network and explore pathway interactions.
  //             </Typography>
  //           </Box>
  //         )}
  //       </Grid>

  //     </Grid>
  //   </Paper>
  // );
  return (
    <Paper 
      elevation={4} 
      sx={{ 
        padding: '10px',
        paddingTop: '0px',
        height: '700px', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        background: '#f8fafc', // A clean, light background
        borderRadius: '12px',
      }}
    >
      {/* ✅ NEW: Single, streamlined header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        flexShrink: 0,
        // pb: 1.5,
        borderBottom: '1px solid #e2e8f0',
        marginBottom:'5px'
      }}>
        {/* Title and Cluster Name */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
          Enrichment Analysis
        </Typography>
        <Chip 
          label={clusterName} 
          size="small"
          sx={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }} 
        />
        
        {/* Tabs - They will expand to fill the space */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            flexGrow: 1, // This makes the tabs take up the available space
            '& .MuiTabs-indicator': {
              backgroundColor: '#3b82f6',
            }
          }}
        >
          {categories.map(cat => <Tab label={cat.replace(/_/g, ' ')} key={cat} sx={{textTransform: 'none', fontWeight: 500}}/>)}
        </Tabs>

        {/* Close Button */}
        <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
          <X size={20} />
        </IconButton>
      </Box>

 <Grid container sx={{ flexGrow: 1, overflow: 'hidden', height: '100%' }}>

       {/* Left Panel: Results - Very compact with minimal width */}
       <Grid item xs={12} md={2.5} lg={2} sx={{ 
        overflowY: 'auto', 
        height: '100%',
        pr: 1, // Small right padding for spacing from right panel
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f5f9',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#cbd5e1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#94a3b8',
        }
      }}>
         {Object.entries(libraries).map(([libraryName, terms]) => (
          <Accordion 
            key={libraryName} 
            defaultExpanded
            sx={{
              mb: 0.5, // Minimal bottom margin
              background: 'white',
              borderRadius: '8px !important',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:before': { display: 'none' },
              overflow: 'hidden'
            }}
          >
            <AccordionSummary 
              expandIcon={<ChevronDown size={18} />}
              sx={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                minHeight: '48px !important',
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0 !important',
                  alignItems: 'center'
                }
              }}
            >
              <Typography sx={{ 
                fontWeight: 600, 
                fontSize: '13px',
                color: '#374151',
                flex: 1
              }}>
                {libraryName.replace(/_/g, ' ')}
              </Typography>
              <Chip 
                label={terms.length} 
                size="small" 
                sx={{ 
                  height: '22px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#e0f2fe',
                  color: '#0369a1'
                }} 
              />
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List dense disablePadding>
                {terms.map((term, index) => (
                  <ListItemButton 
                    key={term.name} 
                    onClick={() => handleTermSelect(term)}
                    selected={selectedTerm?.name === term.name}
                    sx={{
                      py: 0.25, // Further reduced from 0.5 to 0.25
                      px: 0.75, // Further reduced from 1.5 to 0.75
                      minHeight: '35px', // Reduced from 40px to 35px
                      borderBottom: index < terms.length - 1 ? '1px solid #f1f5f9' : 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        borderLeft: '3px solid #3b82f6'
                      },
                      '&:hover': {
                        background: '#f8fafc'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography sx={{ 
                          fontSize: '13px', // Increased from 12px to 13px
                          fontWeight: 600, // Increased from 500 to 600
                          color: '#1f2937',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {term.name}
                        </Typography>
                      }
                      secondary={
                        <Typography sx={{ 
                          fontSize: '12px', // Increased from 11px to 12px
                          color: '#374151',
                          fontWeight: 700, // Made bold (increased from 500 to 700)
                          mt: 0.1 // Further reduced from 0.25 to 0.1
                        }}>
                          p-value: {term.pValue < 0.001 ? term.pValue.toExponential(2) : term.pValue.toFixed(4)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
      
      {/* Right Panel: Visualization - Maximum space */}
      <Grid item xs={12} md={9.5} lg={10} sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        // p: 2
      }}>
        {selectedTerm ? (
          <GenePathwayNetwork term={selectedTerm} />
        ) : (
          <Box textAlign="center" sx={{ p: 4 }}>
            <Network size={64} style={{ 
              color: '#cbd5e1', 
              margin: '0 auto 24px' 
            }} />
            <Typography variant="h6" sx={{ 
              color: '#64748b',
              fontWeight: 600,
              mb: 1
            }}>
              Select a Pathway Term
            </Typography>
            <Typography sx={{ 
              color: '#94a3b8',
              fontSize: '14px',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              Click on an enriched term from the sidebar to visualize its gene network and explore pathway interactions.
            </Typography>
          </Box>
        )}
      </Grid>

    </Grid>
    </Paper>
  );
};

export default PathwayAnalysisView;