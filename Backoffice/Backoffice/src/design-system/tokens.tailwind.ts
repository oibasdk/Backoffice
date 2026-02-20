// Tailwind-derived tokens to be referenced by the design system
export const tailwindTokens = {
  palette: {
    brand: {
      50: '#E6F7F5',
      100: '#CDEFEA',
      200: '#9FDCD6',
      300: '#71C8C2',
      400: '#3FB0A9',
      500: '#0E7C78',
      600: '#0B6966',
      700: '#085250',
      800: '#053B3A',
      900: '#032323'
    },
    neutral: {
      50: '#F6F6F3',
      100: '#EEEDEA',
      200: '#D9D7D1',
      300: '#C3BFB6',
      400: '#9B9488',
      500: '#756F64',
      600: '#5D584F',
      700: '#444039',
      800: '#2D2A25',
      900: '#15130F'
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg,#0E7C78 0%,#D9831F 100%)'
  },
  spacingUnit: 8,
  radius: {
    small: 8,
    medium: 12,
    large: 16
  },
  animation: {
    easing: {
      standard: 'cubic-bezier(0.4,0,0.2,1)',
      entrance: 'cubic-bezier(0.34,1.56,0.64,1)'
    },
    duration: { micro: 100, short: 200, medium: 300 }
  }
};
