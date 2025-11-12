import {
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';

/**
 * Custom hook for managing color scheme (light/dark mode) throughout the application.
 * Follows Mantine best practices for reliable color scheme toggling.
 *
 * @returns An object containing:
 * - colorScheme: The current color scheme value ('auto' | 'light' | 'dark')
 * - computedColorScheme: The resolved color scheme ('light' | 'dark')
 * - setColorScheme: Function to set a specific color scheme
 * - toggleColorScheme: Function to toggle between light and dark modes
 * - clearColorScheme: Function to reset to the default color scheme
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { computedColorScheme, toggleColorScheme } = useColorScheme();
 *
 *   return (
 *     <button onClick={toggleColorScheme}>
 *       Current theme: {computedColorScheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useColorScheme() {
  const { colorScheme, setColorScheme, clearColorScheme } =
    useMantineColorScheme();

  // computedColorScheme is always either 'light' or 'dark'
  // This is crucial for reliable toggling, especially when colorScheme is 'auto'
  const computedColorScheme = useComputedColorScheme('light');

  /**
   * Toggle between light and dark color schemes.
   * Uses computedColorScheme to ensure reliable toggling even when the main
   * colorScheme is 'auto'.
   */
  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return {
    colorScheme,
    computedColorScheme,
    setColorScheme,
    toggleColorScheme,
    clearColorScheme,
  };
}
