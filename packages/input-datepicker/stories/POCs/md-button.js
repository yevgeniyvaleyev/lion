import { html, css } from '@lion/core';
import { LionButton } from '@lion/button';

customElements.define(
  'md-button',
  class extends LionButton {
    static get styles() {
      return [
        // ...super.styles,
        css`
          .c-button,
          :host {
            font-family: Roboto, sans-serif;
            -moz-osx-font-smoothing: grayscale;
            -webkit-font-smoothing: antialiased;
            font-size: 0.875rem;
            line-height: 2.25rem;
            font-weight: 500;
            letter-spacing: 0.0892857143em;
            text-decoration: none;
            text-transform: uppercase;

            border: transparent;
            border-radius: 0;
            background: none;

            color: var(--color-primary, royalblue);
            position: relative;
            padding: 16px;

            display: inline-block;
            padding-top: 2px;
            padding-bottom: 2px;
            height: 40px; /* src = https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/ */
            outline: 0;
            background-color: transparent;
            box-sizing: border-box;
          }

          .c-button__container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            position: relative;
          }

          :host(:focus) {
            outline: none;
          }

          :host(:focus),
          :host(:hover) {
            background-color: rgba(33, 150, 243, 0.08);
            color: var(--color-primary, royalblue);
          }

          :host(:focus) {
            outline: none;
            border-color: transparent;
            box-shadow: none;
          }

          :host([disabled]) {
            pointer-events: none;
          }

          :host(:active) {
            background-color: rgba(33, 150, 243, 0.16);
          }

          .c-button__click-area {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            margin: -3px -1px;
            padding: 0;
          }

          :host ::slotted(button) {
            position: absolute;
            visibility: hidden;
          }
        `,
      ];
    }

    __clickDelegationHandler() {
      this._nativeButtonNode.click();
    }

    render() {
      return html`
        <div class="c-button__container">
          <slot></slot>
          <slot name="_button"></slot>
          <div class="c-button__click-area" @click="${this.__clickDelegationHandler}"></div>
        </div>
        <md-ripple></md-ripple>
      `;
    }
  },
);
