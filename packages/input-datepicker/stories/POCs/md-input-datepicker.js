import { html, css, LitElement, ifDefined } from '@lion/core';
import { getWeekdayNames, getMonthNames } from '@lion/localize';
import { LionInputDatepicker } from '../../src/LionInputDatepicker.js';
import { MdFieldMixin } from './MdFieldMixin.js';
import './md-calendar.js';
import './load-roboto.js';

customElements.define(
  'md-calendar-overlay-frame',
  class extends LitElement {
    static get properties() {
      return {
        /**
         * Contains day name, week name and day number
         */
        headingParts: Object,
        /**
         * Makes full input clickable.
         * When false, a button will be shown next to the input
         */
        fullWidthInvoker: {
          type: Boolean,
          attribute: 'full-width-invoker',
        },
      };
    }

    static get styles() {
      return [
        css`
          :host {
            display: inline-block;
            background: white;
            position: relative;

            border-radius: 4px;
            box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14),
              0px 9px 46px 8px rgba(0, 0, 0, 0.12);
          }

          .c-calendar-overlay__header {
            display: flex;
            background: var(--color-primary, royalblue);
            color: white;
          }

          .c-calendar-overlay__heading {
            padding: 0 24px;

            font-size: 2.125rem;
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            font-weight: 400;
            line-height: 1.17;
            letter-spacing: 0.00735em;

            height: 100px;
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            justify-content: center;
          }

          .c-calendar-overlay__heading > .c-calendar-overlay__close-button {
            flex: none;
          }

          .c-calendar-overlay__heading__year {
            color: rgba(255, 255, 255, 0.54);

            font-size: 1rem;
            line-height: 1.75;
            letter-spacing: 0.00938em;
          }

          .c-calendar-overlay__close-button {
            min-width: 40px;
            min-height: 32px;
            border-width: 0;
            padding: 0;
            font-size: 24px;
          }

          .c-calendar-overlay__footer {
            display: flex;
            padding: var(--spacer, 8px);
            justify-content: flex-end;
          }

          .c-calendar-overlay__footer > *:not(:last-child) {
            margin-right: var(--spacer, 8px);
          }

          .c-calendar-overlay__body {
            display: flex;
            flex-direction: column;
          }

          @media only screen and (min-width: 640px) {
            .c-calendar-overlay {
              flex-direction: row;
              display: flex;
            }

            .c-calendar-overlay__header {
              width: 160px;
              padding-top: 8px;
            }

            .c-calendar-overlay__heading {
              height: auto;
            }
          }
        `,
      ];
    }

    firstUpdated(...args) {
      super.firstUpdated(...args);
      // Delegate actions to extension of LionInputDatepicker.
      // In InputDatepicker, interaction with Calendar is provided
      this.shadowRoot.addEventListener('click', ({ target }) => {
        if (['set-button', 'cancel-button', 'clear-button'].includes(target.id)) {
          const action = target.id.split('-')[0];
          this.dispatchEvent(new CustomEvent('delegate-action', { detail: { action } }));
        }
      });
    }

    render() {
      // eslint-disable-line class-methods-use-this
      return html`
        <div class="c-calendar-overlay">
          <div class="c-calendar-overlay__header">
            <div role="region">
              <div
                id="overlay-heading"
                role="heading"
                aria-level="1"
                class="c-calendar-overlay__heading"
              >
                ${this.headingParts
                  ? html`
                      <span class="c-calendar-overlay__heading__year"
                        >${this.headingParts.year}</span
                      >
                      <div class="c-calendar-overlay__heading__date">
                        <span class="c-calendar-overlay__heading__dayname">
                          ${this.headingParts.dayName},
                        </span>
                        <span class="c-calendar-overlay__heading__day"
                          >${this.headingParts.dayWeekNumber}</span
                        >
                        <span class="c-calendar-overlay__heading__monthname"
                          >${this.headingParts.monthName}</span
                        >
                      </div>
                    `
                  : html``}
              </div>
            </div>
          </div>
          <div class="c-calendar-overlay__body">
            <slot></slot>

            <div class="c-calendar-overlay__footer">
              <md-button id="clear-button" class="c-calendar-overlay__clear-button">
                Clear
              </md-button>
              <md-button id="cancel-button" class="c-calendar-overlay__cancel-button">
                Cancel
              </md-button>
              <md-button id="set-button" class="c-calendar-overlay__set-button">
                Set
              </md-button>
            </div>
          </div>
        </div>
      `;
    }
  },
);

