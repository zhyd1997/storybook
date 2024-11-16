import * as HeaderStories from './Header.stories';
import { Page } from './Page';

const meta = {
  component: Page,
};

export default meta;

export const LoggedIn = {
  args: HeaderStories.LoggedIn.args,
};

export const LoggedOut = {
  args: HeaderStories.LoggedOut.args,
};
