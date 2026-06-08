import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        // Listen on all interfaces so Windows host can reach the WSL2 container
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        proxy: {
            // Proxy API calls to the Express backend — transparent to the client
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/client/test/setup.ts'],
        globals: true,
    },
});
