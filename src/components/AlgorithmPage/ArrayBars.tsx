interface Props {
  data: number[];
  compareIndices: number[];
  swapIndices: number[];
  sortedIndices: number[];
  pointers: Record<string, number>;
  currentRange: [number, number] | null;
  discardedRanges: [number, number][];
}

export default function ArrayBars({
  data, compareIndices, swapIndices, sortedIndices, pointers,
  currentRange, discardedRanges,
}: Props) {
  const maxVal = Math.max(...data, 1);

  const getBarStyle = (index: number) => {
    const height = (data[index] / maxVal) * 100;
    let bg = 'bg-blue-500';
    if (sortedIndices.includes(index)) bg = 'bg-accent-sorted';
    else if (swapIndices.includes(index)) bg = 'bg-accent-swap';
    else if (compareIndices.includes(index)) bg = 'bg-accent-compare';
    return { height: `${height}%`, backgroundColor: undefined, className: `w-8 rounded-t transition-all duration-300 ${bg}` };
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 flex-1">
      <div className="flex items-end justify-center gap-1 h-64 relative">
        {data.map((val, i) => {
          const inRange = currentRange ? i >= currentRange[0] && i <= currentRange[1] : true;
          const isDiscarded = discardedRanges.some(([l, r]) => i >= l && i <= r);
          return (
            <div key={i} className="relative flex flex-col items-center">
              <div
                className={`w-8 rounded-t transition-all duration-300 flex items-end justify-center pb-1 ${getBarStyle(i).className}`}
                style={{ height: `${(val / maxVal) * 100}%`, opacity: isDiscarded ? 0.2 : inRange ? 1 : 0.4 }}
              >
                <span className="text-xs font-medium text-white/80">{val}</span>
              </div>
              {Object.entries(pointers).map(([name, idx]) => (
                idx === i && (
                  <div key={name} className="absolute -top-6 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: name === 'pivot' ? '#a855f7' : name === 'found' ? '#22c55e' : name === 'low' || name === 'high' ? '#06b6d4' : '#f59e0b' }}>
                    {name}
                  </div>
                )
              ))}
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-2 text-xs text-slate-500 gap-4">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> 比较中</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-swap rounded" /> 交换中</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent-sorted rounded" /> 已排序</span>
      </div>
    </div>
  );
}