// import './App.css';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Contact from './components/pages/Contact';
// import About from './components/pages/About'
// import Layout from './components/pages/Layout';
// import Home from './components/pages/Home';
// import Footer from './components/pages/Footer';
// import HeatmapWrapper from './HeatmapWrapper.tsx'; //src\HeatmapWrapper.tsx
// import React from "react"

// function App() {
//   return (
//       <Router>
//       <Routes>
//           <Route path='/' element={<Layout/>}>
//           <Route index element={<Home/>}/>
//           <Route path= 'about' element={<About/>}/>
//           <Route path='contact' element={<Contact/>}/>
//           <Route path='heatmap' element = {<HeatmapWrapper/>}/>
//         </Route>
//       </Routes>
//       {/* <Footer /> */}
//       </Router>
//   );
// }

// export default App;


import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Contact from './components/pages/Contact';
import About from './components/pages/About';
import Layout from './components/pages/Layout';
import Home from './components/pages/Home';
import Footer from './components/pages/Footer';
import HeatmapPage from './components/pages/HeatmapPage'; // New component
import React from "react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Layout/>}>
          <Route index element={<Home/>}/>
          <Route path='about' element={<About/>}/>
          <Route path='contact' element={<Contact/>}/>
        </Route>
        {/* HeatmapPage is outside the Layout so it has its own full page layout */}
        <Route path='heatmap' element={<HeatmapPage/>}/>
      </Routes>
      {/* <Footer /> */}
    </Router>
  );
}

export default App;