import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import devtoolsJson from 'vite-plugin-devtools-json';
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    devtoolsJson(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    // Listen on all network interfaces (0.0.0.0) to allow network access
    host: "0.0.0.0",
    // Default port, can be overridden with --port flag
    port: 5173,
    // Allow CORS for development
    cors: true,
    // Enable HMR over the network
    hmr: {
      // Use the client host automatically
      clientPort: 5173,
    },
  },
});
