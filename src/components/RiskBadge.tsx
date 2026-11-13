import type { RiskTier } from '../types/edupredict';

interface RiskBadgeProps {
  tier: RiskTier;
  score?: number;
}

const TIER_STYLES: Record<
  RiskTier,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  high: {
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FCA5A5]',
    dot: 'bg-[#EF4444]',
    label: 'High Risk',
  },
  medium: {
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#92400E]',
    border: 'border-[#FCD34D]',
    dot: 'bg-[#F59E0B]',
    label: 'Medium Risk',
  },
  low: {
    bg: 'bg-[#DCFCE7]',
    text: 'text-[#166534]',
    border: 'border-[#86EFAC]',
    dot: 'bg-[#22C55E]',
    label: 'Low Risk',
  },
};

export function RiskBadge({ tier, score }: RiskBadgeProps) {
  const style = TIER_STYLES[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
      <span>{style.label}</span>
      {typeof score === 'number' && (
        <span className="tabular-nums opacity-85">({score})</span>
      )}
    </span>
  );
}
