import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 상대 경로로 빌드하여 GitHub Pages 및 로컬 어디서든 정상 로드
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
