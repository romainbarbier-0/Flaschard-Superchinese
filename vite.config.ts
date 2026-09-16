import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed at https://romainbarbier-0.github.io/flaschard-superchinese/
export default defineConfig({
  base: '/flaschard-superchinese/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
