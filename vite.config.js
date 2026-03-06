import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(), // ✅ Tailwind v4 uses a Vite plugin, not postcss
    ],
    server: {
        host: '127.0.0.1',
        port: 3005,
        proxy: {
            '/api': {
                target: 'http://localhost:3002',
                changeOrigin: true,
            }
        }
    }
});
