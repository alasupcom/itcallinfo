import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "client/public/assets"),
    },
  },
  root: path.resolve(__dirname, "./"),
  build: {
    outDir: path.resolve(__dirname, "./dist/public"),
    emptyOutDir: true,
    sourcemap: false, // Disable source maps in production for smaller bundle size
    chunkSizeWarningLimit: 1000, // Increase the warning limit if needed
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom',
            // Add other large dependencies here
          ],
        },
      },
    },
  },
});