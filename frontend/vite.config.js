import { defineConfig } from "vite"; 
import react from "@vitejs/plugin-react"; 
import path from "path"; 
import env from "dotenv"; 

export default defineConfig({
     plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // allows '@/components/Header' inside src folder
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:3000', // backend port
          changeOrigin: true,
          secure: process.env.MODE === 'production',
        },
      },
    },
  });