# Components >> Forms >> Input Date >> Overview ||10

`lion-input-date` component is based on the generic text input field. Its purpose is to provide a way for users to fill in a date.

```js script
import { html } from '@lion/core';
import { MinDate, MinMaxDate, MaxDate } from '@lion/form-core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import { formatDate } from '@lion/localize';
import '@lion/input-date/lion-input-date.js';
```

```js preview-story
export const main = () => html` <lion-input-date label="Date"></lion-input-date> `;
```

## Features

- Based on [lion-input](?path=/docs/forms-input--main#input)
- Makes use of [formatDate](?path=/docs/localize-dates--formatting#date-localization) for formatting and parsing.
- Option to override locale to change the formatting and parsing
- Default label in different languages
- Can make use of date specific [validators](?path=/docs/forms-validation-overview--main#validate) with corresponding error messages in different languages
  - IsDate (default)
  - MinDate
  - MaxDate
  - MinMaxDate

## How to use

### Installation

```bash
npm i --save @lion/input-date
```

```js
import { LionInputDate } from '@lion/input-date';
// or
import '@lion/input-date/lion-input-date.js';
```
