import path from "path"; 

// export default {
//   build: {
//     outDir: './dist',  \
//   },
// };

export default {
  build: {
    // Specify the output directory relative to the project root
    outDir: path.resolve(__dirname, 'dist'),  // Use absolute path for safety
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),  // Specify the correct entry file
    },
  },
};