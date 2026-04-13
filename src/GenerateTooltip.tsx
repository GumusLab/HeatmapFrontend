import { getTooltipType } from './DeckGLHeatmap.types';
import { IDS } from './const';
import { maybeTruncateLabel } from './layers/labels/maybeTruncateLabel';
import capitalizeFirstLetter from './utils/capitalizeFirstLetter';
import getTextWidth from './utils/getTextWidth';
function getWidth(counts:number[]):number[]{
  let widths = []
  const max = Math.max(...counts);
  for(let i=0;i < counts.length; i++){
    const wd = (counts[i]/max)*100
    widths.push(wd)
  }
  return widths

}

const generateTableRows = (keys:any,object:any)=>{
    let rows = '';
    // let totalHeight = 0;
    let newDictionary:any = {}
    for (let i = 0; i < keys.length; i++){
      // total += object.category[keys[i]][0]
      const parentCat = keys[i].split(":")[0]
      // newDictionary[parentCat][keys[i]] = object.category[keys[i]][0]
      if(parentCat in newDictionary){
        newDictionary[parentCat][keys[i]] = object.category[keys[i]][0]
      }
      else{
        newDictionary[parentCat] = {}
        newDictionary[parentCat][keys[i]] = object.category[keys[i]][0]
      }
      // countArray.push(object.category[keys[i]][0])    
  }
    for(const parentKey in newDictionary){
    let countArray = []
    // let total = []
    const keys = Object.keys(newDictionary[parentKey])
    for (let i = 0; i < keys.length; i++){
        // total += object.category[keys[i]][0]
        countArray.push(newDictionary[parentKey][keys[i]])    
    }

    const total: number = countArray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const widths = getWidth(countArray)
    rows += ` <tr style="margin:0px;padding:0px">
              <th style="margin: 0px,padding: 0px;textAlign: 'left', width: '70%', height:20px;">
              ${capitalizeFirstLetter(parentKey)}
              </th>              
              <th style="margin: 0px;padding: 0px;text-align: right; width:10%; height:20px;">Counts</th>
              <th style="margin: 0px;padding: 0px;text-align: right; width:10%; height:20px;">Pct</th>
              <th style="margin: 0px;padding: 0px;text-align: right; width:10%; height:20px;">Pval</th>
            </tr>`
    // <span style="background-color: rgba(255, 255, 255, 0.8); padding: 0px; margin: 0px; height: 20px;">

    for (let i = 0; i < keys.length; i++) {
        rows += `<tr style="margin:0px;padding:0px">
                    <td style="width:70%; height: 20px; margin:0px;padding:0px;"> 
                    <div style="width: ${`${widths[i]}%`}; background-color:${object.category[keys[i]][1]}; height:20px; white-space: nowrap; padding:0px; margin:0px;">
                    <span style="background-color: rgba(255, 255, 255, 0.7); padding: 0; margin: 0; line-height: 20px;">
                    ${maybeTruncateLabel(keys[i].split(":")[1],13)}
                    </span>
                    </div>
                    </td>
                    <td style="width:10%;height:20px; margin:0px;padding:0px;text-align: right;">${object.category[keys[i]][0]}</td>
                    <td style="width:10%;height:20px; margin:0px;padding:0px;text-align: right;">${Number((countArray[i]/total*100).toFixed(1))}</td>
                    <td style="width:10%;height:20px; margin:0px;padding:0px;text-align: right;">${Number(object.Pvalue[keys[i]].toFixed(2))}</td>
                  </tr>`;
    }
    // rows += `
    // <tr>
    // <th>Col Nodes</th>
    // </tr>
    // <tr>
    // <td style="border: 1px solid black; padding: 8px;">${object.nodes}</td>
    // </tr>`;
  }
    return rows
    
}
export const  generateTooltipContent: getTooltipType = (info)=>{

    if (!info){
        return null;
    }
    const { object, layer } = info;

    console.log('********* object is as follows *********',object)

    if (!object || !layer) {
        // Handle the case when the desired information is not available
        return null; // or return a default tooltip content
      }
    else{

        if(layer.id === 'col-clusters'){

            const keys = Object.keys(object.category);
            if(keys.length > 0){
            const tableRows = generateTableRows(keys, object);
            const translateY = 0;
            let translateX = 0;
            const X = info.x;
            const rowLabelsWidth = info.viewport?.x;
            const clusterLayerWidth = info.viewport?.width;

            if(rowLabelsWidth && clusterLayerWidth){
              const totalWidth = rowLabelsWidth + clusterLayerWidth;
              if(totalWidth-X < 350){
                translateX = -350
              }
            }

            /*We have kept 40 as the value because whatever will the padding from the top*/
            // <table style="border: 5px solid black; position: 'absolute', left: ${-x}, top: ${y}; width:300px ">
            return {
                html: `<div style="width: 350px;">
                      <table style="width:100%; padding:0px; margin:0px;">
                       <tbody>
                        ${tableRows}
                       </tbody>
                      </table>
                      </div>`,
                style: {
                  backgroundColor: 'white',                  
                  color: 'black',
                  display:'block',
                  textAlign: 'left',
                  fontFamily:'Arial, sans-serif',
                  fontSize:'13px',
                  width:'350px',
                  // height:`${tableHeight+20}px`,
                  padding:'0px',
                  margin:'0px',
                  top:`${translateY}px`,
                  left:`${translateX}px`,
                  position:'absolute',
                }
              };  
        }
        else{
          const translateY = 0;
          const translateX = 0;
          const fontFamily = 'Arial, sans-serif';
          const font = `normal 13px ${fontFamily}`;
          const width = getTextWidth(object.text,font);

          return {
              html: `${object.text}`,
              style:{
                backgroundColor:'white',
                color:'black',
                padding:'0px',
                fontFamily:'Arial, sans-serif',
                fontSize:'13px',
                // height:'13px',
                width:`${width}px`,
                top:`${translateY}px`,
                left:`${translateX}px`,
                position:'absolute',

          }
      }
    }
  }
  else if(layer.id === 'row-clusters'){

    const keys = Object.keys(object.category);
    if(keys.length > 0){
    const tableRows = generateTableRows(keys, object);
    const fontFamily = 'Arial, sans-serif';
    const font = `normal 13px ${fontFamily}`;
    const translateY = 0;
    let translateX = 0;

    return {
      html: `<div style="width: 350px;">
            <table style="width:100%; padding:0px; margin:0px;">
             <tbody>
              ${tableRows}
             </tbody>
            </table>
            </div>`,
      style: {
        backgroundColor: 'white',                  
        color: 'black',
        display:'block',
        textAlign: 'left',
        fontFamily:`${font}`,
        fontSize:'13px',
        width:'350px',
        // height:`${tableHeight+20}px`,
        padding:'0px',
        margin:'0px',
        top:`${translateY}px`,
        left:`${translateX}px`,
        position:'absolute',
      }
    };  
  }
    else{
    const fontFamily = 'Arial, sans-serif';
    const font = `normal 13px ${fontFamily}`;
    const width = getTextWidth(object.text,font);
    const translateY = 0;
    let translateX = 0;
    const X = info.x;
    const rowLabelsWidth = info.viewport?.x;
    const clusterLayerWidth = info.viewport?.width;

    if(rowLabelsWidth && clusterLayerWidth){
      const totalWidth = rowLabelsWidth + clusterLayerWidth;
      if(totalWidth-X < width){
        translateX = -width
      }
    }

    return  {
            html: `${object.text}`,
            style:{
              backgroundColor:'white',
              color:'black',
              padding:'0px',
              fontFamily:'Arial, sans-serif',
              fontSize:'13px',
              // height:'13px',
              width:`${width}px`,
              top:`${translateY}px`,
              left:`${translateX}px`,
              position:'absolute',
        }
      }
  }
}
    else if(layer.id === "heatmap-grid-layer-detailed" || layer.id === "heatmap-grid-layer-aggregated" ){

            const X = info.x;
            const Y = info.y;
            const rowLabelsWidth = info.viewport?.x;
            const colLabelsWidth = info.viewport?.y;
            const heatmapHeight = info.viewport?.height;
            const heatmapWidth = info.viewport?.width;
            let translateX:number = 0;
            let translateY:number = 0;
            let HTML;

            if(heatmapWidth && rowLabelsWidth ){
              const totalWidth = heatmapWidth + rowLabelsWidth;
              if(totalWidth-X < 180){
                translateX = -180;
              }
            }
            if(heatmapHeight && colLabelsWidth){
              const totalHeight = heatmapHeight + colLabelsWidth;
              if(totalHeight-Y < 80){
                translateY = -80;
              }
            }
              // <div style="margin-top: 5px;">
                    //   <strong>Sample Rows:</strong><br>
                    //   ${object.sampleRows.map((label:any) => `&nbsp;&nbsp;- ${label}<br>`).join('')}
                    // </div>
                    // <div style="margin-top: 5px;">
                    //   <strong>Sample Columns:</strong><br>
                    //   ${object.sampleCols.map((label:any) => `&nbsp;&nbsp;- ${label}<br>`).join('')}
                    // </div>


            if (!object.aggregated){
              // Format value to 3 decimal places to fix Float32Array precision artifacts
              const formattedValue = typeof object.value === 'number' ? object.value.toFixed(3) : object.value;
              if(object.colCategory){
                HTML = `Row: ${object.row}<br/>Column: ${object.col}<br/>
                ${Object.entries(object.colCategory).map(([key,value])=> `${key}:${(value as string).split(':')[1]}`).join('<br/>')}
                <br/>Value: ${formattedValue}`
              }
              else{
                HTML = `Row: ${object.row}<br/>Column: ${object.col}<br/>Value: ${formattedValue}`
              }
              return {
                // html: `Row: ${object.row}<br/>Column: ${object.col}<br/>Value: ${object.value}`,
                html:`${HTML}`,
                style:{
                  backgroundColor:'white',
                  color:'black',
                  padding:'0px',
                  width:'180px',
                  // height:'60px',
                  textAlign: 'left',
                  fontFamily:'Arial, sans-serif',
                  fontSize:'13px',
                  top:`${translateY}px`,
                  left:`${translateX}px`,
                  position:'absolute',
                  zIndex:'1',
                }
              }
            }
            else{
              // Tooltip for an AGGREGATED cell
              // Format value to 3 decimal places to fix Float32Array precision artifacts
              const formattedValue = typeof object.value === 'number' ? object.value.toFixed(3) : object.value;
                  HTML = `
                  <div style="text-align: left; font-family: sans-serif; font-size: 13px; padding: 4px;">
                    <div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Aggregated Cell</div>
                    <div><strong>Avg. Value:</strong> ${formattedValue}</div>
                    <div style="margin-top: 5px;">
                      <strong>Contains:</strong><br>
                      &nbsp;&nbsp;${object.rowCount} rows<br>
                      &nbsp;&nbsp;${object.colCount} columns<br>
                      &nbsp;&nbsp;(${object.cellCount} total cells)
                    </div>
                  </div>
                `;
              return {
                // html: `Row: ${object.row}<br/>Column: ${object.col}<br/>Value: ${object.value}`,
                html:`${HTML}`,
                style:{
                  backgroundColor:'white',
                  color:'black',
                  padding:'0px',
                  width:'180px',
                  // height:'60px',
                  textAlign: 'left',
                  fontFamily:'Arial, sans-serif',
                  fontSize:'13px',
                  top:`${translateY}px`,
                  left:`${translateX}px`,
                  position:'absolute',
                  zIndex:'1',
                }
              }
            }
           
        }
        else if(layer.id === IDS.LAYERS.ROW_LABELS){
          return null     
        }
        else if(layer.id === IDS.LAYERS.COL_LABELS){
          console.log('********* object is as follows *********',object)

          return null     
        }
        else{

          console.log('********* object is as follows *********',object)

          if('visibility' in object){
            if(!object.visibility){
              return {
                html: ``,
                style:{
                  backgroundColor:'white',
                  color:'black',
                  padding:'0px',
                }
              }
            }
            else{
              const fontFamily = 'Arial, sans-serif';
              const font = `normal 13px ${fontFamily}`;
              const width = getTextWidth(object.text,font);
              const translateY = 0;
              let translateX = 0;
              const X = info.x;
              const rowLabelsWidth = info.viewport?.x;
              const clusterLayerWidth = info.viewport?.width;

              if(rowLabelsWidth && clusterLayerWidth){
                const totalWidth = rowLabelsWidth + clusterLayerWidth;
                if(totalWidth-X < width){
                  translateX = -width
                }
              }
              return {
                html: `${object.text}`,
                style:{
                  backgroundColor:'white',
                  color:'black',
                  padding:'0px',
                  fontFamily:'Arial, sans-serif',
                  fontSize:'13px',
                  // height:'13px',
                  width:`${width}px`,
                  top:`${translateY}px`,
                  left:`${translateX}px`,
                  position:'absolute',
                }
              }
            }
          }
          else {
            const fontFamily = 'Arial, sans-serif';
            const font = `normal 13px ${fontFamily}`;
            const width = getTextWidth(object.text,font);
            const translateY = 0;
            let translateX = 0;
            const X = info.x;
            const rowLabelsWidth = info.viewport?.x;
            const clusterLayerWidth = info.viewport?.width;

            if(rowLabelsWidth && clusterLayerWidth){
              const totalWidth = rowLabelsWidth + clusterLayerWidth;
              if(totalWidth-X < width){
                translateX = -width
              }
            }

            return {
              html: `${object.text}`,
              style:{
                backgroundColor:'white',
                color:'black',
                padding:'0px',
                fontFamily:'Arial, sans-serif',
                fontSize:'13px',
                // height:'13px',
                width:`${width}px`,
                top:`${translateY}px`,
                left:`${translateX}px`,
                position:'absolute',

              }
            }
          }
        }
    }
    
  }