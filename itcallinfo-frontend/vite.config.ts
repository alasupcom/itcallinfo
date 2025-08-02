import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "public/assets"),
    },
  },
  root: path.resolve(__dirname, "./"),
  build: {
    outDir: path.resolve(__dirname, "./build"),
    emptyOutDir: true,
    sourcemap: false, // Disable source maps in production for smaller bundle size
    chunkSizeWarningLimit: 1000, // Increase the warning limit if needed
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: {
          vendor: [
            'react', 
            'react-dom',
          ],
        },
      },
    },
  },
});