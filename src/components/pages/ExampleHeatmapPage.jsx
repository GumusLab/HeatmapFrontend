// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import HeatmapWrapper from "../../HeatmapWrapper";
// import { 
//   Box, 
//   Button, 
//   Typography, 
//   Chip, 
//   IconButton, 
//   Tooltip,
//   Divider,
//   Paper,
//   Stack,
//   Avatar,
//   useTheme,
//   alpha,
//   CircularProgress
// } from "@mui/material";
// import { 
//   ArrowBack, 
//   Info, 
//   Science, 
//   Biotech,
//   Download,
//   Share,
//   DataUsage,
//   Timeline,
//   People,
//   School
// } from "@mui/icons-material";
// import BloodtypeIcon from '@mui/icons-material/Bloodtype';
// import { loadExampleData } from '../../backendApi/heatmapData'; // Updated import

// // Example configurations - no data imports needed anymore
// const EXAMPLES_CONFIG = {
//   "genomics": {
//     id: "genomics",
//     title: "Gene Expression Analysis",
//     subtitle: "RNA-seq Cancer Research Study",
//     icon: <Science sx={{ fontSize: 28, color: "#ffffff" }} />,
//     description: "Comprehensive RNA-seq analysis comparing tumor vs normal tissue samples revealing distinct clustering patterns between cancerous and healthy tissue",
//     category: "Genomics",
//     color: "#1E90FF",
//     gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
//     dataPoints: "3M+ measurements",
//     studySource: "Nature Cancer Research, 2024",
//     sampleSize: "97 patients",
//     dataType: "RNA-seq Expression",
//     methodology: "Illumina NovaSeq 6000"
//   },
//   "proteomics": {
//     id: "proteomics", 
//     title: "Proteomics Abundance Matrix",
//     subtitle: "Mass Spectrometry Protein Quantification",
//     icon: <Biotech sx={{ fontSize: 28, color: "#ffffff" }} />,
//     description: "Advanced mass spectrometry-based protein quantification across multiple treatment conditions showing differential protein expression and pathway enrichment",
//     category: "Proteomics", 
//     color: "#1E90FF",
//     gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
//     dataPoints: "1.18M+ measurements",
//     studySource: "Journal of Proteome Research, 2024", 
//     sampleSize: "108 samples",
//     dataType: "MS/MS Quantification",
//     methodology: "Orbitrap Fusion Lumos"
//   },
//   "immunogenomics": {
//     id: "immunogenomics",
//     title: "Immune Cell Transcriptomics",
//     subtitle: "Population Genetics & Immune Variation",
//     icon: <BloodtypeIcon sx={{ fontSize: 28, color: "#ffffff" }} />,
//     description: "Gene expression profiling of purified immune cells (CD4+ T cells and CD14+ monocytes) from healthy individuals across three ancestry groups revealing genetic architecture of immune transcriptomes",
//     category: "Immunogenomics",
//     color: "#4CAF50",
//     gradient: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
//     dataPoints: "19.6M+ measurements",
//     studySource: "Harvard Medical School, Nature, 2014",
//     sampleSize: "980+ individuals",
//     dataType: "Microarray Expression",
//     methodology: "Affymetrix Human Gene 1.0 ST"
//   }
// };

// function ExampleHeatmapPage() {
//   const { exampleId } = useParams();
//   const navigate = useNavigate();
//   const theme = useTheme();
//   const [example, setExample] = useState(null);
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [sessionId, setSessionId] = useState(null);

//   // NEW: Load data using backend API
//   const loadDataFromBackend = async (id) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       console.log(`🔄 Loading data from backend for: ${id}`);
      
//       // Call your backend API
//       const response = await loadExampleData(id);
      
//       console.log(`📡 Backend response:`, response);
      
//       if (!response.success) {
//         throw new Error(response.error || 'Failed to load dataset from backend');
//       }
      
