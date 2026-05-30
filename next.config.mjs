/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',       // 关键配置：开启静态导出
  trailingSlash: true     // 可选：让生成的文件路径带斜杠，兼容性更好
};

export default nextConfig;
