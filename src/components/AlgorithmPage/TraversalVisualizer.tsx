import { useMemo } from 'react';
import { TreeNode } from '../../types';

interface TraversalVisualizerProps {
  root: TreeNode | null;
  // 节点状态
  activeNodeId: number | null;
  traversalMarkedNodeIds: Record<number, number>; // nodeId → order
  visitedNodeIds: number[];
  // 栈/队列状态
  stackValues: number[];
  queueValues: number[];
  // 辅助数据操作类型
  auxOpType: 'none' | 'push' | 'pop' | 'enqueue' | 'dequeue';
  auxOpValue: number;
  auxOpNew: number[];
  // 遍历类型
  algoType: 'preorder' | 'inorder' | 'postorder' | 'bfs' | 'levelorder';
  // 遍历顺序
  traversalOrder: number[];
  // 层级信息（BFS/层序）
  currentLevel?: number;
}

const NODE_R = 22;

// 节点状态颜色
const STATE_COLORS = {
  idle:     '#475569',
  active:   '#f59e0b',
  visited:  '#22c55e',
};

function collectNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  const result: TreeNode[] = [];
  const q: TreeNode[] = [root];
  while (q.length) { const n = q.shift()!; result.push(n); if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
  return result;
}

function computeLayout(root: TreeNode | null, svgW: number): Map<number, { x: number; y: number }> {
  const pos = new Map<number, { x: number; y: number }>();
  if (!root) return pos;
  const LH = 70;
  const levels: TreeNode[][] = [];
  const q: { node: TreeNode; depth: number }[] = [{ node: root, depth: 0 }];
  while (q.length) {
    const { node, depth } = q.shift()!;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(node);
    if (node.left)  q.push({ node: node.left, depth: depth + 1 });
    if (node.right) q.push({ node: node.right, depth: depth + 1 });
  }
  levels.forEach((lvl, depth) => {
    const y = 30 + depth * LH;
    const total = (lvl.length - 1) * 72;
    const startX = (svgW - total) / 2;
    lvl.forEach((n, i) => {
      const x = startX + i * 72;
      pos.set(n.id, { x, y });
      n.x = x; n.y = y;
    });
  });
  return pos;
}