//       console.log(`✅ Successfully loaded data from backend for: ${id}`, {
//         hasData: !!response.data,
//         dataKeys: Object.keys(response.data || {}),
//         fileSize: response.file_size_mb,
//         sampleCount: response.data?.data?.length || 'unknown'
//       });
      
//       setData(response.data);
//       return response.data;
      
//     } catch (err) {
//       console.error(`❌ Error loading data from backend for ${id}:`, err);
//       setError(err.message);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     console.log("🔥 ExampleHeatmapPage Mounted for:", exampleId);
    
//     // Get example configuration
//     const exampleConfig = EXAMPLES_CONFIG[exampleId];
    
//     if (!exampleConfig) {
//       console.error("Example not found:", exampleId);
//       navigate("/example");
//       return;
//     }
    
//     setExample(exampleConfig);
    
//     // NEW: Load data from backend instead of public folder
//     loadDataFromBackend(exampleId);
    
//     // Set page title
//     document.title = `ClusterChirp - ${exampleConfig.title}`;
    
//     return () => {
//       console.log("🗑️ ExampleHeatmapPage Unmounted");
//     };
//   }, [exampleId, navigate]);

//   const handleBackToExamples = () => {
//     navigate("/example");
//   };

//   const handleDownload = () => {
//     if (!data) {
//       console.warn("No data available for download");
//       return;
//     }
    
//     // Create downloadable link for the data
//     const dataStr = JSON.stringify(data, null, 2);
//     const dataBlob = new Blob([dataStr], { type: 'application/json' });
//     const url = URL.createObjectURL(dataBlob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `${example.id}_dataset.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   const handleShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: example.title,
//           text: example.description,
//           url: window.location.href,
//         });
//       } catch (err) {
//         console.log('Error sharing:', err);
//       }
//     } else {
//       // Fallback: copy URL to clipboard
//       navigator.clipboard.writeText(window.location.href);
//       // You could add a toast notification here
//     }
//   };

//   // Loading state
//   if (!example || loading) {
//     return (
//       <Box sx={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column',
//         gap: 2
//       }}>

//         <CircularProgress size={48} />
//         <Typography>
//           {!example ? "Loading example..." : "Loading dataset from backend..."}
//         </Typography>
//         {loading && example && (
//           <Typography variant="body2" color="textSecondary">
//             Fetching {example.title} data from server...
//           </Typography>
//         )}
//       </Box>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <Box sx={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh',
//         flexDirection: 'column',
//         gap: 2
//       }}>
//         <Typography variant="h6" color="error">
//           Failed to load dataset
//         </Typography>
//         <Typography variant="body2" color="textSecondary">
//           {error}
//         </Typography>
//         <Stack direction="row" spacing={2}>
//           <Button 
//             variant="outlined" 
//             onClick={() => loadDataFromBackend(exampleId)}
//           >
//             Retry
//           </Button>
//           <Button 
//             variant="contained" 
//             onClick={handleBackToExamples}
//           >
//             Back to Examples
//           </Button>
//         </Stack>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ 
//       height: '100vh', 
//       display: 'flex', 
//       flexDirection: 'column',
//       background: `linear-gradient(135deg, ${alpha(example.color, 0.03)} 0%, ${alpha(example.color, 0.01)} 100%)`
//     }}>

//       {/* Beautiful Header */}
//       <Paper 
//         elevation={0}
//         sx={{
//           background: example.gradient,
//           color: 'white',
//           position: 'relative',
//           overflow: 'hidden',
//           '&::before': {
//             content: '""',
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
//             opacity: 0.3
//           }
//         }}
//       >
          
//         <Box sx={{ 
//           position: 'relative', 
//           zIndex: 1,
//           padding: '12px 24px'
//         }}>
//           {/* Top Navigation */}
//           <Box sx={{ 
//             display: 'flex', 
//             alignItems: 'center', 
//             justifyContent: 'space-between',
//             mb: 1
//           }}>
//             {/* <Button
//               startIcon={<ArrowBack />}
//               onClick={handleBackToExamples}
//               sx={{ 
//                 color: 'white',
//                 fontSize: '0.85rem',
//                 '&:hover': { 
//                   backgroundColor: alpha('#ffffff', 0.1) 
//                 }
//               }}
//             >
//               Back to Examples
//             </Button> */}

