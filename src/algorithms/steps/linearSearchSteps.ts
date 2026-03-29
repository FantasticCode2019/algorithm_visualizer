import { Step } from '../../types';

export function linearSearchSteps(arr: number[], target?: number): { steps: Step[]; target: number } {
  const steps: Step[] = [];
  const data = [...arr];
  const t = target ?? data[Math.floor(Math.random() * data.length)];

  steps.push({ type: 'message', data: { text: `顺序查找目标 ${t}，数组: [${data.join(', ')}]` }, highlightLine: 0 });

  for (let i = 0; i < data.length; i++) {
    steps.push({ type: 'movePointer', data: { name: 'i', index: i }, highlightLine: 1 });
    steps.push({ type: 'compare', data: { i, j: -1, message: `检查 arr[${i}]=${data[i]} 与目标 ${t}` }, highlightLine: 2 });

    if (data[i] === t) {
      steps.push({ type: 'markFound', data: { index: i, message: `找到目标 ${t} 在位置 ${i}` }, highlightLine: 3 });
      steps.push({ type: 'message', data: { text: `找到目标 ${t}，位置 ${i}！` }, highlightLine: 3 });
      return { steps, target: t };
    }
  }

  steps.push({ type: 'message', data: { text: `未找到目标 ${t}` }, highlightLine: 4 });
  return { steps, target: t };
}