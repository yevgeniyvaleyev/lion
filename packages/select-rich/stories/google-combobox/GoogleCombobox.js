import { css, html, SlotMixin } from '@lion/core';
import { LionOption } from '@lion/option';
import { LionCombobox } from '../../src/LionCombobox.js';
import { LionComboboxInvoker } from '../../src/LionComboboxInvoker.js';
import { renderLitAsNode } from '@lion/helpers';

const googleSearchIcon = html`
<svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path
    d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z">
  </path>
</svg>
`;

const googleVoiceSearchIcon = html`
<svg class="HPVvwb" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="m12 15c1.66 0 3-1.31 3-2.97v-7.02c0-1.66-1.34-3.01-3-3.01s-3 1.34-3 3.01v7.02c0 1.66 1.34 2.97 3 2.97z"
    fill="#4285f4"></path>
  <path d="m11 18.08h2v3.92h-2z" fill="#34a853"></path>
  <path d="m7.05 16.87c-1.27-1.33-2.05-2.83-2.05-4.87h2c0 1.45 0.56 2.42 1.47 3.38v0.32l-1.15 1.18z" fill="#f4b400">
  </path>
  <path
    d="m12 16.93a4.97 5.25 0 0 1 -3.54 -1.55l-1.41 1.49c1.26 1.34 3.02 2.13 4.95 2.13 3.87 0 6.99-2.92 6.99-7h-1.99c0 2.92-2.24 4.93-5 4.93z"
    fill="#ea4335"></path>
</svg>
`;
export class GoogleOption extends LionOption {
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
customElements.define('google-option', GoogleOption);

export class GoogleComboboxInvoker extends LionComboboxInvoker {

}
customElements.define('google-combobox-invoker', GoogleComboboxInvoker);

export class GoogleCombobox extends LionCombobox {
  static get styles() {
    return [
      super.styles,
      css`

        .input-group__container {
          background: #fff;
          display: flex;
          border: 1px solid #dfe1e5;
          box-shadow: none;
          border-radius: 24px;
          z-index: 3;
          height: 44px;
          margin: 0 auto;
          width: 482px;
        }

        .input-group__prefix {
          display: block;
          height: 20px;
          width: 20px;
          padding: 12px;
          fill: #9AA0A6;
        }

        .input-group__input {
          flex: 1;
        }

        .input-group__input ::slotted("slot=textbox") {
          border: transparent;
          width: 100%;
        }
      `,
    ];
  }

  get slots() {
    return {
      ...super.slots,
      prefix: () => renderLitAsNode(html`
        <span style="height:16px">${googleSearchIcon}</span>
      `),
      suffix: () => renderLitAsNode(html`
        <button data-label>${googleVoiceSearchIcon}</button>
      `),
    }
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
}
customElements.define('google-combobox', GoogleCombobox);
