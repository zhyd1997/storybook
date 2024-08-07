import { vi, beforeAll, beforeEach } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as projectAnnotations from './preview';
import * as componentAnnotations from '../core/template/stories/preview';
import * as coreAnnotations from '../addons/toolbars/template/stories/preview';
// register global components used in many stories
import '../renderers/react/template/components';

const { cleanup, render: testingLibraryRender } = await import('@testing-library/react/pure');

beforeEach(cleanup);

vi.spyOn(console, 'warn').mockImplementation((...args) => console.log(...args));

const annotations = setProjectAnnotations([
  projectAnnotations,
  componentAnnotations,
  coreAnnotations,
  { testingLibraryRender },
]);

beforeAll(annotations.beforeAll);
