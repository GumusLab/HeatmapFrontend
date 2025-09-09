// import React, { useState } from 'react';
// import { Box, Typography, Card, CardMedia, CardContent, Grid, Container, Chip, IconButton } from '@mui/material';
// import { styled } from '@mui/material/styles';
// import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
// import DatasetIcon from '@mui/icons-material/Dataset';
// import ScienceIcon from '@mui/icons-material/Science';
// import BiotechIcon from '@mui/icons-material/Biotech';
// import AccountTreeIcon from '@mui/icons-material/AccountTree';
// import DnsIcon from '@mui/icons-material/Dns';
// import BarChartIcon from '@mui/icons-material/BarChart';
// import cptacProteomicsData from "../../data/cptac_proteomics.json";
// import HeatmapWrapper from "../../HeatmapWrapper"; 


// const StyledCard = styled(Card)(({ theme }) => ({
//   height: '100%',
//   cursor: 'pointer',
//   transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//   borderRadius: '12px',
//   overflow: 'hidden',
//   display: 'flex',
//   flexDirection: 'column',
//   '&:hover': {
//     transform: 'translateY(-8px) scale(1.02)',
//     boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
//   },
//   '&:hover .card-media': {
//     transform: 'scale(1.05)',
//   },
// }));

// const StyledCardMedia = styled(CardMedia)({
//   height: 200,
//   margin: '12px 12px 0 12px', // Add margin to make image smaller than card
//   borderRadius: '8px', // Round the image corners
//   transition: 'transform 0.3s ease',
//   backgroundSize: 'contain', // Changed from 'cover' to 'contain'
//   backgroundPosition: 'center',
//   backgroundRepeat: 'no-repeat',
//   backgroundColor: '#f5f5f5', // Light background for empty space
// });

// const IconWrapper = styled(Box)(({ theme }) => ({
//   display: 'inline-flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   width: 40,
//   height: 40,
//   borderRadius: '50%',
//   backgroundColor: theme.palette.primary.main,
//   color: 'white',
//   marginBottom: theme.spacing(2),
// }));

// const Examples = () => {
//   const examples = [
//     {
//       id: 1,
//       title: "Gene Expression Analysis",
//       icon: <ScienceIcon />,
//       image: "cptac_img.png",
//       description: "RNA-seq data from a cancer research study comparing tumor vs normal tissue samples. This dataset contains expression levels of 500+ genes across 50 patient samples, revealing distinct clustering patterns between cancerous and healthy tissue.",
//       studySource: "Nature Cancer Research, 2024",
//       dataPoints: "25,000+ data points",
//       category: "Genomics",
//       color: "#1976d2"
//     },
//     {
//       id: 2,
//       title: "Proteomics Abundance Matrix",
//       icon: <BiotechIcon />,
//       image: "proteomics.png",
//       description: "Mass spectrometry-based protein quantification across different treatment conditions. Dataset includes 2,000+ proteins measured in triplicate across 24 samples, showing differential protein expression and pathway enrichment patterns.",
//       studySource: "Journal of Proteome Research, 2024",
//       dataPoints: "48,000+ measurements",
//       category: "Proteomics",
//       color: "#7b1fa2",
//       data: cptacProteomicsData
//     },
//     {
//       id: 3,
//       title: "Single-Cell RNA Sequencing",
//       icon: <AccountTreeIcon />,
//       image: "https://via.placeholder.com/400x200/2e7d32/ffffff?text=scRNA-seq+Clusters",
//       description: "Single-cell transcriptomics data from human tissue samples revealing cellular heterogeneity. Analysis of 10,000+ cells with 3,000+ genes, identifying distinct cell populations and developmental trajectories through dimensionality reduction.",
//       studySource: "Nature Cell Biology, 2024",
//       dataPoints: "30M+ expression values",
//       category: "Single-Cell",
//       color: "#2e7d32"
//     },
//     {
//       id: 4,
//       title: "Metabolomics Pathway Analysis",
//       icon: <DnsIcon />,
//       image: "https://via.placeholder.com/400x200/f57c00/ffffff?text=Metabolomics+Network",
//       description: "LC-MS metabolomics profiling comparing healthy vs disease states. Comprehensive analysis of 800+ metabolites across 60 plasma samples, revealing disrupted metabolic pathways and potential biomarkers for early diagnosis.",
//       studySource: "Metabolomics Journal, 2024",
//       dataPoints: "48,000+ metabolite peaks",
//       category: "Metabolomics", 
//       color: "#f57c00"
//     },
//     {
//       id: 5,
//       title: "Epigenomic Chromatin States",
//       icon: <DatasetIcon />,
//       image: "https://via.placeholder.com/400x200/d32f2f/ffffff?text=ChIP-seq+Heatmap",
//       description: "ChIP-seq analysis of histone modifications across different cell types. Genome-wide profiling of H3K4me3, H3K27ac, and H3K27me3 marks revealing chromatin accessibility patterns and regulatory element activity in development.",
//       studySource: "Nature Genetics, 2024",
//       dataPoints: "500M+ genomic loci",
//       category: "Epigenomics",
//       color: "#d32f2f"
//     },
//     {
//       id: 6,
//       title: "Multi-Omics Integration",
//       icon: <BarChartIcon />,
//       image: "https://via.placeholder.com/400x200/0288d1/ffffff?text=Multi-Omics+Matrix",
//       description: "Integrated analysis combining transcriptomics, proteomics, and metabolomics data from the same cohort. Multi-layer molecular profiling of 200 samples revealing cross-omics correlations and systems-level biological insights.",
//       studySource: "Nature Methods, 2024",
//       dataPoints: "100,000+ multi-omics features",
//       category: "Multi-Omics",
//       color: "#0288d1"
//     }
//   ];

