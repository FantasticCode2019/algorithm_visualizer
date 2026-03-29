import { Step } from '../../types';

export function insertionSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({ type: 'message', data: { text: `开始直接插入排序，共 ${n} 个元素` }, highlightLine: 0 });

  for (let i = 1; i < n; i++) {
    const key = data[i];
    steps.push({ type: 'setPivot', data: { index: i, value: key }, highlightLine: 2 });
    steps.push({ type: 'message', data: { text: `将 arr[${i}]=${key} 插入已排序区` }, highlightLine: 0 });

    let j = i - 1;
    while (j >= 0 && data[j] > key) {
      steps.push({ type: 'compare', data: { i: j, j: j + 1, message: `比较 arr[${j}]=${data[j]} > key=${key}` }, highlightLine: 4 });
      data[j + 1] = data[j];
      steps.push({ type: 'shift', data: { from: j, to: j + 1, message: `将 arr[${j}] 后移到 arr[${j + 1}]` }, highlightLine: 5 });
      j--;
    }
    data[j + 1] = key;
    steps.push({ type: 'insert', data: { index: j + 1, value: key, message: `将 ${key} 插入位置 ${j + 1}` }, highlightLine: 7 });
    if (i === 1) steps.push({ type: 'markSorted', data: { index: 0 }, highlightLine: 0 });
    steps.push({ type: 'markSorted', data: { index: i }, highlightLine: 0 });
  }

  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });
  return { steps };
}