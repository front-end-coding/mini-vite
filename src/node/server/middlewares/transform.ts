import { NextHandleFunction } from 'connect';
import {
  cleanUrl,
  isJSRequest,
  isImportRequest,
  isCssRequest,
} from '../../utils'

import { ServerContext } from '../index';
import createDebug from "debug";

const debug = createDebug("dev");


export async function transformRequest(url: string, serverContext: ServerContext) {
  const { moduleGraph, pluginContainer } = serverContext;
  url = cleanUrl(url);
  let mod = await moduleGraph.ensureEntryFromUrl(url)
  if (mod && mod.transformResult) {
    return mod.transformResult
  }

  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code === "object" && code !== null) {
      code = code.code;
    }
    if (code) {
      transformResult = await pluginContainer.transform(
        code as string,
        resolvedResult?.id
      );
    }
  }
  if (mod) {
    mod.transformResult = transformResult
  }
  return transformResult;
}


export function transformMiddleware(serverContext: ServerContext): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) {
      return next()
    }
    const url = req.url;
    debug('transformMiddleWare: %s', url);
    if (
      isJSRequest(url) ||
      isCssRequest(url) ||
      // 静态资源的 import 请求，如 import logo from './logo.svg';
      isImportRequest(url)
    ) {
      let result = await transformRequest(url, serverContext);

      if (!result) {
        return next();
      }
      if (result && typeof result !== 'string') {
        result = result.code;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      return res.end(result);
    }
    next();
  }
}