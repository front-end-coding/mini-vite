import { ServerContext } from './server/index';
import { blue, green } from 'picocolors';
import { getShortName } from './utils';


export function bindingHRMEvents(serverContext: ServerContext) {
  const { watcher, ws, root } = serverContext;

  watcher.on('change', async (file) => {
    console.log(`✨${blue("[hmr]")} ${green(file)} changed`);
    const { moduleGraph } = serverContext;
    // 清除模块依赖的缓存
    await moduleGraph.invalidateModule(file);

    //客户端更新
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(file, root),
          acceptPath: '/' + getShortName(file, root)
        }
      ]
    })

  })
}