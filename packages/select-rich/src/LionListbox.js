import { LitElement } from '@lion/core';
import { FormControlMixin, InteractionStateMixin } from '@lion/field';
import { ValidateMixin } from '@lion/validate';
import { ListboxMixin } from './ListboxMixin.js';

/**
 * LionListbox: implements the wai-aria listbox design pattern and integrates it as a Lion
 * FormControl
 *
 * @customElement lion-select-rich
 * @extends {LitElement}
 */
export class LionListbox extends ListboxMixin(
  FormControlMixin(InteractionStateMixin(ValidateMixin(LitElement))),
) {}
