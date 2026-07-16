import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
                            server: {
                              proxy: {
                                '/api/images': {
                                  target: 'https://images.ygoprodeck.com',
                                  changeOrigin: true,
                                  rewrite: (path) => path.replace(/^\/api\/images/, ''),
                                },
                              },
                            },
                            base: '/ygo-3d-viewer/',
});
