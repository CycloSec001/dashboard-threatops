/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'htb-bg':      '#070B11',
        'htb-sidebar': 'rgba(9, 13, 20, 0.75)',
        'htb-card':    'rgba(10, 16, 24, 0.42)',
        'htb-cardalt': 'rgba(16, 24, 36, 0.55)',
        'htb-border':  'rgba(255, 255, 255, 0.08)',
        'htb-border-sidebar': 'rgba(255, 255, 255, 0.06)',
        'htb-green':   '#39FF6A',
        'htb-greenlt': '#6DFF8F',
        'htb-cyan':    '#00D9FF',
        'htb-red':     '#FF4D4F',
        'htb-amber':   '#FFC107',
        'htb-orange':  '#FF8C00',
        'htb-text':    '#F5F5F5',
        'htb-dim':     '#6B7280',
        'htb-muted':   '#9CA3AF',
        'htb-purple':  '#8b5cf6',
        'htb-blue':    '#3b82f6',
        'htb-violet':  '#6366f1',
        'htb-gray':    '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'green-glow': '0 0 20px rgba(59, 255, 91, 0.3)',
        'card': '0 4px 20px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}
