
// import * as React from 'react';
// import { useEffect, useState } from "react";
// import 'react-app-polyfill/ie11';
// import { DeckGLHeatmap } from './DeckGLHeatmap';
// import './wrapper.css';
// import { CircularProgress } from '@mui/material';
// import {processHeatmapData} from "./backendApi/heatmapData"
// import d from './data/cytof_data_patient.json';

// type CategoryType = {
//   row: Record<string, any>;
//   col: Record<string, any>;
// };

// interface HeatmapWrapperProps {
//   data: any;
//   id: string;
//   fileSelectedFlag: boolean;
//   cat?: CategoryType;
// }

// const HeatmapWrapper: React.FC<HeatmapWrapperProps> = ({ data, id,fileSelectedFlag, cat = { row: {}, col: {} } }) => {
//   const containerRef = React.useRef<HTMLDivElement | null>(null);
//   // const [test, setTest] = useState<HTMLDivElement | null>(null);
//   const [categories, setCategories] = useState(cat);
//   const [resultValueType,setResultValueType] = useState("logFC")
//   const [resultCat,setResultCat] = useState("Timepoints");
//   const [valScale, setValScale] = useState(id === 'olinkPatientHeatmap' || id === 'cytofPatientHeatmap' || id === 'serologyPatientHeatmap' ? 'Zscore' : 'None');
//   const [isContainerReady, setIsContainerReady] = useState(false); // Track if the container ref is ready
//   const [Heatmapdata, setHeatmapdata] = useState(null)



//   console.log('******** Heatmap data is ',Heatmapdata)
//   console.log('******* id is as follows ******', id)
//   useEffect(()=>{

//     if(fileSelectedFlag){
//       processHeatmapData(data).then((response)=>{
//         if (response.cat_colors) {
//           const rowCats: Record<string, string> = {};
//           const colCats: Record<string, string> = {};
      
//           if (Object.keys(response.cat_colors.row).length > 0) {
//             for (const key of Object.keys(response.cat_colors.row)) {
//               const catName = Object.keys(response.cat_colors.row[key])[0].split(":")[0].trim();
//               rowCats[catName] = key;
//             }
//           }
//           if (Object.keys(response.cat_colors.col).length > 0) {
//             for (const key of Object.keys(response.cat_colors.col)) {
//               const catName = Object.keys(response.cat_colors.col[key])[0].split(":")[0].trim();
//               colCats[catName] = key;
//             }
//           }
      
//           setCategories({ row: rowCats, col: colCats });
//           // setIsCategoriesReady(true);
//           // Flag = false
//         } else {
//           if (Object.keys(categories.row).length > 0 || Object.keys(categories.col).length > 0) {
//             setCategories({ row: {}, col: {} });
//           }
//         //   setIsCategoriesReady(true);
//         //  Flag = false
//         }

//         // ✅ Add file_name to response
//       const updatedResponse = {
//         ...response,
//         file_name: id  // Using 'data.name' if available
//       };

//       setHeatmapdata(updatedResponse);
//       // setHeatmapdata(response)
//       })
//     }
//     else{
//       if (data.cat_colors) {
//         const rowCats: Record<string, string> = {};
//         const colCats: Record<string, string> = {};
    
//         if (Object.keys(data.cat_colors.row).length > 0) {
//           for (const key of Object.keys(data.cat_colors.row)) {
//             const catName = Object.keys(data.cat_colors.row[key])[0].split(":")[0].trim();
//             rowCats[catName] = key;
//           }
//         }
//         if (Object.keys(data.cat_colors.col).length > 0) {
//           for (const key of Object.keys(data.cat_colors.col)) {
//             const catName = Object.keys(data.cat_colors.col[key])[0].split(":")[0].trim();
//             colCats[catName] = key;
//           }
//         }
    
//         setCategories({ row: rowCats, col: colCats });
//       } else {
//         if (Object.keys(categories.row).length > 0 || Object.keys(categories.col).length > 0) {
//           setCategories({ row: {}, col: {} });
//         }
//         // setIsCategoriesReady(true);
//       //  Flag = false
//       }
//       setHeatmapdata(data)
//     }
//   },[data])


//   useEffect(() => {
//     // Ensure the ref is set after the component is mounted
//     if (containerRef.current) {
//       setIsContainerReady(true);
//     }
//   }, [containerRef]);

//   // Show CircularProgress until categories are ready
//  // Show CircularProgress until categories are ready and the container is ready
//  if (!isContainerReady || !Heatmapdata) {
//   return (
//     <div id={id} ref={containerRef} style={{ width: '90%', height: '100%', position: 'relative' }}>
//       <CircularProgress />
//     </div>
//   );
// }

//   // ✅ Check if fileSelectedFlag is true, file_name matches id, and container is ready
//   if (fileSelectedFlag &&  Heatmapdata["file_name"] !== id) {
//     return (
//       <div id={id} ref={containerRef} style={{ width: '90%', height: '100%', position: 'relative' }}>
//         <CircularProgress />
//       </div>
//     );
//   }

