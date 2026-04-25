import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Cambiado de 'react-vendor' a 'plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})