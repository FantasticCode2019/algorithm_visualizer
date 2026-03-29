import { Step } from '../../types';

export function heapSortSteps(arr: number[]): { steps: Step[] } {
  const steps: Step[] = [];
  const data = [...arr];
  const n = data.length;

  steps.push({ type: 'message', data: { text: `开始堆排序，共 ${n} 个元素` }, highlightLine: 0 });

  function heapify(size: number, root: number) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size) {
      steps.push({ type: 'compare', data: { i: left, j: largest, message: `比较 arr[${left}]=${data[left]} 和 arr[${largest}]=${data[largest]}` }, highlightLine: 0 });
      if (data[left] > data[largest]) largest = left;
    }
    if (right < size) {
      steps.push({ type: 'compare', data: { i: right, j: largest, message: `比较 arr[${right}]=${data[right]} 和 arr[${largest}]=${data[largest]}` }, highlightLine: 0 });
      if (data[right] > data[largest]) largest = right;
    }

    if (largest !== root) {
      [data[root], data[largest]] = [data[largest], data[root]];
      steps.push({ type: 'swap', data: { i: root, j: largest, message: `交换 arr[${root}] 和 arr[${largest}]` }, highlightLine: 0 });
      heapify(size, largest);
    }
  }

  // Build max heap
  steps.push({ type: 'message', data: { text: '构建最大堆...' }, highlightLine: 0 });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    steps.push({ type: 'setPivot', data: { index: i, value: data[i], message: `堆化子树根节点 ${i}` }, highlightLine: 0 });
    heapify(n, i);
  }

  steps.push({ type: 'message', data: { text: '最大堆构建完成' }, highlightLine: 0 });

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [data[0], data[i]] = [data[i], data[0]];
    steps.push({ type: 'swap', data: { i: 0, j: i, message: `将堆顶 ${data[i]} 移到位置 ${i}` }, highlightLine: 0 });
    steps.push({ type: 'markSorted', data: { index: i, message: `位置 ${i} 已就位` }, highlightLine: 0 });
    heapify(i, 0);
  }
  steps.push({ type: 'markSorted', data: { index: 0 }, highlightLine: 0 });
  steps.push({ type: 'message', data: { text: '排序完成！' }, highlightLine: 0 });

  return { steps };
}