interface Props {
  code: string[];
  highlightedLine: number | null;
}

export default function CodeViewer({ code, highlightedLine }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">伪代码</h2>
      <pre className="font-mono text-sm overflow-x-auto">
        {code.map((line, i) => (
          <div
            key={i}
            className={`px-3 py-1 rounded transition-colors ${highlightedLine === i ? 'bg-primary/30 text-primary' : 'text-slate-300'}`}
          >
            <span className="text-slate-500 select-none mr-2">{i + 1}</span>
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}