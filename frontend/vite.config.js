import { defineConfig } from "vite"; 
import react from "@vitejs/plugin-react"; 
import path from "path"; 

export default defineConfig({
     plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // allows '@/components/Header' inside src folder
      },
    },
    // server: {
    //   proxy: {
    //     '/api': {
    //       target: process.VITE_BACKEND_URL || 'http://localhost:3000', // backend port
    //       changeOrigin: true,
    //       secure: false,
    //     },
    //   },
    // },
  });