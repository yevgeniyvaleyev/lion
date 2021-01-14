# Forms >> Form Integrations >> Overview ||10

A combobox is a widget made up of the combination of two distinct elements:

- a single-line textbox
- an associated listbox overlay

Based on the combobox configuration and entered texbox value, options in the listbox will be
filtered, checked, focused and the textbox value may be autocompleted.
Optionally the combobox contains a graphical button adjacent to the textbox, indicating the
availability of the popup.

> Fore more information, consult [Combobox wai-aria design pattern](https://www.w3.org/TR/wai-aria-practices/#combobox)

```js script
import { html } from '@lion/core';
import { Required } from '@lion/form-core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import { listboxData } from '@lion/listbox/docs/listboxData.js';
import '@lion/listbox/lion-option.js';
import '@lion/combobox/lion-combobox.js';
import './src/demo-selection-display.js';
import { lazyRender } from './src/lazyRender.js';
```

```js preview-story
export const main = () => html`
  <lion-combobox name="combo" label="Default">
    ${lazyRender(
      listboxData.map(entry => html` <lion-option .choiceValue="${entry}">${entry}</lion-option> `),
    )}
  </lion-combobox>
`;
```

[...show more](./examples.md)

## Features

> tbd

## Installation

```bash
npm i --save @lion/combobox
```

```js
import '@lion/combobox/lion-combobox.js';
```
