import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 환경 변수에서 base URL을 가져옵니다.
const base = process.env.VITE_BASE_URL;

export default defineConfig({
  base: base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 60015,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 60015
  }
})
