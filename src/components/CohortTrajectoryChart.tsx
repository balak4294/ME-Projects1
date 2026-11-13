import { useState } from 'react';
import type { CohortWeeklyPoint } from '../types/edupredict';

interface CohortTrajectoryChartProps {
  data: CohortWeeklyPoint[];
}

export function CohortTrajectoryChart({ data }: CohortTrajectoryChartProps) {
  const [activeIndex, setActiveIndex] = useState<number>(data.length - 1);

  const width = 680;
  const height = 230;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const minVal = 80;
  const maxVal = 98;

  const getX = (index: number) =>
    padLeft + (index / Math.max(1, data.length - 1)) * innerW;

  const getY = (val: number) =>
    padTop + ((maxVal - val) / (maxVal - minVal)) * innerH;

  const predictedPoints = data
    .map((point, idx) => `${getX(idx).toFixed(1)},${getY(point.predictedRetention).toFixed(1)}`)
    .join(' ');

  const baselinePoints = data
    .map((point, idx) => `${getX(idx).toFixed(1)},${getY(point.baselineRetention).toFixed(1)}`)
    .join(' ');

  const areaPath = [
    `M ${getX(0).toFixed(1)} ${(padTop + innerH).toFixed(1)}`,
    ...data.map((point, idx) => `L ${getX(idx).toFixed(1)} ${getY(point.predictedRetention).toFixed(1)}`),
    `L ${getX(data.length - 1).toFixed(1)} ${(padTop + innerH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const activePoint = data[activeIndex] ?? data[data.length - 1];
  const retentionLift = (
    activePoint.predictedRetention - activePoint.baselineRetention
  ).toFixed(1);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Term Retention Trajectory
          </h2>
          <p className="text-xs text-[#434655] mt-0.5">
            AI-assisted intervention cohort vs. unassisted historical baseline (Weeks 1–10)
          </p>
        </div>
        <div className="flex items-center gap-5 text-xs text-[#434655]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" aria-hidden="true" />
            <span>Predicted with Interventions</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" aria-hidden="true" />
            <span>Historical Baseline</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs bg-[#F8FAFC] rounded-lg px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-[#0F172A]">
          <span className="font-semibold">{activePoint.week}</span>
          <span aria-hidden="true" className="text-[#94A3B8]">·</span>
          <span className="tabular-nums">
            Projected Retention:{' '}
            <strong className="font-semibold text-[#6B38D4]">
              {activePoint.predictedRetention.toFixed(1)}%
            </strong>
          </span>
          <span aria-hidden="true" className="text-[#94A3B8]">·</span>
          <span className="tabular-nums">
            Baseline:{' '}
            <strong className="font-semibold text-[#0F172A]">
              {activePoint.baselineRetention.toFixed(1)}%
            </strong>
          </span>
          <span aria-hidden="true" className="text-[#94A3B8]">·</span>
          <span className="tabular-nums">
            Avg LMS Engagement:{' '}
            <strong className="font-semibold text-[#0F172A]">
              {activePoint.avgEngagement}%
            </strong>
          </span>
        </div>
        <span className="tabular-nums font-semibold text-[#166534]">
          +{retentionLift} pts retention lift
        </span>
      </div>

      <div className="mt-3 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[460px]"
          role="img"
          aria-label="10-week cohort retention trajectory chart"
        >
          <defs>
            <linearGradient id="eduPredictArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[82, 86, 90, 94, 98].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748B"
                  className="tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#eduPredictArea)" />

          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.25"
            strokeDasharray="5 4"
            points={baselinePoints}
          />

          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={predictedPoints}
          />

          {data.map((point, idx) => {
            const cx = getX(idx);
            const cyPred = getY(point.predictedRetention);
            const cyBase = getY(point.baselineRetention);
            const isSelected = idx === activeIndex;

            return (
              <g key={point.week}>
                {isSelected && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + innerH}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cyBase}
                  r={isSelected ? 4.5 : 3}
                  fill="#38BDF8"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={cx}
                  cy={cyPred}
                  r={isSelected ? 5.5 : 3.5}
                  fill="#8B5CF6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isSelected ? '600' : '400'}
                  fill={isSelected ? '#0F172A' : '#64748B'}
                >
                  {point.week}
                </text>
                <rect
                  x={cx - innerW / data.length / 2}
                  y={padTop}
                  width={innerW / data.length}
                  height={innerH + 22}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
