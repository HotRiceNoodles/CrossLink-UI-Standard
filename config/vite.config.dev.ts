import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      port: 5180,
      open: true,
      proxy: {
        '/admin/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/v1': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    // Windows 文件系统大小写不敏感，/license 会命中根目录的 LICENSE 文件，
    // 导致静态文件中间件在 SPA fallback 之前返回 LICENSE 内容。
    // 此插件强制已知的 SPA 路由走 index.html，绕过静态文件匹配。
    plugins: [
      {
        name: 'spa-route-rewrite',
        configureServer(server) {
          const SPA_ROUTES = ['/license', '/settings']
          server.middlewares.use((req, res, next) => {
            if (req.url && SPA_ROUTES.some((r) => req.url === r || req.url.startsWith(r + '/'))) {
              req.url = '/index.html'
            }
            next()
          })
        },
      },
    ],
  }),
)
