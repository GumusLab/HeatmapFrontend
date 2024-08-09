import { getLabelsLayer } from './getLabelsLayer';
import { LabelProps } from './labels.types';

export function getColLabelsLayer(props: LabelProps) {
  return getLabelsLayer({ ...props, axis: 'column' });
}