//             <Stack direction="row" spacing={1}>
//               <Tooltip title="Download Dataset">
//                 <IconButton 
//                   onClick={handleDownload}
//                   size="small"
//                   disabled={!data}
//                   sx={{ 
//                     color: 'white',
//                     '&:hover': { backgroundColor: alpha('#ffffff', 0.1) },
//                     '&:disabled': { color: alpha('#ffffff', 0.5) }
//                   }}
//                 >
//                   <Download fontSize="small" />
//                 </IconButton>
//               </Tooltip>
//               <Tooltip title="Share">
//                 <IconButton 
//                   onClick={handleShare}
//                   size="small"
//                   sx={{ 
//                     color: 'white',
//                     '&:hover': { backgroundColor: alpha('#ffffff', 0.1) }
//                   }}
//                 >
//                   <Share fontSize="small" />
//                 </IconButton>
//               </Tooltip>
//             </Stack>
//           </Box>

//           {/* Main Header Content - Horizontal Layout */}
//           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
//               <Avatar 
//                 sx={{ 
//                   width: 50,
//                   height: 50,
//                   background: alpha('#ffffff', 0.2),
//                   backdropFilter: 'blur(10px)',
//                   border: '2px solid rgba(255,255,255,0.3)'
//                 }}
//               >
//                 {example.icon}
//               </Avatar>

//               <Box sx={{ flex: 1 }}>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
//                   <Typography variant="h6" component="h1" sx={{
//                     fontWeight: 700,
//                     textShadow: '0 2px 4px rgba(0,0,0,0.2)'
//                   }}>
//                     {example.title}
//                   </Typography>
//                   <Chip
//                     label={example.category}
//                     size="small"
//                     sx={{
//                       backgroundColor: alpha('#ffffff', 0.2),
//                       color: 'white',
//                       fontWeight: 600,
//                       backdropFilter: 'blur(10px)'
//                     }}
//                   />
//                   <Chip
//                     label="Backend Loaded"
//                     size="small"
//                     sx={{
//                       backgroundColor: alpha('#4CAF50', 0.8),
//                       color: 'white',
//                       fontWeight: 500,
//                       fontSize: '0.7rem'
//                     }}
//                   />
//                 </Box>
                
//                 <Typography variant="body2" sx={{
//                   opacity: 0.9, 
//                   fontWeight: 400,
//                   mb: 0.5
//                 }}>
//                   {example.subtitle}
//                 </Typography>
                
//                 <Typography variant="caption" sx={{
//                   opacity: 0.85,
//                   maxWidth: '500px',
//                   lineHeight: 1.4,
//                   display: 'block'
//                 }}>
//                   {example.description}
//                 </Typography>
//               </Box>
//             </Box>

//             {/* Right Side: Stats in Compact Grid */}
//             <Box sx={{ 
//               display: 'grid',
//               gridTemplateColumns: 'repeat(2, 1fr)',
//               gap: 2,
//               minWidth: '300px'
//             }}>
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <DataUsage sx={{ fontSize: 16, opacity: 0.8 }} />
//                 <Box>
//                   <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>
//                     Data Points
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
//                     {example.dataPoints}
//                   </Typography>
//                 </Box>
//               </Box>

//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <People sx={{ fontSize: 16, opacity: 0.8 }} />
//                 <Box>
//                   <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>
//                     Sample Size
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
//                     {example.sampleSize}
//                   </Typography>
//                 </Box>
//               </Box>

//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Timeline sx={{ fontSize: 16, opacity: 0.8 }} />
//                 <Box>
//                   <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>
//                     Method
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
//                     {example.methodology}
//                   </Typography>
//                 </Box>
//               </Box>

