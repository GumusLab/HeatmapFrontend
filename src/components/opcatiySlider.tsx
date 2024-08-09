
// import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import * as React from "react";
// import { OPACITY } from "../const";

function valuetext(value: number) {
  return String(value);
}
type CustomSliderProps = {
  direction: "horizontal" | "vertical";
  setOpacityValue: any;
  minVal: number;
  maxVal: number;
  step: number;
  initialVal: number;
  calculateSteps?: boolean;
};
export default function MultipurposeSlider({ direction="horizontal",setOpacityValue,minVal,maxVal,step,initialVal,calculateSteps=false}: CustomSliderProps) {
  const [value, setValue] = React.useState<number>(initialVal);

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    setOpacityValue(newValue as number);
  };

  let steps:any = []
  let stepSize:any
  if(calculateSteps){
    // steps.push({value:minVal})
    // for(let i=0;i<0.05;i=i+0.01){
    //   steps.push({value:Number(i.toFixed(2))})

    // }
    // steps.push({value:0.05})
    // for(let i = 0.1;i < 1;i = i+0.05 ){
    //   steps.push({value:Number(i.toFixed(2))})

    // }
    // steps.push({value:maxVal})
    // steps = [0,0.001,0.002,0.003,0.004,0.005,0.01,0.02,0.03,0.04,0.05,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]
    steps = [
      0, 0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01,
      0.015, 0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.06, 0.07, 0.08,
      0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1
    ];
    stepSize = (maxVal-minVal)/(steps.length - 1)
  }

  return (
    // <Box
    //   sx={{
    //     width: direction === 'vertical'?"20px":"100%",
    //     height: direction === 'vertical'?"100px":"12px",
    //     position: "relative",
    //     marginTop: "0px",
    //     border: '1px solid black',
    //     paddingTop: "0px",
    //     // top: '-20%',
    //     // left: '50%'
    //   }}
    // > 
    <div style={{marginTop:0,paddingTop:0}}>
      <Slider
        orientation={direction}
        value={value}
        onChange={handleSliderChange}
        getAriaValueText={valuetext}
        marks= {calculateSteps ? steps : []}
        min={minVal}
        max={maxVal}
        step={calculateSteps ? stepSize : step}
        valueLabelDisplay="auto"
        sx={{
            margin: 0, // override default margin
            padding: 0,
            marginTop:0,
            paddingTop:0,
          "& .MuiSlider-rail": {
            width:direction === 'vertical'?"12px":"100%",
            height:direction === 'vertical'?"100px":"12px",
            borderRadius: "4px",
            background: "#D3D3D3",
            opacity: 1,
            // clipPath: direction === 'vertical'?"polygon(0% 0%,100% 0%,100% 100%,0% 0%)":"polygon(0% 0%,0% 100%,100% 100%,0% 0%)",

          },
          "& .MuiSlider-track": {
            display: "none",
          },
          "& .MuiSlider-thumb": {
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "#1e90ff",
            border: "4px solid #fff",
            boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.1), 0px 2px 2px 0px rgba(0,0,0,0.1), 0px 1px 5px 0px rgba(0,0,0,0.1)",
          },
          "& .MuiSlider-thumb:hover": {
            boxShadow: "0px 3px 1px -2px rgba(0,0,0,0.3), 0px 2px 2px 0px rgba(0,0,0,0.3), 0px 1px 5px 0px rgba(0,0,0,0.3)",
          },
          "& .MuiSlider-thumb.Mui-focusVisible": {
            boxShadow: "0px 3px 5px 1px rgba(0,0,0,0.3), 0px 1px 10px 2px rgba(0,0,0,0.3), 0px 2px 4px -1px rgba(0,0,0,0.3)",
          },
          "& .MuiSlider-thumb.Mui-active": {
            boxShadow: "0px 3px 5px 1px rgba(0,0,0,0.5), 0px 1px 10px 2px rgba(0,0,0,0.5), 0px 2px 4px -1px rgba(0,0,0,0.5)",
          },
          "& .MuiSlider-thumb:hover .MuiSlider-tooltip": {
            opacity: 1,
            pointerEvents: "auto",
          },
          "& .MuiSlider-mark": {
            display: "none", // Hide marks
          },
        }}
      />
      </div>
  );
}




