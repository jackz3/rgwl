import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

export default defineConfig({
  plugins: [solidPlugin(),
    basicSsl()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // https: true
  },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "./index.html"),
        launcher: resolve(__dirname, './launcher.html')
      },
    },
    target: 'esnext',
  },
});