// return (
//   <div
//     id={id}
//     ref={containerRef}
//     style={{
//       width: "100%",
//       height: "100%", // ✅ Expands to full height
//       minHeight: "500px", // ✅ Ensures visibility
//       position: "relative",
//       display: "flex", // ✅ Allow child elements to expand properly
//       justifyContent: "center",
//       alignItems: "center",
//     }}
//   >
//     {containerRef.current ? (
//       <DeckGLHeatmap
//         data={Heatmapdata}
//         dataId={id}
//         container={containerRef.current}
//         position="relative"
//         categories={categories}
//         // ord={{
//         //   row: "alphabetically",
//         //   col: "alphabetically",
//         //   rowCat: [],
//         //   sortByRowCat: "",
//         //   colCat: [],
//         //   sortByColCat: "",
//         // }}
//         setValueScale={['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap'].includes(id) ? setValScale : setResultValueType}
//         setResultCategory={setResultCat}
//         resultCategories={['Timepoints', 'ARMs', 'Response']}
//         valueScale={valScale}
//         legend={{ width: 175 - 20, height: 30 }}
//         labels={{
//           row: { maxSize: 14, titleSize: 8, maxChars: 30 },
//           column: { maxSize: 10, titleSize: 8, maxChars: 20, angle: 45 },
//         }}
//         valueType={resultValueType}
//         panelWidth={175}
//       />
//     ) : (
//       <CircularProgress />
//     )}
//   </div>
// );

// };

// export default HeatmapWrapper;


import * as React from 'react';
import { useEffect, useState, useRef } from "react";
import 'react-app-polyfill/ie11';
import { DeckGLHeatmap } from './DeckGLHeatmap';
import './wrapper.css';
import { CircularProgress } from '@mui/material';
import { processHeatmapData } from "./backendApi/heatmapData";

type CategoryType = {
  row: Record<string, any>;
  col: Record<string, any>;
};

interface HeatmapWrapperProps {
  data: any;
  id: string;
  fileSelectedFlag: boolean;
  cat?: CategoryType;
}

const HeatmapWrapper: React.FC<HeatmapWrapperProps> = ({ data, id, fileSelectedFlag, cat = { row: {}, col: {} } }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heatmapDataRef = useRef<any>(null); // ✅ Stores large data efficiently
  const [heatmapVersion, setHeatmapVersion] = useState(0); // ✅ Triggers re-render when data updates
  const [categories, setCategories] = useState(cat);
  const [resultValueType, setResultValueType] = useState("logFC");
  const [resultCat, setResultCat] = useState("Timepoints");
  const [valScale, setValScale] = useState(
    ['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap'].includes(id) ? 'Zscore' : 'None'
  );
  const [isContainerReady, setIsContainerReady] = useState(false);

  console.log("🔥 Heatmap Rendered with Version:", heatmapVersion);

  useEffect(() => {
    if (fileSelectedFlag) {
      console.log("⏳ Processing new heatmap data...");

      processHeatmapData(data).then((response) => {
        const updatedResponse = {
          ...response,
          file_name: id, // ✅ Ensure correct file is processed
        };

        heatmapDataRef.current = updatedResponse; // ✅ Stores large data
        setHeatmapVersion((v) => v + 1); // ✅ Triggers re-render
      }).catch((error) => {
        console.error("❌ Error processing heatmap data:", error);
      });
    } else {
      heatmapDataRef.current = data;
      setHeatmapVersion((v) => v + 1); // ✅ Ensure re-render when switching to default data
    }
  }, [fileSelectedFlag, data]);

  useEffect(() => {
    if (containerRef.current) {
      setIsContainerReady(true);
    }
  }, []);

  // ✅ Show Loader Until:
  // - `fileSelectedFlag` is true AND 
  // - Correct file is loaded AND 
  // - Container is ready
  if (fileSelectedFlag && (!heatmapDataRef.current || heatmapDataRef.current.file_name !== id || !isContainerReady)) {
    return (
      <div id={id} ref={containerRef} style={{ width: '90%', height: '100%', position: 'relative' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div
      id={id}
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
             // marginTop:'5px'
        // border: "1px solid #E0E0E0",
        padding:"0px"
      }}
    >
      {containerRef.current ? (
        <DeckGLHeatmap
          key={heatmapVersion} // ✅ Forces component re-render when data changes
          data={heatmapDataRef.current} // ✅ Uses latest data efficiently
          dataId={id}
          container={containerRef.current}
          position="relative"
          categories={categories}
          setValueScale={
            ['olinkPatientHeatmap', 'cytofPatientHeatmap', 'serologyPatientHeatmap'].includes(id)
              ? setValScale
              : setResultValueType
          }
          setResultCategory={setResultCat}
          resultCategories={['Timepoints', 'ARMs', 'Response']}
          valueScale={valScale}
          legend={{ width: 175 - 20, height: 30 }}
          labels={{
            row: { maxSize: 15, titleSize: 8, maxChars: 10 },
            column: { maxSize: 5, titleSize: 8, maxChars: 10, angle: 45 },
          }}
          valueType={resultValueType}
          panelWidth={175}
        />
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};

export default HeatmapWrapper;
