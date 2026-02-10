import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        sourcemap: true, // Enable sourcemaps for debugging
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    mui: ['@mui/material', '@mui/material/styles'],
                },
            },
        },
    },
    server: {
        port: 5173,
        strictPort: false
    },
    preview: {
        port: 4173,
        strictPort: false
    }
});
