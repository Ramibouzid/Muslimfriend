import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'Data/**/*', dest: 'Data' },
      ],
    }),
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
