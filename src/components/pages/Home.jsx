// import React, { useState } from "react";
// import "./Home.css";
// import HeatmapWrapper from "../../HeatmapWrapper";
// import { Box, Button, Typography } from "@mui/material";
// import defaultData from "../../data/cytof_data_patient.json";
// // import defaultData from "../../data/Trial 8_timepoint_A.json";

// import sinaiLogo from './Mount_Sinai_hospital_logo.png'
// import { Link } from 'react-router-dom'

// function Home() {
//   const [selectedFile, setSelectedFile] = useState(null);

//   const handleFileChange = (event) => {
//     setSelectedFile(event.target.files[0]);
//     console.log("Selected file:", event.target.files[0]);
//   };

//   const features = [
//     { title: "Search", imgSrc: "search.png" },
//     { title: "AI", imgSrc: "AIGif.gif" },
//     { title: "Metadata", imgSrc: "metadata.png" },
//     { title: "Cluster", imgSrc: "clustering.png" },
//     { title: "Sort", imgSrc: "sorting.png" },
//     { title: "Download", imgSrc: "download.png" },
//   ];

//   return (
//     <>
//       <div className="wrapper">
//         <div className="extraSpace">
//   <div className="circle-container">
//     <h3 className="circleText">
//       <span className="circleText-cluster">Cluster</span>
//       <span className="circleText-chirp">Chirp</span>
//     </h3>
//     <img src="AIGif_2.gif" alt="Logo1" className="giflogo" />
//   </div>
// </div>



        
//         <div className="home">
//           {/* Introduction Text */}
//           <Typography
//             // variant="h8"
//             sx={{
//               textAlign: "justify",
//               margin: "30px auto",
//               marginBottom: "10px",
//               marginTop:"0px",
//               maxWidth: "90%",
//               lineHeight: "1.1",
//               fontWeight:'light',
//               fontSize:'19px'
//             }}
//           >
//             <strong>Welcome to the heatmap tool</strong> where you can visualize
//             your tabular data with precision and clarity. Quickly identify
//             patterns, trends, and anomalies through interactive visualizations.
//             With seamless integration of ChatGPT, you can interact with AI to
//             gain deeper insights and make data-driven decisions faster. Ideal
//             for researchers, analysts, and professionals looking to enhance
//             their data exploration and analysis.
//           </Typography>

//          {/* Heatmap Display (Default Data or Uploaded File) */}
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               margin: "20px auto",
//               marginTop: "0px", // Fixed margin-top
//               marginBottom:"20px",
//               width: "90%",
//               height: "60%",
//               minHeight: "700px",
//               // maxHeight: "100vh",
//               overflow: "scroll",
//               // boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", 
//               borderRadius: "8px", // Optional: Add rounded corners
//               border: "1px solid #E0E0E0"
//               }}
//           >
//            <HeatmapWrapper
//               data={selectedFile || defaultData}
//               id={selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "cytof"} // Remove file extension
//               fileSelectedFlag={!!selectedFile}
//             />
//           </Box>

//           {/* Upload & Try Demo Buttons */}
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "center",
//               gap: "20px",
//               marginBottom: "2px",
//               // border: "1px solid black"
//             }}
//           >
              
//             <input
//               type="file"
//               accept=".csv, .tsv"
//               onChange={handleFileChange}
//               style={{ display: "none" }}
//               id="file-upload"
//             />
//             <label htmlFor="file-upload">
//               <Button
//                 variant="contained"
//                 color="primary"
//                 sx={{
//                   padding: "10px 20px",
//                   fontSize: "16px",
//                 }}
//                 onClick={() => document.getElementById("file-upload").click()}
//               >
//                 <strong>Upload Data </strong>
//               </Button>
//             </label>
//             {/* <Button
//               variant="contained"
//               sx={{
//                 backgroundColor: "black",
//                 color: "white",
//                 padding: "10px 20px",
//                 fontSize: "16px",
//               }}
//               onClick={() => setSelectedFile(null)}
//             >
//               Try Demo
//             </Button> */}

