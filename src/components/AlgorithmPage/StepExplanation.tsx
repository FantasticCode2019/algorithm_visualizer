interface Props {
  message: string;
  currentStepIndex: number;
  totalSteps: number;
}

export default function StepExplanation({ message, currentStepIndex, totalSteps }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-2">当前步骤</h2>
      <p className="text-white min-h-[2rem]">
        {message || (currentStepIndex >= totalSteps ? '算法执行完成' : '点击播放开始演示')}
      </p>
    </div>
  );
}