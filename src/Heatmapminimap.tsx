import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DataStateShape, HeatmapStateShape, ViewState } from './types';
import { IDS, BASE_ZOOM } from './const';
import {ViewStateChangeProps} from "./state/useViewStates"
import clamp from 'lodash/clamp';

interface HeatmapMinimapProps {
  viewState: ViewState;
  onViewStateChange:(params: ViewStateChangeProps) => void;
  dataState: DataStateShape | null;
  heatmapState: HeatmapStateShape | null;
  width?: number;
  height?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  gridResolution?: number;
  colLabelsWidth: number;
  rowLabelsWidth: number;
  opacity:number;
}


const generateOptimizedWorkerCode = () => {
  return `
    self.onmessage = function(e) {
      const {
        cellData,
        colors,
        width,
        height,
        gridResolution,
        numColumns,
        numRows,
        opacity
      } = e.data;

      try {
        // --- 1. Validate Inputs in Worker ---
        if (!width || !height || !gridResolution || !numColumns || !numRows) {
          throw new Error('Worker missing required parameters.');
        }

        if (!cellData?.colIndices || !cellData?.rowIndices || !colors) {
           throw new Error('Worker missing required data arrays.');
        }

        const { colIndices, rowIndices, values } = cellData;
        const totalCells = Math.min(colIndices.length, rowIndices.length, values?.length || colIndices.length);

        if (totalCells === 0) {
          self.postMessage({ success: true, imageData: new ImageData(width, height) });
          return;
        }

        // --- 2. Setup Grid and Scaling ---
        const gridCellWidth = width / gridResolution;
        const gridCellHeight = height / gridResolution;

        const gridCounts = new Uint32Array(gridResolution * gridResolution);
        const gridR = new Uint32Array(gridResolution * gridResolution);
        const gridG = new Uint32Array(gridResolution * gridResolution);
        const gridB = new Uint32Array(gridResolution * gridResolution);
        const gridA = new Uint32Array(gridResolution * gridResolution);

        const scaleX = width / numColumns;
        const scaleY = height / numRows;

        console.log('🔍 Minimap worker scaling debug:', {
          width, height, numColumns, numRows,
          scaleX, scaleY,
          totalCells,
          sampleCoords: totalCells > 0 ? {
            firstCell: { row: rowIndices[0], col: colIndices[0] },
            lastCell: { row: rowIndices[totalCells-1], col: colIndices[totalCells-1] }
          } : null
        });

        // --- 3. Process Cells and Accumulate Colors (including Alpha) ---
        for (let i = 0; i < totalCells; i++) {
          const row = rowIndices[i];
          const col = colIndices[i];

          if (row < 0 || col < 0) continue;

          const x = col * scaleX;
          const y = row * scaleY;

          const gridX = Math.min(gridResolution - 1, Math.floor(x / gridCellWidth));
          const gridY = Math.min(gridResolution - 1, Math.floor(y / gridCellHeight));
          const gridIdx = gridY * gridResolution + gridX;

          const colorIdx = i * 4;
          if (colorIdx + 3 >= colors.length) continue;
          
          const alpha = colors[colorIdx + 3];
          if (alpha < 20) continue;

          gridR[gridIdx] += colors[colorIdx];
          gridG[gridIdx] += colors[colorIdx + 1];
          gridB[gridIdx] += colors[colorIdx + 2];
          gridA[gridIdx] += alpha;
          gridCounts[gridIdx]++;
        }

        // --- 4. Render Grid to ImageData with Alpha Blending ---
        const imageData = new ImageData(width, height);
        const data = imageData.data;
        
        const bgColor = { r: 240, g: 240, b: 240 };

        // Initialize with a light background color first.
        for (let i = 0; i < data.length; i += 4) {
            data[i] = bgColor.r;
            data[i + 1] = bgColor.g;
            data[i + 2] = bgColor.b;
            data[i + 3] = 255; // Opaque background
        }

        // Iterate through the grid and draw the averaged color blocks on top of the background
        for (let gridY = 0; gridY < gridResolution; gridY++) {
          for (let gridX = 0; gridX < gridResolution; gridX++) {
            const gridIdx = gridY * gridResolution + gridX;
            const count = gridCounts[gridIdx];

            if (count > 0) {
              // Calculate the average color of the data points in this grid cell
              const avgR = Math.round(gridR[gridIdx] / count);
              const avgG = Math.round(gridG[gridIdx] / count);
              const avgB = Math.round(gridB[gridIdx] / count);
              const avgA = Math.round(gridA[gridIdx] / count);

              // **FIX**: Perform manual alpha blending against the background color
              const alphaNorm = avgA * opacity/ 255; // Normalize alpha to 0.0 - 1.0
              const finalR = Math.round((avgR * alphaNorm) + (bgColor.r * (1 - alphaNorm)));
              const finalG = Math.round((avgG * alphaNorm) + (bgColor.g * (1 - alphaNorm)));
              const finalB = Math.round((avgB * alphaNorm) + (bgColor.b * (1 - alphaNorm)));

              const startX = Math.floor(gridX * gridCellWidth);
              const endX = Math.floor((gridX + 1) * gridCellWidth);
              const startY = Math.floor(gridY * gridCellHeight);
              const endY = Math.floor((gridY + 1) * gridCellHeight);

              for (let py = startY; py < endY; py++) {
                for (let px = startX; px < endX; px++) {
                  const pixelIndex = (py * width + px) * 4;
                  data[pixelIndex] = finalR;
                  data[pixelIndex + 1] = finalG;
                  data[pixelIndex + 2] = finalB;
                  // The final pixel is fully opaque because we have blended it with an opaque background
                  data[pixelIndex + 3] = 255; 
                }
              }
            }
          }
        }

        // --- 5. Post Result Back to Main Thread ---
        self.postMessage({ success: true, imageData: imageData });

      } catch (error) {
        console.error('Error in heatmap worker:', error);
        self.postMessage({ success: false, error: error.message });
      }
    };
  `;
};


