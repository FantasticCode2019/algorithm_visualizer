import { Step } from '../../types';

export function selectionSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({ type: 'message', data: { text: `开始简单选择排序，共 ${n} 个元素` }, highlightLine: 0 });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({ type: 'message', data: { text: `第 ${i + 1} 轮：从位置 ${i} 开始寻找最小值` }, highlightLine: 1 });
    steps.push({ type: 'setPivot', data: { index: minIdx, value: data[minIdx] }, highlightLine: 2 });

    for (let j = i + 1; j < n; j++) {
      steps.push({ type: 'compare', data: { i: j, j: minIdx, message: `比较 arr[${j}]=${data[j]} 和当前最小 arr[${minIdx}]=${data[minIdx]}` }, highlightLine: 4 });
      if (data[j] < data[minIdx]) {
        minIdx = j;
        steps.push({ type: 'setPivot', data: { index: minIdx, value: data[minIdx], message: `更新最小值到位置 ${minIdx}` }, highlightLine: 2 });
      }
    }

    if (minIdx !== i) {
      [data[i], data[minIdx]] = [data[minIdx], data[i]];
      steps.push({ type: 'swap', data: { i, j: minIdx, message: `交换 arr[${i}] 和 arr[${minIdx}]` }, highlightLine: 6 });
    }
    steps.push({ type: 'markSorted', data: { index: i, message: `位置 ${i} 已就位` }, highlightLine: 0 });
  }
  steps.push({ type: 'markSorted', data: { index: n - 1 }, highlightLine: 0 });
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}