//   const handleExampleClick = (example) => {
//     // This will be implemented later for opening interactive heatmap
//     console.log(`Opening interactive heatmap for: ${example.title}`);
//     // You can integrate with your existing IndexedDB approach or routing system
//     alert(`Interactive heatmap for "${example.title}" will open here (to be implemented)`);
//   };

//   return (
//     <Box sx={{ 
//       minHeight: '100vh', 
//       backgroundColor: '#fafafa',
//       paddingTop: 4,
//       paddingBottom: 6
//     }}>
//       <Container maxWidth="xl">
//         {/* Header Section */}
//         <Box sx={{ textAlign: 'center', marginBottom: 6 }}>
//         <Typography
//             variant="h4"
//             component="h1"
//             sx={{
//               fontWeight: 'bold',
//               color: '#333',
//               marginBottom: 2,
//               fontSize: { xs: '1.5rem', md: '1.5rem' }
//             }}
//           >
//             ClusterChirp Examples
//           </Typography>
//           <Typography
//             variant="h6"
//             sx={{
//               color: '#666',
//               maxWidth: '1000px',
//               margin: '0 auto',
//               lineHeight: 1.6,
//               fontWeight: 'light'
//             }}
//           >
//             Discover the power of GPU-accelerated omics data visualization through real-world examples. 
//             Each showcase demonstrates AI-supported interactive exploration of high-dimensional biological datasets across various omics domains.
//           </Typography>
//         </Box>

//         {/* Examples Grid */}
//         <Grid container spacing={4}>
//           {examples.map((example) => (
//             <Grid item xs={12} md={6} lg={4} key={example.id}>
//               <StyledCard onClick={() => handleExampleClick(example)}>
//                 <StyledCardMedia
//                   className="card-media"
//                   image={example.image}
//                   title={example.title}
//                 />
//                 <CardContent sx={{ 
//                   padding: 3, 
//                   flex: 1, 
//                   display: 'flex', 
//                   flexDirection: 'column' 
//                 }}>
//                   {/* Category and Icon */}
//                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
//                     <Chip 
//                       label={example.category} 
//                       size="small" 
//                       sx={{ 
//                         backgroundColor: example.color + '20',
//                         color: example.color,
//                         fontWeight: 'medium'
//                       }} 
//                     />
//                     <IconWrapper sx={{ backgroundColor: example.color }}>
//                       {example.icon}
//                     </IconWrapper>
//                   </Box>

