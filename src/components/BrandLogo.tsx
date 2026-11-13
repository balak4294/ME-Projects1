interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandLogo({ size = 'md', showTagline = false }: BrandLogoProps) {
  const dimensions =
    size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const titleSize =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dimensions} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="edupulseLogoBg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        {/* Rounded container */}
        <rect width="40" height="40" rx="10" fill="url(#edupulseLogoBg)" />
        {/* Open educational book */}
        <path
          d="M8.5 14.5C8.5 13.4 9.4 12.5 10.5 12.5H17.2C18.7 12.5 20 13.7 20 15.2V28.5C18.6 27.4 16.8 26.8 14.8 26.8H10.5C9.4 26.8 8.5 25.9 8.5 24.8V14.5Z"
          fill="#FFFFFF"
          fillOpacity="0.96"
        />
        <path
          d="M31.5 14.5C31.5 13.4 30.6 12.5 29.5 12.5H22.8C21.3 12.5 20 13.7 20 15.2V28.5C21.4 27.4 23.2 26.8 25.2 26.8H29.5C30.6 26.8 31.5 25.9 31.5 24.8V14.5Z"
          fill="#FFFFFF"
          fillOpacity="0.88"
        />
        {/* AI neural circuit lines inside book */}
        <path
          d="M12.5 17.5H16.5M12.5 21H15.5"
          stroke="#2563EB"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M23.5 18.5L25.5 20.5L28 17"
          stroke="#8B5CF6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Intelligent AI pulse spark rising from book spine */}
        <path
          d="M20 5.5L21.3 8.7L24.5 10L21.3 11.3L20 14.5L18.7 11.3L15.5 10L18.7 8.7L20 5.5Z"
          fill="#8B5CF6"
          stroke="#FFFFFF"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
      <div className="leading-tight">
        <span
          className={`font-display ${titleSize} font-bold tracking-tight text-[#0F172A] whitespace-nowrap block`}
        >
          EduPulse <span className="text-[#2563EB]">AI</span>
        </span>
        {showTagline && (
          <span className="text-xs text-[#434655] block mt-0.5">
            Smart Academic Risk &amp; Growth Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
