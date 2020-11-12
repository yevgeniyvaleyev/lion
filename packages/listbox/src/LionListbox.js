import { LionField } from '@lion/form-core';
import { ListboxMixin } from './ListboxMixin.js';

// TODO: could we extend from LionField?

/**
 * LionListbox: implements the wai-aria listbox design pattern and integrates it as a Lion
 * FormControl
 */
// @ts-expect-error
export class LionListbox extends ListboxMixin(LionField) {}
