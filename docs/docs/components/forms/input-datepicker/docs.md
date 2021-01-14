# Forms >> Input Datepicker >> Docs ||20

```js script
import { html } from '@lion/core';
import { MinMaxDate, IsDateDisabled } from '@lion/form-core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import { formatDate } from '@lion/localize';
import './lion-input-datepicker.js';
```

## Minimum and maximum date

Below are examples of different validators for dates.

```js preview-story
export const minimumAndMaximumDate = () => html`
  <lion-input-datepicker
    label="MinMaxDate"
    .modelValue=${new Date('2018/05/30')}
    .validators=${[new MinMaxDate({ min: new Date('2018/05/24'), max: new Date('2018/06/24') })]}
  >
    <div slot="help-text">
      Enter a date between ${formatDate(new Date('2018/05/24'))} and ${formatDate(
        new Date('2018/06/24'),
      )}.
    </div>
  </lion-input-datepicker>
`;
```

## Disable specific dates

```js preview-story
export const disableSpecificDates = () => html`
  <lion-input-datepicker
    label="IsDateDisabled"
    help-text="You're not allowed to choose any 15th."
    .validators=${[new IsDateDisabled(d => d.getDate() === 15)]}
  ></lion-input-datepicker>
`;
```

## Calendar heading

You can modify the heading of the calendar with the `.calendarHeading` property or `calendar-heading` attribute for simple values.

By default, it will take the label value.

```js preview-story
export const calendarHeading = () => html`
  <lion-input-datepicker
    label="Date"
    .calendarHeading="${'Custom heading'}"
    .modelValue=${new Date()}
  ></lion-input-datepicker>
`;
```

## Disabled

You can disable datepicker inputs.

```js preview-story
export const disabled = () => html`
  <lion-input-datepicker label="Disabled" disabled></lion-input-datepicker>
`;
```

## Read only

You can set datepicker inputs to `readonly`, which will prevent the user from opening the calendar popup.

```js preview-story
export const readOnly = () => html`
  <lion-input-datepicker label="Readonly" readonly .modelValue="${new Date()}">
  </lion-input-datepicker>
`;
```