/**
 * Creates a density map by offloading the computation to a Web Worker.
 * This function initiates the worker, sends it data, and returns a promise
 * that resolves with the generated ImageData.
 * @param heatmapState - Contains cell data and colors.
 * @param dataState - Contains overall data dimensions like numColumns and numRows.
 * @param width - The width of the minimap canvas.
 * @param height - The height of the minimap canvas.
 * @param gridResolution - The resolution of the aggregation grid.
 * @returns A promise that resolves to the generated ImageData.
 */
const createDensityMapBlockBased = async (
  heatmapState: HeatmapStateShape,
  dataState: DataStateShape,
  width: number,
  height: number,
  gridResolution: number,
  opacity:number
): Promise<ImageData> => {

  // --- 1. Validate Inputs on Main Thread ---
  if (!width || !height || width <= 0 || height <= 0) {
    console.warn('Invalid dimensions for minimap.');
    return new ImageData(width || 1, height || 1);
  }

  if (!heatmapState?.cellData || !heatmapState?.colors || !dataState?.numColumns || !dataState?.numRows) {
    console.warn('Minimap is missing required data from heatmapState or dataState.');
    return new ImageData(width, height);
  }

  // --- 2. Use the dataState dimensions directly ---
  // If backend filtering is working correctly, dataState should have the right dimensions
  console.log('📊 Minimap data dimensions:', {
    dataState: { columns: dataState.numColumns, rows: dataState.numRows },
    cellDataLength: heatmapState.cellData.colIndices.length
  });

  // --- 3. Create and Manage Web Worker ---
  return new Promise((resolve, reject) => {
    const workerCode = generateOptimizedWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(blob.toString()); // Clean up blob URL
      reject(new Error('Minimap worker timed out after 30 seconds.'));
    }, 30000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(blob.toString()); // Clean up blob URL

      if (e.data.success) {
        console.log('✅ Minimap worker finished successfully.');
        resolve(e.data.imageData);
      } else {
        console.error('❌ Minimap worker reported an error:', e.data.error);
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(blob.toString()); // Clean up blob URL
      console.error('💥 An unhandled error occurred in the minimap worker:', error);
      reject(error);
    };

    // --- 4. Send Data to Worker ---
    // Use the dataState dimensions directly
    console.log('📤 Sending data to minimap worker...');
    worker.postMessage({
      cellData: heatmapState.cellData,
      colors: heatmapState.colors,
      width,
      height,
      gridResolution,
      numColumns: dataState.numColumns,  // Use dataState dimensions
      numRows: dataState.numRows,        // Use dataState dimensions
      opacity
    });
  });
};


