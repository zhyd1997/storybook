// TODO: remove the function type from styles in 9.0
export type Styles = ViewportStyles | ((s: ViewportStyles | undefined) => ViewportStyles) | null;

export interface Viewport {
  name: string;
  styles: Styles;
  type: 'desktop' | 'mobile' | 'tablet' | 'other';
}

export interface ViewportStyles {
  height: string;
  width: string;
}

export interface ViewportMap {
  [key: string]: Viewport;
}
