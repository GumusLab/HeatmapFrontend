import { RefObject, useEffect, useMemo, useState } from 'react';
import {HEATMAP_PARENT_HEIGHT_RATIO, HEATMAP_PARENT_WIDTH_RATIO} from '../const'

export const useDimensions = (container: HTMLDivElement) => {
  const [dimensions, setDimensions] = useState<[number, number] | null>(null);
  const resizeObs = useMemo(
    () =>
      new ResizeObserver((entries) => {
        setDimensions([
          HEATMAP_PARENT_WIDTH_RATIO/100*entries[0].contentRect.width,
          HEATMAP_PARENT_HEIGHT_RATIO/100*entries[0].contentRect.height,
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
