// components/pages/Home.jsx
import React, { useState } from "react";
import "./Home.css";
import HeatmapWrapper from "../../HeatmapWrapper"; // Adjust path as needed
import { Box, Button, Typography } from "@mui/material";
import defaultData from "../../data/top_250.json";
import sinaiLogo from './Mount_Sinai_hospital_logo.png';


function Home() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    event.target.value = '';

    setIsProcessing(true);
    console.log("Selected file:", file);
    
    // Store the file in IndexedDB
    const request = indexedDB.open("HeatmapDB", 1);
    
    request.onupgradeneeded = function(event) {
      const db = event.target.result;
      // Create an object store if it doesn't exist
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");
      
      // Generate a unique key for the file
      const fileKey = `file_${Date.now()}`;
      
      // Store the actual File object
      const storeRequest = store.put(file, fileKey);
      
      storeRequest.onsuccess = function() {
        // Open a new tab with a reference to the file
        // window.open(`/heatmap?fileKey=${encodeURIComponent(fileKey)}`, '_blank');
        window.open(`heatmap?fileKey=${encodeURIComponent(fileKey)}`, '_blank');
        // window.open(`/clusterchirp-test/heatmap?fileKey=${encodeURIComponent(fileKey)}`, '_blank');

        setIsProcessing(false);
      };
      
      storeRequest.onerror = function(error) {
        console.error("Error storing file:", error);
        alert("Failed to prepare the file for visualization. Please try again.");
        setIsProcessing(false);
      };
    };
    
    request.onerror = function(error) {
      console.error("Error opening IndexedDB:", error);
      alert("Failed to prepare the file for visualization. Please try again.");
      setIsProcessing(false);
    };
  };

  // Handler for showing sample data in a new tab
  const handleShowSampleData = () => {
    // Open a new tab with sample data page
    // window.open('/sample-data', '_blank');
    window.open('sample-data', '_blank');
    // window.open('/clusterchirp-test/sample-data', '_blank');


  };

  // defaultData = null

  // Your existing JSX for the Home component
  return (
    <>
      <div className="wrapper">
        <div className="extraSpace">
          {/* <div className="circle-container">
            <h3 className="circleText">
              <span className="circleText-cluster">Cluster</span>
              <span className="circleText-chirp">Chirp</span>
            </h3>
            <img src="clusterChirp_icon.svg" alt="Logo1" className="giflogo" />
          </div> */}
        </div>
        
        <div className="home">
          {/* Introduction Text */}
          <Typography
            sx={{
              textAlign: "justify",
              margin: "30px auto",
              marginBottom: "10px",
              marginTop:"-5px",
              maxWidth: "90%",
              lineHeight: "1.1",
              fontWeight:'light',
              fontSize:'18px'
            }}
          >
            <strong>Welcome to ClusterChirp!</strong> Upload your tabular data to perform on-the-fly clustering and uncover patterns, trends, and anomalies.
            Interact directly with the visualizations—or explore your data using our built-in AI chatbot! Powerful analytics with an intuitive user interface.
            {/* <strong>Welcome to ClusterChirp!</strong>  Upload your data to perform on-the fly clustering and uncover patterns, trends, and anomalies. Interact directly with visualizations or explore using our built-in AI chatbot. Powerful analytics, intuitive interface. */}
          </Typography>
          <Box
            sx={{
              height: "calc(100vh - 200px)",
              width: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              // ✅ Alternative: Use CSS custom properties
              overflow: "auto",
              "&": {
                // ✅ Force scrollbar using CSS custom properties
                "--webkit-scrollbar-width": "12px",
                scrollbarWidth: "12px",
                overflowY: "scroll !important",
              },
              "&::-webkit-scrollbar": {
                width: "12px !important",
                backgroundColor: "#e1e1e1 !important",
                position: "relative !important",
                zIndex: "9999 !important",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888 !important",
                borderRadius: "8px !important",
                minHeight: "40px !important",
              },
            }}
          >
           <HeatmapWrapper
              data={defaultData}
              // id="rnaSeq"
              id="defaultheatmap"
              fileSelectedFlag={false}
              homepage={true}
            />
          </Box>

          {/* Upload & Try Demo Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "2px",
            }}
          >
              
            <input
              type="file"
              accept=".csv, .tsv, .xlsx, .json"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                color="primary"
                component="span"
                disabled={isProcessing}
                sx={{
                  padding: "10px 20px",
                  fontSize: "16px",
                }}
              >
                {isProcessing ? "Processing..." : "Upload Data"}
              </Button>
            </label>

            {/* Sample Data Button */}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleShowSampleData}
              sx={{
                padding: "10px 20px",
                fontSize: "16px",
              }}
            >
              Data Format
            </Button>
          </Box>

          {/* Free Access Statement - Required for NAR Web Server Issue */}
          <Typography
            sx={{
              textAlign: "center",
              margin: "5px auto",
              fontSize: "14px",
              color: "#666",
              fontStyle: "italic"
            }}
          >
            ClusterChirp is freely available for all users. No registration required.
          </Typography>
        </div>

        <div className="extraSpace">
        </div>
      </div>
    </>
  );
}

export default Home;