/* eslint-disable react/no-deprecated */
import type { ReactElement } from 'react';
import * as ReactDOM from 'react-dom';

const renderElement = async (node: ReactElement, el: Element) => {
  return new Promise<null>((resolve) => {
    ReactDOM.render(node, el, () => resolve(null));
  });
};

const unmountElement = (el: Element) => {
  ReactDOM.unmountComponentAtNode(el);
};

export default { renderElement, unmountElement };
