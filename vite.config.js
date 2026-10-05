import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ai-multivariable-math/', // GitHub Pages 저장소 이름에 맞춘 표준 base 경로
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
