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

  // Configuración de construcción
  build: {
    // Generar source maps solo en desarrollo
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Optimizaciones de seguridad
    rollupOptions: {
      output: {
        // Ofuscar nombres de archivos para mayor seguridad
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Minificar en producción
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remover console.log en producción
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
