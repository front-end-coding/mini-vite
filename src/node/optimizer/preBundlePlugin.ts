import { Loader, Plugin } from 'esbuild'
import { BARE_IMPORT_RE } from '../constants'
// 分析es模块import export的语句
import { init, parse } from 'es-module-lexer'
import path from 'path'
// 一个实现了 node 路径解析算法的库
import resolve from 'resolve'
// 一个更加好用的文件操作库
import fs from "fs-extra";
// 用来开发打印 debug 日志的库
import createDebug from "debug";
import { normalizePath } from "../utils";


const debug = createDebug('dev');


export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:pre-bundle',
    setup(build) {
      build.onResolve(
        {
          filter: BARE_IMPORT_RE,
        },
        (resolveInfo) => {
          const { path: id, importer } = resolveInfo;
          // console.log('prebuild bare import resolveInfo', resolveInfo)
          const isEntry = !importer;
          // 命中依赖
          if (deps.has(id)) {
            // 如果是入口，标记namespace
            // 非入口由于node_modules是打平的结构，因此使用resolve.sync
            return isEntry ? { path: id, namespace: "dep" } : { path: resolve.sync(id, { basedir: process.cwd() }) }
          }
        })

      build.onLoad(
        {
          filter: /.*/,
          namespace: "dep"
        },

        async (loadInfo) => {

          await init;
          const id = loadInfo.path;
          const root = process.cwd();
          // 默认读node_modules的文件
          const entryPath = normalizePath(resolve.sync(id, { basedir: root }));
          const code = await fs.readFile(entryPath, 'utf-8');

          const [imports, exports] = await parse(code);
          // console.log('code', id, code)
          let proxyModule = [];

          // cjs
          if (!imports.length && !exports.length) {
            const res = require(entryPath);
            const specifiers = Object.keys(res);
            proxyModule.push(
              `export { ${specifiers.join(',')} } from "${entryPath}"`,
              `export default require("${entryPath}")`
            )
          } else {
            // esm
            if (exports.includes("default")) {
              proxyModule.push(`import d from "${entryPath}"; export default d`)
            }
            proxyModule.push(`export * from "${entryPath}"`)
          }
          debug("代理模块内容：%o", proxyModule.join('\n'));
          const loader = path.extname(entryPath).slice(1);

          // console.log('loader', proxyModule)

          return {
            loader: loader as Loader,
            contents: proxyModule.join('\n'),
            resolveDir: root
          }
        }
      )
    }
  }
}
