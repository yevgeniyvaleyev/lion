import { html } from '@lion/core';
import { OverlayMixin, withDropdownConfig } from '@lion/overlays';
import '../lion-select-invoker.js';
import './differentKeyNamesShimIE.js';
import { LionListbox } from './LionListbox.js';

/**
 * LionSelectRich: wraps the <lion-listbox> element
 *
 * @customElement lion-select-rich
 * @extends {LitElement}
 */
export class LionSelectRich extends OverlayMixin(LionListbox) {
  get slots() {
    return {
      ...super.slots,
      invoker: () => document.createElement('lion-select-invoker'),
    };
  }

  get _inputNode() {
    // In FormControl, we get direct child [slot="input"]. This doesn't work, because the overlay
    // system wraps it in [slot="_overlay-shadow-outlet"]
    // TODO: find a way to solve this by putting the wrapping part in shadow dom...
    return this.querySelector('[slot="input"]');
  }

  get _invokerNode() {
    return Array.from(this.children).find(child => child.slot === 'invoker');
  }

  get _listboxNode() {
    return (
      (this._overlayCtrl && this._overlayCtrl.contentNode) ||
      Array.from(this.children).find(child => child.slot === 'input')
    );
  }

  get _scrollTargetNode() {
    return this._overlayContentNode._scrollTargetNode || this._overlayContentNode;
  }

  constructor() {
    super();
    this.__onKeyUp = this.__onKeyUp.bind(this);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
    // this.__teardownEventListeners();
    this.__teardownOverlay();
    this.__teardownInvokerNode();
    // this.__teardownListboxNode();
  }

  firstUpdated(c) {
    super.firstUpdated(c);
    this.__setupOverlay();
    this.__setupInvokerNode();
    this._invokerNode.selectedElement = this.formElements[this.checkedIndex];
    this.__toggleInvokerDisabled();
  }

  updated(changedProps) {
    super.updated(changedProps);

    if (changedProps.has('disabled')) {
      if (this.disabled) {
        this._invokerNode.makeRequestToBeDisabled();
      } else {
        this._invokerNode.retractRequestToBeDisabled();
      }
    }

    if (this._inputNode && this._invokerNode) {
      if (changedProps.has('_ariaLabelledNodes')) {
        this._invokerNode.setAttribute(
          'aria-labelledby',
          `${this._inputNode.getAttribute('aria-labelledby')} ${this._invokerNode.id}`,
        );
      }

      if (changedProps.has('_ariaDescribedNodes')) {
        this._invokerNode.setAttribute(
          'aria-describedby',
          this._inputNode.getAttribute('aria-describedby'),
        );
      }

      if (changedProps.has('showsFeedbackFor')) {
        // The ValidateMixin sets aria-invalid on the inputNode, but in this component we also need it on the invoker
        this._invokerNode.setAttribute('aria-invalid', this._hasFeedbackVisibleFor('error'));
      }
    }
  }

  _requestUpdate(name, oldValue) {
    super._requestUpdate(name, oldValue);
    if (name === 'disabled' || name === 'readOnly') {
      this.__toggleInvokerDisabled();
    }
    if (name === 'modelValue') {
      this.__syncInvokerElement();
    }
  }

  _groupTwoTemplate() {
    return html`
      ${this._inputGroupTemplate()}
      ${this._feedbackTemplate()}
      <slot name="_overlay-shadow-outlet"></slot>
    `;
  }

