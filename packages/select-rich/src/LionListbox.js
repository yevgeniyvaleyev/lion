import { LitElement } from '@lion/core';
import { ListboxMixin } from './ListboxMixin.js';

/**
 * LionListbox: implements the wai-aria listbox design pattern and integrates it as a Lion
 * FormControl
 *
 * @customElement lion-select-rich
 * @extends {LitElement}
 */
export class LionListbox extends ListboxMixin(LitElement) {}
