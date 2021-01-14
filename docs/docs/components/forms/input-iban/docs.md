# Forms >> Input Iban >> Docs ||20

```js script
import { html } from '@lion/core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';
import { IsCountryIBAN, IsNotCountryIBAN } from './src/validators.js';
import './lion-input-iban.js';
```

## Prefilled

```js preview-story
export const prefilled = () => html`
  <lion-input-iban .modelValue=${'NL20INGB0001234567'} name="iban" label="IBAN"></lion-input-iban>
`;
```

## Faulty Prefilled

```js preview-story
export const faultyPrefilled = () => html`
  <lion-input-iban
    .modelValue=${'NL20INGB0001234567XXXX'}
    name="iban"
    label="IBAN"
  ></lion-input-iban>
`;
```

## Country Restrictions

By default, we validate the input to ensure the IBAN is valid.
To get the default feedback message for this default validator, use `loadDefaultFeedbackMessages` from `@lion/form-core`.

In the example below, we show how to use an additional validator that restricts the `input-iban` to IBANs from only certain countries.

```js preview-story
export const countryRestrictions = () => {
  loadDefaultFeedbackMessages();
  return html`
    <lion-input-iban
      .modelValue=${'DE89370400440532013000'}
      .validators=${[new IsCountryIBAN('NL')]}
      name="iban"
      label="IBAN"
    ></lion-input-iban>
    <br />
    <small>Demo instructions: you can use NL20 INGB 0001 2345 67</small>
  `;
};
```

## Blacklisted Country

By default, we validate the input to ensure the IBAN is valid.
To get the default feedback message for this default validator, use `loadDefaultFeedbackMessages` from `@lion/form-core`.

In the example below, we show how to use an additional validator that blocks IBANs from certain countries.

You can pass a single string value, or an array of strings.

```js preview-story
export const blacklistedCountry = () => {
  loadDefaultFeedbackMessages();
  return html`
    <lion-input-iban
      .modelValue=${'DE89370400440532013000'}
      .validators=${[new IsNotCountryIBAN(['RO', 'NL'])]}
      name="iban"
      label="IBAN"
    ></lion-input-iban>
    <br />
    <small
      >Demo instructions: Try <code>RO 89 RZBR 6997 3728 4864 5577</code> and watch it fail</small
    >
  `;
};
```
