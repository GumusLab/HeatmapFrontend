export const maybeTruncateLabel = (label: string, truncateLength: number) => {
  if (label.length > truncateLength) {
    // subtract 3 to accomodate for ellipsis
    // return label.slice(0, truncateLength-3).concat('...');
    return label.slice(0, truncateLength);
  }
  // else if(label.length < truncateLength){
  //   return label.padEnd(truncateLength, ' ');
  // }
  return label;
};
