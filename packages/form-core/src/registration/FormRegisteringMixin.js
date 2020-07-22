import { dedupeMixin } from '@lion/core';

function findClosestShadowRoot(startEl) {
  let el = startEl;
  do {
    el = el.parentNode;
  } while (el && !el.shadowRoot);
  return el;
}

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
        this.dispatchEvent(
          new CustomEvent('form-element-register', {
            detail: { element: this },
            bubbles: true,
          }),
        );

        if (window.ShadyDOM) {
          const commentNode = document.createComment(' Form Registration Dispatcher for IE11 ');
          const { appendChild } = window.ShadyDOM.nativeMethods;
          const parentShadowRoot = findClosestShadowRoot(this);
          if (parentShadowRoot) {
            appendChild.call(parentShadowRoot, commentNode);
          } else {
            appendChild.call(this.parentNode, commentNode);
          }
          commentNode.dispatchEvent(
            new CustomEvent('form-element-register', {
              detail: { element: this },
              bubbles: true,
            }),
          );
        }
      }

      _unregisterFormElement() {
        if (this.__parentFormGroup) {
          this.__parentFormGroup.removeFormElement(this);
        }
      }
    },
);