const HeatmapMinimap: React.FC<HeatmapMinimapProps> = ({
  viewState,
  onViewStateChange,
  dataState,
  heatmapState,
  width: propWidth = 180,
  height: propHeight = 180,
  position = 'bottom-right',
  gridResolution = 25,
  colLabelsWidth,
  rowLabelsWidth,
  opacity
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [densityData, setDensityData] = useState<ImageData | null>(null);

  // Calculate minimap dimensions based on data aspect ratio
  const { width, height } = useMemo(() => {
    if (!dataState || !heatmapState) {
      return { width: propWidth, height: propHeight };
    }

    const dataWidth = dataState.numColumns * heatmapState.cellDimensions.width;
    const dataHeight = dataState.numRows * heatmapState.cellDimensions.height;
    const dataRatio = dataWidth / dataHeight;

    // Use the larger of propWidth/propHeight as the base dimension
    const maxDimension = Math.max(propWidth, propHeight);

    let calculatedWidth: number;
    let calculatedHeight: number;

    if (dataRatio > 1) {
      // Data is wider than tall
      calculatedWidth = maxDimension;
      calculatedHeight = maxDimension / dataRatio;
    } else {
      // Data is taller than wide
      calculatedHeight = maxDimension;
      calculatedWidth = maxDimension * dataRatio;
    }

    return {
      width: Math.round(calculatedWidth),
      height: Math.round(calculatedHeight)
    };
  }, [dataState, heatmapState, propWidth, propHeight]);

  // Calculate total dimensions and scales
  const totalDimensions = useMemo(() => {
    if (!dataState || !heatmapState) return { width: 0, height: 0, scaleX: 1, scaleY: 1 };

    // Use dataState dimensions directly - backend filtering should provide correct dimensions
    const totalWidth = dataState.numColumns * heatmapState.cellDimensions.width;
    const totalHeight = dataState.numRows * heatmapState.cellDimensions.height;


    return {
      width: totalWidth,
      height: totalHeight,
      scaleX: width / totalWidth,
      scaleY: height / totalHeight
    };
  }, [dataState, heatmapState, width, height]);
  
  // Update viewport rectangle when view state changes
  useEffect(() => {
    if (!heatmapState || !viewState || !totalDimensions.width) return;
    
    // Get zoom value
    const zoom = Array.isArray(viewState.zoom) ? viewState.zoom[0] : viewState.zoom;

    // Calculate scale factor based on your onViewStateChange logic
    const nextScaleFactor = 2 ** (zoom - BASE_ZOOM);

    // Get the actual view dimensions and calculate visible area in world coordinates
    const actualViewWidth = heatmapState.width;
    const actualViewHeight = heatmapState.height;

    // Calculate viewport size in world coordinates (matching useViewStates.ts logic)
    // In useViewStates.ts: viewW = heatmapState.width / scale, halfW = viewW / 2 / baseScaleFactor
    // Since baseScaleFactor = 2^BASE_ZOOM = 1 (when BASE_ZOOM = 0)
    // halfW = (heatmapState.width / scale) / 2 = heatmapState.width / (2 * scale)
    const baseScaleFactor = 2 ** BASE_ZOOM;
    const viewW = actualViewWidth / nextScaleFactor;
    const viewH = actualViewHeight / nextScaleFactor;
    const halfW = viewW / 2 / baseScaleFactor;
    const halfH = viewH / 2 / baseScaleFactor;

    // Calculate the visible area in world coordinates (matching your constraint logic)
    const visibleArea = {
      minX: viewState.target[0] - halfW,
      minY: viewState.target[1] - halfH,
      maxX: viewState.target[0] + halfW,
      maxY: viewState.target[1] + halfH
    };
    
    // Calculate the data bounds in world coordinates using dataState dimensions
    if (!heatmapState || !dataState) return;

    const cellWidth = heatmapState.cellDimensions.width;
    const cellHeight = heatmapState.cellDimensions.height;

    // Use dataState dimensions directly - backend filtering should provide correct dimensions
    const dataWidth = dataState.numColumns * cellWidth;
    const dataHeight = dataState.numRows * cellHeight;

    // Calculate offset matching useViewStates.ts logic:
    // offsetX = heatmapState.width / 2 / baseScaleFactor
    const offsetX = actualViewWidth / 2 / baseScaleFactor;
    const offsetY = actualViewHeight / 2 / baseScaleFactor;

    // The actual navigable data bounds should match the target constraints in useViewStates.ts
    // The target can go from (-offsetX + halfW) to (dataW - offsetX - halfW)
    // So the viewport's left edge can go from (-offsetX + halfW - halfW) = -offsetX
    // And the viewport's right edge can go from (dataW - offsetX - halfW + halfW) = dataW - offsetX
    // This means the data bounds for the minimap are the full data extent
    const dataMinX = -offsetX;
    const dataMinY = -offsetY;
    const dataMaxX = dataWidth - offsetX;
    const dataMaxY = dataHeight - offsetY;

    // Convert to minimap coordinates with proper offset
    // Map world coordinates [dataMinX, dataMaxX] to minimap coordinates [0, width]
    const minimapX = ((visibleArea.minX - dataMinX) / (dataMaxX - dataMinX)) * width;
    const minimapY = ((visibleArea.minY - dataMinY) / (dataMaxY - dataMinY)) * height;
    const minimapWidth = ((visibleArea.maxX - visibleArea.minX) / (dataMaxX - dataMinX)) * width;
    const minimapHeight = ((visibleArea.maxY - visibleArea.minY) / (dataMaxY - dataMinY)) * height;
    
    // Debug logging
    console.log('🗺️ Minimap Debug:', {
      visibleArea,
      dataBounds: { minX: dataMinX, maxX: dataMaxX, minY: dataMinY, maxY: dataMaxY },
      minimapBox: { x: minimapX, y: minimapY, width: minimapWidth, height: minimapHeight },
      minimapSize: { width, height },
      boxRightEdge: minimapX + minimapWidth,
      boxBottomEdge: minimapY + minimapHeight,
      shouldReachRight: minimapX + minimapWidth >= width - 1,
      shouldReachBottom: minimapY + minimapHeight >= height - 1,
      target: viewState.target,
      zoom,
      // Additional debug
      heatmapStateSize: { width: heatmapState.width, height: heatmapState.height },
      actualViewSize: { width: actualViewWidth, height: actualViewHeight },
      offsetX, offsetY,
      dataSize: { width: dataWidth, height: dataHeight },
      cellSize: { width: cellWidth, height: cellHeight },
      numCells: { cols: dataState.numColumns, rows: dataState.numRows }
    });

    // console.log('Minimap Debug:', {
    //   zoom,
    //   nextScaleFactor,
    //   target: viewState.target,
    //   visibleArea,
    //   actualDimensions: { columns: dataState.numColumns, rows: dataState.numRows },
    //   dataBounds: { minX: dataMinX, minY: dataMinY, maxX: dataMaxX, maxY: dataMaxY },
    //   minimapRect: { x: minimapX, y: minimapY, width: minimapWidth, height: minimapHeight },
    //   totalDimensions,
    //   heatmapDimensions: { width: actualViewWidth, height: actualViewHeight }
    // });
    
    setViewportRect({
      x: minimapX,
      y: minimapY,
      width: minimapWidth,
      height: minimapHeight
    });
  }, [viewState, heatmapState, totalDimensions, width, height]);

  
  // Process data when it changes
  // useEffect(() => {
  //   if (!dataState || !heatmapState || !canvasRef.current) return;
    
  //   setIsLoading(true);
    
  //   // Calculate in main thread
  //   const canvas = canvasRef.current;
  //   const ctx = canvas.getContext('2d');
  //   if (!ctx) return;
    
  //   const densityImage = createDensityMap(heatmapState, width, height, gridResolution);
  //   ctx.putImageData(densityImage, 0, 0);
  //   setDensityData(densityImage);
  //   setIsLoading(false);
  // }, [dataState, heatmapState, width, height, gridResolution]);

  useEffect(() => {
    if (!canvasRef.current || !dataState || !heatmapState) {
      return;
    }
    
    setIsLoading(true);
    
    const processData = async () => {
      try {
        // IMPORTANT: Pass dataState to the function now
        const densityImage = await createDensityMapBlockBased(
          heatmapState,
          dataState, // Pass the whole dataState
          width,
          height,
          gridResolution,
          opacity
        );
        
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.putImageData(densityImage, 0, 0);
            setDensityData(densityImage);
          }
        }
      } catch (error) {
        console.error('💥 Error generating minimap:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timeoutId = setTimeout(processData, 50);
    return () => clearTimeout(timeoutId);
    
  }, [dataState, heatmapState, width, height, gridResolution,opacity]);


  
  // Draw the density map and viewport rectangle
  useEffect(() => {
    if (!canvasRef.current || !densityData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas and draw density map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(densityData, 0, 0);
    
    // Draw viewport rectangle
    drawViewportRect();
  }, [densityData, viewportRect]);
  
  // Function to draw viewport rectangle
  const drawViewportRect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate the visible portion of the viewport rectangle within minimap bounds
    const visibleRect = {
      x: Math.max(0, viewportRect.x),
      y: Math.max(0, viewportRect.y),
      width: Math.min(viewportRect.width, width - Math.max(0, viewportRect.x)),
      height: Math.min(viewportRect.height, height - Math.max(0, viewportRect.y))
    };
    
    // Ensure width and height are not negative
    visibleRect.width = Math.max(0, visibleRect.width);
    visibleRect.height = Math.max(0, visibleRect.height);
    
    // Only draw if there's a visible portion
    if (visibleRect.width > 0 && visibleRect.height > 0) {
      // Draw viewport rectangle outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(visibleRect.x, visibleRect.y, visibleRect.width, visibleRect.height);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(visibleRect.x, visibleRect.y, visibleRect.width, visibleRect.height);
      
      // Add inner border for better visibility
      if (visibleRect.width > 2 && visibleRect.height > 2) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          visibleRect.x + 1, 
          visibleRect.y + 1, 
          visibleRect.width - 2, 
          visibleRect.height - 2
        );
      }
    }
  };
  
  // Handle mouse events for interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !heatmapState || !dataState) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate the visible portion of the viewport rectangle
    const visibleRect = {
      x: Math.max(0, viewportRect.x),
      y: Math.max(0, viewportRect.y),
      width: Math.min(viewportRect.width, width - Math.max(0, viewportRect.x)),
      height: Math.min(viewportRect.height, height - Math.max(0, viewportRect.y))
    };
    
    // Check if click is inside the visible portion of viewport rectangle
    if (
      x >= visibleRect.x && 
      x <= visibleRect.x + visibleRect.width &&
      y >= visibleRect.y && 
      y <= visibleRect.y + visibleRect.height &&
      visibleRect.width > 0 && visibleRect.height > 0
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - viewportRect.x,
        y: y - viewportRect.y
      });
    } else {
      // Click outside viewport - center view on click point
      if (!heatmapState || !dataState) return;

      // Convert minimap coordinates back to world coordinates using dataState dimensions
      const cellWidth = heatmapState.cellDimensions.width;
      const cellHeight = heatmapState.cellDimensions.height;

      // Use dataState dimensions directly
      const dataWidth = dataState.numColumns * cellWidth;
      const dataHeight = dataState.numRows * cellHeight;

      // Calculate offset matching useViewStates.ts logic:
      // offsetX = heatmapState.width / 2 / baseScaleFactor (where baseScaleFactor = 2^BASE_ZOOM = 1)
      const baseScaleFactor = 2 ** BASE_ZOOM;
      const offsetX = heatmapState.width / 2 / baseScaleFactor;
      const offsetY = heatmapState.height / 2 / baseScaleFactor;

      const dataMinX = -offsetX;
      const dataMinY = -offsetY;
      const dataMaxX = dataWidth - offsetX;
      const dataMaxY = dataHeight - offsetY;

      // Map minimap coordinates [0, width] back to world coordinates [dataMinX, dataMaxX]
      const worldX = dataMinX + (x / width) * (dataMaxX - dataMinX);
      const worldY = dataMinY + (y / height) * (dataMaxY - dataMinY);
      
      const currentZoom = Array.isArray(viewState.zoom) ? viewState.zoom[0] : viewState.zoom;

      // Create a complete viewState object
      const completeViewState: Required<ViewState> & { zoom: number } = {
        target: [worldX, worldY],
        zoom: currentZoom,
        minZoom: viewState.minZoom,
        maxZoom: viewState.maxZoom,
        height: viewState.height || 0,
        width: viewState.width || 0,
        rotationOrbit: viewState.rotationOrbit || 0,
        rotationX: viewState.rotationX || 0,
        minRotationX: viewState.minRotationX || 0,
        maxRotationX: viewState.maxRotationX || 0
      };
      
      onViewStateChange({
        viewId: IDS.VIEWS.HEATMAP_GRID,
        viewState: completeViewState,
        interactionState: { isDragging: false }
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Update viewport rectangle position (don't clamp here)
    setViewportRect(prev => ({
      ...prev,
      x,
      y
    }));
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    if (!heatmapState || !dataState) return;

    
    // Calculate the new target for the main view using dataState dimensions
    // Convert viewport rectangle back to world coordinates with proper offset
    const cellWidth = heatmapState.cellDimensions.width;
    const cellHeight = heatmapState.cellDimensions.height;

    // Use dataState dimensions directly
    const dataWidth = dataState.numColumns * cellWidth;
    const dataHeight = dataState.numRows * cellHeight;

    // Calculate offset matching useViewStates.ts logic:
    // offsetX = heatmapState.width / 2 / baseScaleFactor (where baseScaleFactor = 2^BASE_ZOOM = 1)
    const baseScaleFactor = 2 ** BASE_ZOOM;
    const offsetX = heatmapState.width / 2 / baseScaleFactor;
    const offsetY = heatmapState.height / 2 / baseScaleFactor;

    const dataMinX = -offsetX;
    const dataMinY = -offsetY;
    const dataMaxX = dataWidth - offsetX;
    const dataMaxY = dataHeight - offsetY;
    
    // Map minimap viewport back to world coordinates
    const worldLeft = dataMinX + (viewportRect.x / width) * (dataMaxX - dataMinX);
    const worldTop = dataMinY + (viewportRect.y / height) * (dataMaxY - dataMinY);
    const worldWidth = (viewportRect.width / width) * (dataMaxX - dataMinX);
    const worldHeight = (viewportRect.height / height) * (dataMaxY - dataMinY);
    
    // Calculate the center of the visible area
    const worldCenterX = worldLeft + worldWidth / 2;
    const worldCenterY = worldTop + worldHeight / 2;
    
    // This should match the target calculation from your visible area logic
    const newTargetX = worldCenterX;
    const newTargetY = worldCenterY;
    
    const currentZoom = Array.isArray(viewState.zoom) ? viewState.zoom[0] : viewState.zoom;
    
    // Create a complete viewState object
    const completeViewState: Required<ViewState> & { zoom: number } = {
      target: [newTargetX, newTargetY],
      zoom: currentZoom,
      minZoom: viewState.minZoom,
      maxZoom: viewState.maxZoom,
      height: viewState.height || 0,
      width: viewState.width || 0,
      rotationOrbit: viewState.rotationOrbit || 0,
      rotationX: viewState.rotationX || 0,
      minRotationX: viewState.minRotationX || 0,
      maxRotationX: viewState.maxRotationX || 0
    };
    
    // Call onViewStateChange
    onViewStateChange({
      viewId: IDS.VIEWS.HEATMAP_GRID,
      viewState: completeViewState,
      interactionState: { isDragging: false }
    });
  };
  
  console.log('Minimap dimensions:', { width, height, propWidth, propHeight });

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: 'transparent',
        border: '1px solid #808080',
        borderRadius: '6px',
        overflow: 'hidden',
        pointerEvents: 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative'
      }}
    >
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '12px',
          zIndex: 5000,
        }}>
          <span>Loading minimap...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          display: 'block',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
};

export default HeatmapMinimap;