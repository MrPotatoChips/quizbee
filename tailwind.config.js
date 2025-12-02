/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        'farm-green': '#58DC00',
        'techy-blue': '#00A5FE',
        'forest-green': '#005032',
        'cloud-white': '#F9F8F1'
      }
    },
  },
  plugins: [],
}