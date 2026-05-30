/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',       // 关键配置：开启静态导出
  trailingSlash: true,    // 可选：让生成的文件路径带斜杠，兼容性更好
  images: {
    unoptimized: true     // 静态导出时关闭图片优化
  }
};

export default nextConfig;
