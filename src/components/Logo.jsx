/**
 * TraceOn Minimal Logo
 */
export default function Logo({ size = 40, className = '' }) {
  const blueR = size * 0.35;
  const yellowR = size * 0.22;
  const cx1 = size * 0.4;
  const cy1 = size * 0.5;
  const cx2 = size * 0.65;
  const cy2 = size * 0.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      aria-label="TraceOn logo"
    >
      <circle cx={cx1} cy={cy1} r={blueR} fill="#6EA8FE" />
      <circle cx={cx2} cy={cy2} r={yellowR} fill="#FFD166" />
    </svg>
  );
}