//                   {/* Title */}
//                   <Typography
//                     variant="h6"
//                     component="h3"
//                     sx={{
//                       fontWeight: 'bold',
//                       color: '#333',
//                       marginBottom: 2,
//                       fontSize: '1.25rem'
//                     }}
//                   >
//                     {example.title}
//                   </Typography>

//                   {/* Description */}
//                   <Typography
//                     variant="body2"
//                     sx={{
//                       color: '#666',
//                       lineHeight: 1.6,
//                       marginBottom: 3,
//                       flex: 1
//                     }}
//                   >
//                     {example.description}
//                   </Typography>

//                   {/* Study Info */}
//                   <Box sx={{ marginBottom: 2 }}>
//                     <Typography variant="caption" sx={{ color: '#888', display: 'block', marginBottom: 0.5 }}>
//                       <strong>Source:</strong> {example.studySource}
//                     </Typography>
//                     <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
//                       <strong>Scale:</strong> {example.dataPoints}
//                     </Typography>
//                   </Box>

//                   {/* Click Indicator */}
//                   <Box sx={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     justifyContent: 'space-between',
//                     paddingTop: 2,
//                     borderTop: '1px solid #eee'
//                   }}>
//                     <Typography
//                       variant="body2"
//                       sx={{
//                         color: '#1976d2',
//                         fontWeight: 'medium'
//                       }}
//                     >
//                       Click to explore
//                     </Typography>
//                     <IconButton
//                       size="small"
//                       sx={{
//                         backgroundColor: '#1976d2',
//                         color: 'white',
//                         '&:hover': {
//                           backgroundColor: '#1565c0',
//                         }
//                       }}
//                     >
//                       <ArrowForwardIcon fontSize="small" />
//                     </IconButton>
//                   </Box>
//                 </CardContent>
//               </StyledCard>
//             </Grid>
//           ))}
//         </Grid>

//         {/* Call to Action Section */}
//         <Box sx={{ 
//           textAlign: 'center', 
//           marginTop: 8,
//           padding: 4,
//           backgroundColor: 'white',
//           borderRadius: '12px',
//           boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
//           maxWidth: '1000px',
//           margin: '64px auto 0'
//         }}>
//           <Typography
//             variant="h5"
//             sx={{
//               fontWeight: 'bold',
//               color: '#333',
//               marginBottom: 2
//             }}
//           >
//             Ready to explore your omics data?
//           </Typography>
//           <Typography
//             variant="body1"
//             sx={{
//               color: '#666',
//               lineHeight: 1.6
//             }}
//           >
//             Upload your high-dimensional omics datasets to ClusterChirp and leverage our GPU-accelerated clustering algorithms 
//             with AI-supported interactive exploration. Discover hidden patterns in your genomics, proteomics, metabolomics, 
//             and multi-omics data with unprecedented speed and insight!
//           </Typography>
//         </Box>
//       </Container>
//     </Box>
//   );
// };

// export default Examples;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardMedia, CardContent, Grid, Container, Chip, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DatasetIcon from '@mui/icons-material/Dataset';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DnsIcon from '@mui/icons-material/Dns';
import BarChartIcon from '@mui/icons-material/BarChart';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';


// Import your actual datasets


const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  '&:hover .card-media': {
    transform: 'scale(1.05)',
  },
}));

const StyledCardMedia = styled(CardMedia)({
  height: 200,
  margin: '12px 12px 0 12px',
  borderRadius: '8px',
  transition: 'transform 0.3s ease',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#f5f5f5',
});

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  marginBottom: theme.spacing(2),
}));

