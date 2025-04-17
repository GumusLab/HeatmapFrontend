// Function to generate a range of numbers between start and end (inclusive)
const generateRange = (start: number, end: number): Set<number> => {
    const rangeSet = new Set<number>();
    for (let i = start; i <= end; i++) {
      rangeSet.add(i);
    }
    return rangeSet;
  };

export default generateRange;

  