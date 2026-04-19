import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverPort = env.SERVER_PORT || '8080'
  const frontendPort = parseInt(env.FRONTEND_PORT || '3000')
  const allowedHosts = env.VITE_ALLOWED_HOSTS 
    ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim())
    : ['.trycloudflare.com', '.ngrok-free.app', 'localhost']

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      host: '0.0.0.0',
      strictPort: true,
      cors: true,
      allowedHosts: allowedHosts,
      hmr: {
        host: 'localhost',
        port: frontendPort
      },
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
        '/uploads': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})