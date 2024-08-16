import React, { useEffect, useState } from "react";
import "./Home.css";
import heatmap from "./heatmap.png";
import HeatmapWrapper from "../../HeatmapWrapper";
import {processHeatmapData} from "../../backendApi/heatmapData"

import * as d from '../../data/cytof_data_patient.json';


function Home() {
  const [selectedFile, setSelectedFile] = useState(d);

  useEffect(() => {
    if (selectedFile) {
      // Send the file via HTTP request
      processHeatmapData(selectedFile)
        .then((response) => {
          console.log("Received response:", response);
          // Handle the response (e.g., update the heatmap)
        })
        .catch((error) => {
          console.error("Error processing heatmap data:", error);
        });
    }
  }, [selectedFile]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    console.log("Selected file:", event.target.files[0]);
  };

  return (
    <>
      <div className="wrapper">
        <div className="border"></div>
        <div className="home">
          <div className="header">
            <p>
              <strong>VizArDS</strong> is a webtool that allows for easy
              creation of heatmaps for visualization, exploration, and analysis
              of large datasets.
            </p>
          </div>
          <div className="body">
            <div className="input-box">
              <div className="input-text">Input Data Here!</div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <button
                  onClick={() =>
                    document.getElementById("file-upload").click()
                  }
                >
                  Select file
                </button>
              </label>
              {selectedFile && <p>File selected: {selectedFile.name}</p>}
            </div>

            <div className="heatmap">
              <HeatmapWrapper d={selectedFile}/>
            </div>
          </div>
        </div>
        <div className="border"></div>
      </div>
    </>
  );
}

export default Home;
