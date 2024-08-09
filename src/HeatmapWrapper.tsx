import * as React from 'react';
import { useEffect, useMemo, useState } from "react";
import 'react-app-polyfill/ie11';
import { DeckGLHeatmap } from './DeckGLHeatmap';
// import * as d from './data/rnaSeq_data_patient_1000_rows.json';
import * as d from './data/cytof_data_patient.json';

import './wrapper.css';
import { CircularProgress } from '@mui/material';

function truncateLabel(label:string,truncateLength:number){
  if (label.length > truncateLength) {
    return label.slice(0, truncateLength);
  }
  return label;
}
 const HeatmapWrapper = () => {

  const containerRef = React.useRef<HTMLDivElement|null>(null);
  console.log(`this is container ref `, containerRef)

  const [test, setTest] = useState<HTMLDivElement|null>(null)
  console.log('test', test)
  useEffect(() => {
    if(containerRef.current){
      setTest(containerRef.current)
    }
  },[containerRef])
  // const data = useMemo(() => generateRandomNetwork({
  //   numRowCats: 5,
  //   numColCats: 5,
  //   numRow: 20,
  //   numCol: 20,
  //   maxRowLabelLength: 10,
  //   maxColLabelLength: 7,
  // }), [])
  let id:string;
  let data:any;
  id = 'cytofPatientHeatmap'

  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [categories,setCategories] = useState({"row":{},"col":{}});
  // const [valScale, setValScale] = useState(id === 'olinkPatientHeatmap' ? 'Zscore' : 'None');
  const [valScale, setValScale] = useState(id === 'olinkPatientHeatmap' || id === 'cytofPatientHeatmap' || id === 'serologyPatientHeatmap' ? 'Zscore' : 'None');

  const [resultValueType,setResultValueType] = useState("logFC")
  const [resultCat,setResultCat] = useState("Timepoints");


  const panelWidth = 175

  data = d

  useEffect(()=>{
    if(data.cat_colors){
      let rowCats: any = {}
      let colCats: any = {}
      if(Object.keys(data.cat_colors.row).length > 0){
        for(const key of Object.keys(data.cat_colors.row)){
          const catName = Object.keys(data.cat_colors.row[key])[0].split(":")[0].trim();
          rowCats[catName] = key
        }
      }
      if(Object.keys(data.cat_colors.col).length > 0){
        for(const key of Object.keys(data.cat_colors.col)){
          const catName = Object.keys(data.cat_colors.col[key])[0].split(":")[0].trim();
          colCats[catName] = key
        }
      }
      setCategories((prev)=>({...prev,row:rowCats,col:colCats}))
      const rowCategory = Object.keys(rowCats).length > 0?Object.keys(rowCats)[0]:"";
      const colCategory = Object.keys(colCats).length > 0?Object.keys(colCats)[0]:"";

      // setOrder((prev)=>({...prev,rowCat:rowCategory,colCat:colCategory}))
    }
  },[id])

  
  /*This is for setting the height between the input text  */
  const inputStyle: React.CSSProperties = {
    lineHeight: '0.5',
    fontFamily:'Arial, sans-serif',
    marginLeft:'500px'
  };

const rowlabels = useMemo(() => data?.row_nodes.map((ele: any) => ele.name), [data]);
  

// const setFunction = id === 'olinkPatientHeatmap'?setValScale:setResultValueType
const setFunction = ['olinkPatientHeatmap','cytofPatientHeatmap','serologyPatientHeatmap'].includes(id)?setValScale:setResultValueType


  return (
    <div id={id} ref={containerRef} 
    style={{width:'90%', height: '100%',position:'relative'}}>   
    {
      test?<DeckGLHeatmap
      data={data}
      container={test}
      // debug={true}
      // tooltipFunction={generateTooltipContent}
      position="relative"
      categories={categories}
      setValueScale={setFunction}
      setResultCategory={setResultCat}
      resultCategories={['Timepoints','ARMs','Response']}
      valueScale={valScale}
      legend={{ width: panelWidth-20, height: 30 }}
      // columnLabelsTitle="Genes"
      // rowLabelsTitle="Cell Expressions"
      deckglProps = {
        {style:{
          top:"0px",
      }}}
      labels={{
        row: { maxSize: 10, titleSize: 8,maxChars:10},
        column: { maxSize: 10, titleSize: 8,maxChars:10,angle:45},
      }} 
      onClick={{
        
      }}
      valueType={resultValueType}
      panelWidth={panelWidth}
      /> : <CircularProgress/>
    }  
     
    </div>
  );
//else {
 // return ( <div>
  //  <CircularProgress/>
   // </div>)
//}
};



export default HeatmapWrapper;