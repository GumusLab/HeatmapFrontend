// // import { Outlet, Link } from "react-router-dom";
// // import React from "react";
// // import "./Layout.css";
// // import logo from "./heatmapToolSymbol.jpg"
// // import sinaiLogo from './Mount_Sinai_hospital_logo.png'
// // import HomeIcon from '@mui/icons-material/Home';
// // import CallIcon from '@mui/icons-material/Call';
// // import InfoIcon from '@mui/icons-material/Info';
// // import ArticleIcon from '@mui/icons-material/Article';

// // function Layout() {
// //   return (
// //     <>
// //       <nav>   <img
// //       src="temp.gif"
// //       alt="Logo1"
// //       className="logo"
// //       // style={{ width: "80px", height: "80px", marginBottom: "10px" }}
// //     />
// //         <div className = 'name' ><h1>ClusterChirp</h1></div>
// //         <div className='nav-menu'>
// //           <Link to="/" activeStyle className="nav-link" style={{ fontWeight: "bold" }}>Home<HomeIcon/></Link>
// //           <Link to="/About" activeStyle className="nav-link" style={{ fontWeight: "bold" }}>About <InfoIcon/></Link>
// //           <Link to="/contact" activeStyle className="nav-link" style={{ fontWeight: "bold" }}>Contact <CallIcon/></Link>
// //           <Link to="/references" activeStyle className="nav-link" style={{ fontWeight: "bold" }}>References <ArticleIcon/></Link>
// //         </div>
// //         {/* <img src={sinaiLogo} className='sinai-logo' /> */}
// //       </nav>
      

// //       <Outlet />
// //     </>
// //   )
// // };

// // export default Layout;







import { Outlet, Link, useLocation } from "react-router-dom";
import React from "react";
import "./Layout.css";
import HomeIcon from "@mui/icons-material/Home";
import CallIcon from "@mui/icons-material/Call";
import InfoIcon from "@mui/icons-material/Info";
import ArticleIcon from "@mui/icons-material/Article";
import sinaiLogo from './Mount_Sinai_hospital_logo.png'
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";


function Layout() {
  const location = useLocation();

  return (
    <>
     {/* <img
      src="Logo3_transparent.gif"
      alt="Logo1"
      className="logo"
    /> */}
      {/* <nav className="navbar">
          <div className="nav-menu">
            <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
              Home <HomeIcon />
            </Link>
            <Link to="/about" className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}>
              About <InfoIcon />
            </Link>
            <Link to="/contact" className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
              Contact <CallIcon />
            </Link>
            <Link to="/references" className={`nav-link ${location.pathname === "/references" ? "active" : ""}`}>
              References <ArticleIcon />
            </Link>
          </div>
      </nav> */}

      <nav className="navbar">
  <div className="nav-container">
    <div className="nav-menu">
      <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
        Home <HomeIcon />
      </Link>
      <Link to="/about" className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}>
        FAQ <InfoIcon />
      </Link>
      <Link to="/contact" className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
        Examples <FolderSpecialIcon />
      </Link>
      <Link to="/references" className={`nav-link ${location.pathname === "/references" ? "active" : ""}`}>
        References <ArticleIcon />
      </Link>
    </div>
    {/* <div className="nav-logo"> */}
      <img src={sinaiLogo} alt="Mount Sinai Logo" className="logo" />
    {/* </div> */}
  </div>
</nav>


      <Outlet />
    </>
  );
}

export default Layout;











// import { Outlet, Link, useLocation } from "react-router-dom";
// import React, { useEffect } from "react";
// import $ from "jquery"; // Import jQuery for animations
// import "./Layout.css";
// import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faHouse, faPhone,faBook,faInfo} from "@fortawesome/free-solid-svg-icons";


// function Layout() {
//   const location = useLocation();

//   useEffect(() => {
//     // Navbar animation logic (same as your provided JavaScript)
//     var tabsNewAnim = $("#navbar-animmenu");
//     var activeItemNewAnim = tabsNewAnim.find(".active");
//     var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
//     var itemPosNewAnimLeft = activeItemNewAnim.position();

//     $(".hori-selector").css({
//       left: itemPosNewAnimLeft.left + "px",
//       width: activeWidthNewAnimWidth + "px",
//     });

//     $("#navbar-animmenu").on("click", "li", function (e) {
//       $("#navbar-animmenu ul li").removeClass("active");
//       $(this).addClass("active");
//       var activeWidthNewAnimWidth = $(this).innerWidth();
//       var itemPosNewAnimLeft = $(this).position();
//       $(".hori-selector").css({
//         left: itemPosNewAnimLeft.left + "px",
//         width: activeWidthNewAnimWidth + "px",
//       });
//     });
//   }, [location]); // Runs when the route changes

//   return (
//     <>
//       <nav id="navbar-animmenu">
//         <ul className="show-dropdown main-navbar">
//           <div className="hori-selector">
//             <div className="left"></div>
//             <div className="right"></div>
//           </div>

//           <li className={location.pathname === "/" ? "active" : ""}>
//             <Link to="/">
//               <FontAwesomeIcon icon={faHouse} /> Dashboard
//             </Link>
//           </li>
//           <li className={location.pathname === "/about" ? "active" : ""}>
//             <Link to="/about">
//               <FontAwesomeIcon icon={faInfo} /> About
//             </Link>
//           </li>
//           <li className={location.pathname === "/contact" ? "active" : ""}>
//             <Link to="/contact">
//               <FontAwesomeIcon icon={faPhone} /> Contact
//             </Link>
//           </li>
//           <li className={location.pathname === "/references" ? "active" : ""}>
//             <Link to="/references">
//               <FontAwesomeIcon icon={faBook} /> References
//             </Link>
//           </li>
//         </ul>
//       </nav>

//       <div className="content">
//         <Outlet />
//       </div>
//     </>
//   );
// }

// export default Layout;
