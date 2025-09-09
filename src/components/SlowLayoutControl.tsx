import React, { useEffect, useState, useRef } from "react";
import { useSigma } from "@react-sigma/core";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import RestartAlt from '@mui/icons-material/RestartAlt';
import { IconButton } from '@mui/material';
const SlowLayoutControl = () => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isRunning, setIsRunning] = useState(false);
  const settings = forceAtlas2.inferSettings(graph);
  Object.assign(settings, {
    scalingRatio: 0.05,
    gravity: 0.00001,
    slowDown: 10,
    edgeWeightInfluence: 0.001,
    barnesHutOptimize: false,
    strongGravityMode: false,
    linLogMode: false,
    outboundAttractionDistribution: false,
    adjustSizes: false,
  });
  const intervalRef = useRef<null | NodeJS.Timeout>(null);

  const handleToggle = () => {
    // if we're _stopping_ the layout, dump the settings to the console
    if (isRunning) {
      console.log("ForceAtlas2 stopped – current settings:", settings);
    }
    setIsRunning(!isRunning);
  };
  
  useEffect(() => {
    let animationId;
    let lastUpdate = 0;
    const throttleMs = 100; // Update every 100ms for slower, smoother animation
    const animate = (timestamp) => {
      if (isRunning && timestamp - lastUpdate > throttleMs) {
        forceAtlas2.assign(graph, {settings, iterations: 1});
        sigma.refresh();
        lastUpdate = timestamp;
      }
      if (isRunning) {
        animationId = requestAnimationFrame(animate);
      }
    };
    if (isRunning) {
      animationId = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isRunning, graph, sigma, settings]);
  const reset = () => {
    graph.forEachNode((node) => {
      graph.setNodeAttribute(node, "x", Math.random() * 20 - 10);
      graph.setNodeAttribute(node, "y", Math.random() * 20 - 10);
    });
    sigma.refresh();
  };
  return (
    <>
      {/* <IconButton onClick={() => setIsRunning(!isRunning)} size="small"> */}
      <IconButton onClick={handleToggle} size="small">

        {isRunning ? <Pause /> : <PlayArrow />}
      </IconButton>
      <IconButton onClick={reset} size="small">
        <RestartAlt />
      </IconButton>
    </>
  );
};

export default SlowLayoutControl; 