import { Header } from './Header';

const meta = {
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
};

export default meta;

export const LoggedIn = {
  args: {
    user: {},
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};

export const LoggedOut = {
  args: {
    onLogin: () => {},
    onLogout: () => {},
    onCreateAccount: () => {},
  },
};
