import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const nextDistCompiled = path.join(projectRoot, 'node_modules', 'next', 'dist', 'compiled');

const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      react: path.join(nextDistCompiled, 'react'),
      'react-dom': path.join(nextDistCompiled, 'react-dom'),
      'react-dom/client': path.join(nextDistCompiled, 'react-dom', 'client'),
      'react-dom/server': path.join(nextDistCompiled, 'react-dom', 'server')
    };

    return config;
  }
};

export default nextConfig;
