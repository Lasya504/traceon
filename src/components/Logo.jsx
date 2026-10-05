export default function Logo({ size = 40, className = '' }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="TraceOn logo"
    >
      {/* Blue circle */}
      <circle cx="16" cy="22" r="13" fill="#4F8EF7" opacity="0.95" />
      {/* Yellow accent circle */}
      <circle cx="27" cy="15" r="8.5" fill="#F6C94E" opacity="0.9" />
    </svg>
  );
}
