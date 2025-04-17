
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import {HEATMAP_WIDTH} from "../const"
import * as React from "react";

function valuetext(value: number) {
  return String(value);
}
type CustomSliderProps = {
  direction: "horizontal" | "vertical";
  setClusterValue: any;
  width:number;
};
export default function CustomSlider({ direction="horizontal",setClusterValue,width}: CustomSliderProps) {
  const [value, setValue] = React.useState<number>(5);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    console.log(event)
    setValue(newValue as number);
    if(direction === 'horizontal'){
      setClusterValue(12-(newValue as number));
    }
    else{
      setClusterValue(newValue as number);
    }
  };

  return (
    <Box
      sx={{
        width: direction === 'vertical'?"20px":"100px",
        height: direction === 'vertical'?"100px":"20px",
        position: "absolute",
        top: direction === "vertical"?`${0}%`:"90%",
        left: direction === 'vertical'?`${98}%`:`${width}px`
      }}
    >
      <Slider
        orientation={direction}
        value={value}
        onChange={handleSliderChange}
        getAriaValueText={valuetext}
        marks={[]}
        min={1}
        max={11}
        step={1}
        valueLabelDisplay="off"
        sx={{
          "& .MuiSlider-rail": {
            width:direction === 'vertical'?"12px":"100px",
            height:direction === 'vertical'?"100px":"12px",
            borderRadius: "4px",
            background: "#D3D3D3",
            opacity: 1,
            clipPath: direction === 'vertical'?"polygon(0% 0%,100% 0%,50% 100%,0% 0%)":"polygon(0% 0%,0% 100%,100% 50%,0% 0%)",

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
        }}
      />
    </Box>
  );
}