// <svg id="tutorialButton" onclick="window.location.href = 'https://gumuslab.github.io/phosnetvis-docs/docs/tutorials'" xmlns="http://www.w3.org/2000/svg" width="3.7%" viewBox="0 0 55 56">
//                 <g id="Group_2" data-name="Group 2" transform="translate(6.032 0.136)">
//                   <g id="No" transform="translate(0)">
//                     <g id="Ellipse_111" data-name="Ellipse 111" transform="translate(-0.032 -0.136)" fill="none" stroke="#576072" stroke-width="2">
//                       <circle cx="20.5" cy="20.5" r="20.5" stroke="none"/>
//                       <circle cx="20.5" cy="20.5" r="19.5" fill="none"/>
//                     </g>
//                   </g>
//                 </g>
//                 <g id="Polygon_1" data-name="Polygon 1" transform="translate(41 9) rotate(90)" fill="#fff">
//                   <path d="M 16.52786064147949 21.50000190734863 L 6.472129821777344 21.50000190734863 C 5.586329936981201 21.50000190734863 4.811200141906738 21.06784248352051 4.345510005950928 20.3143310546875 C 3.879810094833374 19.56081199645996 3.839920043945312 18.67425155639648 4.236070156097412 17.88196182250977 L 9.263930320739746 7.826241970062256 C 9.696599960327148 6.960891723632812 10.53250980377197 6.444272041320801 11.5 6.444272041320801 C 12.46747970581055 6.444272041320801 13.30340003967285 6.960891723632812 13.73606967926025 7.826231956481934 L 18.76392936706543 17.88196182250977 C 19.16007995605469 18.67425155639648 19.12018966674805 19.56081199645996 18.65448951721191 20.31432151794434 C 18.18880081176758 21.06784248352051 17.41366958618164 21.50000190734863 16.52786064147949 21.50000190734863 Z" stroke="none"/>
//                   <path d="M 11.5 7.944271087646484 C 11.26918029785156 7.944271087646484 10.84605979919434 8.016082763671875 10.60556983947754 8.497062683105469 L 5.577709197998047 18.55278205871582 C 5.360759735107422 18.9866828918457 5.512020111083984 19.34861183166504 5.621480941772461 19.52573204040527 C 5.730949401855469 19.70286178588867 5.987030029296875 20.00000190734863 6.472129821777344 20.00000190734863 L 16.52786064147949 20.00000190734863 C 17.01296043395996 20.00000190734863 17.26903915405273 19.70286178588867 17.37850952148438 19.52573204040527 C 17.48797988891602 19.34861183166504 17.63922882080078 18.98667144775391 17.42229080200195 18.55278205871582 L 12.39443016052246 8.497051239013672 C 12.15394973754883 8.016082763671875 11.73081970214844 7.944271087646484 11.5 7.944271087646484 M 11.5 4.944271087646484 C 12.92033100128174 4.944271087646484 14.34066009521484 5.681316375732422 15.07771015167236 7.155412673950195 L 20.10556983947754 17.21114158630371 C 21.43536949157715 19.87075233459473 19.50139045715332 23.00000190734863 16.52786064147949 23.00000190734863 L 6.472129821777344 23.00000190734863 C 3.49860954284668 23.00000190734863 1.564619064331055 19.87075233459473 2.894430160522461 17.21114158630371 L 7.922289848327637 7.155422210693359 C 8.659335136413574 5.68132209777832 10.07966899871826 4.944271087646484 11.5 4.944271087646484 Z" stroke="none" fill="#576072"/>
//                 </g>
//                 <text id="TUTORIAL" transform="translate(0 53)" fill="#576072" font-size="11" font-family="Helvetica"><tspan x="0" y="0">TUTORIAL</tspan></text>
//               </svg>
//               {/* <Link to="/contact"  style={{ display: 'inline-block' }}> */}

