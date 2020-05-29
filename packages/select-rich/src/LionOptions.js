import { LitElement } from '@lion/core';
import { FormRegistrarPortalMixin } from '@lion/field';

/**
 * LionOptions. To be used as a child of a collapsible dropdown listbox (also known as select-rich)
 * It allows to be put in different parts of the dom (for instance appended to the body in a dialog)
 * @customElement lion-options
 * @extends {LitElement}
 */
export class LionOptions extends FormRegistrarPortalMixin(LitElement) {
  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.setAttribute('role', 'listbox');
    this.style.display = 'block';
  }

  createRenderRoot() {
    return this;
  }
}
