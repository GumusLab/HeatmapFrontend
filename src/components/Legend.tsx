import React, { useState } from 'react';

export const LEGEND_HEIGHT = '50%';
export const LEGEND_WIDTH = 20;
export const LEGEND_FONT_SIZE = '10px';

export type LegendProps = {
  min: number;
  max: number;
  maxColor: string;
  minColor: string;
  colLabelsWidth: number;
  legendHeight?: number | string;
  legendWidth?: number | string;
  offsetFromChart?: number;
  fontSize?: number | string;
  unit?:string;
};

const Legend = ({
  min,
  max,
  maxColor,
  minColor,
  colLabelsWidth,
  legendWidth = LEGEND_WIDTH,
  legendHeight = LEGEND_HEIGHT,
  offsetFromChart = LEGEND_WIDTH / 2,
  fontSize = LEGEND_FONT_SIZE,
  unit,
}: LegendProps) => {

  const [hoveredValue, setHoveredValue] = useState<number|null>(null);
  const [Position, setPosition] = useState<{ top: number; left: number } | null>(null);


  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { top} = event.currentTarget.getBoundingClientRect();
    const { clientY, clientX } = event;
    setHoveredValue(clientY <= top + (event.currentTarget.offsetHeight / 2) ? max : min);
    setPosition({ top: clientY, left: clientX });
  };

  const handleMouseLeave = () => {
    setHoveredValue(null);
    setPosition(null);
  };

  // const minLimit = min
  // const maxLimit = max
  return (
    <div
      style={{
        height: legendHeight,
        width: legendWidth ?? LEGEND_WIDTH,
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        top: colLabelsWidth,
        right:
          typeof legendWidth === 'number'
            ? `-${legendWidth + offsetFromChart}px`
            : `-${legendWidth + offsetFromChart}`,
        zIndex: -1, // make sure that the legend renders underneath the tooltip
      }}
    >
      
      <p style={{ marginBlock: 0, margin: 0, fontSize }} onMouseMove={()=>{setHoveredValue(max); setPosition({top:1 , left:1})}} onMouseLeave={()=>{setHoveredValue(null); setPosition(null)}}>
        <b>Max</b>
      </p>
      <div
        style={{
          height: '100%',
          width: legendWidth,
          backgroundImage: `linear-gradient(
            ${max > 0 ? `${maxColor}, ` : ''}
            white
            ${min < 0 ? `, ${minColor}` : ''}
        )`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {hoveredValue !== null && Position !== null && (
        <p
          style={{
            position: 'relative',
            // top:`${Position.top}px`,
            top:legendHeight,
            left:-20,
            margin: 0,
            padding: '5px',
            // backgroundColor: 'white',
            zIndex:1,
          }}
        >
          {hoveredValue === max ? 'Max' : 'Min'}: {hoveredValue.toFixed(2)}
        </p>
      )}
      <p
        style={{
          position: 'absolute',
          margin: 0,
          fontSize: '14px',
          top: '60%', // adjust the vertical position as needed
          left: '5px', // adjust the horizontal position as needed
          transform: 'rotate(-90deg)', // rotate the text
          transformOrigin: 'left', // set the rotation origin to the center
          whiteSpace: 'nowrap', // prevent text from wrapping
        }}
      >
        <b>{unit}</b>
      </p>
      </div>
      <p style={{ marginBlock: 0, margin: 0, fontSize }} onMouseMove={()=>{setHoveredValue(min); setPosition({ top: 1, left: 1 });}} onMouseLeave={()=>{setHoveredValue(null); setPosition(null);}}>
        <b>Min</b>
      </p>
    </div>
  );
};

export default Legend;
