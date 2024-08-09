// https://stackoverflow.com/a/30219884

const color = function (
  r?: number,
  g?: number,
  b?: number,
  a?: number
): [number, number, number, number] {
  r = typeof r === 'undefined' ? 0 : r;
  g = typeof g === 'undefined' ? 0 : g;
  b = typeof b === 'undefined' ? 0 : b;
  a = typeof a === 'undefined' ? 0 : a;
  return [r, g, b, a];
};
export const makeColorRange = function (c1: number[], c2: number[],opacity:any) {
  const colorList = [];
  let tmpColor;
  for (let i = 0; i < 255; i++) {
    tmpColor = color(
      c1[0] + (i * (c2[0] - c1[0])) / 255,
      c1[1] + (i * (c2[1] - c1[1])) / 255,
      c1[2] + (i * (c2[2] - c1[2])) / 255,
      c1[3] + (i * (c2[3] - c1[3])) / 255*opacity
    );
    colorList.push(tmpColor);
  }
  return colorList;
};

export const getColorRange = (min: number,opacity:any) => {
  return min < 0
    ? makeColorRange([0, 0, 255, 0], [0, 0, 255, 255],opacity)
    : makeColorRange([255, 0, 0, 0], [255, 0, 0, 255],opacity);
};
