import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    ...configDefaults,
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
  },
});