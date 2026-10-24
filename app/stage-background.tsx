// Fixed decorative background: spotlight, light rays and gold arcs (DESIGN.md, section 2.4)
export function StageBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 stage-bg">
      <div className="absolute inset-0 stage-rays" />
      <svg
        className="absolute inset-x-0 bottom-0 h-[140px] w-full"
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
      >
        <g fill="none" strokeWidth="1.3" vectorEffect="non-scaling-stroke">
          <path d="M-10 140 Q200 -10 410 140" stroke="#e5b12e" strokeOpacity="0.55" vectorEffect="non-scaling-stroke" />
          <path d="M20 140 Q200 30 380 140" stroke="#e5b12e" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
          <path d="M55 140 Q200 65 345 140" stroke="#9aa3bc" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
    </div>
  );
}
