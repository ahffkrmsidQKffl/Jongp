import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 환경 변수에서 base URL을 가져옵니다.
const base = process.env.VITE_BASE_URL;

export default defineConfig({
  base: base, // 환경에 따라 다른 base 설정 사용
  plugins: [react()],
  server: {
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
});
