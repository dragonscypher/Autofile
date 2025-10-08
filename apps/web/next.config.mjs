/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: { serverActions: { bodySizeLimit: '10mb' } },
    transpilePackages: ['@autofile/ats', '@autofile/llm', '@autofile/utils'],
};
export default nextConfig;
