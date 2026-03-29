import { Step } from '../../types';

export function binarySearchSteps(arr: number[], target?: number): { steps: Step[]; target: number } {
  const steps: Step[] = [];
  const data = [...arr].sort((a, b) => a - b);
  const t = target ?? data[Math.floor(data.length / 2)];

  steps.push({ type: 'message', data: { text: `二分查找目标 ${t}，数组已排序: [${data.join(', ')}]` }, highlightLine: 0 });

  let low = 0, high = data.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps.push({ type: 'setRange', data: { left: low, right: high, message: `搜索区间 [${low}, ${high}]` }, highlightLine: 1 });
    steps.push({ type: 'movePointer', data: { name: 'low', index: low }, highlightLine: 1 });
    steps.push({ type: 'movePointer', data: { name: 'high', index: high }, highlightLine: 1 });
    steps.push({ type: 'movePointer', data: { name: 'mid', index: mid }, highlightLine: 2 });

    steps.push({ type: 'compare', data: { i: mid, j: -1, message: `比较 arr[${mid}]=${data[mid]} 与目标 ${t}` }, highlightLine: 3 });

    if (data[mid] === t) {
      steps.push({ type: 'markFound', data: { index: mid, message: `找到目标 ${t} 在位置 ${mid}` }, highlightLine: 4 });
      steps.push({ type: 'message', data: { text: `找到目标 ${t}，位置 ${mid}！` }, highlightLine: 4 });
      return { steps, target: t };
    } else if (data[mid] < t) {
      steps.push({ type: 'markDiscarded', data: { left: low, right: mid, message: `排除区间 [${low}, ${mid}]` }, highlightLine: 5 });
      steps.push({ type: 'message', data: { text: `${data[mid]} < ${t}，向右搜索` }, highlightLine: 5 });
      low = mid + 1;
    } else {
      steps.push({ type: 'markDiscarded', data: { left: mid, right: high, message: `排除区间 [${mid}, ${high}]` }, highlightLine: 6 });
      steps.push({ type: 'message', data: { text: `${data[mid]} > ${t}，向左搜索` }, highlightLine: 6 });
      high = mid - 1;
    }
  }

  steps.push({ type: 'message', data: { text: `未找到目标 ${t}` }, highlightLine: 7 });
  return { steps, target: t };
}