const Examples = () => {
  const navigate = useNavigate();

  const examples = [
    {
      id: 1,
      routeId: "genomics", // This matches the route parameter
      title: "Gene Expression Analysis",
      icon: <ScienceIcon />,
      image: "genomics.png",
      description: "RNA-seq data from a cancer research study comparing tumor vs normal tissue samples. This dataset contains expression levels of 500+ genes across 50 patient samples, revealing distinct clustering patterns between cancerous and healthy tissue.",
      studySource: "Nature Cancer Research, 2024",
      dataPoints: "Around 3M data points",
      category: "Genomics",
      color: "#1976d2",
      hasData: true // Indicates this example has real data
    },
    {
      id: 2,
      routeId: "proteomics",
      title: "Proteomics Abundance Matrix",
      icon: <BiotechIcon />,
      image: "proteomics.png",
      description: "Mass spectrometry-based protein quantification across different treatment conditions. Dataset includes 10909 proteins measured in triplicate across 108 samples, showing differential protein expression and pathway enrichment patterns.",
      studySource: "Journal of Proteome Research, 2024",
      dataPoints: "1.18M+ measurements",
      category: "Proteomics",
      color: "#7b1fa2",
      hasData: true
    },
    {
      id: 3,
      routeId: "immunogenomics",
      title: "Immune Cell Transcriptomics",
      icon: <BloodtypeIcon />,
      image: "immvar.png",
      description: "Gene expression profiling of purified immune cells (CD4+ T cells and CD14+ monocytes) from healthy individuals across three ancestry groups. This population genetics study reveals how genetic variation shapes immune transcriptomes and disease susceptibility patterns.",
      studySource: "Harvard Medical School, Nature, 2014",
      dataPoints: "980+ samples, 20,000+ genes",
      category: "Immunogenomics",
      color: "#4caf50",
      hasData: true // Set to true when you have the data file
    },
    {
      id: 4,
      routeId: "single-cell", // Future implementation
      title: "Single-Cell RNA Sequencing",
      icon: <AccountTreeIcon />,
      image: "https://via.placeholder.com/400x200/2e7d32/ffffff?text=scRNA-seq+Clusters",
      description: "Single-cell transcriptomics data from human tissue samples revealing cellular heterogeneity. Analysis of 10,000+ cells with 3,000+ genes, identifying distinct cell populations and developmental trajectories through dimensionality reduction.",
      studySource: "Nature Cell Biology, 2024",
      dataPoints: "30M+ expression values",
      category: "Single-Cell",
      color: "#2e7d32",
      hasData: false // No data yet - show as "Coming Soon"
    },
    {
      id: 5,
      routeId: "metabolomics",
      title: "Metabolomics Pathway Analysis",
      icon: <DnsIcon />,
      image: "https://via.placeholder.com/400x200/f57c00/ffffff?text=Metabolomics+Network",
      description: "LC-MS metabolomics profiling comparing healthy vs disease states. Comprehensive analysis of 800+ metabolites across 60 plasma samples, revealing disrupted metabolic pathways and potential biomarkers for early diagnosis.",
      studySource: "Metabolomics Journal, 2024",
      dataPoints: "48,000+ metabolite peaks",
      category: "Metabolomics", 
      color: "#f57c00",
      hasData: false
    },
    {
      id: 6,
      routeId: "epigenomics",
      title: "Epigenomic Chromatin States",
      icon: <DatasetIcon />,
      image: "https://via.placeholder.com/400x200/d32f2f/ffffff?text=ChIP-seq+Heatmap",
      description: "ChIP-seq analysis of histone modifications across different cell types. Genome-wide profiling of H3K4me3, H3K27ac, and H3K27me3 marks revealing chromatin accessibility patterns and regulatory element activity in development.",
      studySource: "Nature Genetics, 2024",
      dataPoints: "500M+ genomic loci",
      category: "Epigenomics",
      color: "#d32f2f",
      hasData: false
    },
    {
      id: 7,
      routeId: "multi-omics",
      title: "Multi-Omics Integration",
      icon: <BarChartIcon />,
      image: "https://via.placeholder.com/400x200/0288d1/ffffff?text=Multi-Omics+Matrix",
      description: "Integrated analysis combining transcriptomics, proteomics, and metabolomics data from the same cohort. Multi-layer molecular profiling of 200 samples revealing cross-omics correlations and systems-level biological insights.",
      studySource: "Nature Methods, 2024",
      dataPoints: "100,000+ multi-omics features",
      category: "Multi-Omics",
      color: "#0288d1",
      hasData: false
    }
  ];

  const handleExampleClick = (example) => {
    if (example.hasData) {
      // Navigate to the example heatmap page with the route ID
      console.log(`Opening interactive heatmap for: ${example.title}`);
      navigate(`/example/${example.routeId}`);
    } else {
      // Show coming soon message for examples without data
      alert(`"${example.title}" is coming soon! We're working on adding more example datasets.`);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa',
      paddingTop: 4,
      paddingBottom: 6
    }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', marginBottom: 6 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 2,
              fontSize: { xs: '1.5rem', md: '1.5rem' }
            }}
          >
            ClusterChirp Examples
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              maxWidth: '1000px',
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 'light'
            }}
          >
            Discover the power of GPU-accelerated omics data visualization through real-world examples. 
            Each showcase demonstrates AI-supported interactive exploration of high-dimensional biological datasets across various omics domains.
          </Typography>
        </Box>

        {/* Examples Grid */}
        <Grid container spacing={4}>
          {examples.map((example) => (
            <Grid item xs={12} md={6} lg={4} key={example.id}>
              <StyledCard 
                onClick={() => handleExampleClick(example)}
                sx={{
                  opacity: example.hasData ? 1 : 0.7,
                  position: 'relative'
                }}
              >
                {/* Coming Soon Badge */}
                {!example.hasData && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 2,
                      backgroundColor: '#ff9800',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Coming Soon
                  </Box>
                )}

                <StyledCardMedia
                  className="card-media"
                  image={example.image}
                  title={example.title}
                />
                <CardContent sx={{ 
                  padding: 3, 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column' 
                }}>
                  {/* Category and Icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Chip 
                      label={example.category} 
                      size="small" 
                      sx={{ 
                        backgroundColor: example.color + '20',
                        color: example.color,
                        fontWeight: 'medium'
                      }} 
                    />
                    <IconWrapper sx={{ backgroundColor: example.color }}>
                      {example.icon}
                    </IconWrapper>
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 'bold',
                      color: '#333',
                      marginBottom: 2,
                      fontSize: '1.25rem'
                    }}
                  >
                    {example.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      lineHeight: 1.6,
                      marginBottom: 3,
                      flex: 1
                    }}
                  >
                    {example.description}
                  </Typography>

                  {/* Study Info */}
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="caption" sx={{ color: '#888', display: 'block', marginBottom: 0.5 }}>
                      <strong>Source:</strong> {example.studySource}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                      <strong>Scale:</strong> {example.dataPoints}
                    </Typography>
                  </Box>

                  {/* Click Indicator */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    paddingTop: 2,
                    borderTop: '1px solid #eee'
                  }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: example.hasData ? '#1976d2' : '#ff9800',
                        fontWeight: 'medium'
                      }}
                    >
                      {example.hasData ? 'Click to explore' : 'Coming soon'}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{
                        backgroundColor: example.hasData ? '#1976d2' : '#ff9800',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: example.hasData ? '#1565c0' : '#f57c00',
                        }
                      }}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action Section */}
        <Box sx={{ 
          textAlign: 'center', 
          marginTop: 8,
          padding: 4,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          maxWidth: '1000px',
          margin: '64px auto 0'
        }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: '#333',
              marginBottom: 2
            }}
          >
            Ready to explore your omics data?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              lineHeight: 1.6
            }}
          >
            Upload your high-dimensional omics datasets to ClusterChirp and leverage our GPU-accelerated clustering algorithms 
            with AI-supported interactive exploration. Discover hidden patterns in your genomics, proteomics, metabolomics, 
            and multi-omics data with unprecedented speed and insight!
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Examples;