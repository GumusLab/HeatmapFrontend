import { getLabelsLayer } from './getLabelsLayer';
import { LabelProps } from './labels.types';

export function getRowLabelsLayer(props: LabelProps) {
  return getLabelsLayer({ ...props, axis: 'row' });
}
