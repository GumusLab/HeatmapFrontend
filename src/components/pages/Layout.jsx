// import { Outlet, Link, useLocation } from "react-router-dom";
// import React from "react";
// import "./Layout.css";
// import HomeIcon from "@mui/icons-material/Home";
// import CallIcon from "@mui/icons-material/Call";
// import InfoIcon from "@mui/icons-material/Info";
// import ArticleIcon from "@mui/icons-material/Article";
// import sinaiLogo from './Mount_Sinai_hospital_logo.png'
// import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";


// function Layout() {
//   const location = useLocation();

//   return (
//     <>
//     <nav className="navbar">
//   <div className="nav-container">
//     <div className="nav-menu">
//       <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
//         Home <HomeIcon />
//       </Link>
//       <Link to="/about" className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}>
//         FAQ <InfoIcon />
//       </Link>
//       <Link to="/example" className={`nav-link ${location.pathname === "/example" ? "active" : ""}`}>
//         Examples <FolderSpecialIcon />
//       </Link>
//       <Link to="/contact" className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
//         Contact <ArticleIcon />
//       </Link>
//     </div>
//     {/* <div className="nav-logo"> */}
//       <img src={sinaiLogo} alt="Mount Sinai Logo" className="logo" />
//     {/* </div> */}
//   </div>
// </nav>


//       <Outlet />
//     </>
//   );
// }

// export default Layout;

import { Outlet, Link, useLocation } from "react-router-dom";
import React from "react";
import "./Layout.css";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import ArticleIcon from "@mui/icons-material/Article";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import sinaiLogo from './sinai_logo.png';
import { Margin } from "@mui/icons-material";

function Layout() {
  const location = useLocation();

  return (
    <>
      <header className="header-grid">
        {/* Left: ClusterChirp Logo */}
        <div className="left-section">
          <img src="clusterchirp_logo.jpg" alt="ClusterChirp Logo" className="logo1" />
          <div className="circleTextHorizontal">
            <span className="circleText-cluster">Cluster</span>
            <span className="circleText-chirp">Chirp</span>
          </div>
        </div>

        {/* Center: Nav Menu */}
        <nav className="nav-menu">
          <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>Home</Link>
          <Link to="/example" className={`nav-link ${location.pathname === "/example" ? "active" : ""}`}>Examples</Link>
          <a href="https://gumuslab.github.io/ClusterChirpDocs/intro" target="_blank" rel="noopener noreferrer" className="nav-link">Tutorial/FAQ</a>
    
          {/* <Link to="/example" className={`nav-link ${location.pathname === "/example" ? "active" : ""}`}>Examples</Link> */}
          <Link to="/contact" className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}>Contact</Link>
        </nav>


        {/* Right: Mount Sinai Logo */}
        <div className="right-section">
          <img src={sinaiLogo} alt="Mount Sinai Logo" className="logo2" />
        </div>
      </header>

      <Outlet />
    </>
  );
}

export default Layout;











