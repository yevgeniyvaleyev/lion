import { LionFieldset } from '@lion/fieldset';

const throwFormNodeError = () => {
  throw new Error(
    'No form node found. Did you put a <form> element inside your custom-form element?',
  );
};

/**
 * LionForm: form wrapper providing extra features and integration with lion-field elements.
 *
 * @customElement lion-form
 */
// eslint-disable-next-line no-unused-vars
export class LionForm extends LionFieldset {
  constructor() {
    super();
    this._submit = this._submit.bind(this);
    this._reset = this._reset.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.__registerEventsForLionForm();

    // @override LionFieldset: makes sure a11y is handled by ._formNode
    this.removeAttribute('role');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.__teardownEventsForLionForm();
  }

  get _formNode() {
    return /** @type {HTMLFormElement} */ (this.querySelector('form'));
  }

  submit() {
    if (this._formNode) {
      // Firefox requires cancelable flag, otherwise we cannot preventDefault
      // Firefox still runs default handlers for untrusted events :\
      this._formNode.dispatchEvent(new Event('submit', { cancelable: true }));
    } else {
      throwFormNodeError();
    }
  }

  /**
   * @param {Event} ev
   */
  _submit(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.submitGroup();
    this.dispatchEvent(new Event('submit', { bubbles: true }));
  }

  reset() {
    if (this._formNode) {
      this._formNode.reset();
    } else {
      throwFormNodeError();
    }
  }

  /**
   * @param {Event} ev
   */
  _reset(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    this.resetGroup();
    this.dispatchEvent(new Event('reset', { bubbles: true }));
  }

  __registerEventsForLionForm() {
    this._formNode.addEventListener('submit', this._submit);
    this._formNode.addEventListener('reset', this._reset);
  }

  __teardownEventsForLionForm() {
    this._formNode.removeEventListener('submit', this._submit);
    this._formNode.removeEventListener('reset', this._reset);
  }
}
