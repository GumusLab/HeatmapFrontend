import { useEffect, useRef } from 'react';

// A simple hook to store the previous value of a state or prop.
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  // Store current value in ref after the render is committed.
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before the update in useEffect).
  return ref.current;
}