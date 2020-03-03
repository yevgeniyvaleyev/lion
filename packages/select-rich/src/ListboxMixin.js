import { ChoiceGroupMixin } from '@lion/choice-input';
import { css, dedupeMixin } from '@lion/core';
import { FormControlMixin, FormRegistrarMixin, InteractionStateMixin } from '@lion/field';
import { ValidateMixin } from '@lion/validate';
import './differentKeyNamesShimIE.js';

function uuid() {
  return Math.random()
    .toString(36)
    .substr(2, 10);
}

function detectInteractionMode() {
  if (navigator.appVersion.indexOf('Mac') !== -1) {
    return 'mac';
  }
  return 'windows/linux';
}

function isInView(container, element, partial = false) {
  const cTop = container.scrollTop;
  const cBottom = cTop + container.clientHeight;
  const eTop = element.offsetTop;
  const eBottom = eTop + element.clientHeight;
  const isTotal = eTop >= cTop && eBottom <= cBottom;
  let isPartial;

  if (partial === true) {
    isPartial = (eTop < cTop && eBottom > cTop) || (eBottom > cBottom && eTop < cBottom);
  } else if (typeof partial === 'number') {
    if (eTop < cTop && eBottom > cTop) {
      isPartial = ((eBottom - cTop) * 100) / element.clientHeight > partial;
    } else if (eBottom > cBottom && eTop < cBottom) {
      isPartial = ((cBottom - eTop) * 100) / element.clientHeight > partial;
    }
  }
  return isTotal || isPartial;
}

