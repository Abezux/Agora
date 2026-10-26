import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        agora: {
          bg: '#FAF6EE',
          card: '#FFFDF8',
          border: '#E5DCC8',
          ink: {
            DEFAULT: '#211D1A',
            muted: '#6E655F',
            light: '#A0958C',
          },
          terracotta: {
            DEFAULT: '#C1502E',
            hover: '#A74223',
            light: '#F7EBE8',
            border: '#E8C5BC',
          },
          brass: {
            DEFAULT: '#8B7355',
            hover: '#735F45',
            light: '#F3EFEA',
            border: '#D9CFBF',
          },
          sage: {
            DEFAULT: '#5C7A52',
            light: '#EFF4EC',
            border: '#C3D4BC',
          },
          brick: {
            DEFAULT: '#9B4038',
            light: '#F8ECEB',
            border: '#E6BCB8',
          },
          gold: {
            DEFAULT: '#C99A2E',
            hover: '#B08525',
            light: '#FBF3DE',
            border: '#EAD9A0',
          },
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
