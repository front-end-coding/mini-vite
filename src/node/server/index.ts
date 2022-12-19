import connect from 'connect';
import { blue, green } from 'picocolors';
import { optimize } from '../optimizer';
import { resolvePlugins } from '../plugins';
import { createPluginContainer, PluginContainer } from '../pluginContainer';
import { Plugin } from '../plugin'
import { indexHtmlMiddleware } from './middlewares/indexHtml';
import { transformMiddleware } from './middlewares/transform'
import { staticMiddleware } from './middlewares/static';
import { ModuleGraph } from '../ModuleGraph';
import chokidar, { FSWatcher } from 'chokidar'
import { createWebsocketServer } from '../ws';
import { bindingHRMEvents } from '../hmr';
import { normalizePath } from '../utils';

// 增加如下类型声明
export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
  moduleGraph: ModuleGraph;
  ws: { send: (data: any) => void, close: () => void };
  watcher: FSWatcher
}

export async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();
  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url))

  const watcher = chokidar.watch(root, {
    ignored: ["**/node_modules/**", "**/.git/**"],
    ignoreInitial: true
  })

  // websocket
  const ws = createWebsocketServer(app)


  const serverContext: ServerContext = {
    root: normalizePath(process.cwd()),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  }

  bindingHRMEvents(serverContext)

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }

  // 核心编译逻辑
  app.use(transformMiddleware(serverContext));

  // 入口 HTML 资源
  app.use(indexHtmlMiddleware(serverContext));

  // 静态资源
  app.use(staticMiddleware(serverContext.root));

  app.listen(5174, async () => {
    await optimize(root);
    console.log(
      green("🚀 No-Bundle 服务已经成功启动!"),
      `耗时: ${Date.now() - startTime}ms`
    )
  })
  console.log(`> 本地访问路径: ${blue("http://localhost:5174")}`);
}



