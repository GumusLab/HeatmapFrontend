
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';
import MenuIcon from '@mui/icons-material/Menu';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CropIcon from '@mui/icons-material/Crop';
import { Tooltip } from '@mui/material';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { styled, useTheme } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';
import type {
  DataStateShape
} from '../types';
import { order } from '../types';
import MultiSelect from './CustomMultiSelect';
import ListComponent from './ListComponent';
import SearchBox from './SearchBox';
import SimpleSelection from './SimpleSelection';
import MultipurposeSlider from './opcatiySlider';
import ReplayIcon from '@mui/icons-material/Replay';

const orderArray = ['alphabetically','cluster','sum','variance']
// interface order{
//     row:string;
//     col:string;
//     rowCat:string[];
//     sortByRowCat:boolean;
//     colCat:string[];
//     sortByColCat:boolean;
// }
interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
export default function PersistentDrawerLeft({
  parentContainerRef,
  setIsDrawerOpen,
  setOpacityValue,
  setPvalThreshold,
  setOrder,
  categories,
  resultCategories,
  order,
  Legend,
  panelWidth,
  ID,
  dataState,
  setState,
  setResultCategory,
  setSearchTerm,
  downloadHeatmap,
  downloadMatrix,
  setCropping,
  setFilteredIdxDict,
  cropBox
}: {
  parentContainerRef: HTMLDivElement;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpacityValue: React.Dispatch<React.SetStateAction<number>>;
  setPvalThreshold?:React.Dispatch<React.SetStateAction<number>>;
  setOrder:React.Dispatch<React.SetStateAction<any>>;
  categories:{row:{};col:{};};
  resultCategories?:string[];
  order:order;
  Legend: React.ReactElement;
  panelWidth: number;
  ID:string;
  dataState: DataStateShape | null ;
  setState?:React.Dispatch<React.SetStateAction<string>>;
  setResultCategory?:React.Dispatch<React.SetStateAction<string>>;
  setSearchTerm:React.Dispatch<React.SetStateAction<string>>;
  downloadHeatmap:any;
  downloadMatrix:any;
  setCropping: any;
  setFilteredIdxDict:any;
  cropBox:CropBox|null;

}) {
  const [isDrawerOpen, setDrawerOpen] = useState(true);
  const theme = useTheme();
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedColIndex, setSelectedColIndex] = useState(0);

  const rowlabels = useMemo(
    () => {
      if(dataState){
      return dataState.rowLabels?.map((ele: {text: string}) => ele.text)
      }
      else{
        return null
      }
  }, [dataState?.rowLabels]);

  const drawerWidth = panelWidth;
  const colCategorynames = Object.keys(categories.col);
  const rowCategorynames = Object.keys(categories.row);


  const handleRowItemClick = (index: number) => {
    console.log('rowitemclick')
    setSelectedRowIndex(index);
    setOrder((prevOrder:any) => ({ ...prevOrder, row: orderArray[index], sortByRowCat:""}));
  };

  const handleColItemClick = (index: number) => {
    setSelectedColIndex(index);
    setOrder((prevOrder:any) => ({ ...prevOrder, col: orderArray[index], sortByColCat:""}));
  };

  useEffect(() => {
    const parentContainer = parentContainerRef;
    const drawer = document.querySelector('.MuiDrawer-paper');
    if (parentContainer && drawer instanceof HTMLElement) {
      const parentContainerHeight = parentContainer.offsetHeight;
      drawer.style.height = `${parentContainerHeight}px`;
    }
  }, [parentContainerRef]);

  const DrawerHeader = styled('div')(({ }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingTop: '2px', // Adjust the top padding to control the height
    paddingBottom: '2px',
    justifyContent: 'flex-end',
  }));

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setIsDrawerOpen(false);
  };
  return (
    <div style={{width: drawerWidth,height:'100%',margin:'0px'}}>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerOpen}
        edge="start"
        sx={{
        position: 'absolute',
        top: 1,
        left: 2,
        zIndex: 1000, // Add this line to set the z-index of the IconButton
        mr: 0, ...(isDrawerOpen && { display: 'none' }) }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: 1,
            left: 2,
            position:'absolute',
          },
          position: 'relative',
          height: '100%',
          maxHeight: '100vh',
          zIndex: 1
        }}
        variant="persistent"
        anchor="left"
        open={isDrawerOpen}
      >
        <DrawerHeader>
        <Tooltip 
        title="Take snapshot"   
        slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -14],
              },
            },
          ],
        },
      }}>
          <IconButton onClick={downloadHeatmap}>
            <PhotoCameraIcon /> 
          </IconButton>
          
        </Tooltip>
        <Tooltip
        title="Download Matrix"   
        slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -14],
              },
            },
          ],
        },
      }}>
        <IconButton>
            <DownloadIcon onClick={downloadMatrix} />
          </IconButton>

      </Tooltip>
      {
        cropBox ?  
        <IconButton onClick={setFilteredIdxDict} >
        <ReplayIcon/>
        </IconButton> :
        <Tooltip
        title="Crop Mode"   
        slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -14],
              },
            },
          ],
        },
      }}>
        <IconButton onClick={setCropping} >
            <CropIcon />
          </IconButton>

      </Tooltip>
      }

          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <div style={{ marginLeft: '10px', marginRight: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
          <h3 style={{ margin: '0', padding:'0',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }}>
            Row Order
          </h3>
          <ListComponent selectedIndex={selectedRowIndex} handleItemClick={handleRowItemClick}/>
        </div>
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'10px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          <h3 style={{ margin: '0',padding:'0', fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' }}>
            Col Order 
          </h3>
          <ListComponent selectedIndex={selectedColIndex} handleItemClick={handleColItemClick}/>
        </div>
        {rowlabels && <SearchBox elements={rowlabels} setSearchTerm={setSearchTerm}/>}
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        <h3 style={{ margin: '0', padding:'0',marginTop: '0', marginBottom: '2px',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' 
}}>
            Opacity Slider
          </h3>
        <MultipurposeSlider direction='horizontal' setOpacityValue={setOpacityValue} minVal={0.5} maxVal={3} step={0.5} initialVal={1}/>
        {/* <MultipurposeSlider direction='horizontal' setOpacityValue={setOpacityValue} minVal={0} maxVal={1} step={0.05} initialVal={0.05} calculateSteps={true}/> */}
        </div>

        {['olinkHeatmap','cytofHeatmap','serologyHeatmap','rnaseqHeatmap'].includes(ID) && setPvalThreshold &&
            <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <h3 style={{ margin: '0', padding:'0',marginTop: '0', marginBottom: '2px',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' 
    }}>
                P-value Slider
              </h3>
            <MultipurposeSlider direction='horizontal' setOpacityValue={setPvalThreshold} minVal={0} maxVal={1} step={0.05} initialVal={0.05} calculateSteps={true}/>
            </div>
        }

        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'10px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        <h3 style={{ margin: '0', padding:'0',marginTop: '0', marginBottom: '2px',fontSize: '14px', fontWeight: 'normal', fontFamily: 'Arial, sans-serif' 
}}>
            Matrix Values
          </h3>
        </div>
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'0px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        {Legend}
        </div>
        {colCategorynames.length>0 &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'50px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        <MultiSelect elements={colCategorynames} order={order} setOrder={setOrder} axis='col'/>
        </div>}

        {rowCategorynames.length>0 &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
        <MultiSelect elements={rowCategorynames} order={order} setOrder={setOrder} axis='row'/>
        </div>}
        
        {/* previous line */}
        {/* {ID==='olinkPatientHeatmap' && setState &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['Zscore','Raw']} setState={setState} initialValue='Zscore' labelName='Value Scale'/>
        </div>} */}

        {['olinkPatientHeatmap','cytofPatientHeatmap','serologyPatientHeatmap','rnaseqPatientHeatmap'].includes(ID) && setState &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['Zscore','Raw']} setState={setState} initialValue='Zscore' labelName='Value Scale'/>
        </div>}


        {['olinkHeatmap','cytofHeatmap','serologyHeatmap','rnaseqHeatmap'].includes(ID) && setResultCategory && resultCategories &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'50px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={resultCategories} setState={setResultCategory} initialValue={resultCategories[0]} labelName='Result Type'/>
        </div>}
        {['olinkHeatmap','cytofHeatmap','serologyHeatmap','rnaseqHeatmap'].includes(ID) && setState &&
        <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['logFC','nLogP']} setState={setState} initialValue='logFC' labelName='Value Type'/>
        </div>
        }
         {/* <div style={{ marginLeft: '10px', marginRight: '10px',marginTop:'30px',display: 'flex', flexDirection: 'column', justifyContent: 'flex-start'}}>
            <SimpleSelection elements={['logFC','nLogP']} setState={setState} initialValue='logFC' labelName='Distance Type'/>
        </div> */}
      </Drawer>
      </div>
    // </div> 
  );
}