import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve('src/index.ts'),
      name: 'ReactI18nQuery',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) =>
        format === 'es'
          ? `es/react-i18n-query.js`
          : format === 'cjs'
          ? `cjs/react-i18n-query.js`
          : `umd/react-i18n-query.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'i18next',
        'i18next-http-backend',
        'react-i18next',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          i18next: 'i18next',
          'i18next-http-backend': 'i18nextHttpBackend',
          'react-i18next': 'reactI18next',
        },
      },
    },
    minify: 'terser',
    sourcemap: true,
  },
});
