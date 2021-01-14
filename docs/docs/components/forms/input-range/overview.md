# Components >> Forms >> Input Range >> Overview ||10

`lion-input-range` component is based on the native range input.
Its purpose is to provide a way for users to select one value from a range of values.

```js script
import { html } from '@lion/core';
import '@lion/input-range/lion-input-range.js';
```

```js preview-story
export const main = () => html`
  <lion-input-range min="200" max="500" .modelValue="${300}" label="Input range"></lion-input-range>
`;
```

## Features

- Based on [lion-input](?path=/docs/forms-input--main#input).
- Shows `modelValue` and `unit` above the range input.
- Shows `min` and `max` value after the range input.
- Can hide the `min` and `max` value via `no-min-max-labels`.
- Makes use of [formatNumber](?path=/docs/localize-numbers--formatting#formatting) for formatting and parsing.

## How to use

### Installation

```bash
npm i --save @lion/input-range
```

```js
import { LionInputRange } from '@lion/input-range';
// or
import '@lion/input-range/lion-input-range.js';
```
