// eslint-disable-next-line max-classes-per-file
import { LitElement, html, css, SlotMixin, nothing } from '@lion/core';
import { OverlayMixin, withDropdownConfig } from '@lion/overlays';
import { FocusMixin } from '@lion/field';
import { ListboxMixin } from './ListboxMixin.js';

/**
 * Renders the wrapper containing the textbox that triggers the listbox with filtered options.
 * Optionally, shows 'chips' that indicate the selection.
 * Should be considered an internal/protected web component to be used in conjunction with
 * LionCombobox
 *
 * Please note that this is purely a visual component: accessibility and user interaction are
 * handled by LionCombobox.
 */
class LionComboboxTextbox extends FocusMixin(SlotMixin(LitElement)) {
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
    // Why we handle here and not in LionComboboxTextbox:
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
      console.log('ontznab');
      this._textboxNode.value = '';
    }
  }

  __restoreBackspace() {
    this.removeChipOnNextBackspace = false;
  }
}
customElements.define('lion-combobox-textbox', LionComboboxTextbox);

/**
 * LionListbox: implements the wai-aria listbox design pattern and integrates it as a Lion
 * FormControl
 *
 * @customElement lion-select-rich
 * @extends {LitElement}
 */
export class LionCombobox extends OverlayMixin(ListboxMixin(SlotMixin(LitElement))) {
  static get properties() {
    return {
      /**
       * @desc By default, 'list'. When 'both', will automatically autocomplete the input value
       * with the closest match. When 'none', no filter takes place
       * @type {'list'|'both'|'none'}
       */
      autocomplete: String,
      /**
       * @desc When typing in the textbox, will by default be set on 'begin',
       * only matching the beginning part in suggestion list.
       * => 'a' will match 'apple' from ['apple', 'pear', 'citrus'].
       * When set to 'all', will match middle of the word as well
       * => 'a' will match 'apple' and 'pear'
       * @type {'begin'|'all'}
       */
      matchMode: {
        type: String,
        attribute: 'match-mode',
      },
    };
  }

  get slots() {
    return {
      ...super.slots,
      combobox: () => document.createElement('lion-combobox-textbox'),
    };
  }

  /**
   *  Wrapper with combobox role for the text inputthat the end user controls the listbox with.
   */
  get _comboboxNode() {
    return this.querySelector('[slot=combobox]');
  }

  get _comboboxTextboxNode() {
    return this._comboboxNode._textboxNode;
  }

