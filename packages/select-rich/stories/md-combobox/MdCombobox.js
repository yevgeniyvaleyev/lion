import { css, html } from '@lion/core';
import { LionOption } from '@lion/option';
import { LionCombobox } from '../../src/LionCombobox.js';
import { LionComboboxInvoker } from '../../src/LionComboboxInvoker.js';
import { MdFieldMixin } from './MdFieldMixin.js';
import './style/md-ripple.js';
import './style/load-roboto.js';

// TODO: insert ink wc here
export class MdOption extends LionOption {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          position: relative;
          padding: 8px;
        }

        :host([focused]) {
          background: lightgray;
        }

        :host([active]) {
          color: #1867c0 !important;
          caret-color: #1867c0 !important;
        }

        :host ::slotted(.md-highlight) {
          color: rgba(0,0,0,.38);
          background: #eee;
        }
      `,
    ];
  }

  /**
   * @override
   * @param {string} matchingString
   */
  onFilterMatch(matchingString) {
    const { innerHTML } = this;
    this.__originalInnerHTML = innerHTML;
    this.innerHTML = innerHTML.replace(new RegExp(`(${matchingString})`, 'i'), `<span class="md-highlight">$1</span>`);
  }

  /**
   * @override
   */
  onFilterUnmatch() {
    if (this.__originalInnerHTML) {
      this.innerHTML = this.__originalInnerHTML;
    }
  }

  render() {
    return html`
      ${super.render()}
      <md-ripple></md-ripple>
    `;
  }
}
customElements.define('md-option', MdOption);

export class MdComboboxInvoker extends LionComboboxInvoker {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          flex: 1;
        }
      `,
    ];
  }
}
customElements.define('md-combobox-invoker', MdComboboxInvoker);

export class MdCombobox extends MdFieldMixin(LionCombobox) {
  // get slots() {
  //   return {
  //     ...super.slots,
  //     'combobox': () => document.createElement('md-combobox-invoker'),
  //   };
  // }

  static get styles() {
    return [
      super.styles,
      css`


      `,
    ];
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    // TODO: via static get styles once aligned with master (=> shadow outlet)
    const style = {
      boxShadow: '0 4px 6px 0 rgba(32,33,36,.28)',
      paddingTop: '8px',
      paddingBottom: '8px',
      top: '2px',
    };

    Object.assign(this._listboxNode.style, style);
  }

  _inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        ${this._labelTemplate()}
        <div class="combobox__input" data-ref="combobox">
          <slot name="_textbox"></slot>
        </div>
        <slot name="input"></slot>
        <slot id="options-outlet"></slot>
      </div>
    `;
  }
}
customElements.define('md-combobox', MdCombobox);
