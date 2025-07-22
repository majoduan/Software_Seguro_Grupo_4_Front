import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuraciones de seguridad
  server: {
    // Headers de seguridad para desarrollo
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },

  // Configuración de construcción optimizada para producción
  build: {
    // Generar source maps solo en desarrollo
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Optimizaciones de seguridad con nombres de archivos ofuscados
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Usar minificación por defecto de Vite (esbuild)
    minify: true
  },

  // Remover console.log en producción
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
