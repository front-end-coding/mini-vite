import { read, readFile } from 'fs-extra';
import { Plugin } from '../plugin';
import esbuild from 'esbuild';
import { isJSRequest } from '../utils';
import path from 'path';

export function esbuildTransformPlugin(): Plugin {
  return {
    name: 'm-vite: esbuild-transform',
    async load(id) {
      if (isJSRequest(id)) {
        try {
          const code = await readFile(id, 'utf-8');
          return code
        } catch (e) {
          return null
        }
      }
    },
    async transform(code, id) {
      if (isJSRequest(id)) {
        const extname = path.extname(id).slice(1);
        const { code: transformCode, map } = await esbuild.transform(code, {
          target: 'esnext',
          format: 'esm',
          sourcemap: true,
          loader: extname as "js" | "jsx" | "tsx" | "ts"
        })
        return {
          code: transformCode,
          map
        }
      }
      return null;
    }
  }
}