  /**
   * @override
   */
  // eslint-disable-next-line
  _inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        <slot name="invoker"></slot>
        <div role="dialog">
          <slot name="input"></slot>
        </div>
        <slot id="options-outlet"></slot>
      </div>
    `;
  }

  __setupEventListeners() {
    super.__setupEventListeners();
    this.addEventListener('keyup', this.__onKeyUp);
  }

  __teardownEventListeners() {
    super.__teardownEventListeners();
    this.removeEventListener('keyup', this.__onKeyUp);
  }

  __toggleInvokerDisabled() {
    if (this._invokerNode) {
      this._invokerNode.disabled = this.disabled;
      this._invokerNode.readOnly = this.readOnly;
    }
  }

  __syncInvokerElement() {
    // sync to invoker
    if (this._invokerNode) {
      this._invokerNode.selectedElement = this.formElements[this.checkedIndex];
    }
  }

  __onKeyUp(ev) {
    // if (this.disabled || this.opened) {
    //   return;
    // }

    // const { key } = ev;
    // switch (key) {
    //   case 'ArrowUp':
    //     // ev.preventDefault();
    //     if (this.interactionMode === 'mac') {
    //       this.opened = true;
    //     } else {
    //       this._handleCheckedIndex(this.__getPreviousEnabledOption(this.checkedIndex));
    //     }
    //     break;
    //   case 'ArrowDown':
    //     // ev.preventDefault();
    //     if (this.interactionMode === 'mac') {
    //       this.opened = true;
    //     } else {
    //       this._handleCheckedIndex(this.__getNextEnabledOption(this.checkedIndex));
    //     }
    //     break;
    //   /* no default */
    // }
  }

  _focusInputOnLabelClick() {
    this._labelNode.addEventListener('click', () => {
      this._invokerNode.focus();
    });
  }

  __setupInvokerNode() {
    this._invokerNode.id = `invoker-${this._inputId}`;
    this._invokerNode.setAttribute('aria-haspopup', 'listbox');

    this.__setupInvokerNodeEventListener();
  }

  __setupInvokerNodeEventListener() {
    this.__invokerOnClick = () => {
      if (!this.disabled && !this.readOnly && !this.__blockListShow) {
        this._overlayCtrl.toggle();
      }
    };
    this._invokerNode.addEventListener('click', this.__invokerOnClick);

    this.__invokerOnBlur = () => {
      this.dispatchEvent(new Event('blur'));
    };
    this._invokerNode.addEventListener('blur', this.__invokerOnBlur);
  }

  __teardownInvokerNode() {
    this._invokerNode.removeEventListener('click', this.__invokerOnClick);
    this._invokerNode.removeEventListener('blur', this.__invokerOnBlur);
  }

  // eslint-disable-next-line class-methods-use-this
  _defineOverlayConfig() {
    return withDropdownConfig();
  }

  __setupOverlay() {
    this.__overlayOnShow = () => {
      if (this.checkedIndex != null) {
        this.activeIndex = this.checkedIndex;
      }
      this._listboxNode.focus();
    };
    this._overlayCtrl.addEventListener('show', this.__overlayOnShow);

    this.__overlayOnHide = () => {
      this._invokerNode.focus();
    };
    this._overlayCtrl.addEventListener('hide', this.__overlayOnHide);

    this.__preventScrollingWithArrowKeys = this.__preventScrollingWithArrowKeys.bind(this);
    this._scrollTargetNode.addEventListener('keydown', this.__preventScrollingWithArrowKeys);
  }

  __teardownOverlay() {
    this._overlayCtrl.removeEventListener('show', this.__overlayOnShow);
    this._overlayCtrl.removeEventListener('hide', this.__overlayOnHide);
    this._scrollTargetNode.removeEventListener('keydown', this.__preventScrollingWithArrowKeys);
  }

  /**
   * @override Configures OverlayMixin
   */
  get _overlayInvokerNode() {
    return this._invokerNode;
  }

  /**
   * @override Configures OverlayMixin
   */
  get _overlayContentNode() {
    return this._listboxNode;
  }

  /**
   * @override adds to ListboxMixin > FormRegistrarMixin
   * @param {Element} child
   * @param {Number} indexToInsertAt
   */
  addFormElement(child, indexToInsertAt) {
    super.addFormElement(child, indexToInsertAt);
    /* eslint-disable no-param-reassign */

    // the first elements checked by default
    if (!this.__hasInitialSelectedFormElement && (!child.disabled || this.disabled)) {
      child.active = true;
      child.checked = true;
      this.__hasInitialSelectedFormElement = true;
    }
  }
}
