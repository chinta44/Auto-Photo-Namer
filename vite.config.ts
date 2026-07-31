import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages では https://<username>.github.io/smart-name-ai/ という
// サブパスで配信されるため、base を必ずリポジトリ名に合わせておくこと。
// これがズレると資産(JS/CSS)が404になり、画面が真っ白のまま起動しない。
export default defineConfig({
  base: '/smart-name-ai/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
