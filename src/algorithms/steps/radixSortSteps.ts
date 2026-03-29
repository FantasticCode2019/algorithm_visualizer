import { Step } from '../../types';

export function radixSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({ type: 'message', data: { text: `开始基数排序，共 ${n} 个元素` }, highlightLine: 0 });

  // Find max to determine number of digits
  const maxVal = Math.max(...data);
  steps.push({ type: 'setPivot', data: { index: -1, value: maxVal, message: `最大值 ${maxVal}` }, highlightLine: 0 });

  let exp = 1;
  while (Math.floor(maxVal / exp) > 0) {
    steps.push({ type: 'message', data: { text: `按第 ${exp === 1 ? '个' : exp === 10 ? '十' : '百'}位分配...` }, highlightLine: 0 });

    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    const digitValues: number[] = [];

    // Distribute
    for (let i = 0; i < n; i++) {
      const digit = Math.floor(data[i] / exp) % 10;
      buckets[digit].push(data[i]);
      digitValues.push(digit);
      steps.push({
        type: 'radixDistribute',
        data: { index: i, value: data[i], digit, message: `arr[${i}]=${data[i]} 分配到桶 ${digit}` },
        highlightLine: 0,
      });
    }

    // Collect
    let k = 0;
    steps.push({ type: 'message', data: { text: '从桶中收集...' }, highlightLine: 0 });
    for (let d = 0; d < 10; d++) {
      for (const val of buckets[d]) {
        data[k] = val;
        steps.push({
          type: 'radixCollect',
          data: { index: k, value: val, bucket: d, message: `从桶 ${d} 取 ${val} 到位置 ${k}` },
          highlightLine: 0,
        });
        k++;
      }
    }

    exp *= 10;
  }

  for (let i = 0; i < n; i++) {
    steps.push({ type: 'markSorted', data: { index: i }, highlightLine: 0 });
  }
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}