import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lentopallo-v2/',
  plugins: [
    {
      name: 'no-service-role-in-bundle',
      buildStart() {
        const forbidden = Object.keys(process.env).filter(
          k => k.startsWith('VITE_') && k.toLowerCase().includes('service')
        )
        if (forbidden.length > 0) {
          throw new Error(
            `SECURITY: Service role key must NOT be prefixed with VITE_. Found: ${forbidden.join(', ')}. ` +
            `Remove the VITE_ prefix from these variables — they must not be exposed to the browser bundle.`
          )
        }
      },
    },
  ],
})
