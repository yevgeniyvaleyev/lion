# Components >> Forms >> Input >> Overview ||10

`lion-input` component is a webcomponent that enhances the functionality of the native `<input>` element.

```js script
import { html } from 'lit-html';
import '@lion/input/lion-input.js';
```

```js preview-story
export const main = () => html`<lion-input label="First Name"></lion-input>`;
```

[...show more](./examples.md)

## Features

- Based on [field](?path=/docs/forms-system-overview--page)
- Extra visual elements can be added via `slots`
  - **label**: can also be provided via the `label` attribute, but the slot can be used to change the `html` and `CSS` of the label.
    For example add an `u-sr-only` class to the label to make it visually hidden.
    A label is always needed for accessibility reasons.
  - **help-text**: a helper text shown below the label to give extra clarification.
  - **prefix**: does not have an active use case yet, but the option is in place.
  - **suffix**: can be used for addons to the input like a calculator, datepicker or addressbook. In these cases a button with an icon is used.
  - **before**: does not have an active use case yet, but the option is in place.
  - **after**: can be used to show a currency or percentage.
- Delegates attributes like `type`, `disabled`, `placeholder` and `read-only` to the native input.
- Can make us of [validation](?path=/docs/forms-validation-overview--main#validate)

## Installation

```bash
npm i --save @lion/input
```

```js
import '@lion/input/lion-input.js';
```
