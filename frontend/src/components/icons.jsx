// Small, restrained inline icons (stroke-based, inherit currentColor) --
// used instead of emoji so interactive controls (password visibility,
// notifications) match the app's clean, professional visual language.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function EyeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.14A10.4 10.4 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17.6 17.6 0 0 1-3.34 4.24M6.4 6.4C3.7 8.1 1.5 12 1.5 12S5.5 19 12 19c1.26 0 2.42-.26 3.46-.68" />
      <path d="M9.9 9.9a3 3 0 0 0 4.24 4.24" />
    </svg>
  )
}

export function BellIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 8.5a6 6 0 1 1 12 0c0 4.2 1.2 5.6 1.8 6.3.2.2.05.6-.25.6H4.45c-.3 0-.45-.4-.25-.6.6-.7 1.8-2.1 1.8-6.3Z" />
      <path d="M9.5 19a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}
