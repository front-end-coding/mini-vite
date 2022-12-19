import { PartialResolvedId, TransformResult } from 'rollup';
import { cleanUrl } from './utils';

export class ModuleNode {
  // 资源访问url
  url: string;
  // 绝对路径
  id: string | null = null;
  // 模块的引用方
  importers = new Set<ModuleNode>();
  // 该模块依赖的模块
  importedModules = new Set<ModuleNode>();
  // 是否经过trasnformer钩子的编译结果
  transformResult: TransformResult | null = null;
  lastHMRTimestamp = 0;
  constructor(url: string) {
    this.url = url
  }
}

export class ModuleGraph {
  // 资源url到modulenode的映射表
  urlToModuleMap = new Map<string, ModuleNode>();
  // 资源绝对路径到moduleNode的映射表
  idToModuleMap = new Map<string, ModuleNode>()

  constructor(private resolveId: (url: string) => Promise<PartialResolvedId | null>) { }

  getModuleById(id: string): ModuleNode | null {
    return this.idToModuleMap.get(id)
  }

  async getModuleByUrl(rawUrl: string): Promise<ModuleNode | null> {
    const { url } = await this._resolve(rawUrl)
    return this.urlToModuleMap.get(url)
  }

  async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
    const { url, resolvedId } = await this._resolve(rawUrl);
    // 检查缓存
    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url)
    }
    // 若无缓存，更新 urlToModuleMap 和 idToModuleMap
    const mod = new ModuleNode(url);
    // console.log('nnnnew', mod)
    mod.id = resolvedId;
    this.urlToModuleMap.set(url, mod);
    this.idToModuleMap.set(resolvedId, mod);
    return mod;
  }

  async updateModuleInfo(mod: ModuleNode, importModules: Set<string | ModuleNode>) {
    const prevImports = mod.importers;
    for (const curImports of importModules) {
      const dep = typeof curImports === 'string'
        ? await this.ensureEntryFromUrl(cleanUrl(curImports))
        : curImports;

      if (dep) {
        // dep为引用方，引用方的importers会添加次mod
        dep.importers.add(mod);
        // 当前moduleNode的依赖的module的importedModules会添加次dep
        mod.importedModules.add(dep);
      }
    }
    // 清除不在引用的实例
    for (const prevImport of prevImports) {
      if (!importModules.has(prevImport)) {
        prevImport.importers.delete(mod)
      }
    }
  }

  // hmr触发执行这个方法
  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file);
    if (mod) {
      // 更新时间戳
      mod.lastHMRTimestamp = Date.now();
      mod.transformResult = null;
      mod.importers.forEach((importer) => {
        this.invalidateModule(importer.id!)
      })
    }
  }

  private async _resolve(url: string): Promise<{ url: string, resolvedId: string }> {
    const resolved = await this.resolveId(url);
    const resolvedId = resolved?.id || url;
    return { url, resolvedId }
  }
}