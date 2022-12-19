const path = require('path');

console.log(path.posix.normalize(process.cwd()))
console.log(11, path.join(process.cwd(), "node_modules",
  "mini-vite",
  "dist",
  "client.mjs"))