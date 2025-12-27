/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cores Semânticas (Baseado na função)
        border: "hsl(var(--border))", // Opcional: Preparo para modo dark/light futuro se usar variaveis CSS
        input: "#1f2937", // gray-800 do seu input atual
        ring: "#daa520", // Cor do anel de foco

        background: "#0f0f12", // Seu 'dark-bg' antigo
        foreground: "#ffffff", // <--- ADICIONE ISSO
        surface: "#1c1c21", // Seu 'card-bg' antigo, bom para modais/cards

        // A cor principal da sua marca
        primary: {
          DEFAULT: "#daa520", // O Dourado que você usa na Home e CSS
          hover: "#c8961e", // O tom mais escuro para hover (que estava hardcoded na Home)
          foreground: "#000000", // Cor do texto quando está em cima do dourado (botões)
        },

        // Cores secundárias (geralmente cinzas ou tons de apoio)
        secondary: {
          DEFAULT: "#2a2a2a", // Seu 'border-dark' antigo pode virar uma cor de fundo secundária
          foreground: "#ffffff",
        },

        // Para mensagens de erro (usado no login)
        destructive: {
          DEFAULT: "#ef4444", // red-500
          foreground: "#ffffff",
        },

        // Para textos mais apagados (labels, subtextos)
        muted: {
          DEFAULT: "#1c1c21",
          foreground: "#9ca3af", // gray-400
        },
      },
      // Mantive suas animações que já estavam legais
      animation: {
        "fade-in-down": "fadeInDown 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
