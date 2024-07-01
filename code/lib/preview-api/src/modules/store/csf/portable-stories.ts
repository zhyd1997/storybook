/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import { type CleanupCallback, isExportStory } from '@storybook/csf';
import dedent from 'ts-dedent';
import type {
  Renderer,
  Args,
  ComponentAnnotations,
  LegacyStoryAnnotationsOrFn,
  NamedOrDefaultProjectAnnotations,
  ComposeStoryFn,
  Store_CSFExports,
  StoryContext,
  Parameters,
  ComposedStoryFn,
  StrictArgTypes,
  ProjectAnnotations,
  RenderContext,
  PreparedStory,
} from '@storybook/types';

import { HooksContext } from '../../../addons';
import { composeConfigs } from './composeConfigs';
import { prepareContext, prepareStory } from './prepareStory';
import { normalizeStory } from './normalizeStory';
import { normalizeComponentAnnotations } from './normalizeComponentAnnotations';
import { getValuesFromArgTypes } from './getValuesFromArgTypes';
import { normalizeProjectAnnotations } from './normalizeProjectAnnotations';
import { mountDestructured } from '../../../modules/preview-web/render/mount-utils';
import { MountMustBeDestructured } from '@storybook/core-events/preview-errors';

let globalProjectAnnotations: ProjectAnnotations<any> = {};

const DEFAULT_STORY_TITLE = 'ComposedStory';
const DEFAULT_STORY_NAME = 'Unnamed Story';

function extractAnnotation<TRenderer extends Renderer = Renderer>(
  annotation: NamedOrDefaultProjectAnnotations<TRenderer>
) {
  // support imports such as
  // import * as annotations from '.storybook/preview'
  // in both cases: 1 - the file has a default export; 2 - named exports only
  return 'default' in annotation ? annotation.default : annotation;
}

export function setProjectAnnotations<TRenderer extends Renderer = Renderer>(
  projectAnnotations:
    | NamedOrDefaultProjectAnnotations<TRenderer>
    | NamedOrDefaultProjectAnnotations<TRenderer>[]
) {
  const annotations = Array.isArray(projectAnnotations) ? projectAnnotations : [projectAnnotations];
  globalProjectAnnotations = composeConfigs(annotations.map(extractAnnotation));
}

const cleanups: CleanupCallback[] = [];

export function composeStory<TRenderer extends Renderer = Renderer, TArgs extends Args = Args>(
  storyAnnotations: LegacyStoryAnnotationsOrFn<TRenderer>,
  componentAnnotations: ComponentAnnotations<TRenderer, TArgs>,
  projectAnnotations?: ProjectAnnotations<TRenderer>,
  defaultConfig?: ProjectAnnotations<TRenderer>,
  exportsName?: string
): ComposedStoryFn<TRenderer, Partial<TArgs>> {
  if (storyAnnotations === undefined) {
    // eslint-disable-next-line local-rules/no-uncategorized-errors
    throw new Error('Expected a story but received undefined.');
  }

  // @TODO: Support auto title

  componentAnnotations.title = componentAnnotations.title ?? DEFAULT_STORY_TITLE;
  const normalizedComponentAnnotations =
    normalizeComponentAnnotations<TRenderer>(componentAnnotations);

  const storyName =
    exportsName ||
    storyAnnotations.storyName ||
    storyAnnotations.story?.name ||
    storyAnnotations.name ||
    DEFAULT_STORY_NAME;

  const normalizedStory = normalizeStory<TRenderer>(
    storyName,
    storyAnnotations,
    normalizedComponentAnnotations
  );

  const normalizedProjectAnnotations = normalizeProjectAnnotations<TRenderer>(
    composeConfigs([defaultConfig ?? {}, globalProjectAnnotations, projectAnnotations ?? {}])
  );

  const story = prepareStory<TRenderer>(
    normalizedStory,
    normalizedComponentAnnotations,
    normalizedProjectAnnotations
  );

  const globalsFromGlobalTypes = getValuesFromArgTypes(normalizedProjectAnnotations.globalTypes);

  const initializeContext = () => {
    const context: StoryContext<TRenderer> = {
      hooks: new HooksContext(),
      globals: {
        ...globalsFromGlobalTypes,
        ...normalizedProjectAnnotations.initialGlobals,
      },
      args: { ...story.initialArgs },
      viewMode: 'story',
      loaded: {},
      abortSignal: new AbortController().signal,
      step: (label, play) => story.runStep(label, play, context),
      canvasElement: globalThis?.document?.body,
      canvas: {},
      ...story,
      context: null!,
      mount: null!,
    };

    context.context = context;
    context.mount = story.mount(context);
    context.renderToCanvas = async () => {
      // Consolidate this renderContext with Context in SB 9.0
      const unmount = await story.renderToCanvas?.(
        {
          componentId: story.componentId,
          title: story.title,
          id: story.id,
          name: story.name,
          tags: story.tags,
          showError: (error) => {},
          showException: (error) => {},
          forceRemount: true,
          storyContext: context,
          storyFn: () => story.unboundStoryFn(context),
          unboundStoryFn: story.unboundStoryFn,
        } as RenderContext<TRenderer>,
        context.canvasElement
      );
      if (unmount) {
        cleanups.push(unmount);
      }
    };
    return prepareContext(context);
  };

  const playFunction = (extraContext?: Partial<StoryContext<TRenderer, Partial<TArgs>>>) => {
    const context = initializeContext();
    Object.assign(context, extraContext);
    return playStory(story, context);
  };

  let loadedContext: StoryContext<TRenderer> | undefined;

  const composedStory: ComposedStoryFn<TRenderer, Partial<TArgs>> = Object.assign(
    function storyFn(extraArgs?: Partial<TArgs>) {
      const context = loadedContext ?? initializeContext();
      context.args = {
        ...context.initialArgs,
        ...extraArgs,
      };
      return story.unboundStoryFn(context);
    },
    {
      id: story.id,
      storyName,
      load: async () => {
        // First run any registered cleanup function
        for (const callback of [...cleanups].reverse()) await callback();
        cleanups.length = 0;

        const context = initializeContext();

        context.loaded = await story.applyLoaders(context);

        cleanups.push(...(await story.applyBeforeEach(context)).filter(Boolean));

        loadedContext = context;
      },
      args: story.initialArgs as Partial<TArgs>,
      parameters: story.parameters as Parameters,
      argTypes: story.argTypes as StrictArgTypes<TArgs>,
      play: playFunction,
      tags: story.tags,
    }
  );

  return composedStory;
}

