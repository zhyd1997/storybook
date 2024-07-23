import { fn } from '@storybook/test';
import { FilterToggle } from './FilterToggle';

export default {
  component: FilterToggle,
  args: {
    active: false,
    onClick: fn(),
  },
};

export const Changes = {
  args: {
    count: 12,
    label: 'Change',
    status: 'warning',
  },
};

export const ChangesActive = {
  args: {
    ...Changes.args,
    active: true,
  },
};

export const Errors = {
  args: {
    count: 2,
    label: 'Error',
    status: 'critical',
  },
};

export const ErrorsActive = {
  args: {
    ...Errors.args,
    active: true,
  },
};
