import type { ReactElement } from 'react';

export interface Background {
  name: string;
  value: string;
}

// TODO: remove in 9.0
export interface GlobalState {
  name: string | undefined;
  selected: string | undefined;
}

// TODO: remove in 9.0
export interface BackgroundSelectorItem {
  id: string;
  title: string;
  onClick: () => void;
  value: string;
  active: boolean;
  right?: ReactElement;
}

// TODO: remove in 9.0
export interface BackgroundsParameter {
  default?: string | null;
  disable?: boolean;
  values: Background[];
}

// TODO: remove in 9.0
export interface BackgroundsConfig {
  backgrounds: Background[] | null;
  selectedBackgroundName: string | null;
  defaultBackgroundName: string | null;
  disable: boolean;
}
