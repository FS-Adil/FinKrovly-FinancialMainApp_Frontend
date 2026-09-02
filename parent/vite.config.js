import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      // PRODUCTION: Заменить localhost на реальные домены
      'Content-Security-Policy': [
      //   "default-src 'self'",
      //   "script-src 'self' 'unsafe-inline'", // PRODUCTION: убрать 'unsafe-inline', использовать nonce
      //   "style-src 'self' 'unsafe-inline'",
      //   "img-src 'self' data: https:",
      //   "font-src 'self' data:",
        "connect-src 'self' http://localhost:8383 http://localhost:8181", // PRODUCTION: https://api.yourdomain.com https://app1.yourdomain.com
        "frame-src 'self' http://localhost:3001 http://localhost:3002", // PRODUCTION: https://app1.yourdomain.com https://app2.yourdomain.com
      ].join('; '),
    //   // PRODUCTION: Добавить
    //   'X-Frame-Options': 'SAMEORIGIN',
    //   'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }
  },
  build: {
    target: 'es2015',
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});