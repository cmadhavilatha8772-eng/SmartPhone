import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The React plugin enables JSX transformation and React Fast Refresh in development.
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-auth',
              test: /node_modules[\\/]@firebase[\\/]auth[\\/]/,
            },
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]@firebase[\\/]firestore[\\/]/,
              maxSize: 350 * 1024,
            },
          ],
        },
      },
    },
  },
})
