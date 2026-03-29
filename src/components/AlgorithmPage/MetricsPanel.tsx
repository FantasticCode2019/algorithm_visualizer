interface Props {
  comparisonCount: number;
  swapCount: number;
  currentRange: [number, number] | null;
}

export default function MetricsPanel({ comparisonCount, swapCount, currentRange }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">统计指标</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">比较次数</span>
          <span className="text-primary font-medium">{comparisonCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">交换次数</span>
          <span className="text-accent-swap font-medium">{swapCount}</span>
        </div>
        {currentRange && (
          <div className="flex justify-between">
            <span className="text-slate-400">当前区间</span>
            <span className="text-accent-pointer font-medium">[{currentRange[0]}, {currentRange[1]}]</span>
          </div>
        )}
      </div>
    </div>
  );
}