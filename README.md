## 启动
  - 项目根目录启动mini-vite编译服务，`pnpm run start` 进行编译。
  - playGround目录是一个react demo，通过引用编译好的mini-vite来进行启动， `pnpm run dev`。

## 文件说明
  - optimizer为mini-vite预扫描和预打包的实现代码。
  - plugins文件夹为需要实现的各类插件。
  - src目录下为mini-vite的实现文件，其中node服务区就是服务端的文件，而client文件夹即为需要注入到index.html的文件。

## 流程原理
  详见[流程原理](./viteFlow.md)