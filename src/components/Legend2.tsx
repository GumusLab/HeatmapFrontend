import React from 'react';

export const LEGEND_HEIGHT = '50%';
export const LEGEND_WIDTH = 20;
export const LEGEND_FONT_SIZE = '12px';

export type LegendProps = {
  min: number;
  max: number;
  maxColor: string;
  minColor: string;
  legendHeight?: number | string;
  legendWidth?: number | string;
  fontSize?: number | string;
  unit?:string;
};

const Legend2 = ({
  min,
  max,
  maxColor,
  minColor,
  legendWidth = LEGEND_WIDTH,
  legendHeight = LEGEND_HEIGHT,
  fontSize = LEGEND_FONT_SIZE,
  unit,
}: LegendProps) => {

  return (
    <div
      style={{
        height: legendHeight,
        width: legendWidth ?? LEGEND_WIDTH,
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column', // Change the flex direction to column
        // alignItems: 'center',
        justifyContent: 'space-between', // Align items to either end
        zIndex: -1, // make sure that the legend renders underneath the tooltip
      }}
    >
      
      {/* <p style={{ marginBlock: 0, margin: 0, fontSize}}>
        <b>{max}</b>
      </p> */}
      <div
        style={{
            height: '60%',
            width: '100%',
            border:'0.5px solid black',
            backgroundImage: `linear-gradient(
            to left,
            ${max > 0 ? `${maxColor}, ` : ''}
            white
            ${min < 0 ? `, ${minColor}` : ''}
            )`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px', 
            fontWeight: 'normal', 
            fontFamily: 'Arial, sans-serif'
        }}
    >
        {unit}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between', // Align items to either end
          alignItems: 'center',
          height: '40%', // Height of the container for min and max values
          marginTop:'5px',
          fontSize:fontSize,
        }}
      >
        {/* Min Value */}
        <div>
          <h3 style={{fontWeight: 'normal', fontFamily: 'Arial, sans-serif'}}>{min.toFixed(1)}</h3>
        </div>
        {/* Max Value */}
        <div>
          <h3 style={{fontWeight: 'normal', fontFamily: 'Arial, sans-serif'}}>{max.toFixed(1)}</h3>
        </div>
      </div>
    </div>
  );
};

export default Legend2;
