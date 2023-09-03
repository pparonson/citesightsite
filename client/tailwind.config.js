/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{vue,js,ts}'],
  theme: {
    extend: {},
    daisyui: {
      themes: ["light"]
    },

  },
  plugins: [
      require('daisyui'),
  ],
}

