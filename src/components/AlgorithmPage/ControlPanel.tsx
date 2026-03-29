import { AlgorithmInfo } from '../../types';

interface Props {
  algo: AlgorithmInfo;
  inputValue: string;
  onInputChange: (v: string) => void;
  onStart: () => void;
  onRandom: () => void;
  onReset: () => void;
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

export default function ControlPanel({
  algo, inputValue, onInputChange, onStart, onRandom, onReset,
  isPlaying, currentStepIndex, totalSteps,
  onPlay, onPause, onStepForward, onStepBackward,
}: Props) {
  const progress = totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
      {/* 算法信息 */}
      {algo.complexity && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-2">算法信息</h2>
          <div className="text-xs text-slate-400 space-y-1">
            <div>平均复杂度：<span className="text-primary">{algo.complexity.average}</span></div>
            <div>最好：{algo.complexity.best} · 最坏：{algo.complexity.worst}</div>
            {algo.stable !== undefined && <div>稳定性：{algo.stable ? '✓ 稳定' : '✗ 不稳定'}</div>}
          </div>
        </div>
      )}

      {/* 输入数据（网络算法不显示） */}
      {algo.category !== 'network' && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-2">输入数据</h2>
          <input
            type="text"
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            placeholder="用逗号分隔，如: 5,3,8,1,9"
            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={onStart} className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-lg py-2 text-sm transition-colors">
              应用
            </button>
            <button onClick={onRandom} className="flex-1 bg-surface-dark border border-surface-border hover:border-primary rounded-lg py-2 text-sm transition-colors">
              随机
            </button>
          </div>
        </div>
      )}

      {/* 播放控制 */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-2">播放控制</h2>
        {/* 进度条 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>第 {currentStepIndex} 步</span>
            <span>{totalSteps} 步</span>
          </div>
          <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-xs text-slate-500 mt-1">{progress}%</div>
        </div>
        <div className="flex gap-2 mb-2">
          <button onClick={onStepBackward} disabled={currentStepIndex <= 0} className="flex-1 bg-surface-dark border border-surface-border hover:border-primary disabled:opacity-30 rounded-lg py-2 text-sm transition-colors">
            ◀
          </button>
          {isPlaying ? (
            <button onClick={onPause} className="flex-1 bg-amber-500 hover:bg-amber-600 rounded-lg py-2 text-sm transition-colors">
              ⏸ 暂停
            </button>
          ) : (
            <button onClick={onPlay} disabled={currentStepIndex >= totalSteps} className="flex-1 bg-green-500 hover:bg-green-600 rounded-lg py-2 text-sm disabled:opacity-30 transition-colors">
              ▶ 播放
            </button>
          )}
          <button onClick={onStepForward} disabled={currentStepIndex >= totalSteps} className="flex-1 bg-surface-dark border border-surface-border hover:border-primary disabled:opacity-30 rounded-lg py-2 text-sm transition-colors">
            ▶
          </button>
        </div>
      </div>

      <button onClick={onReset} className="w-full bg-surface-dark border border-surface-border hover:border-red-500 hover:text-red-400 rounded-lg py-2 text-sm transition-colors">
        🔄 重置
      </button>
    </div>
  );
}
