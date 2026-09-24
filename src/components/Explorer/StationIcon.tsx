export function StationIcon() {
  return (
    <svg
      className="station-list-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="14" height="12" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <line x1="5" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="19" r="1.4" fill="currentColor" />
      <circle cx="15.5" cy="19" r="1.4" fill="currentColor" />
      <line x1="7.5" y1="16" x2="6" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16.5" y1="16" x2="18" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
