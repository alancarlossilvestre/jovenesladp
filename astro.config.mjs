import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://alancarlossilvestre.github.io',
  base: '/jovenesladp',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  
  /*integrations: [react()],
  vite: { plugins: [tailwindcss()] },*/
})
