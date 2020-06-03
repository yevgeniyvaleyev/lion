// eslint-disable-next-line max-classes-per-file
import { html, css } from '@lion/core';
import { OverlayMixin, withDropdownConfig } from '@lion/overlays';
import { FocusMixin } from '@lion/field';
import { LionListbox } from './LionListbox.js';
import '../lion-combobox-invoker.js';

/**
 * LionCombobox: implements the wai-aria combobox design pattern and integrates it as a Lion
 * FormControl
 *
 * @customElement lion-combobox
 * @extends {LitElement}
 */
export class LionCombobox extends OverlayMixin(FocusMixin(LionListbox)) {
  static get properties() {
    return {
      autocomplete: String,
      matchMode: {
        type: String,
        attribute: 'match-mode',
      },
    };
  }

  static get styles() {
    // TODO: share input-group css?
    return [
      super.styles,
      css`
      /* ::slotted([slot='_textbox']) {
        outline: none;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: none;
        border-bottom: 1px solid;
      } */
        .combobox__input {
          display: flex;
          flex: 1;
        }
    `];
  }

  get slots() {
    return {
      ...super.slots,
      _textbox: () => document.createElement('input'),
      // combobox: () => document.createElement('lion-combobox-invoker'),
    };
  }

  /**
   * Wrapper with combobox role for the text inputthat the end user controls the listbox with.
   */
  get _comboboxNode() {
    return this.shadowRoot.querySelector('[data-ref="combobox"]');
  }

  get _comboboxTextNode() {
    return this.querySelector('[slot=_textbox]');
    // return this._comboboxNode._textboxNode;
  }

  /**
   * @override FormControlMixin
   * Will tell FormControlMixin that a11y wrt labels / descriptions / feedback
   * should be applied here.
   */
  get _inputNode() {
    return this._comboboxTextNode;
  }

