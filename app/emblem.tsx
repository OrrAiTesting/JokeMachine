// Decorative emblem: smiley face inside a gold ring (DESIGN.md, section 1.1)
export function Emblem() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="glow-gold"
    >
      <circle cx="32" cy="32" r="30.75" fill="#0e1450" stroke="#e5b12e" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#9aa3bc" strokeWidth="0.9" />
      <g fill="none" stroke="#f8dc7a" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="32" cy="32" r="10.5" />
        <path d="M27.5 35.2c2.4 2.6 6.6 2.6 9 0" />
      </g>
      <circle cx="28.4" cy="29.4" r="1.3" fill="#f8dc7a" />
      <circle cx="35.6" cy="29.4" r="1.3" fill="#f8dc7a" />
    </svg>
  );
}
