import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Contact from './components/pages/Contact';
import About from './components/pages/About';
import Layout from './components/pages/Layout';
import Home from './components/pages/Home';
import Footer from './components/pages/Footer';
import HeatmapPage from './components/pages/HeatmapPage';
import React, { useEffect } from "react";
import SampleData from "./components/pages/SampleData";
import Examples from './components/pages/Example';
import NetworkVisualizationPage from './components/pages/NetworkVisualizationPage';
import ExampleHeatmapPage from './components/pages/ExampleHeatmapPage'; // ✅ Fixed import
import { initializeGA, trackPageView } from './utils/analytics';

// Component to track page views
// function PageTracker() {
//   const location = useLocation();

//   useEffect(() => {
//     trackPageView(location.pathname + location.search);
//   }, [location]);

//   return null;
// }

function App() {
  // useEffect(() => {
  //   // Initialize Google Analytics when the app starts
  //   initializeGA();
  // }, []);

  return (
    // <Router  basename="/clusterchirp-test">
    <Router>

      {/* <PageTracker /> */}
      <Routes>
        <Route path='/' element={<Layout/>}>
          <Route index element={<Home/>}/>
          <Route path='example' element={<Examples/>}/>
          <Route path='about' element={<About/>}/>
          <Route path='contact' element={<Contact/>}/>
          <Route path="/example/:exampleId" element={<ExampleHeatmapPage />} />

        </Route>
        {/* HeatmapPage is outside the Layout so it has its own full page layout */}
        <Route path='heatmap' element={<HeatmapPage/>}/>
        <Route path="/sample-data" element={<SampleData />}/> 
        <Route path='network-visualization' element={<NetworkVisualizationPage/>}/>
      
      </Routes>
    </Router>
  );
}

export default App;
