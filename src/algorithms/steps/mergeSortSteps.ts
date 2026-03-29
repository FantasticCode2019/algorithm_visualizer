import { Step } from '../../types';

export function mergeSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];

  steps.push({ type: 'message', data: { text: `开始归并排序，共 ${data.length} 个元素` }, highlightLine: 0 });

  function mergeSort(start: number, end: number) {
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);
    steps.push({ type: 'setRange', data: { left: start, right: end, message: `分割区间 [${start}, ${end}]` }, highlightLine: 1 });
    steps.push({ type: 'setPivot', data: { index: mid, value: data[mid], message: `中点 mid = ${mid}` }, highlightLine: 1 });

    mergeSort(start, mid);
    mergeSort(mid + 1, end);

    // Merge
    const leftArr = data.slice(start, mid + 1);
    const rightArr = data.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    steps.push({ type: 'message', data: { text: `合并 [${start}, ${mid}] 和 [${mid + 1}, ${end}]` }, highlightLine: 0 });

    while (i < leftArr.length && j < rightArr.length) {
      steps.push({ type: 'compare', data: { i: start + i, j: mid + 1 + j, message: `比较 ${leftArr[i]} 和 ${rightArr[j]}` }, highlightLine: 5 });
      if (leftArr[i] <= rightArr[j]) {
        data[k] = leftArr[i];
        steps.push({ type: 'setValue', data: { index: k, value: leftArr[i], message: `写入 ${leftArr[i]} 到位置 ${k}` }, highlightLine: 5 });
        i++;
      } else {
        data[k] = rightArr[j];
        steps.push({ type: 'setValue', data: { index: k, value: rightArr[j], message: `写入 ${rightArr[j]} 到位置 ${k}` }, highlightLine: 5 });
        j++;
      }
      k++;
    }

    while (i < leftArr.length) {
      data[k] = leftArr[i];
      steps.push({ type: 'setValue', data: { index: k, value: leftArr[i], message: `写入剩余 ${leftArr[i]} 到位置 ${k}` }, highlightLine: 0 });
      i++; k++;
    }

    while (j < rightArr.length) {
      data[k] = rightArr[j];
      steps.push({ type: 'setValue', data: { index: k, value: rightArr[j], message: `写入剩余 ${rightArr[j]} 到位置 ${k}` }, highlightLine: 0 });
      j++; k++;
    }

    steps.push({ type: 'message', data: { text: `区间 [${start}, ${end}] 合并完成` }, highlightLine: 0 });
  }

  mergeSort(0, data.length - 1);
  for (let i = 0; i < data.length; i++) {
    steps.push({ type: 'markSorted', data: { index: i }, highlightLine: 0 });
  }
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}