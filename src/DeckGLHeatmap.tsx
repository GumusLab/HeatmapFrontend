import DeckGL from '@deck.gl/react/typed';
import jsPDF from 'jspdf';
import { merge } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DeckGLHeatmapProps } from './DeckGLHeatmap.types';
import { generateTooltipContent } from './GenerateTooltip';
import MySnackbar from './components/HoverTable';
import Legend2 from './components/Legend2';
import PersistentDrawerLeft from './components/Panel';
import CustomSlider from './components/Slider';
import { DEFAULT_LABEL_OFFSET, MAX_CATEGORIES, OPACITY } from './const';
import { layerFilter } from './layerFilter';
import { getLayers } from './layers/getLayers';
import { getHeatmapState } from './state/getHeatmapState';
import { useDataState } from './state/useDataState';
import { useDimensions } from './state/useDimensions';
import { useLabelState } from './state/useLabelState';
import { useViewStates } from './state/useViewStates';
import { useViews } from './state/useViews';
import getTextWidth from './utils/getTextWidth';
import { CircularProgress } from "@mui/material";
import { doc } from 'prettier';
// NOTE: center of the screen is 0, 0,
//       to center a cell you would place it at [-CELL_SIZE / 2, -CELL_SIZE / 2]

// NOTE: z is cut in half for each zoom level

/**
 * DeckGLHeatmap -- for all your squares and labels needs
 */
function capitalizeFirstLetter(str: string): string {
  const lowerCaseString = str.toLowerCase();
  return lowerCaseString.charAt(0).toUpperCase() + lowerCaseString.slice(1);
}

