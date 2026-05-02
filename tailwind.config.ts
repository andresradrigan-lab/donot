import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        donot: {
          // ===== Paleta oficial donot. =====
          verde:       '#005341', // brand principal
          crema:       '#FFF2E8', // background, paneles
          naranjo:     '#F36F4E', // CTAs primarios, énfasis
          azulPastel:  '#B7CEF2', // tags info, fondos secundarios
          rosado:      '#FF70C0', // promos, drops, joviales
          // ===== Grises derivados (UI funcional) =====
          ink:         '#1F1F1F', // texto cuerpo
          muted:       '#5C6E68', // texto secundario
          border:      '#DDD3C8', // bordes sobre crema
          rowAlt:      '#FBF7F1', // filas alternadas
        },
      },
      fontFamily: {
        // Definir las dos vars en app/layout.tsx con next/font
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 83, 65, 0.08)',
        pop:  '0 8px 24px rgba(0, 83, 65, 0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
}

export default config
