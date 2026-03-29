import { Step } from '../../types';

export function shellSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({ type: 'message', data: { text: `开始希尔排序，共 ${n} 个元素` }, highlightLine: 0 });

  let gap = Math.floor(n / 2);
  steps.push({ type: 'message', data: { text: `初始增量 gap = ${gap}` }, highlightLine: 1 });

  while (gap > 0) {
    steps.push({ type: 'setRange', data: { left: 0, right: n - 1, message: `当前增量 gap = ${gap}` }, highlightLine: 0 });

    for (let i = gap; i < n; i++) {
      const temp = data[i];
      steps.push({ type: 'setPivot', data: { index: i, value: temp }, highlightLine: 3 });
      steps.push({ type: 'message', data: { text: `处理元素 arr[${i}] = ${temp}` }, highlightLine: 0 });

      let j = i;
      while (j >= gap && data[j - gap] > temp) {
        steps.push({ type: 'compare', data: { i: j - gap, j, message: `比较 arr[${j - gap}]=${data[j - gap]} > ${temp}` }, highlightLine: 4 });
        data[j] = data[j - gap];
        steps.push({ type: 'shift', data: { from: j - gap, to: j, message: `将 arr[${j - gap}] 后移到 arr[${j}]` }, highlightLine: 5 });
        j -= gap;
      }
      data[j] = temp;
      steps.push({ type: 'insert', data: { index: j, value: temp, message: `将 ${temp} 插入位置 ${j}` }, highlightLine: 7 });
      if (i === gap) steps.push({ type: 'markSorted', data: { index: 0 }, highlightLine: 0 });
    }

    steps.push({ type: 'message', data: { text: `gap = ${gap} 轮完成` }, highlightLine: 0 });
    gap = Math.floor(gap / 2);
  }

  for (let i = 0; i < n; i++) {
    steps.push({ type: 'markSorted', data: { index: i }, highlightLine: 0 });
  }
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}