customElements.define(
  'md-input-datepicker',
  class extends MdFieldMixin(LionInputDatepicker) {
    constructor() {
      super();
      // Config options for subclassers
      // this._calendarInvokerSlot = '_full-width-invoker';
      this._focusCentralDateOnCalendarOpen = false;
      this._hideOnUserSelect = false;
      this._syncOnUserSelect = false;

      this.__mdDelegateOverlayAction = this.__mdDelegateOverlayAction.bind(this);
      this.__mdFormatHeading = this.__mdFormatHeading.bind(this);
    }

    render() {
      return html`
        ${super.render()} ${this._overlayTemplate()}
        ${this.fullWidthInvoker
          ? html`
              <slot name="_full-width-invoker"></slot>
            `
          : ''}
      `;
    }

    firstUpdated(c) {
      super.firstUpdated(c);
      this._calendarElement.addEventListener('click', this.__mdFormatHeading);
      this._calendarElement.addEventListener('keydown', this.__mdFormatHeading);
      this.__mdFormatHeading();
    }

    /** @override */
    _invokerTemplate() {
      // return html`
      //   <button
      // type="button"
      // @click="${this.__openCalendarOverlay}"
      // id="${this.__invokerId}"
      // aria-label="${this.msgLit('lion-input-datepicker:openDatepickerLabel')}"
      // title="${this.msgLit('lion-input-datepicker:openDatepickerLabel')}"
      //     style="position: absolute; top: 0; bottom: 0; left: 0; right: 0; width:100%; opacity: 0; cursor: pointer;"
      //   ></button>
      // `;
      return html`
        <md-button
          type="button"
          @click="${this.__openCalendarOverlay}"
          id="${this.__invokerId}"
          aria-label="${this.msgLit('lion-input-datepicker:openDatepickerLabel')}"
          title="${this.msgLit('lion-input-datepicker:openDatepickerLabel')}"
        >
          <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"
            ></path>
            <path d="M0 0h24v24H0z" fill="none"></path>
          </svg>
        </md-button>
      `;
    }

    /** @override */
    _calendarTemplate() {
      return html`
        <md-calendar
          id="calendar"
          .selectedDate="${this.constructor.__getSyncDownValue(this.modelValue)}"
          .minDate="${this.__calendarMinDate}"
          .maxDate="${this.__calendarMaxDate}"
          .disableDates="${ifDefined(this.__calendarDisableDates)}"
          @user-selected-date-changed="${this._onCalendarUserSelectedChanged}"
        ></md-calendar>
      `;
    }

    /** @override */
    // TODO: if globalOverlay would support shadow dom, this would be more straightforward,
    // a.k.a. not require an extra web component
    _overlayTemplate() {
      return html`
        <md-calendar-overlay-frame id="calendar-overlay">
          <span slot="heading">${this.calendarHeading}</span>
          ${this._calendarTemplate()}
        </md-calendar-overlay-frame>
      `;
    }

    /** @override */
    _onCalendarOverlayOpened() {
      super._onCalendarOverlayOpened();
      this._overlayContentNode.addEventListener('delegate-action', this.__mdDelegateOverlayAction);
      // TODO: Change events to one 'central-date-changed' once exposed
      this.__mdFormatHeading();
    }

    /**
     * @override Configures OverlayMixin
     */
    get _overlayContentNode() {
      if (this._cachedOverlayContentNode) {
        return this._cachedOverlayContentNode;
      }
      this._cachedOverlayContentNode = this.shadowRoot.querySelector('md-calendar-overlay-frame');
      return this._cachedOverlayContentNode;
    }

    __mdFormatHeading() {
      // TODO: needs to run on 'central-date-changed': fire this event in LionCalendar
      const d = this._calendarElement.centralDate;
      const locale = this._calendarElement.__getLocale();
      const { firstDayOfWeek } = this._calendarElement;

      this._overlayContentNode.headingParts = {
        monthName: getMonthNames({ locale, style: 'short' })[d.getMonth()],
        dayName: getWeekdayNames({ locale, style: 'short', firstDayOfWeek })[d.getDay()],
        dayWeekNumber: d.getDate(),
        year: d.getFullYear(),
      };
    }

    __mdDelegateOverlayAction({ detail: { action } }) {
      switch (action) {
        case 'set':
          this._calendarElement.selectedDate = this._calendarElement.centralDate;
          this.modelValue = this._calendarElement.selectedDate;
          break;
        case 'clear':
          this._calendarElement.selectedDate = undefined;
          this.modelValue = undefined;
          break;
        case 'cancel':
          this._overlayCtrl.hide();
          break;
        default:
      }
    }
  },
);
