/** Tailwind configuration merged for Sharoobi Backoffice hybrid theme */
module.exports = (() => {
  const config = {
    content: [
      './index.html',
      './src/**/*.{js,ts,jsx,tsx,html}',
      './_tailwind_template_temp/tailwind-admin-reactjs-free/package/src/**/*.{js,ts,jsx,tsx,html}',
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#E6F7F5',
            100: '#CDEFEA',
            200: '#9FDCD6',
            300: '#71C8C2',
            400: '#3FB0A9',
            500: '#0E7C78',
            600: '#0B6966',
            700: '#085250',
            800: '#053B3A',
            900: '#032323',
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
            900: '#15130F',
          },
        },
        spacing: {
          7.5: '30px',
        },
        borderRadius: {
          lg: '12px',
        },
      },
    },
    plugins: [],
    // optional: prepare for RTL support via stylis-plugin-rtl and tailwind-rtl if added later
    experimental: {
      optimizeUniversalDefaults: true,
    },
  };

  // Try to enable RTL support if plugin is installed (safe require)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rtl = require('tailwind-rtl');
    if (rtl) {
      config.plugins.push(rtl);
    }
  } catch (e) {
    // plugin not installed — continue without RTL
  }

  return config;
})();
