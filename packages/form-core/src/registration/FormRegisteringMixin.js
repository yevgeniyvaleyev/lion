import { dedupeMixin } from '@lion/core';

/**
 * #FormRegisteringMixin:
 *
 * This Mixin registers a form element to a Registrar
 *
 * @polymerMixin
 * @mixinFunction
 */
export const FormRegisteringMixin = dedupeMixin(
  superclass =>
    // eslint-disable-next-line no-shadow, no-unused-vars
    class FormRegisteringMixin extends superclass {
      constructor() {
        super();
        this.__boundDispatchRegistration = this._dispatchRegistration.bind(this);
        this.__dispatcher = this;
      }

      connectedCallback() {
        if (super.connectedCallback) {
          super.connectedCallback();
        }

        this._dispatchRegistration();
      }

      disconnectedCallback() {
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
        this._unregisterFormElement();
      }

      _dispatchRegistration() {
        let commentNode;
        if (window.ShadyDOM) {
          commentNode = document.createComment(' Form Registration Dispatcher for IE11 ');
          const { appendChild } = window.ShadyDOM.nativeMethods;
          appendChild.call(this.parentNode, commentNode);
          this.__dispatcher = commentNode;
        }

        this.__dispatcher.dispatchEvent(
          new CustomEvent('form-element-register', {
            detail: { element: this },
            bubbles: true,
          }),
        );

        if (window.ShadyDOM) {
          const { removeChild } = window.ShadyDOM.nativeMethods;
          removeChild.call(commentNode.parentNode, commentNode);
          this.__dispatcher = this;
        }
      }

      _unregisterFormElement() {
        if (this.__parentFormGroup) {
          this.__parentFormGroup.removeFormElement(this);
        }
      }
    },
);
