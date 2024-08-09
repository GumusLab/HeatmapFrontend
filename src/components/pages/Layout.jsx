import { Outlet, Link } from "react-router-dom";
import React from "react";
import "./Layout.css";
import logo from "./heatmap_logo.png"
import sinaiLogo from './Mount_Sinai_hospital_logo.png'
import HomeIcon from '@mui/icons-material/Home';
import CallIcon from '@mui/icons-material/Call';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';

function Layout() {
  return (
    <>
      <nav>
        <img src={logo} className="logo"/>
        <div className = 'name' ><h1>VizArDS</h1></div>
        <div className='nav-menu'>
          <Link to="/" activeStyle className="nav-link">Home<HomeIcon/></Link>
          <Link to="/About" activeStyle className="nav-link">About <InfoIcon/></Link>
          <Link to="/contact" activeStyle className="nav-link">Contact <CallIcon/></Link>
          <Link to="/references" activeStyle className="nav-link">References <ArticleIcon/></Link>
        </div>
        <img src={sinaiLogo} className='sinai-logo' />
      </nav>
      

      <Outlet />
    </>
  )
};

export default Layout;