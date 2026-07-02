/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    dirs: ['app', 'components', 'features', 'lib', 'services', 'hooks', 'types', 'utils', 'config'],
  },
};

export default nextConfig;
