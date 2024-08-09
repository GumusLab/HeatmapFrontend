import { RefObject, useEffect, useMemo, useState } from 'react';

export const useDimensions = (container: HTMLDivElement) => {
  const [dimensions, setDimensions] = useState<[number, number] | null>(null);
  const resizeObs = useMemo(
    () =>
      new ResizeObserver((entries) => {
        setDimensions([
          entries[0].contentRect.width,
          entries[0].contentRect.height,
        ]);
      }),
    []
  );
  useEffect(() => {
    if (container) {
      resizeObs.observe(container);
    }
    return () => {
      resizeObs.disconnect();
    };
  }, [container, resizeObs]);
  return dimensions;
};
