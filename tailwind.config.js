/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // macOS 设计语言配色（参考 PRD 5.2节）
        light: {
          bg: '#FFFFFF',
          primary: '#007AFF',
          growth: '#FF3B30',
          shrink: '#34C759',
          text: '#1D1D1F',
          'text-secondary': '#86868B'
        },
        dark: {
          bg: '#1E1E1E',
          primary: '#0A84FF',
          growth: '#FF453A',
          shrink: '#32D74B',
          text: '#F5F5F7',
          'text-secondary': '#98989D'
        },
        // 目录类型颜色
        system: '#9ca3af',
        documents: '#3b82f6',
        media: '#a855f7',
        applications: '#10b981',
        downloads: '#f59e0b'
      }
    }
  },
  plugins: [],
  darkMode: 'class'
}
