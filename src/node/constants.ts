import path from 'path';

export const EXTERNAL_TYPES = [
  "css",
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "marko",
  "astro",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
]

export const BARE_IMPORT_RE = /^[\w@][^:]/;

export const DEFAULT_EXTERSIONS = [".tsx", ".ts", ".jsx", "js"];



// 写入的预构建的文件路径
export const PRE_BUNDLE_DIR = path.join("node_modules", ".m-vite")

// 哈希后的内容
export const HASH_RE = /#.*$/s;
export const QEURY_RE = /\?.*$/s;
export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
export const HMR_PORT = 23456;
export const CLIENT_PUBLIC_PATH = "/@vite/client";