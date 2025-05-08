import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 환경 변수에서 base URL을 가져옵니다.
const base = process.env.VITE_BASE_URL || '/';
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  build: {
    sourcemap: true
  },
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 60015,
    headers: {
      'Service-Worker-Allowed': '/'
    },
    proxy: {
      '/api': {
        target: isDev
          ? 'http://localhost:5000' // 개발용 dev-backend 서버
          : 'http://localhost:5000',
          // : 'https://ceprj.gachon.ac.kr:60015', // 배포용 Spring 서버
        changeOrigin: true
      },
       // 관리자용 API 프록시
       '/admin/api': {
        target: isDev
          ? 'http://localhost:5000'
          : 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 60015
  }
});
