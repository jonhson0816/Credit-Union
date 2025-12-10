/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          }
        },
        'slide-out-right': {
          '0%': { 
            transform: 'translateX(0)', 
            opacity: '1' 
          },
          '100%': { 
            transform: 'translateX(100%)', 
            opacity: '0' 
          }
        },
        'fade-in': {
          '0%': { 
            opacity: '0' 
          },
          '100%': { 
            opacity: '1' 
          }
        },
        'fade-out': {
          '0%': { 
            opacity: '1' 
          },
          '100%': { 
            opacity: '0' 
          }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-in'
      },
      zIndex: {
        'notification': '100'
      }
    }
  },
  plugins: []
}