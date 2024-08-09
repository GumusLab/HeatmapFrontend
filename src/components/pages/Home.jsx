import React from "react";
import "./Home.css";
import heatmap from "./heatmap.png";
import HeatmapWrapper from "../../HeatmapWrapper";

function Home() {
  return (
    <>
      <div className="wrapper">
        <div className='border'></div>
        <div className="home">
          <div className="header">
            <p>
              <strong> VizArDS</strong> is a webtool which allows for easy
              creation of heatmaps for visualization, exploration, and analysis
              of large datasets
            </p>
          </div>
          <div className="body">
            <div>
              <div className="input-box">
                <div className="input-text">Input Data Here!</div>
                <button>Select file</button>
              </div>
            </div>

            <div className = 'heatmap'>
              <HeatmapWrapper />
            </div>
          </div>
        </div>
        <div className='border'></div>

      </div>
    </>
  );
}

export default Home;
