import { css } from '@lion/core';

/**
 * Temp approach for showing dropdowns that flow out of their container
 * Ideally, this would be configurable in Preview:
 * https://github.com/storybookjs/storybook/blob/next/lib/components/src/blocks/Preview.tsx
 *
 * Alternatively, activate popper body positioning (better)
 */
const overrides = css`
  .sbdocs.sbdocs-preview {
    overflow: initial;
    position: relative;
    z-index: unset;
  }
  .sbdocs.sbdocs-preview > div:first-child {
    z-index: 1;
  }
  .sbdocs.sbdocs-preview > div > div {
    overflow: initial;
    z-index: unset;
  }
  .sbdocs.sbdocs-preview > div > div [scale='1'] {
    z-index: 1;
  }
`;

const styleTag = document.createElement('style');
styleTag.innerHTML = overrides.cssText;
document.head.appendChild(styleTag);