export const DeckGLHeatmap = ({
  data,
  container,
  debug = false,
  labels,
  onClick,
  tooltipFunction,
  legend,
  position,
  deckglProps,
  rowLabelsTitle,
  columnLabelsTitle,
  categories,
  resultCategories,
  setResultCategory,
  setValueScale,
  valueScale,
  valueType,
  panelWidth,
  pvalData
}: DeckGLHeatmapProps) => {

  const [{ colLabelsWidth, rowLabelsWidth }, setLabelsState] = useState({
    colLabelsWidth: 0,
    rowLabelsWidth: 0,
  });

  interface Coords{
    x: number,
    y: number
  }
  interface Area{
    start: undefined | Coords;
    end: undefined | Coords;
  }


  const [colClustGroup,setColClusterValue] = useState(5);
  const [rowClustGroup,setRowClusterValue] = useState(5);
  const [OpacityValue,setOpacityValue] = useState(OPACITY);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [order, setOrder] = useState({row:"alphabetically",col:"alphabetically",rowCat: [] as string[],sortByRowCat:"",colCat: [] as string[],sortByColCat:""});
  const [catTemp, setCatTemp] = useState({"row":{},"col":{}});
  const [searchTerm,setSearchTerm] = useState("");
  const [pvalThreshold,setPvalThreshold] = useState(0.05);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [clickedClusterData, setClickedClusterData] = useState<any|null>(null);
  const [isHovering, setHovering] = useState(true)
  const containerRefDeckgl = useRef<any>(null);
  const [crop, setCrop] = useState<boolean>(false)

  const [selectedArea, setSelectedArea] = useState<Area>({start: undefined, end: undefined})
  const [mouseDown, setMouseDown] = useState<boolean>(false)
  
  const box = document.createElement('div');

  box.style.position = "fixed";
  box.style.borderRadius = "2px";
  box.style.border = "5px solid";
  box.style.borderColor = "#00ff95";
  box.style.pointerEvents = "none";
  const boxElement = useRef<HTMLDivElement>(box);


  const setCropping = () =>{
    console.log('cropping here')
    console.log(crop)
    setCrop(!crop)
  }
  
  if(!tooltipFunction){
    tooltipFunction= generateTooltipContent;
  }

useEffect(() => {
  const containerElement: HTMLDivElement = container;
  if (crop){
    console.log('eventListeners')
    containerElement.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
  return () => {
    containerElement.removeEventListener("mousedown", handleMouseDown);
    document.removeEventListener("mouseup", handleMouseUp);
  }
}
}, [crop])


useEffect(() =>{
  const containerElement: HTMLDivElement = container;
  const selectionBoxElement = boxElement.current
  if (containerElement && selectionBoxElement) {
    if (mouseDown) {
      if (!document.body.contains(selectionBoxElement)){
        containerElement.appendChild(selectionBoxElement);
      } 
    }else {
        if (containerElement.contains(selectionBoxElement)){
          containerElement.removeChild(selectionBoxElement)
        }
      }
    }
},[mouseDown, boxElement])

useEffect(() =>{
  const {start, end} = selectedArea;
  console.log('selectedArea')
  if (start && end && boxElement.current) {
    console.log('selected if statement')
    drawSelectionBox(boxElement.current, start, end);
  }
}, [selectedArea, boxElement])

const handleMouseUp = (e:MouseEvent) =>{
    console.log('mouseUp')
    document.body.style.userSelect = "initial";
    document.removeEventListener("mousemove", handleMouseMove);
    setMouseDown(false);
}

const handleMouseDown = (e: MouseEvent) => {
  console.log('mouseDown')
  const containerElement: HTMLDivElement = container;
  setMouseDown(true)

  if (containerElement.contains(e.target as HTMLCanvasElement)){
    console.log(container)
    document.addEventListener('mousemove', handleMouseMove);
    setSelectedArea({
      start: {x: e.clientX, y:e.clientY},
      end:{x: e.clientX, y:e.clientY}
    })
  }
  


}
  
const handleMouseMove = (e: MouseEvent) =>{
  console.log(mouseDown, 'mousemove')
  document.body.style.userSelect  = 'none'
  setSelectedArea((prev) => ({
    ...prev, 
    end: {x: e.clientX, y:e.clientY}
  }))
}


function drawSelectionBox(
  boxElement: HTMLElement,
  start: Coords,
  end: Coords
): void {
  const b = boxElement;
  if (end.x > start.x) {
    b.style.left = start.x + "px";
    b.style.width = end.x - start.x + "px";
  } else {
    b.style.left = end.x + "px";
    b.style.width = start.x - end.x + "px";
  }

  if (end.y > start.y) {
    b.style.top = start.y + "px";
    b.style.height = end.y - start.y + "px";
  } else {
    b.style.top = end.y + "px";
    b.style.height = start.y - end.y + "px";
  }
}

  const ID: string = container.id
  let unit="";
  if(ID?.includes('cytof')){

    if(ID === 'cytofHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'Freq'
    }
  }
  else if(ID?.includes('olink')){

    if(ID === 'olinkHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = `NPX-${valueScale}`
    }
  }
  else if(ID?.includes('serology')){
    if(ID === 'serologyHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'Titers'
    }
  }
  else if(ID?.includes('rnaseq')){
    if(ID === 'rnaseqHeatmap'){
      if(valueType){
        unit = valueType
      }
    }
    else{
      unit = 'FPKM'
    }
  }

 
  // console.log(unit);
  // STATE


  useEffect(()=>{
    if(data.cat_colors){
      let rowCats:any = {}
      let colCats:any = {}
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
      setCatTemp((prev)=>({...prev,row:rowCats,col:colCats}))
      let rowCategory: string[] = [];
      let colCategory: string[] = [];
      let rowCounter = 0;
      let colCounter = 0;
      for(const key of Object.keys(rowCats)){
        if(rowCounter == MAX_CATEGORIES){
          break;
        }
        rowCategory.push(key)
        rowCounter += 1
      }
      for(const key of Object.keys(colCats)){
        if(colCounter == MAX_CATEGORIES){
          break;
        }
        colCategory.push(key)
        colCounter += 1
      }


      // const rowCategory = Object.keys(rowCats).length > 0?Object.keys(rowCats)[0]:"";
      // const colCategory = Object.keys(colCats).length > 0?Object.keys(colCats)[0]:"";

      setOrder((prev)=>({...prev,rowCat:rowCategory,colCat:colCategory}))
    }
  },[ID])

  const dataState = useDataState(data,order,catTemp);



  // const idx = dataState ? dataState?.rowLabels.findIndex((label) => label.text.trim() === searchTerm?.trim()) : -1;
  // const rowLabelIndex = idx !== -1 ? dataState?.rowLabels[idx].position : null;

  const dimensions = useDimensions(container);

  const heatmapState = useMemo(
    () =>
      getHeatmapState(dataState, colLabelsWidth, rowLabelsWidth, dimensions, ID),
    [dataState, dimensions, colLabelsWidth, rowLabelsWidth,searchTerm,order]
  );

  useLabelState(
    dataState,
    heatmapState,
    labels,
    container,
    order,
    ID,
    setLabelsState
  );

  if(order.colCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0){
    const containerElement: HTMLDivElement = container;
    const colCategoryNames = Object.keys(categories.col);
    for(let i = 0;i<colCategoryNames.length;i++){

      const labelToRemove = colCategoryNames[i].includes('#') ?containerElement.querySelector(`#${colCategoryNames[i].replace('#','no').split(' ').join('_')}`): containerElement.querySelector(`#${colCategoryNames[i]}`);
      if(labelToRemove && containerElement.contains(labelToRemove)){
        containerElement.removeChild(labelToRemove);
      }
    }
    // if(order.col !== 'cluster'){
    for(let i = 0;i<order.colCat.length;i++){
      const label = document.createElement('label');
      label.id = order.colCat[i].includes('#')?`${order.colCat[i].replace('#','no').split(' ').join('_')}` :`${order.colCat[i]}`;
      label.style.position = 'absolute';
      // const topMargin = deckglProps?.style?.top;
      // if(topMargin){
        // 17px
        // (order.colCat.length-i)*17
      
      // label.style.top = `${25+colLabelsWidth/2-(i+1)*8}px`;
      /* So height of each layer is 8 but it is pixel to convert to common unit we multiply it by 2 */
      label.style.top = `${(colLabelsWidth-(i+1)*16)}px`
      //`${35+(colLabelsWidth-(i+1)*16)}px`;

      // + colLabelsWidth-(i+1)*15+20
      // }
    
      label.textContent = `${capitalizeFirstLetter(order.colCat[i])}`;
      if(order.row !== 'cluster'){
      label.addEventListener('click',()=>{
        setOrder((prevOrder:any) => ({ ...prevOrder, sortByColCat:order.colCat[i]}))
      });}
      const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
      label.style.fontSize = '13px';
      label.style.fontFamily = 'Arial, sans-serif';
      label.style.fontWeight = 'light';
      const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
      const width = getTextWidth(label.textContent,labelFont)
      label.style.width = `${width}px`;
      label.style.color = '#333333';
      label.style.textAlign= 'right';
      /*We added 10 pixel because the panel icon has 10 pixel width */
      label.style.left = `${225+rowLabelsWidth-width-offset}px` //isDrawerOpen?`${200+rowLabelsWidth-width-offset}px`:`${50+rowLabelsWidth-width-offset}px`;
      // label.style.border = '1px solid black';
      containerElement.appendChild(label);
  
    }
    // }
  }

  if(order.rowCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0){
    const containerElement = container;
    const rowCategoryNames = Object.keys(categories.row);
    for(let i = 0;i<rowCategoryNames.length;i++){

      const labelToRemove = rowCategoryNames[i].includes('#') ?containerElement.querySelector(`#${rowCategoryNames[i].replace('#','no').split(' ').join('_')}`): containerElement.querySelector(`#${rowCategoryNames[i]}`);
      if(labelToRemove && containerElement.contains(labelToRemove)){
        containerElement.removeChild(labelToRemove);
      }
    }
   
   for(let i = 0;i<order.rowCat.length;i++){
    const label = document.createElement('label');
    label.id = order.rowCat[i].includes('#')?`${order.rowCat[i].replace('#','no').split(' ').join('_')}` :`${order.rowCat[i]}`;
    label.style.position = 'absolute';
    // const topMargin = deckglProps?.style?.top;
    // if(topMargin){
      // 17px
      // (order.colCat.length-i)*17
    
    // label.style.top = `${25+colLabelsWidth/2-(i+1)*8}px`;
    /* So height of each layer is 8 but it is pixel to convert to common unit we multiply it by 2 */
    label.style.top = dimensions? `${dimensions[1]-40+(colLabelsWidth-(i+1)*16)}px` : `${325+(colLabelsWidth-(i+1)*16)}px`
    //`${35+(colLabelsWidth-(i+1)*16)}px`;

    // + colLabelsWidth-(i+1)*15+20
    // }
  
    label.textContent = `${capitalizeFirstLetter(order.rowCat[i])}`;
    if(order.row !== 'cluster'){
    label.addEventListener('click',()=>{
      console.log('here')
      setOrder((prevOrder:any) => ({ ...prevOrder, sortByRowCat:order.rowCat[i]}))
    });}
    const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
    label.style.fontSize = '13px';
    label.style.fontFamily = 'Arial, sans-serif';
    label.style.fontWeight = 'light';
    const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
    const width = getTextWidth(label.textContent,labelFont)
    label.style.width = `${width}px`;
    label.style.color = '#333333';
    label.style.textAlign= 'right';
    /*We added 10 pixel because the panel icon has 10 pixel width */
    label.style.left = `${225+rowLabelsWidth-width-offset}px` //isDrawerOpen?`${190+rowLabelsWidth-width-offset}px`:`${30+rowLabelsWidth-width-offset}px`;
    // label.style.border = '1px solid black';
    containerElement.appendChild(label);

  }

  }


  // Uncomment this paragraph in the future

  // if(order.rowCat.length >= 0 && rowLabelsWidth>0 && colLabelsWidth>0){
  //   const containerElement = container.current;
  //   const rowCategoryNames = Object.keys(categories.row);
  //   for(let i = 0;i<rowCategoryNames.length;i++){
  //     const labelToRemove = containerElement.querySelector(`#${rowCategoryNames[i]}`);
  //     if(labelToRemove && containerElement.contains(labelToRemove)){
  //       containerElement.removeChild(labelToRemove);
  //     }
  //   }
  //   // if(order.col !== 'cluster'){
  //   for(let i = 0;i<order.rowCat.length;i++){
  //     const label = document.createElement('label');
  //     label.id = `${order.rowCat[i]}`;
  //     label.style.position = 'absolute';
  //     // const topMargin = deckglProps?.style?.top;
  //     // if(topMargin){
  //       // 17px
  //       // (order.colCat.length-i)*17
      
  //     // label.style.top = `${25+colLabelsWidth/2-(i+1)*8}px`;
  //     /* So height of each layer is 8 but it is pixel to convert to common unit we multiply it by 2 */

  //     // label.style.top = `${35+(colLabelsWidth-(i+1)*16)}px`;
  //     label.style.top = '103%';

  //     // + colLabelsWidth-(i+1)*15+20
  //     // }
     
  //     label.textContent = `${capitalizeFirstLetter(order.rowCat[i])}`;
      
  //     if(order.row !== 'cluster'){
  //     label.addEventListener('click',()=>{
  //       setOrder((prevOrder:any) => ({ ...prevOrder, sortByRowCat:order.rowCat[i]}))
  //     });}

  //     // const offset = labels?.row?.offset ? labels.row.offset: DEFAULT_LABEL_OFFSET + 2;
  //     label.style.fontSize = '13px';
  //     label.style.fontFamily = 'Arial, sans-serif';
  //     label.style.fontWeight = 'light';
  //     const labelFont = `normal ${label.style.fontSize} ${label.style.fontFamily}`;
  //     const width = getTextWidth(label.textContent,labelFont)
  //     const ht = '14';
  //     label.style.width = `${width}px`;
  //     label.style.height = `${ht}px`;
  //     label.style.color = '#333333';
  //     // label.style.textAlign= 'right';
  //     label.style.transform = 'rotate(90deg)';
  //     label.style.transformOrigin = 'center';

  //     /*We added 10 pixel because the panel icon has 10 pixel width */
  //     // label.style.left = isDrawerOpen?'240px':`${10+rowLabelsWidth-width-offset}px`;
  //     label.style.left = isDrawerOpen?`${rowLabelsWidth + 210}px`:`${rowLabelsWidth-30}px`;

  //     // label.style.border = '1px solid black';
  //     containerElement.appendChild(label);
  
  //   }
  //   // }
  // }






  // useEffect(() => {

  //   const containerElement = container.current;
  //   if (containerElement && colLabelsWidth>0) {

  //     // If there already exist a label then remove it
  //     const labelToRemove = containerElement.querySelector('#catLabel');

  //     if(labelToRemove && containerElement.contains(labelToRemove)){
  //       containerElement.removeChild(labelToRemove);
  //     }
      
  //     if(order.col !== 'cluster'){
  //       const label = document.createElement('label');
  //       label.id = 'catLabel'

  //       if(order.colCat.toLowerCase() === 'ann_arbor_stage'){
  //         label.textContent = 'stage'
  //       }
  //       else{
  //         label.textContent = maybeTruncateLabel(order.colCat.toLowerCase(),10);
  //       }
        
  //       label.addEventListener('click',()=>{setOrder((prevOrder:any) => ({ ...prevOrder, sortByColCat:true,}))});
  //       label.style.position = 'absolute';


  //       const topMargin = deckglProps?.style?.top;

  //       if(topMargin){
  //       // label.style.top = `${colLabelsWidth + parseInt(topMargin,10) + 20}px`;
  //       label.style.top = `${colLabelsWidth + parseInt(topMargin,10) + 2}px`;

  //       }
  //       else{
  //         // label.style.top = `${colLabelsWidth}px`;
  //         label.style.top = `${colLabelsWidth}px`;
  //       }         
  //       // label.style.left = '782px';

  //       label.style.left = '13px';
  //       // label.style.left = '100%';
  //       // label.style.transform = 'skewY(-45deg)';
  //       // label.style.transformOrigin = 'left';
  //       // label.style.textShadow = '1px 1px 1px rgba(0, 0, 0, 0.5)';
  //       // label.style.fontSize = '12px';

  //       label.style.fontSize = '13px';
  //       label.style.fontFamily = 'Arial, sans-serif';
  //       label.style.fontWeight = 'lighter';
  //       label.style.color = '#333333';
  //       containerElement.appendChild(label);

  //       }
  //   }
  // }, [colLabelsWidth,order,container.current.id]);

  const { viewStates, onViewStateChange } = useViewStates(
    container,
    dimensions,
    heatmapState,
    dataState,
    // rowLabelIndex,
    // labels
  );

  
  const views = useViews({
    colLabelsWidth,
    rowLabelsWidth,
    dimensions,
    debug,
  });


  // LAYERS
  const layers = useMemo(
    () =>
      getLayers({
        dataState,
        heatmapState,
        viewStates,
        onClick,
        labels,
        debug,
        colLabelsWidth,
        rowLabelsWidth,
        rowLabelsTitle,
        columnLabelsTitle,
        searchTerm,
        order,
        categories:catTemp,
        rowSliderVal:rowClustGroup,
        colSliderVal:colClustGroup,
        opacityVal:OpacityValue,
        pvalThreshold,
        pvalData,
        setOrder
      }),
    [
      colLabelsWidth,
      columnLabelsTitle,
      dataState,
      debug,
      heatmapState,
      labels,
      onClick,
      rowLabelsTitle,
      rowLabelsWidth,
      viewStates,
      searchTerm,
      order,
      colClustGroup,
      rowClustGroup,
      OpacityValue,
      pvalThreshold,
      pvalData
    ]
  );
  
  const legendComponent = <Legend2 
                        min={dataState?.min || 0}
                        max={dataState?.max || 0}
                        maxColor="#FF0000"
                        minColor="#0000FF"
                        legendWidth={legend?.width}
                        legendHeight={legend?.height}
                        fontSize={legend?.fontSize}
                        unit={unit}
                        />

  // onClick handler to download matrix as csv file
  const downloadMatrix = () => {
    console.log('1',data.row_nodes)
    console.log('2', data.row_nodes[1])

    const rowLabelArr: any[] = []
    for (let i=0; i<(data.row_nodes).length; i++){
      rowLabelArr.push(data.row_nodes[i].name)

    }

    const colLabelArr: any[] = ['']
    for (let i=0; i<data.col_nodes.length; i++){
      colLabelArr.push(data.col_nodes[i].name)
    }
    console.log(colLabelArr)

    const matrixArray: any[] = data.mat

    matrixArray.map((ele, index) => {ele.unshift(rowLabelArr[index]); return ele; })
    matrixArray.splice(0, 0, colLabelArr)

    let csvRows:any[] = [];
    for (let i = 0; i < matrixArray.length; ++i) {
        for (let j = 0; j < matrixArray[i].length; ++j) {
          matrixArray[i][j] = '\"' + matrixArray[i][j] + '\"';  // Handle elements that contain commas
        }
        csvRows.push(matrixArray[i].join(','));
    }



    var csvString = csvRows.join('\r\n');
    var a         = document.createElement('a');
    a.href        = 'data:attachment/csv,' + csvString;
    a.target      = '_blank';
    a.download    = 'myFile.csv';

    document.body.appendChild(a);
    a.click();
    
  }

  const downloadPdf = () => {
    // const deckglCanvas = containerRefDeckgl.current.deck.canvas;
    containerRefDeckgl.current.deck.redraw(true)
    const deckglCanvas = containerRefDeckgl.current.deck.canvas;

    if (deckglCanvas) {



            // Set canvas background to transparent
            // deckglCanvas.style.backgroundColor = 'transparent';

            // Convert the canvas to a data URL with JPEG format and quality 0.9 (90%)
            const dataUrl = deckglCanvas.toDataURL('image/png');

            // // Create a link element
            // const link = document.createElement('a');
            // link.href = dataUrl; // Set the href attribute to the data URL

            // // Set the download attribute to specify the file name with the .jpeg extension
            // link.download = 'your_image.png';

            // // Trigger a click event on the link to initiate the download
            // link.click();


              // Create a new jsPDF instance
              const pdf = new jsPDF('p', 'mm', 'a4'); // Specify page size as A4

              // Calculate the width and height of the image in the PDF
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (deckglCanvas.height * pdfWidth) / deckglCanvas.width;
        
              // Specify a white background color for the image

              pdf.setFillColor(255, 255, 255); // White color
              pdf.rect(0, 0, pdfWidth, pdfHeight, 'F'); // Fill rectangle with white color
              pdf.addImage(dataUrl, 'png', 0, 0, pdfWidth, pdfHeight);
        
              // Save the PDF with a specified file name
              pdf.save('HeatmapImg.pdf');
            }
  

    //   deckglCanvas.toBlob((blob:any) => {
    //     const url = URL.createObjectURL(blob);

    //     // Create a link element
    //     const link = document.createElement('a');
    //     link.href = url;

    //     // Set the download attribute to specify the file name
    //     link.download = 'heatmapImg.pdf';

    //     // Trigger a click event on the link to initiate the download
    //     link.click();

    //     // Clean up the URL object after the download is complete
    //     URL.revokeObjectURL(url);
    //   });
    // }
  };
                      
                      
return heatmapState?.cellData && container && layers ? (
    <div style={{height:'100%'}}>
      {/* <button onClick={downloadSvg} style={{
           marginLeft:"300px"
          }}>Downoad Image</button> */}
      <PersistentDrawerLeft 
          parentContainerRef={container}
          setIsDrawerOpen={setIsDrawerOpen}
          setOpacityValue={setOpacityValue}
          setOrder = {setOrder}
          categories = {catTemp}
          order = {order}
          Legend={legendComponent}
          panelWidth={panelWidth}
          ID={ID}
          dataState={dataState}
          setState={setValueScale}
          resultCategories={resultCategories}
          setResultCategory={setResultCategory}
          setSearchTerm={setSearchTerm}
          setPvalThreshold={setPvalThreshold}
          downloadHeatmap={downloadPdf}
          downloadMatrix={downloadMatrix}
          setCropping={setCropping}
        />
      <div style={{
            height:"100%", 
            width:"80%", 
            transform: `translateX(${
            //isDrawerOpen ? `${panelWidth+50}px` : 
            `${panelWidth+50}px`
            })`,
            transition: 'transform 0.3s ease',
          }}>
      <DeckGL

        ref={containerRefDeckgl}
        getCursor={(cursorState: any) => {
          if (cursorState.isDragging) {
            return 'grab';
          }
          return 'crosshair';
        }}
        {...deckglProps}
        width="100%"
        height="100%"
        parent={container}
        style={merge(
          { position: position ?? 'absolute' },
          deckglProps?.style || {},
        )}
        views={views}
        layerFilter={layerFilter}
        // @ts-ignore
        onViewStateChange={onViewStateChange}
        viewState={viewStates}
        layers={layers}
        onClick={(event: any)=>{
          console.log(event)
          console.log(dataState)
          const obj = event.object
          if(obj.id === 'row-cluster'){
            const clusterData = {'Nodes':obj.nodes,'Group':obj.text}
            setClickedClusterData(clusterData)
            setIsTableVisible(true)
          }
      
        }}

      //   onAfterRender={() => {
      //     // Fires multiple times.

      //     // Converts the deck.gl canvas to a base64-encoded image.  Other image MIME types can be used here as well.
      //     // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
      //     const base64Image = containerRefDeckgl?.current?.deck?.canvas?.toDataURL('image/png');

      //     // Creates a temporary link and clicks on it to download.
      //     // No need to append this element to the DOM.
      //     const a = document.createElement('a');
      //     a.href = base64Image;
      //     a.download = 'screenshot.png';
      //     a.click();
      // }}


        // getTooltip={
        //   tooltipFunction && isHovering
        //     ? tooltipFunction
        //     : ({ object, index }) => {
        //         if (object) {
        //           if ('text' in object) {
        //             return object.text;
        //           } else if ('value' in object) {
        //             if (index >= 0) {
        //               return `${rowLabelsTitle ?? 'Row'}: ${
        //                 dataState?.rowLabels[index % dataState.numRows]?.text ||
        //                 '-'
        //               }\n${columnLabelsTitle ?? 'Column'}: ${
        //                 dataState?.colLabels[
        //                   Math.floor(index / dataState.numRows)
        //                 ]?.text || '-'
        //               }\nValue: ${object.value.toFixed(2)}`;
        //             }
        //             return `Value: ${object.value.toFixed(2)}`;
        //           }
        //         }
        //         return JSON.stringify(object, null, 2);
        //       }
        // }
        getTooltip={
          tooltipFunction && isHovering
            ? tooltipFunction
            : null
        }
      >
      {order.col === 'cluster' && (<CustomSlider
        direction='vertical' 
        setClusterValue={setColClusterValue}
        width={order.colCat.length > 0?colLabelsWidth:8}
      />)}

      {/* The height of row cluster layer is 5 so thats why width is 5 provided */}
      {order.row === 'cluster' && (<CustomSlider
        direction='horizontal' 
        setClusterValue={setRowClusterValue}
        width={8}
      />)}

      {isTableVisible && clickedClusterData && ID.includes('olink') && (
              <div>
                <MySnackbar setVisibilty={setIsTableVisible} setHovering = {setHovering} data={clickedClusterData}/> 
              </div>
            )}
      </DeckGL>
      </div>
    </div>
  ) : null;
//}
//else{
//  return null;
//}
};


