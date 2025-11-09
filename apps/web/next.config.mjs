import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      react: path.join(projectRoot, 'node_modules', 'react'),
      'react-dom': path.join(projectRoot, 'node_modules', 'react-dom'),
      'react-dom/client': path.join(projectRoot, 'node_modules', 'react-dom', 'client'),
      'react-dom/server': path.join(projectRoot, 'node_modules', 'react-dom', 'server')
    };

    return config;
  }
};

export default nextConfig;