//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <School sx={{ fontSize: 16, opacity: 0.8 }} />
//                 <Box>
//                   <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }}>
//                     Source
//                   </Typography>
//                   <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
//                     {example.studySource.split(',')[0]}
//                   </Typography>
//                 </Box>
//               </Box>
//             </Box>
//           </Box>
//         </Box>
//       </Paper>

//       {/* Heatmap Container */}
//       <Box
//         sx={{
//           flex: 1,
//           position: "relative",
//           overflow: "hidden",
//           backgroundColor: '#fafafa'
//         }}
//       >
//         {/* Subtle border */}
//         <Box sx={{ 
//           height: '2px', 
//           background: example.gradient,
//           opacity: 0.7
//         }} />
        
//         <Box
//           sx={{
//             height: "100%",
//             width: "100%",
//             overflow: "auto",
//             position: "relative",
//             display: "flex",
//             flexDirection: "column",
//             // Custom scrollbar styling
//             "&::-webkit-scrollbar": {
//               width: "12px",
//               height: "12px"
//             },
//             "&::-webkit-scrollbar-track": {
//               backgroundColor: "#f1f1f1",
//               borderRadius: "6px"
//             },
//             "&::-webkit-scrollbar-thumb": {
//               backgroundColor: example.color,
//               borderRadius: "6px",
//               opacity: 0.7,
//               "&:hover": {
//                 backgroundColor: example.color,
//                 opacity: 1
//               }
//             }
//           }}
//         >
//           {data ? (
//             <HeatmapWrapper
//               data={data}
//               id={`${example.id}`}
//               fileSelectedFlag={false}
//               homepage={true}
//             />
//           ) : (
//             <Box sx={{ 
//               display: 'flex', 
//               justifyContent: 'center', 
//               alignItems: 'center', 
//               height: '100%' 
//             }}>
//               <Typography>No data available</Typography>
//             </Box>
//           )}
//         </Box>
//       </Box>
//     </Box>
//   );
// }

// export default ExampleHeatmapPage;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeatmapWrapper from "../../HeatmapWrapper";
import { 
  Box, 
  Button, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Divider,
  Paper,
  Stack,
  Avatar,
  useTheme,
  alpha,
  CircularProgress,
  Link
} from "@mui/material";
import { 
  ArrowBack, 
  Info, 
  Science, 
  Biotech,
  Download,
  Share,
  DataUsage,
  Timeline,
  People,
  School
} from "@mui/icons-material";
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import { loadExampleData } from '../../backendApi/heatmapData';

