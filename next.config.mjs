/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    dirs: ['app', 'components', 'features', 'lib', 'services', 'hooks', 'types', 'utils', 'config'],
  },
};

export default nextConfig;