export const ListboxMixin = dedupeMixin(
  superclass =>
    // eslint-disable-next-line no-shadow, no-unused-vars
    class ListboxMixin extends ChoiceGroupMixin(
      FormRegistrarMixin(InteractionStateMixin(ValidateMixin(FormControlMixin(superclass)))),
    ) {
      static get properties() {
        return {
          disabled: {
            type: Boolean,
            reflect: true,
          },

          readOnly: {
            type: Boolean,
            reflect: true,
            attribute: 'readonly',
          },

          interactionMode: {
            type: String,
            attribute: 'interaction-mode',
          },

          checkedIndex: Boolean,
          activeIndex: Boolean,
        };
      }

      static get styles() {
        return [
          css`
            :host {
              display: block;
            }

            :host([disabled]) {
              color: #adadad;
            }
          `,
        ];
      }

      get _listboxNode() {
        return this._inputNode;
      }

      // get _inputNode() {
      //   return this.querySelector('[slot=input]');
      // }

      get _listboxActiveDescendantNode() {
        return this._listboxNode.querySelector(`#${this._listboxActiveDescendant}`);
      }

      get _scrollTargetNode() {
        return this;
      }

      get checkedIndex() {
        const options = this.formElements;
        return options.indexOf(options.find(o => o.checked));
      }

      set checkedIndex(index) {
        if (this._listboxNode.children[index]) {
          this._listboxNode.children[index].checked = true;
        }
      }

      get activeIndex() {
        return this.formElements.findIndex(el => el.active === true);
      }

      set activeIndex(index) {
        if (this.formElements[index]) {
          const el = this.formElements[index];
          el.active = true;

          if (!isInView(this._scrollTargetNode, el)) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }

      constructor() {
        super();
        this.interactionMode = 'auto';
        this.disabled = false;
        // for interaction states
        this._listboxActiveDescendant = null;
        this.__hasInitialSelectedFormElement = false;

        this.__setupEventListeners();
      }

      async connectedCallback() {
        this._listboxNode.registrationTarget = this;
        if (super.connectedCallback) {
          super.connectedCallback();
        }
        if (!this.__readyForRegistration) {
          await this.registrationReady;
          this.initInteractionState();
        }
      }

      disconnectedCallback() {
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
        this.__teardownEventListeners();
        this.__teardownListboxNode();
      }

      firstUpdated(c) {
        super.firstUpdated(c);
        this.__setupListboxNode();

        // formRegistrarManager.addEventListener('all-forms-open-for-registration', () => {
        //   // Now that we have rendered + registered our listbox, try setting the user defined modelValue again
        //   if (this.__cachedUserSetModelValue) {
        //     console.log('__cachedUserSetModelValue', this.__cachedUserSetModelValue);
        //     this.modelValue = this.__cachedUserSetModelValue;
        //   }
        // });
      }

      _requestUpdate(name, oldValue) {
        super._requestUpdate(name, oldValue);
        if (name === 'interactionMode') {
          if (this.interactionMode === 'auto') {
            this.interactionMode = detectInteractionMode();
          }
        }
        if (name === 'modelValue') {
          this.dispatchEvent(new Event('model-value-changed', { bubbles: true }));
        }
      }

      // eslint-disable-next-line class-methods-use-this
      _checkSingleChoiceElements() {}

      updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('disabled')) {
          if (this.disabled) {
            // this._invokerNode.makeRequestToBeDisabled();
            this.__requestOptionsToBeDisabled();
          } else {
            // this._invokerNode.retractRequestToBeDisabled();
            this.__retractRequestOptionsToBeDisabled();
          }
        }
      }

      // // TODO: add this to Listbox element
      // /**
      //  * @override
      //  */
      // // eslint-disable-next-line
      // _inputGroupInputTemplate() {
      //   return html`
      //     <div class="input-group__input">
      //       <slot name="input"></slot>
      //     </div>
      //   `;
      // }

      /**
       * Overrides FormRegistrar adding to make sure children have specific default states when added
       *
       * @override
       * @param {*} child
       * @param {Number} indexToInsertAt
       */
      addFormElement(child, indexToInsertAt) {
        super.addFormElement(child, indexToInsertAt);

        // we need to adjust the elements being registered
        /* eslint-disable no-param-reassign */
        child.id = child.id || `${this.localName}-option-${uuid()}`;

        if (this.disabled) {
          child.makeRequestToBeDisabled();
        }

        // the first elements checked by default
        if (!this.__hasInitialSelectedFormElement && (!child.disabled || this.disabled)) {
          child.active = true;
          child.checked = true;
          this.__hasInitialSelectedFormElement = true;
        }

        this.__setAttributeForAllFormElements('aria-setsize', this.formElements.length);
        child.setAttribute('aria-posinset', this.formElements.length);

        this.__onChildModelValueChanged({ target: child });
        this.resetInteractionState();
        /* eslint-enable no-param-reassign */
      }

      __setupEventListeners() {
        this.__onChildActiveChanged = this.__onChildActiveChanged.bind(this);
        this.__onChildModelValueChanged = this.__onChildModelValueChanged.bind(this);

        this._listboxNode.addEventListener('active-changed', this.__onChildActiveChanged);
        // this._listboxNode.addEventListener('model-value-changed', this.__onChildModelValueChanged);
        this._listboxNode.addEventListener('checked', this.__onChildModelValueChanged);
        this.addEventListener('keyup', this.__onKeyUp);
      }

      __teardownEventListeners() {
        this._listboxNode.removeEventListener('active-changed', this.__onChildActiveChanged);
        // this._listboxNode.removeEventListener('model-value-changed', this.__onChildModelValueChanged);
        this._listboxNode.addEventListener('checked', this.__onChildModelValueChanged);
        this._listboxNode.removeEventListener('keyup', this.__onKeyUp);
      }

      __onChildActiveChanged({ target }) {
        if (target.active === true) {
          this.formElements.forEach(formElement => {
            if (formElement !== target) {
              // eslint-disable-next-line no-param-reassign
              formElement.active = false;
            }
          });
          this._listboxNode.setAttribute('aria-activedescendant', target.id);
        }
      }

      __setAttributeForAllFormElements(attribute, value) {
        this.formElements.forEach(formElement => {
          formElement.setAttribute(attribute, value);
        });
      }

      __onChildModelValueChanged(cfgOrEvent) {
        const { target } = cfgOrEvent;
        if (cfgOrEvent.stopPropagation) {
          cfgOrEvent.stopPropagation();
        }

        if (target.checked) {
          this.formElements.forEach(formElement => {
            if (formElement !== target) {
              // eslint-disable-next-line no-param-reassign
              formElement.checked = false;
            }
          });
          this.modelValue = target.choiceValue;
        }
      }

      __getNextEnabledOption(currentIndex, offset = 1) {
        for (let i = currentIndex + offset; i < this.formElements.length; i += 1) {
          if (this.formElements[i] && !this.formElements[i].disabled) {
            return i;
          }
        }
        return currentIndex;
      }

      __getPreviousEnabledOption(currentIndex, offset = -1) {
        for (let i = currentIndex + offset; i >= 0; i -= 1) {
          if (this.formElements[i] && !this.formElements[i].disabled) {
            return i;
          }
        }
        return currentIndex;
      }

      /**
       * @desc
       * Handle various keyboard controls; UP/DOWN will shift focus; SPACE selects
       * an item.
       *
       * @param ev - the keydown event object
       */
      __listboxOnKeyUp(ev) {
        if (this.disabled) {
          return;
        }

        const { key } = ev;

        switch (key) {
          case 'Escape':
            ev.preventDefault();
            this.opened = false;
            break;
          case 'Enter':
          case ' ':
            ev.preventDefault();
            if (this.interactionMode === 'mac') {
              this.checkedIndex = this.activeIndex;
            }
            this.opened = false;
            break;
          case 'ArrowUp':
            ev.preventDefault();
            this.activeIndex = this.__getPreviousEnabledOption(this.activeIndex);
            break;
          case 'ArrowDown':
            ev.preventDefault();
            this.activeIndex = this.__getNextEnabledOption(this.activeIndex);
            break;
          case 'Home':
            ev.preventDefault();
            this.activeIndex = this.__getNextEnabledOption(0, 0);
            break;
          case 'End':
            ev.preventDefault();
            this.activeIndex = this.__getPreviousEnabledOption(this.formElements.length - 1, 0);
            break;
          /* no default */
        }

        const keys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (keys.includes(key) && this.interactionMode === 'windows/linux') {
          this.checkedIndex = this.activeIndex;
        }
      }

      __listboxOnKeyDown(ev) {
        if (this.disabled) {
          return;
        }

        const { key } = ev;

        switch (key) {
          case 'Tab':
            // Tab can only be caught in keydown
            ev.preventDefault();
            this.opened = false;
            break;
          /* no default */
        }
      }

      __requestOptionsToBeDisabled() {
        this.formElements.forEach(el => {
          if (el.makeRequestToBeDisabled) {
            el.makeRequestToBeDisabled();
          }
        });
      }

      __retractRequestOptionsToBeDisabled() {
        this.formElements.forEach(el => {
          if (el.retractRequestToBeDisabled) {
            el.retractRequestToBeDisabled();
          }
        });
      }

      /**
       * For ShadyDom the listboxNode is available right from the start so we can add those events
       * immediately.
       * For native ShadowDom the select gets render before the listboxNode is available so we
       * will add an event to the slotchange and add the events once available.
       */
      __setupListboxNode() {
        if (this._listboxNode) {
          this.__setupListboxInteractions();
        } else {
          const inputSlot = this.shadowRoot.querySelector('slot[name=input]');
          if (inputSlot) {
            inputSlot.addEventListener('slotchange', () => {
              this.__setupListboxInteractions();
            });
          }
        }
      }

      __setupListboxInteractions() {
        this.__listboxOnClick = () => {
          this.opened = false;
        };

        this._listboxNode.setAttribute('role', 'listbox');
        this._listboxNode.setAttribute('tabindex', '0');

        this._listboxNode.addEventListener('click', this.__listboxOnClick);

        this.__listboxOnKeyUp = this.__listboxOnKeyUp.bind(this);
        this._listboxNode.addEventListener('keyup', this.__listboxOnKeyUp);

        this.__listboxOnKeyDown = this.__listboxOnKeyDown.bind(this);
        this._listboxNode.addEventListener('keydown', this.__listboxOnKeyDown);
      }

      __teardownListboxNode() {
        if (this._listboxNode) {
          this._listboxNode.removeEventListener('click', this.__listboxOnClick);
          this._listboxNode.removeEventListener('keyup', this.__listboxOnKeyUp);
          this._listboxNode.removeEventListener('keydown', this.__listboxOnKeyDown);
        }
      }

      __preventScrollingWithArrowKeys(ev) {
        if (this.disabled) {
          return;
        }
        const { key } = ev;
        switch (key) {
          case 'ArrowUp':
          case 'ArrowDown':
          case 'Home':
          case 'End':
            ev.preventDefault();
          /* no default */
        }
      }

      // TODO: find out why this cannot be inherited from FormControlMixin
      set fieldName(value) {
        this.__fieldName = value;
      }

      get fieldName() {
        const label =
          this.label ||
          (this.querySelector('[slot=label]') && this.querySelector('[slot=label]').textContent);
        return this.__fieldName || label || this.name;
      }
    },
);
