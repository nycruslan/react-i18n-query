import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactI18nQuery',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return `es/react-i18n-query.js`;
        }
        if (format === 'cjs') {
          return `cjs/react-i18n-query.js`;
        }
        return `umd/react-i18n-query.js`;
      },
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