// Example configurations
const EXAMPLES_CONFIG = {
  "genomics": {
    id: "genomics",
    title: "Gene Expression Analysis",
    subtitle: "CPTAC RNA-seq Lung Cancer Study",
    icon: <Science sx={{ fontSize: 28, color: "#ffffff" }} />,
    description: "CPTAC RNA-seq whole transcriptome analysis of lung cancer tumor samples revealing distinct gene expression patterns",
    category: "Genomics",
    color: "#1E90FF",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
    dataPoints: "30,931 genes × 98 samples (~3M measurements)",
    studySource: "CPTAC - Clinical Proteomic Tumor Analysis Consortium",
    sampleSize: "98 samples",
    dataType: "RNA-seq Expression",
    methodology: "Illumina NovaSeq 6000",
    paperLink:"https://www.cell.com/cancer-cell/fulltext/S1535-6108(23)00219-2"
  },
  "proteomics": {
    id: "proteomics",
    title: "Proteomics Abundance Matrix",
    subtitle: "Mass Spectrometry Protein Quantification",
    icon: <Biotech sx={{ fontSize: 28, color: "#ffffff" }} />,
    description: "CPTAC mass spectrometry-based protein quantification from tumor samples showing differential expression patterns",
    category: "Proteomics",
    color: "#1E90FF",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
    dataPoints: "10,908 proteins × 109 samples (~1.19M measurements)",
    studySource: "CPTAC - Clinical Proteomic Tumor Analysis Consortium",
    sampleSize: "109 samples",
    dataType: "MS/MS Quantification",
    methodology: "Orbitrap Fusion Lumos",
    paperLink:"https://www.cell.com/cancer-cell/fulltext/S1535-6108(23)00219-2"

  },
  "immunogenomics": {
    id: "immunogenomics",
    title: "Immune Cell Transcriptomics",
    subtitle: "Population Genetics & Immune Variation",
    icon: <BloodtypeIcon sx={{ fontSize: 28, color: "#ffffff" }} />,
    description: "Gene expression profiling of purified immune cells (CD4+ T cells and CD14+ monocytes) from healthy individuals across three ancestry groups revealing genetic architecture of immune transcriptomes",
    category: "Immunogenomics",
    color: "#1E90FF",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
    dataPoints: "21,219 genes × 985 samples (~20.9M measurements)",
    studySource: "ImmVar Project - Harvard Medical School, Nature, 2014",
    sampleSize: "985 individuals",
    dataType: "Microarray Expression",
    methodology: "Affymetrix Human Gene 1.0 ST",
    paperLink:"https://pubmed.ncbi.nlm.nih.gov/24786080/"
  },
  "gu16257_data": {
    id: "gu16257_data",
    title: "Clinical Proteomics - Immunotherapy",
    subtitle: "Olink PEA Immune Biomarker Profiling",
    icon: <Biotech sx={{ fontSize: 28, color: "#ffffff" }} />,
    description: "Immune biomarker profiling in cancer immunotherapy patients using Olink PEA technology",
    category: "Proteomics",
    color: "#1E90FF",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
    dataPoints: "196 samples × 77 proteins (15,092 measurements)",
    studySource: "Cancer Immunotherapy Clinical Trial, 2024",
    sampleSize: "196 samples",
    dataType: "Olink PEA",
    methodology: "Proximity Extension Assay",
    paperLink: "https://pubmed.ncbi.nlm.nih.gov/37783966/"
  },
  "mIHC_data": {
    id: "mIHC_data",
    title: "Spatial Proteomics - Tumor Microenvironment",
    subtitle: "Multiplexed Immunohistochemistry Single-Cell Analysis",
    icon: <Biotech sx={{ fontSize: 28, color: "#ffffff" }} />,
    description: "mIHC single-cell spatial proteomics from 6 cancer patients with 8 cell types and 8 protein markers.",
    category: "Spatial Proteomics",
    color: "#1E90FF",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #4FB3FF 100%)",
    dataPoints: "1,202 cells × 32 features (38,464 measurements)",
    studySource: "Spatial Proteomics Research, 2024",
    sampleSize: "1,202 cells (6 patients)",
    dataType: "mIHC Spatial Proteomics",
    methodology: "Multiplexed Immunohistochemistry",
    paperLink: "https://www.nature.com/articles/s41551-025-01475-9"
  }
};

