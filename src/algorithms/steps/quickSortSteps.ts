import { Step } from '../../types';

export function quickSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];

  steps.push({ type: 'message', data: { text: `开始快速排序，共 ${data.length} 个元素` }, highlightLine: 0 });

  function partition(low: number, high: number): number {
    const pivotVal = data[high];
    steps.push({ type: 'setPivot', data: { index: high, value: pivotVal }, highlightLine: 3 });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({ type: 'compare', data: { i: j, j: high, message: `比较 arr[${j}]=${data[j]} 与基准值 ${pivotVal}` }, highlightLine: 3 });
      if (data[j] < pivotVal) {
        i++;
        if (i !== j) {
          [data[i], data[j]] = [data[j], data[i]];
          steps.push({ type: 'swap', data: { i, j, message: `交换 arr[${i}] 和 arr[${j}]` }, highlightLine: 3 });
        }
      }
    }
    [data[i + 1], data[high]] = [data[high], data[i + 1]];
    steps.push({ type: 'swap', data: { i: i + 1, j: high, message: `基准归位到位置 ${i + 1}` }, highlightLine: 3 });
    steps.push({ type: 'markSorted', data: { index: i + 1 }, highlightLine: 0 });
    return i + 1;
  }

  function quickSort(low: number, high: number) {
    if (low < high) {
      steps.push({ type: 'setRange', data: { left: low, right: high, message: `处理区间 [${low}, ${high}]` }, highlightLine: 1 });
      const pivot = partition(low, high);
      quickSort(low, pivot - 1);
      quickSort(pivot + 1, high);
    } else if (low === high) {
      steps.push({ type: 'markSorted', data: { index: low }, highlightLine: 0 });
    }
  }

  quickSort(0, data.length - 1);
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}