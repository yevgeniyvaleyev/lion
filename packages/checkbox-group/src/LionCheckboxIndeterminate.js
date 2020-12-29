import { html, css } from '@lion/core';
import { LionCheckbox } from './LionCheckbox.js';

// @ts-expect-error false positive for incompatible static get properties. Lit-element merges super properties already for you.
export class LionCheckboxIndeterminate extends LionCheckbox {
  static get properties() {
    return {
      /**
       * Indeterminate state of the checkbox
       */
      indeterminate: {
        type: Boolean,
        reflect: true,
      },
    };
  }

  get _checkboxGroupNode() {
    return /** @type {import('./LionCheckboxGroup').LionCheckboxGroup} */ (this._parentFormGroup);
  }

  get _subCheckboxes() {
    return this._checkboxGroupNode.formElements.filter(
      checkbox => checkbox !== this && this.contains(checkbox),
    );
  }

  _setOwnCheckedState() {
    const checkedElements = this._subCheckboxes.filter(checkbox => checkbox.checked);
    switch (this._subCheckboxes.length - checkedElements.length) {
      // all checked
      case 0:
        this.indeterminate = false;
        this.checked = true;
        break;
      // none checked
      case this._subCheckboxes.length:
        this.indeterminate = false;
        this.checked = false;
        break;
      default:
        this.indeterminate = true;
    }
  }

  /**
   * @override ChoiceInputMixin
   * first set subCheckboxes if event came from itself
   * then set own checked + indeterminate state
   * @param {Event} ev
   */
  __toggleChecked(ev) {
    if (this.disabled) {
      return;
    }

    if (ev.target === this) {
      this._subCheckboxes.forEach(checkbox => {
        // eslint-disable-next-line no-param-reassign
        checkbox.checked = this._inputNode.checked;
      });
    }
    this._setOwnCheckedState();
  }

  // eslint-disable-next-line class-methods-use-this
  _afterTemplate() {
    return html`
      <div class="choice-field__nested-checkboxes">
        <slot name="checkbox"></slot>
      </div>
    `;
  }

  constructor() {
    super();
    this.indeterminate = false;
  }

  /** @param {import('lit-element').PropertyValues } changedProperties */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('indeterminate')) {
      this._inputNode.indeterminate = this.indeterminate;
    }
  }

  static get styles() {
    const superCtor = /** @type {typeof LionCheckbox} */ (super.prototype.constructor);
    return [
      superCtor.styles ? superCtor.styles : [],
      css`
        :host .choice-field__nested-checkboxes {
          display: block;
        }

        ::slotted([slot='checkbox']) {
          padding-left: 8px;
        }
      `,
    ];
  }
}
