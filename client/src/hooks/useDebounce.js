import { useState, useEffect } from "react";

/**
 * A custom hook that delays updating a value until after a specified time has elapsed.
 * Highly optimized for search bars to prevent excessive re-renders and API calls.
 * * @param {any} value - The state value to be debounced (e.g., search query)
 * @param {number} delay - The delay in milliseconds (default: 500ms)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: clears the timeout if the value changes before the delay finishes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
