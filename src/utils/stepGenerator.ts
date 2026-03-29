import { Step } from '../types';

export function createStep(type: Step['type'], data: Record<string, any> = {}, highlightLine?: number): Step {
  return { type, data, highlightLine };
}