  constructor() {
    super();
    this.autocomplete = 'both';
    this.matchMode = 'all';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    this.__setupCombobox();

    // TODO: after shady outlet fix, add to static get styles
    const style = {
      maxHeight: '200px',
      display: 'block',
      outline: '1px solid',
      overflow: 'hidden',
    };

    Object.assign(this._listboxNode.style, style);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('modelValue')) {
      this.__syncComboboxElement();
    }
  }

  async __setupCombobox() {
    this._comboboxNode.setAttribute('role', 'combobox');
    this._comboboxNode.setAttribute('aria-haspopup', 'listbox');
    this._comboboxNode.setAttribute('aria-expanded', 'false'); // Reuse select-rich invoker logic

    this._comboboxNode.setAttribute('aria-owns', this._listboxNode.id);
    this._comboboxNode.multipleChoice = this.multipleChoice;

    this._comboboxTextboxNode.setAttribute('aria-autocomplete', this.autocomplete);
    this._comboboxTextboxNode.setAttribute('aria-controls', this._listboxNode.id);
    this._comboboxTextboxNode.setAttribute('aria-labelledby', this._labelNode.id);

    this._comboboxTextboxNode.addEventListener('keyup', this.__listboxOnKeyUp);
    this._comboboxTextboxNode.addEventListener('keydown', this.__listboxOnKeyDown);

    this._comboboxTextboxNode.addEventListener('input', ev => {
      this.__cboxInputValue = ev.target.value;
      this.__filterListboxNodeVisibility({
        curValue: this.__cboxInputValue,
        prevValue: this.__prevCboxValueNonSelected,
      });
    });

    setTimeout(() => {
      this.__cboxInputValue = '';
      this.__prevCboxValueNonSelected = '';
      this.__filterListboxNodeVisibility({
        curValue: this.__cboxInputValue,
        prevValue: this.__prevCboxValueNonSelected,
      });
    });
  }

  __listboxOnClick() {
    super.__listboxOnClick();
    this._comboboxTextboxNode.focus();
    this.__blockListShowDuringTransition();
  }

  __setupListboxInteractions(...args) {
    super.__setupListboxInteractions(...args);
    this._listboxNode.removeAttribute('tabindex');
  }

  /**
   * @overridable
   */
  _filterOptionCondition(option, curValue) {
    const idx = option.value.toLowerCase().indexOf(curValue.toLowerCase());
    if (this.matchMode === 'all') {
      return idx > -1; // matches part of word
    }
    return idx === 0; // matches beginning of value
  }

  /* eslint-disable no-param-reassign, class-methods-use-this */

  _onFilterMatch(option, matchingString) {
    const { innerHTML } = option;
    option.__originalInnerHTML = innerHTML;
    option.innerHTML = innerHTML.replace(new RegExp(`(${matchingString})`, 'i'), `<b>$1</b>`);
  }

  _onFilterUnmatch(option) {
    if (option.__originalInnerHTML) {
      option.innerHTML = option.__originalInnerHTML;
    }
  }

  /* eslint-enable no-param-reassign, class-methods-use-this */

  __filterListboxNodeVisibility({ curValue, prevValue }) {
    if (this.autocomplete === 'none') {
      return;
    }

    const visibleOptions = [];
    let hasAutoFilled = false;
    const userAdds = prevValue.length < curValue.length;

    this.formElements.forEach((option, index) => {
      if (option.onFilterUnmatch) {
        option.onFilterUnmatch(option, curValue, prevValue);
      } else {
        this._onFilterUnmatch(option, curValue, prevValue);
      }

      if (!curValue) {
        visibleOptions.push(option);
        return;
      }
      const show = this._filterOptionCondition(option, curValue);
      // eslint-disable-next-line no-param-reassign
      option.style.display = 'none';
      // eslint-disable-next-line no-param-reassign
      option.disabled = true; // makes it compatible with keyboard interaction methods

      if (show) {
        visibleOptions.push(option);
        if (option.onFilterMatch) {
          option.onFilterMatch(option, curValue);
        } else {
          this._onFilterMatch(option, curValue);
        }
      }
      option.removeAttribute('aria-posinset');
      option.removeAttribute('aria-setsize');
      const beginsWith = option.value.toLowerCase().indexOf(curValue.toLowerCase()) === 0;
      if (beginsWith && !hasAutoFilled && show && userAdds) {
        if (this.autocomplete === 'both') {
          this._comboboxTextboxNode.value = option.value;
          this._comboboxTextboxNode.selectionStart = this.__cboxInputValue.length;
          this._comboboxTextboxNode.selectionEnd = this._comboboxTextboxNode.value.length;
        }
        this.activeIndex = index;
        hasAutoFilled = true;
      }
    });

    visibleOptions.forEach((option, idx) => {
      option.setAttribute('aria-posinset', idx + 1);
      option.setAttribute('aria-setsize', visibleOptions.length);
      // eslint-disable-next-line no-param-reassign
      option.style.display = null;
      // eslint-disable-next-line no-param-reassign
      option.disabled = false;
    });
    this.__prevCboxValueNonSelected = curValue.slice(0, this._comboboxTextboxNode.selectionStart);

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

  /**
   * @desc When transitoning from navigating listbox to selecting value via enter (focusing textbox),
   * showing conditions for listbox overlay should be blocked for 1 tick.
   */
  __blockListShowDuringTransition() {
    this.__blockListboxShow = true;
    setTimeout(() => {
      this.__blockListboxShow = false;
    });
  }

  __toggleComboboxDisabled() {
    if (this._comboboxNode) {
      this._comboboxNode.disabled = this.disabled;
      this._comboboxNode.readOnly = this.readOnly;
    }
  }

  render() {
    return html`
      ${this._labelTemplate()} ${this._helpTextTemplate()} ${this._inputGroupTemplate()}
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
        <slot name="combobox"></slot>
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

  // TODO: below could be shared with SelectRich

  firstUpdated(c) {
    super.firstUpdated(c);
    this.__setupOverlay();
    // this.__setupInvokerNode();
    // this._invokerNode.selectedElement = this.formElements[this.checkedIndex];
    // this.__toggleInvokerDisabled();
  }

  __setupOverlay() {
    this.__overlayOnShow = () => {
      if (this.checkedIndex != null) {
        this.activeIndex = this.checkedIndex;
      }
      this._listboxNode.focus();
    };
    this._overlayCtrl.addEventListener('show', this.__overlayOnShow);

    // this.__overlayOnHide = () => {
    //   this._comboboxNode.focus();
    // };
    // this._overlayCtrl.addEventListener('hide', this.__overlayOnHide);

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
      if (ev.key === 'Tab' || this.__blockListboxShow) {
        return;
      }
      this.opened = true;
      // this._overlayCtrl.show();
    };
    this.__hideOverlay = () => {
      // this.opened = false;
    };

    this._overlayInvokerNode.addEventListener('focusin', this.__showOverlay);
    this._overlayInvokerNode.addEventListener('keyup', this.__showOverlay);

    // this._overlayInvokerNode.addEventListener('focusout', this.__hideOverlay);
  }

  /**
   * @override OverlayMixin
   */
  _teardownOpenCloseListeners() {
    super._teardownOpenCloseListeners();
    this._overlayInvokerNode.removeEventListener('focusin', this.__showOverlay);
    // this._overlayInvokerNode.removeEventListener('focusout', this.__hideOverlay);
  }

  __onChildActiveChanged(ev) {
    super.__onChildActiveChanged(ev);
    if (ev.target.active) {
      this._comboboxTextboxNode.setAttribute('aria-activedescendant', ev.target.id);
    }
  }
}
