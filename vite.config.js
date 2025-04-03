import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
export default {
  build: {
    outDir: '../dist',  // Output build to the root dist folder
  },
};