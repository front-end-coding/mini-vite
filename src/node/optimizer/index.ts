// 依赖预构建
import path from 'path'
import { build } from "esbuild"
import { green } from 'picocolors'
import { scanPlugin } from './scanPlugin'
import { preBundlePlugin } from './preBundlePlugin'
import { PRE_BUNDLE_DIR } from '../constants'

export async function optimize(root: string) {
  //1. 确定入口，先默认src/main.ts
  const entry = path.resolve(root, 'src/main.tsx');
  //2. 扫描依赖
  const deps = new Set<string>();
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)]
  })
  console.log(
    `${green("需要预构建的依赖")}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join("\n")}`
  );
  // deps 存着bare import 的node modules 可以进行预构建了
  //3. 预构建 这里deps并非绝对路径 esbuild如何进行发现？在当前项目里面找
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)]
  })
}