function ExampleHeatmapPage() {
  const { exampleId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [example, setExample] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [filteredStats, setFilteredStats] = useState(null);

  // Load data using backend API
  const loadDataFromBackend = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Loading data from backend for: ${id}`);
      
      // Call your backend API
      const response = await loadExampleData(id);
      
      console.log(`📡 Backend response:`, response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load dataset from backend');
      }
      
      console.log(`✅ Successfully loaded data from backend for: ${id}`, {
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {}),
        fileSize: response.file_size_mb,
        sampleCount: response.data?.data?.length || 'unknown'
      });
      
      setData(response.data);
      return response.data;
      
    } catch (err) {
      console.error(`❌ Error loading data from backend for ${id}:`, err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔥 ExampleHeatmapPage Mounted for:", exampleId);
    
    // Get example configuration
    const exampleConfig = EXAMPLES_CONFIG[exampleId];
    
    if (!exampleConfig) {
      console.error("Example not found:", exampleId);
      navigate("/example");
      return;
    }
    
    setExample(exampleConfig);
    
    // Load data from backend
    loadDataFromBackend(exampleId);
    
    // Set page title
    document.title = `ClusterChirp - ${exampleConfig.title}`;
    
    return () => {
      console.log("🗑️ ExampleHeatmapPage Unmounted");
    };
  }, [exampleId, navigate]);

  const handleBackToExamples = () => {
    navigate("/example");
  };

  const handleDownload = () => {
    if (!data) {
      console.warn("No data available for download");
      return;
    }
    
    // Create downloadable link for the data
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${example.id}_dataset.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: example.title,
          text: example.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleStatsUpdate = (stats) => {
    console.log('📊 Stats updated:', stats);
    setFilteredStats(stats);
  };

  // Loading state
  if (!example || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={48} />
        <Typography>
          {!example ? "Loading example..." : "Loading dataset from backend..."}
        </Typography>
        {loading && example && (
          <Typography variant="body2" color="textSecondary">
            Fetching {example.title} data from server...
          </Typography>
        )}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6" color="error">
          Failed to load dataset
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {error}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            onClick={() => loadDataFromBackend(exampleId)}
          >
            Retry
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBackToExamples}
          >
            Back to Examples
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: `linear-gradient(135deg, ${alpha(example.color, 0.03)} 0%, ${alpha(example.color, 0.01)} 100%)`
    }}>
      {/* Compact Header */}
      <Paper 
        elevation={0}
        sx={{
          background: example.gradient,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          },
          marginTop:9
        }}
      >
        <Box sx={{ 
          position: 'relative', 
          zIndex: 1,
          // padding: '16px 24px'
          paddingLeft: '10px',
          paddingRight: '10px'
        }}>
          {/* Single Row Layout */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 3
          }}>
            {/* Left Side: Description only */}
            <Box sx={{ flex: 1 }}>
            <Link 
                href={example.paperLink} 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  textDecoration: 'none', // Removes the default underline
                  color: 'inherit'        // Makes the link inherit the color of the Typography text
                }}
              >
              <Typography variant="body2" sx={{
                opacity: 0.95,
                lineHeight: 1.4,
                fontSize: '0.9rem',
                maxWidth: '900px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {example.description}
              </Typography>
              </Link>
            </Box>

            {/* Center-Right: Sample Size and Data Points */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              marginRight: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Arial, sans-serif' }}>
                Sample Size: {example.sampleSize} &nbsp;&nbsp;|&nbsp;&nbsp; Data Points: {example.dataPoints}
              </Typography>
            </Box>

            {/* Right Side: Download and Share buttons */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download Dataset">
                <IconButton 
                  onClick={handleDownload}
                  size="small"
                  disabled={!data}
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: alpha('#ffffff', 0.1) },
                    '&:disabled': { color: alpha('#ffffff', 0.5) }
                  }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton 
                  onClick={handleShare}
                  size="small"
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: alpha('#ffffff', 0.1) }
                  }}
                >
                  <Share fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Heatmap Container */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          backgroundColor: '#fafafa'
        }}
      >
        {/* Subtle border */}
        <Box sx={{ 
          height: '2px', 
          background: example.gradient,
          opacity: 0.7
        }} />
        
        <Box
          sx={{
            height: "100%",
            width: "100%",
            overflow: "auto",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            // Custom scrollbar styling
            "&::-webkit-scrollbar": {
              width: "12px",
              height: "12px"
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "6px"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: example.color,
              borderRadius: "6px",
              opacity: 0.7,
              "&:hover": {
                backgroundColor: example.color,
                opacity: 1
              }
            }
          }}
        >
          {data ? (
            <HeatmapWrapper
              data={data}
              id={`${example.id}`}
              fileSelectedFlag={false}
              homepage={true}
              onStatsUpdate={handleStatsUpdate}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <Typography>No data available</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ExampleHeatmapPage;