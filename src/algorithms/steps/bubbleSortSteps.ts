import { Step } from '../../types';

export function bubbleSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({
    type: 'message',
    data: { text: `开始冒泡排序，共 ${n} 个元素` },
    highlightLine: 0,
  });

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    steps.push({
      type: 'message',
      data: { text: `第 ${i + 1} 轮比较` },
      highlightLine: 0,
    });
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'compare',
        data: { i: j, j: j + 1, valI: data[j], valJ: data[j + 1], message: `比较 arr[${j}]=${data[j]} 和 arr[${j + 1}]=${data[j + 1]}` },
        highlightLine: 2,
      });
      if (data[j] > data[j + 1]) {
        [data[j], data[j + 1]] = [data[j + 1], data[j]];
        steps.push({
          type: 'swap',
          data: { i: j, j: j + 1, valI: data[j + 1], valJ: data[j], message: `交换 arr[${j}] 和 arr[${j + 1}]` },
          highlightLine: 3,
        });
        swapped = true;
      }
    }
    steps.push({
      type: 'markSorted',
      data: { index: n - i - 1, message: `位置 ${n - i - 1} 已就位` },
      highlightLine: 0,
    });
    if (!swapped) {
      for (let k = 0; k < n - i - 1; k++) {
        steps.push({ type: 'markSorted', data: { index: k }, highlightLine: 0 });
      }
      break;
    }
  }
  steps.push({ type: 'markSorted', data: { index: 0 }, highlightLine: 0 });
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}