//                    <svg id = "contactButton" onclick="window.location.href = 'contact-us.html'" xmlns="http://www.w3.org/2000/svg" width="4.8%" viewBox="0 0 71 56">
//                 <g id="Group_3" data-name="Group 3" transform="translate(14.065 0.136)">
//                   <g id="No" transform="translate(0)">
//                     <g id="Ellipse_111" data-name="Ellipse 111" transform="translate(-0.065 -0.136)" fill="none" stroke="#576072" stroke-width="2">
//                       <circle cx="20.5" cy="20.5" r="20.5" stroke="none"/>
//                       <circle cx="20.5" cy="20.5" r="19.5" fill="none"/>
//                     </g>
//                   </g>
//                 </g>
//                 <g id="envelope-svgrepo-com" transform="translate(24.363 13.633)">
//                   <path id="Path_2" data-name="Path 2" d="M19.958,156a.317.317,0,0,0-.317.317v8.553a1.586,1.586,0,0,1-1.584,1.584H2.218A1.586,1.586,0,0,1,.634,164.87v-8.553a.317.317,0,1,0-.634,0v8.553a2.22,2.22,0,0,0,2.218,2.218H18.057a2.22,2.22,0,0,0,2.218-2.218v-8.553A.317.317,0,0,0,19.958,156Z" transform="translate(0 -152.832)" fill="#576072" stroke="#576072" stroke-width="1.5"/>
//                   <path id="Path_3" data-name="Path 3" d="M.481,78.583h0l8.636,5.572a2.222,2.222,0,0,0,2.4,0l8.636-5.572A.62.62,0,0,0,20.446,78a2.224,2.224,0,0,0-2.207-2H2.4A2.224,2.224,0,0,0,.193,78,.62.62,0,0,0,.481,78.583ZM2.4,76.634H18.239a1.6,1.6,0,0,1,1.575,1.417h0l-8.636,5.572a1.587,1.587,0,0,1-1.717,0L.825,78.051h0A1.6,1.6,0,0,1,2.4,76.634Z" transform="translate(-0.182 -76)" fill="#576072" stroke="#576072" stroke-width="1.5"/>
//                 </g>
//                 <text id="CONTACT_US" data-name="CONTACT US" transform="translate(0 53)" fill="#576072" font-size="11" font-family="Helvetica"><tspan x="0" y="0">CONTACT US</tspan></text>
//               </svg>
//               {/* </Link> */}
//           </Box>

          
//                 </div>
                
//         <div className="extraSpace">
//         {/* <img
//           src={sinaiLogo}
//           alt="Logo1"
//           className="logo"
//           // style={{ width: "80px", height: "80px", marginBottom: "10px" }}
//         /> */}
//         </div>
//       </div>
//     </>
//   );
// }

// export default Home;


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
        window.open(`/heatmap?fileKey=${encodeURIComponent(fileKey)}`, '_blank');
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

  // Your existing JSX for the Home component
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
        </div>
        
        <div className="home">
          {/* Introduction Text */}
          <Typography
            sx={{
              textAlign: "justify",
              margin: "30px auto",
              marginBottom: "10px",
              marginTop:"0px",
              maxWidth: "90%",
              lineHeight: "1.1",
              fontWeight:'light',
              fontSize:'20px'
            }}
          >
            {/* <strong>Welcome to the heatmap tool</strong> where you can visualize
            your tabular data with precision and clarity. Quickly identify
            patterns, trends, and anomalies through interactive visualizations.
            With seamless integration of ChatGPT, you can interact with AI to
            gain deeper insights and make data-driven decisions faster. Ideal
            for researchers, analysts, and professionals looking to enhance
            their data exploration and analysis. */}
            <strong>Welcome to ClusterChirp!</strong> Upload your tabular data to perform on-the-fly clustering and uncover patterns, trends, and anomalies.
            Interact directly with the visualizations—or explore your data using our built-in AI chatbot! Powerful analytics with an intuitive user interface.
          </Typography>

          {/* Heatmap Display (Default Data) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "20px auto",
              marginTop: "0px",
              marginBottom: "20px",
              width: "90%",
              height: "60%",
              minHeight: "700px",
              overflow: "scroll",
              borderRadius: "8px",
              border: "1px solid #E0E0E0"
            }}
          >
           <HeatmapWrapper
              data={defaultData}
              id="rnaSeq"
              fileSelectedFlag={false}
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
              accept=".csv, .tsv, .json"
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

            {/* SVG buttons and other elements */}
            {/* <svg id="tutorialButton" onClick={() => window.open('https://gumuslab.github.io/phosnetvis-docs/docs/tutorials', '_blank')} xmlns="http://www.w3.org/2000/svg" width="3.7%" viewBox="0 0 55 56"> */}
              {/* SVG content */}
            {/* </svg> */}
            
            {/* <svg id="contactButton" onClick={() => window.location.href = 'contact-us.html'} xmlns="http://www.w3.org/2000/svg" width="4.8%" viewBox="0 0 71 56"> */}
              {/* SVG content */}
            {/* </svg> */}
          </Box>
        </div>
        
        <div className="extraSpace">
        </div>
      </div>
    </>
  );
}

export default Home;





 {/* Key Features Section */}
          {/* <Box
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
                    width: "150px",
                    margin: "10px",
                  }}
                >
                  <img
                    src={feature.imgSrc}
                    alt={feature.title}
                    style={{ width: "80px", height: "80px", marginBottom: "10px" }}
                  />
                  <Typography>{feature.title}</Typography>
                </Box>
              ))}
            </Box>
          </Box> */}
          {/* <img src={sinaiLogo} className='sinai-logo' /> */}