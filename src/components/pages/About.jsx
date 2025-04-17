import React from "react";
import "./About.css";
import { Box, Typography } from "@mui/material";

const features = [
  { title: "Search", imgSrc: "search.png", description: "Quickly find patterns in your dataset using advanced search functionalities." },
  { title: "AI", imgSrc: "AIGif.gif", description: "Leverage AI-powered insights for clustering and sorting data efficiently." },
  { title: "Metadata", imgSrc: "metadata.png", description: "Enhance your analysis by integrating relevant metadata seamlessly." },
  { title: "Cluster", imgSrc: "clustering.png", description: "Group similar data points together using clustering algorithms for better insights." },
  { title: "Sort", imgSrc: "sorting.png", description: "Easily organize rows and columns by different criteria like variance or alphabetical order." },
  { title: "Download", imgSrc: "download.png", description: "Export your heatmap data and visualizations in multiple formats for further analysis." },
   // New Features
   { title: "Smart Cropping", imgSrc: "cropping.png", description: "Select and zoom into specific regions of the heatmap for detailed analysis." },
   { title: "Box Plots", imgSrc: "boxplot.png", description: "Visualize data distributions with interactive box plots for better comparisons." },
   { title: "Pathway Analysis", imgSrc: "pathway.png", description: "Identify biological pathways and correlations within your data by sending genes/biomarkers to Enrichr." },
   { title: "GPU Acceleration", imgSrc: "gpu.png", description: "Optimized for large matrices, enabling real-time visualization with GPU power." },
 
];

function About() {
  return (
    <>
      <div className="wrapper">
        <div className="extraSpace">
        <div className="circle-container">
            <h3 className="circleText">
            <span className="circleText-cluster">Cluster</span>
            <span className="circleText-chirp">Chirp</span>
            </h3>
            <img src="AIGif_2.gif" alt="Logo1" className="giflogo" />
        </div>
        </div> {/* Space on the left */}

        <div className="about">
          {/* Introduction Text */}
          <Typography
            sx={{
              textAlign: "justify",
              margin: "30px auto",
              marginTop: "5px",
              maxWidth: "90%",
              lineHeight: "1.1",
              fontWeight: "light",
              fontSize: "19px",
            }}
          >
            {/* <strong>About the Heatmap Tool</strong>
            <br /> */}
            Our heatmap tool is designed for visualizing complex tabular data in an intuitive way. It allows users to identify patterns, trends, and anomalies through interactive and AI-powered visualizations. Whether you're analyzing clinical data, financial reports, or biological datasets, our tool provides an efficient and insightful way to explore relationships within your data.
          </Typography>

          {/* Key Features Section */}
          <Box
            sx={{
              margin: "40px auto",
              textAlign: "center",
              maxWidth: "1200px",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                marginBottom: "20px",
                color: "rgba(0, 0, 0, 0.7)",
              }}
            >
              <strong>Key Features</strong>
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {features.map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "180px",
                    margin: "10px",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={feature.imgSrc}
                    alt={feature.title}
                    style={{ width: "80px", height: "80px", marginBottom: "10px" }}
                  />
                  <Typography
                    sx={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px" }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography sx={{ fontSize: "14px", color: "rgba(0, 0, 0, 0.7)" }}>
                    {feature.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </div>

        <div className="extraSpace"></div> {/* Space on the right */}
      </div>
    </>
  );
}

export default About;
