import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    // Disable all minification
    minify: false,
    cssMinify: false,

    // Output structure
    outDir: 'dist',
    assetsDir: 'assets',

    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        pralyne: resolve(import.meta.dirname, 'pralyne/index.html'),
        moubina: resolve(import.meta.dirname, 'moubina/index.html'),
        tracky: resolve(import.meta.dirname, 'tracky/index.html'),
        qash: resolve(import.meta.dirname, 'qash-bank/index.html'),
      },
      output: {
        // Clean file names without hashes
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name].css'
          }
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
