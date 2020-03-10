// eslint-disable-next-line max-classes-per-file
import { LitElement, html, css, SlotMixin, nothing } from '@lion/core';
import { FocusMixin } from '@lion/field';

/**
 * Renders the wrapper containing the textbox that triggers the listbox with filtered options.
 * Optionally, shows 'chips' that indicate the selection.
 * Should be considered an internal/protected web component to be used in conjunction with
 * LionCombobox
 *
 * Please note that this is purely a visual component: accessibility and user interaction are
 * handled by LionCombobox.
 */
export class LionComboboxInvoker extends FocusMixin(SlotMixin(LitElement)) {
  static get properties() {
    return {
      multipleChoice: {
        type: Boolean,
        attribute: 'multiple-choice',
      },
      /**
       * @desc Array of options. Needed to render
       * chips and currntly selected value
       * @type {LionOption[]}
       */
      selectedElements: Array,
      disabled: {
        type: Boolean,
        reflect: true,
      },
      /**
       * @desc When the connected LionSelectRich insteance is readOnly,
       * this should be reflected in the invoker as well
       */
      readOnly: {
        type: Boolean,
        reflect: true,
        attribute: 'readonly',
      },
      /**
       * Can be used to visually indicate the next
       */
      removeChipOnNextBackspace: Boolean,
    };
  }

  static get styles() {
    // TODO: share input-group css?
    return css`
      :host {
        display: flex;
      }

      .combobox__selection {
        flex: none;
      }

      .combobox__input {
        flex: 1;
      }

      .selection-chip {
        border-radius: 4px;
        background-color: #eee;
        padding: 4px;
        font-size: 10px;
      }

      .selection-chip--highlighted {
        background-color: #ccc;
      }

      ::slotted([slot='_textbox']) {
        outline: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: none;
        border-bottom: 1px solid;
      }
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  get slots() {
    return {
      _textbox: () => document.createElement('input'),
    };
  }

  get _textboxNode() {
    return this.querySelector('[slot=_textbox]');
  }

  /**
   * @configure FocusMixin
   */
  get _inputNode() {
    return this._textboxNode;
  }

  constructor() {
    super();
    this.selectedElements = [];
    this.multipleChoice = false;

    this.__textboxOnKeyup = this.__textboxOnKeyup.bind(this);
    this.__restoreBackspace = this.__restoreBackspace.bind(this);
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    if (this.multipleChoice) {
      this._textboxNode.addEventListener('keyup', this.__textboxOnKeyup);
      this._textboxNode.addEventListener('focusout', this.__restoreBackspace);
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('selectedElements')) {
      if (this.multipleChoice || !this.selectedElements.length) {
        this._textboxNode.value = '';
      } else {
        this._textboxNode.value = this.selectedElements[0].value;
      }
      if (this.multipleChoice) {
        this.__reorderChips();
      }
    }
  }

  /**
   * Whenever selectedElements are updated, makes sure that latest added elements
   * are shown latest, and deleted elements respect existing order of chips.
   */
  __reorderChips() {
    const { selectedElements } = this;
    if (this.__prevSelectedEls) {
      const addedEls = selectedElements.filter(e => !this.__prevSelectedEls.includes(e));
      const deletedEls = this.__prevSelectedEls.filter(e => !selectedElements.includes(e));
      if (addedEls.length) {
        this.selectedElements = [...this.__prevSelectedEls, ...addedEls];
      } else if (deletedEls.length) {
        deletedEls.forEach(delEl => {
          this.__prevSelectedEls.splice(this.__prevSelectedEls.indexOf(delEl), 1);
        });
        this.selectedElements = this.__prevSelectedEls;
      }
    }
    this.__prevSelectedEls = this.selectedElements;
  }

  // eslint-disable-next-line class-methods-use-this
  _selectedElementTemplate(option, highlight) {
    return html`
      <span class="selection-chip ${highlight ? 'selection-chip--highlighted' : ''}">
        ${option.value}
      </span>
    `;
  }

  _selectedElementsTemplate() {
    if (!this.multipleChoice) {
      return nothing;
    }
    return html`
      <div class="combobox__selection">
        ${this.selectedElements.map((option, i) => {
          const highlight =
            this.removeChipOnNextBackspace && i === this.selectedElements.length - 1;
          return this._selectedElementTemplate(option, highlight);
        })}
      </div>
    `;
  }

  render() {
    return html`
      ${this._selectedElementsTemplate()}
      <div class="combobox__input">
        <slot name="_textbox"></slot>
      </div>
    `;
  }

  __textboxOnKeyup(ev) {
    // Why we handle here and not in LionComboboxInvoker:
    // All selectedElements state truth should be kept here and should not go back
    // and forth.
    if (ev.key === 'Backspace') {
      if (!this._textboxNode.value) {
        if (this.removeChipOnNextBackspace) {
          this.selectedElements[this.selectedElements.length - 1].checked = false;
        }
        this.removeChipOnNextBackspace = true;
      }
    } else {
      this.removeChipOnNextBackspace = false;
    }

    // TODO: move to LionCombobox
    if (ev.key === 'Escape') {
      this._textboxNode.value = '';
    }
  }

  __restoreBackspace() {
    this.removeChipOnNextBackspace = false;
  }
}
