// 解析url插件
import resolve from 'resolve';
import { Plugin } from '../plugin'
import { ServerContext } from '../server/index';
import path from 'path';
import { DEFAULT_EXTERSIONS } from '../constants'
import { pathExists } from 'fs-extra';
import { removeImportQuery, cleanUrl, isInternalRequest, normalizePath, isWindows } from "../utils";


// 将路径格式化为绝对路径
export function resolvePlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: 'm-vite:resolve',
    configureServer(s) {
      // 保存服务端上下文
      serverContext = s;
    },
    async resolveId(id: string, importer?: string) {
      // id = removeImportQuery(cleanUrl(id));
      // if (isInternalRequest(id)) {
      //   return null;
      // }
      // console.log('resolveId', id)
      // 1.绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id }
        }
        // 加上 root 路径前缀，处理 /src/main.tsx 的情况
        id = path.join(serverContext.root, id);
        if (await pathExists(id)) {
          return { id }
        }
      } else if (id.startsWith('.')) {
        if (!importer) {
          throw new Error("`importer` should not be undefined");
        }
        const hasExtension = path.extname(id).length > 1;
        let resolvedId: string;
        // 2.1 包含文件名后缀
        // 如 ./App.tsx
        if (hasExtension) {
          resolvedId = normalizePath(resolve.sync(id, { basedir: path.dirname(importer) }));
          if (await pathExists(resolvedId)) {
            return { id: resolvedId };
          }
        } else {
          // 2.2 不包含文件名后缀
          // 如 ./App
          for (const extname of DEFAULT_EXTERSIONS) {
            try {
              const withExtension = `${id}${extname}`; // app.ts, app.js, app.tsx, app.jsx
              resolvedId = normalizePath(resolve.sync(withExtension, {
                basedir: path.dirname(importer)
              }))
              if (await pathExists(resolvedId)) {
                return { id: resolvedId }
              }
            } catch (e) {
              continue
            }
          }
        }
      }
      return null;
    }
  }
}