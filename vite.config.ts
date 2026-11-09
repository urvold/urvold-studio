import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import deployment from './deployment.json';
export default defineConfig({base:deployment.basePath,plugins:[react(),tailwindcss()]});
