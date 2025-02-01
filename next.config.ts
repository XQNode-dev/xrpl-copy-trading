/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi lain Next.js (jika ada)...

  eslint: {
    // Ini akan mengabaikan semua error ESLint pada build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
