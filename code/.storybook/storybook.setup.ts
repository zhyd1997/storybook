import { beforeAll, beforeEach } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as projectAnnotations from './preview';
import * as componentAnnotations from '../core/template/stories/preview';
import * as coreAnnotations from '../addons/toolbars/template/stories/preview';
// TODO: figure out why this is causing import/namespace error
import * as reactComponentAnnotations from '../renderers/react/template/components';

const { cleanup, render: testingLibraryRender } = await import('@testing-library/react/pure');

beforeEach(cleanup);

const annotations = setProjectAnnotations([
  projectAnnotations,
  componentAnnotations,
  coreAnnotations,
  reactComponentAnnotations,
  { testingLibraryRender },
]);

beforeAll(annotations.beforeAll!);