  constructor() {
    super();
    /**
     * @desc When "list", will filter listbox suggestions based on textbox value.
     * When "both", an inline completion string will be added to the textbox as well.
     * @type {'list'|'both'|'none'}
     */
    this.autocomplete = 'both';
    /**
     * @desc When typing in the textbox, will by default be set on 'begin',
     * only matching the beginning part in suggestion list.
     * => 'a' will match 'apple' from ['apple', 'pear', 'citrus'].
     * When set to 'all', will match middle of the word as well
     * => 'a' will match 'apple' and 'pear'
     * @type {'begin'|'all'}
     */
    this.matchMode = 'all';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    // TODO: after shady outlet fix, add to static get styles
    const style = {
      maxHeight: '200px',
      display: 'block',
      // outline: '1px solid',
      overflow: 'hidden',
    };

    Object.assign(this._listboxNode.style, style);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('modelValue')) {
      this.__syncComboboxElement();
    }
    if (changedProperties.has('autocomplete')) {
      this._comboboxTextNode.setAttribute('aria-autocomplete', this.autocomplete);
    }
  }

  async __setupCombobox() {
    this._comboboxNode.setAttribute('role', 'combobox');
    this._comboboxNode.setAttribute('aria-haspopup', 'listbox');
    this._comboboxNode.setAttribute('aria-expanded', 'false'); // Reuse select-rich invoker logic

    this._comboboxNode.setAttribute('aria-owns', this._listboxNode.id);
    this._comboboxNode.multipleChoice = this.multipleChoice;

    this._comboboxTextNode.setAttribute('aria-autocomplete', this.autocomplete);
    this._comboboxTextNode.setAttribute('aria-controls', this._listboxNode.id);
    this._comboboxTextNode.setAttribute('aria-labelledby', this._labelNode.id);

    this._comboboxTextNode.addEventListener('keyup', this.__listboxOnKeyUp);
    this._comboboxTextNode.addEventListener('keydown', this.__listboxOnKeyDown);

    this._comboboxTextNode.addEventListener('input', ev => {
      this.__cboxInputValue = ev.target.value;
      this.__handleAutocompletion({
        curValue: this.__cboxInputValue,
        prevValue: this.__prevCboxValueNonSelected,
      });
    });

    // setTimeout(() => {
    //   this.__cboxInputValue = '';
    //   this.__prevCboxValueNonSelected = '';
    //   this.__handleAutocompletion({
    //     curValue: this.__cboxInputValue,
    //     prevValue: this.__prevCboxValueNonSelected,
    //   });
    // });
  }

  __listboxOnClick() {
    super.__listboxOnClick();
    this._comboboxTextNode.focus();
    this.__blockListShowDuringTransition();
  }

  __setupListboxInteractions(...args) {
    super.__setupListboxInteractions(...args);
    this._listboxNode.removeAttribute('tabindex');
  }

  /**
   * @overridable
   * @param {LionOption} option
   * @param {string} curValue current ._comboboxTextNode value
   */
  filterOptionCondition(option, curValue) {
    const idx = option.value.toLowerCase().indexOf(curValue.toLowerCase());
    if (this.matchMode === 'all') {
      return idx > -1; // matches part of word
    }
    return idx === 0; // matches beginning of value
  }

  /* eslint-disable no-param-reassign, class-methods-use-this */

  /**
   * @overridable
   * @param {LionOption} option
   * @param {string} matchingString
   */
  _onFilterMatch(option, matchingString) {
    const { innerHTML } = option;
    option.__originalInnerHTML = innerHTML;
    option.innerHTML = innerHTML.replace(new RegExp(`(${matchingString})`, 'i'), `<b>$1</b>`);
  }

  /**
   * @overridable
   * @param {LionOption} option
   */
  _onFilterUnmatch(option) {
    if (option.__originalInnerHTML) {
      option.innerHTML = option.__originalInnerHTML;
    }
  }

  /* eslint-enable no-param-reassign, class-methods-use-this */

  /**
   * @desc Matches visibility of listbox options against current ._comboboxTextNode contents
   * @param {object} config
   * @param {string} config.curValue current ._comboboxTextNode value
   * @param {string} config.prevValue previous ._comboboxTextNode value
   */
  __handleAutocompletion({ curValue, prevValue }) {
    if (this.autocomplete === 'none') {
      return;
    }

    const /** @type {LionOption[]} */ visibleOptions = [];
    let hasAutoFilled = false;
    const userIsAddingChars = prevValue.length < curValue.length;

    this.formElements.forEach((option, index) => {
      // [1]. Cleanup previous matching states
      if (option.onFilterUnmatch) {
        option.onFilterUnmatch(curValue, prevValue);
      } else {
        this._onFilterUnmatch(option, curValue, prevValue);
      }

      // [2]. If ._comboboxTextNode is empty, no filtering will be applied
      if (!curValue) {
        visibleOptions.push(option);
        return;
      }

      // [3]. Cleanup previous visibility and a11y states
      /* eslint-disable no-param-reassign */
      option.style.display = 'none';
      option.disabled = true; // makes it compatible with keyboard interaction methods
      option.removeAttribute('aria-posinset');
      option.removeAttribute('aria-setsize');
      /* eslint-enable no-param-reassign */

      // [4]. Add options that meet matching criteria
      const show = this.filterOptionCondition(option, curValue);
      if (show) {
        visibleOptions.push(option);
        if (option.onFilterMatch) {
          option.onFilterMatch(curValue);
        } else {
          this._onFilterMatch(option, curValue);
        }
      }

      // [5]. Synchronize ._comboboxTextNode value and active descendant with closest match
      const beginsWith = option.value.toLowerCase().indexOf(curValue.toLowerCase()) === 0;
      if (beginsWith && !hasAutoFilled && show && userIsAddingChars) {
        if (this.autocomplete === 'both') {
          this._comboboxTextNode.value = option.value;
          this._comboboxTextNode.selectionStart = this.__cboxInputValue.length;
          this._comboboxTextNode.selectionEnd = this._comboboxTextNode.value.length;
        }
        this.activeIndex = index;
        hasAutoFilled = true;
      }
    });

    // [6]. enable a11y, visibility and user interaction for visible options
    visibleOptions.forEach((option, idx) => {
      /* eslint-disable no-param-reassign */
      option.setAttribute('aria-posinset', idx + 1);
      option.setAttribute('aria-setsize', visibleOptions.length);
      option.style.display = null;
      option.disabled = false;
      /* eslint-enable no-param-reassign */
    });
    this.__prevCboxValueNonSelected = curValue.slice(0, this._comboboxTextNode.selectionStart);

    if (this._overlayCtrl && this._overlayCtrl._popper) {
      this._overlayCtrl._popper.update();
    }
  }

  _requestUpdate(name, oldValue) {
    super._requestUpdate(name, oldValue);
    if (name === 'disabled' || name === 'readOnly') {
      this.__toggleComboboxDisabled();
    }
    if (name === 'modelValue') {
      this.__blockListShowDuringTransition();
    }
  }

  __toggleComboboxDisabled() {
    if (this._comboboxNode) {
      this._comboboxNode.setAttribute('disabled', this.disabled);
      this._comboboxNode.setAttribute('readonly', this.readOnly);
    }
  }

  _groupTwoTemplate() {
    return html`
      ${this._helpTextTemplate()} ${this._inputGroupTemplate()}
      ${this._feedbackTemplate()}
      <slot name="_overlay-shadow-outlet"></slot>
    `;
  }

  /**
   * @override FormControlMixin
   */
  // eslint-disable-next-line
  _inputGroupInputTemplate() {
    return html`
      <div class="input-group__input">
        <div class="combobox__input" data-ref="combobox">
          <slot name="_textbox"></slot>
        </div>
        <slot name="input"></slot>
        <slot id="options-outlet"></slot>
      </div>
    `;
  }

  /**
   * @override OverlayMixin
   */
  // eslint-disable-next-line class-methods-use-this
  _defineOverlayConfig() {
    return {
      ...withDropdownConfig(),
      elementToFocusAfterHide: null,
    };
  }

  __syncComboboxElement() {
    // sync to invoker
    if (this._comboboxNode) {
      if (!this.multipleChoice && this.checkedIndex !== -1) {
        this._comboboxNode.selectedElements = [this.formElements[this.checkedIndex]];
      } else {
        this._comboboxNode.selectedElements = this._getCheckedElements();
      }
    }
  }

  // TODO: all invoker logic could be shared with SelectRich?
  firstUpdated(c) {
    super.firstUpdated(c);
    this.__initFilterListbox();
    this.__setupOverlay();
    this.__setupCombobox();
  }

  __initFilterListbox() {
    this.__cboxInputValue = '';
    this.__prevCboxValueNonSelected = '';
    this.__handleAutocompletion({
      curValue: this.__cboxInputValue,
      prevValue: this.__prevCboxValueNonSelected,
    });
  }

  __setupOverlay() {
    this.__overlayOnShow = () => {
      if (this.checkedIndex != null) {
        this.activeIndex = this.checkedIndex;
      }
      this._listboxNode.focus();
    };
    this._overlayCtrl.addEventListener('show', this.__overlayOnShow);
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
    return this._comboboxNode;
  }

  /**
   * @override Configures OverlayMixin
   */
  get _overlayContentNode() {
    return this._listboxNode;
  }

  get _listboxNode() {
    return (
      (this._overlayCtrl && this._overlayCtrl.contentNode) ||
      Array.from(this.children).find(child => child.slot === 'input')
    );
  }

  /**
   * @override OverlayMixin
   */
  _setupOpenCloseListeners() {
    super._setupOpenCloseListeners();
    this.__showOverlay = ev => {
      if (ev.key === 'Tab' || this.__blockListShow) {
        return;
      }
      this.opened = true;
    };
    this._overlayInvokerNode.addEventListener('focusin', this.__showOverlay);
    this._overlayInvokerNode.addEventListener('keyup', this.__showOverlay);
  }

  /**
   * @override OverlayMixin
   */
  _teardownOpenCloseListeners() {
    super._teardownOpenCloseListeners();
    this._overlayInvokerNode.removeEventListener('focusin', this.__showOverlay);
    this._overlayInvokerNode.removeEventListener('keyup', this.__showOverlay);
  }

  __onChildActiveChanged(ev) {
    super.__onChildActiveChanged(ev);
    if (ev.target.active) {
      this._comboboxTextNode.setAttribute('aria-activedescendant', ev.target.id);
    }
  }

  __listboxOnKeyDown(ev) {
    super.__listboxOnKeyDown(ev);
    const { key } = ev;
    switch (key) {
      case 'Escape':
        this._comboboxTextNode.value = '';
        break;
      case ' ':
      case 'Enter':
        this.__syncCheckedWithTextbox(); // TODO: also on click when el is registered
      /* no default */
    }
  }

  __syncCheckedWithTextbox() {
    if (!this.multipleChoice) {
      this._comboboxTextNode.value = this._listboxNode.children[this.activeIndex].value;
    }
  }

}