// 栈/队列条目组件
function AuxItem({ value, isNew, type }: { value: number; isNew: boolean; type: 'stack' | 'queue' }) {
  const isPush = isNew;
  return (
    <div
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm
        border transition-all duration-300
        ${type === 'stack'
          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
          : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
        }
        ${isPush ? 'scale-110 ring-2 ring-yellow-400' : ''}
      `}
      style={isPush ? { animation: 'item-pop 0.4s ease-out' } : {}}
    >
      {value}
    </div>
  );
}

export default function TraversalVisualizer({
  root, activeNodeId, traversalMarkedNodeIds = {},
  visitedNodeIds = [], stackValues = [], queueValues = [],
  auxOpType, auxOpValue, auxOpNew = [],
  algoType, traversalOrder = [], currentLevel,
}: TraversalVisualizerProps) {

  const nodes = useMemo(() => collectNodes(root), [root]);
  const positions = useMemo(() => root ? computeLayout(root, 600) : new Map(), [root]);
  const svgW = 600;
  const svgH = nodes.length > 0 ? Math.max(...nodes.map(n => n.y ?? 0)) + 110 : 200;

  const edges = useMemo(() => {
    const e: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const n of nodes) {
      if (n.left && positions.has(n.left.id)) {
        const p1 = positions.get(n.id)!;
        const p2 = positions.get(n.left.id)!;
        e.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
      if (n.right && positions.has(n.right.id)) {
        const p1 = positions.get(n.id)!;
        const p2 = positions.get(n.right.id)!;
        e.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }
    return e;
  }, [nodes, positions]);

  const isDFS = algoType === 'preorder' || algoType === 'inorder' || algoType === 'postorder';

  const orderLabel: Record<string, string> = {
    preorder: '前序', inorder: '中序', postorder: '后序',
    bfs: 'BFS', levelorder: '层序',
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex-1 overflow-hidden">
      <style>{`
        @keyframes pulse-ring {
          0%   { opacity: 0.8; r: 26; }
          100% { opacity: 0; r: 40; }
        }
        @keyframes item-pop {
          0%   { opacity: 0; transform: scale(0.4) translateY(-8px); }
          70%  { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes visit-flash {
          0%   { opacity: 0.7; transform: scale(0.9); }
          50%  { opacity: 1;   transform: scale(1.1); }
          100% { opacity: 1;   transform: scale(1); }
        }
        @keyframes slide-in {
          0%   { opacity: 0; transform: translateX(20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .pulse-anim { animation: pulse-ring 0.8s ease-out infinite; }
        .visit-flash { animation: visit-flash 0.5s ease-out forwards; }
        .slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>

      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isDFS
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            {isDFS ? '🗂️ 栈' : '📋 队列'}
          </span>
          {auxOpType !== 'none' && (
            <span className="slide-in text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              {auxOpType === 'push' && `Push ${auxOpValue} → [${auxOpNew.join(', ')}]`}
              {auxOpType === 'pop'  && `Pop ${auxOpValue} ← [${auxOpNew.join(', ')}]`}
              {auxOpType === 'enqueue' && `Enq ${auxOpValue} → [${auxOpNew.join(', ')}]`}
              {auxOpType === 'dequeue' && `Deq ${auxOpValue} ← [${auxOpNew.join(', ')}]`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
            {orderLabel[algoType] ?? algoType}
          </span>
          {currentLevel !== undefined && (
            <span className="text-xs text-cyan-400 font-mono">第{currentLevel + 1}层</span>
          )}
        </div>
      </div>

      {/* 主内容区：树 + 栈/队列面板 */}
      <div className="flex gap-4 items-start">
        {/* 二叉树 SVG */}
        <div className="flex-1 overflow-x-auto">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">暂无树数据</div>
          ) : (
            <svg width={svgW} height={svgH} className="mx-auto block" style={{ maxWidth: '100%' }}>
              {/* 边 */}
              {edges.map((e, i) => (
                <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke="#334155" strokeWidth={1.8} />
              ))}

              {/* 节点 */}
              {nodes.map(node => {
                const pos = positions.get(node.id);
                if (!pos) return null;
                const isActive  = activeNodeId === node.id;
                const isVisited = visitedNodeIds.includes(node.id);
                const order     = traversalMarkedNodeIds[node.id];
                const isMarked  = order !== undefined;

                let bgColor = STATE_COLORS.idle;
                let strokeColor = '#64748b';
                let strokeW = 1.5;
                let shadow = '';
                let extraEl: React.ReactNode = null;

                if (isActive) {
                  bgColor = STATE_COLORS.active;
                  strokeColor = '#fbbf24';
                  strokeW = 2.5;
                  shadow = 'drop-shadow(0 0 8px #f59e0b)';
                  extraEl = <circle cx={pos.x} cy={pos.y} r={NODE_R + 10} fill="#f59e0b" opacity={0.2} className="pulse-anim" />;
                } else if (isVisited) {
                  bgColor = STATE_COLORS.visited;
                  strokeColor = '#16a34a';
                  strokeW = 2;
                  shadow = 'drop-shadow(0 0 4px #22c55e)';
                } else if (isMarked) {
                  bgColor = STATE_COLORS.visited;
                  strokeColor = '#16a34a';
                  strokeW = 1.5;
                }

                return (
                  <g key={node.id}>
                    {extraEl}
                    <circle
                      cx={pos.x} cy={pos.y} r={NODE_R}
                      fill={bgColor}
                      stroke={strokeColor}
                      strokeWidth={strokeW}
                      className={isActive ? 'visit-flash' : ''}
                      style={{ filter: shadow }}
                    />
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize={13} fontWeight="bold"
                      className="select-none pointer-events-none">
                      {node.value}
                    </text>
                    {/* 访问顺序标签 */}
                    {isMarked && !isActive && (
                      <g>
                        <circle cx={pos.x + NODE_R - 4} cy={pos.y - NODE_R + 4} r={9}
                          fill="#16a34a" stroke="#fff" strokeWidth={1} />
                        <text x={pos.x + NODE_R - 4} y={pos.y - NODE_R + 4}
                          textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize={8} fontWeight="bold">
                          {order}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* 栈/队列面板 */}
        <div className="flex flex-col gap-2 w-32 shrink-0">
          <div className={`text-xs font-semibold px-2 py-1 rounded-t-lg text-center border-t border-l border-r ${
            isDFS ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
          }`}>
            {isDFS ? '🗂️ 栈（Stack）' : '📋 队列（Queue）'}
          </div>
          <div className={`flex flex-col gap-1 p-2 rounded-b-lg border border-t-0 min-h-[80px] ${
            isDFS ? 'border-blue-500/30 bg-blue-500/5' : 'border-emerald-500/30 bg-emerald-500/5'
          }`}>
            {isDFS ? (
              // 栈：顶部在上，最新push的在上方
              [...stackValues].reverse().map((v, i) => (
                <AuxItem key={`${v}-${i}`} value={v} isNew={i === 0 && auxOpType === 'push'} type="stack" />
              ))
            ) : (
              // 队列：队首在左，队尾在右
              queueValues.map((v, i) => (
                <AuxItem key={`${v}-${i}`} value={v}
                  isNew={auxOpType === 'enqueue' && v === auxOpValue}
                  type="queue" />
              ))
            )}
            {(isDFS ? stackValues : queueValues).length === 0 && (
              <div className="text-xs text-slate-600 text-center py-2">empty</div>
            )}
          </div>
        </div>
      </div>

      {/* 遍历顺序面板 */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 shrink-0">{orderLabel[algoType] ?? algoType}顺序：</span>
        <div className="flex gap-1 flex-wrap">
          {traversalOrder.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-600/30 border border-green-500/40 text-green-300 text-xs font-bold slide-in"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {v}
            </span>
          ))}
          {traversalOrder.length === 0 && (
            <span className="text-xs text-slate-600 italic">等待遍历开始...</span>
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex justify-center mt-3 gap-4 flex-wrap text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-500" />
          待访问
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-yellow-400" />
          访问中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-green-600 border border-green-500" />
          已访问
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-500 text-[6px] text-center leading-none flex items-center justify-center">T</span>
          栈
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-500 text-[6px] text-center leading-none flex items-center justify-center">Q</span>
          队列
        </span>
      </div>
    </div>
  );
}