export function composeStories<TModule extends Store_CSFExports>(
  storiesImport: TModule,
  globalConfig: ProjectAnnotations<Renderer>,
  composeStoryFn: ComposeStoryFn
) {
  const { default: meta, __esModule, __namedExportsOrder, ...stories } = storiesImport;
  const composedStories = Object.entries(stories).reduce((storiesMap, [exportsName, story]) => {
    if (!isExportStory(exportsName, meta)) {
      return storiesMap;
    }

    const result = Object.assign(storiesMap, {
      [exportsName]: composeStoryFn(
        story as LegacyStoryAnnotationsOrFn,
        meta,
        globalConfig,
        exportsName
      ),
    });
    return result;
  }, {});

  return composedStories;
}

type WrappedStoryRef = { __pw_type: 'jsx' | 'importRef' };
type UnwrappedJSXStoryRef = {
  __pw_type: 'jsx';
  type: UnwrappedImportStoryRef;
};
type UnwrappedImportStoryRef = ComposedStoryFn & {
  playPromise?: Promise<void>;
  renderingEnded?: PromiseWithResolvers<void>;
};

declare global {
  function __pwUnwrapObject(
    storyRef: WrappedStoryRef
  ): Promise<UnwrappedJSXStoryRef | UnwrappedImportStoryRef>;
}

export function createPlaywrightTest<TFixture extends { extend: any }>(
  baseTest: TFixture
): TFixture {
  return baseTest.extend({
    mount: async ({ mount, page }: any, use: any) => {
      await use(async (storyRef: WrappedStoryRef, ...restArgs: any) => {
        // Playwright CT deals with JSX import references differently than normal imports
        // and we can currently only handle JSX import references
        if (
          !('__pw_type' in storyRef) ||
          ('__pw_type' in storyRef && storyRef.__pw_type !== 'jsx')
        ) {
          // eslint-disable-next-line local-rules/no-uncategorized-errors
          throw new Error(dedent`
              Portable stories in Playwright CT only work when referencing JSX elements.
              Please use JSX format for your components such as:
              
              instead of:
              await mount(MyComponent, { props: { foo: 'bar' } })
              
              do:
              await mount(<MyComponent foo="bar"/>)

              More info: https://storybook.js.org/docs/api/portable-stories-playwright
            `);
        }

        // start the play function on the client, and halt when rendering starts
        await page.evaluate(async (wrappedStoryRef: WrappedStoryRef) => {
          const unwrappedStoryRef = await globalThis.__pwUnwrapObject?.(wrappedStoryRef);
          const story =
            '__pw_type' in unwrappedStoryRef ? unwrappedStoryRef.type : unwrappedStoryRef;

          const renderingStarted = Promise.withResolvers<void>();
          story.renderingEnded = Promise.withResolvers();
          story.playPromise = story.play({
            canvasElement: document.querySelector('#root'),
            renderToCanvas: async () => {
              renderingStarted.resolve();
              await story.renderingEnded?.promise;
            },
          });
          await renderingStarted.promise;
        }, storyRef);

        // let playwright mount the story in node
        const mountResult = await mount(storyRef, ...restArgs);

        // go back to client to continue playing the play function
        await page.evaluate(async (wrappedStoryRef: WrappedStoryRef) => {
          const unwrappedStoryRef = await globalThis.__pwUnwrapObject?.(wrappedStoryRef);
          const story =
            '__pw_type' in unwrappedStoryRef ? unwrappedStoryRef.type : unwrappedStoryRef;

          story.renderingEnded?.resolve();
          await story.playPromise;
        }, storyRef);

        return mountResult;
      });
    },
  });
}

// TODO At some point this function should live in prepareStory and become the core of StoryRender.render as well.
// Will make a follow up PR for that
async function playStory<TRenderer extends Renderer>(
  story: PreparedStory<TRenderer>,
  context: StoryContext<TRenderer>
) {
  for (const callback of [...cleanups].reverse()) await callback();
  cleanups.length = 0;

  context.loaded = await story.applyLoaders(context);
  if (context.abortSignal.aborted) return;

  cleanups.push(...(await story.applyBeforeEach(context)).filter(Boolean));

  const playFunction = story.playFunction;

  const isMountDestructured = playFunction && mountDestructured(playFunction);

  if (!isMountDestructured) {
    await context.mount();
  }

  if (context.abortSignal.aborted) return;

  if (playFunction) {
    if (!isMountDestructured) {
      context.mount = async () => {
        throw new MountMustBeDestructured({ playFunction: playFunction.toString() });
      };
    }
    await playFunction(context);
  }
}
