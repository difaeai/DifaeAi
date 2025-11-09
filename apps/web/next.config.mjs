import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const nextConfig = {
  experimental: {
    serverActions: true
  },
  transpilePackages: ['@difae/ui']
};

export default nextConfig;
