import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed at https://romainbarbier-0.github.io/Flaschard-Superchinese/
// GitHub Pages project sites are case-sensitive on this path segment, and
// this repo's canonical name is "Flaschard-Superchinese" (capitalized).
export default defineConfig({
  base: '/Flaschard-Superchinese/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
