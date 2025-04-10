import { defineConfig, loadEnv } from "vite"; 
import react from "@vitejs/plugin-react"; 
import path from "path"; 

export default defineConfig (({mode})=>{
  const env = loadEnv(mode, process.cwd()); 

  return ({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // allows '@/components/Header' inside src folder
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || "http://localhost:3000", // backend port
          changeOrigin: true,
          secure: env.MODE === "production",
        },
      },
      historyApiFallback: true, // handles client-side routing in dev
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    base: '/', // ensures correct path resolution for deployed app
  }); 
})