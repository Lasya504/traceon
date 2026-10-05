import Logo from './Logo';

export default function TopAppBar() {
  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-3">
      {/* Logo + Title */}
      <div className="flex items-center gap-2.5">
        <Logo size={28} />
        <span className="text-[19px] font-bold text-text tracking-tight">TraceOn</span>
      </div>

      {/* Simple menu icon (replacing profile avatar for minimal look) */}
      <button
        className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-text-muted hover:bg-hover transition-colors"
        aria-label="Menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </header>
  );
}
