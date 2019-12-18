import { LionCalendar } from '@lion/calendar';
import { html, css } from '@lion/core';
import './md-button.js';

customElements.define(
  'md-calendar',
  class extends LionCalendar {
    static get styles() {
      return [
        ...super.styles,
        css`
          #content {
            display: flex;
            max-width: 330px; /* set via js */
            overflow: hidden;
          }

          .calendar__header {
            border-bottom: none;

            display: flex;
            margin-top: 4px;
            align-items: center;
            justify-content: space-between;
          }

          .calendar__month-heading {
            color: rgba(0, 0, 0, 0.87);
            font-size: 1rem;
            font-weight: 400;
            line-height: 1.5;
            letter-spacing: 0.00938em;
          }

          .calendar__weekday-header {
            color: rgba(0, 0, 0, 0.38);
            font-size: 0.75rem;
            line-height: 1.66;
            letter-spacing: 0.03333em;
            padding-bottom: 8px;
          }

          .calendar__day-button {
            border-radius: 50%;

            min-width: 36px;
            min-height: 36px;
          }

          .calendar__day-button:hover {
            border-color: transparent;
            background-color: #eee;
          }

          .calendar__day-button:focus {
            outline: none;
            background-color: lightgray;
          }

          .calendar__day-button[selected] {
            background: var(--color-primary, royalblue);
            color: white;
            border-radius: 50%;
          }

          .calendar__day-button[next-month],
          .calendar__day-button[previous-month] {
            display: none;
          }

          .calendar__prev-month-button,
          .calendar__next-month-button {
            color: rgba(0, 0, 0, 0.54);
          }

          .calendar__prev-month-button svg,
          .calendar__next-month-button svg {
            width: 24px;
          }
        `,
      ];
    }

    constructor() {
      super();
      this.firstDayOfWeek = 1; // Start on Mondays instead of Sundays
      this.weekdayHeaderNotation = 'narrow'; // 'T' instead of 'Thu'
    }

    // TODO: enable if swipeable/animated months need to be created
    // __createData() {
    //   return super.__createData({ futureMonths: 1, pastMonths: 1 });
    // }

    // TODO: align template names, allow Subclassers
    __renderData() {
      return html`
        <div id="content-wrapper">
          ${super.__renderData()}
        </div>
      `;
    }

    // TODO: abstract away a11y and behavior in parent. Align names
    __renderPreviousButton() {
      return html`
        <md-button
          class="calendar__prev-month-button"
          aria-label=${this.msgLit('lion-calendar:previousMonth')}
          title=${this.msgLit('lion-calendar:previousMonth')}
          @click=${this.goToPreviousMonth}
          ?disabled=${this._previousMonthDisabled}
        >
          <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"></path>
            <path fill="none" d="M0 0h24v24H0V0z"></path>
          </svg>
        </md-button>
      `;
    }

    __renderNextButton() {
      return html`
        <md-button
          class="calendar__next-month-button"
          aria-label=${this.msgLit('lion-calendar:nextMonth')}
          title=${this.msgLit('lion-calendar:nextMonth')}
          @click=${this.goToNextMonth}
          ?disabled=${this._nextMonthDisabled}
        >
          <svg focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path>
            <path fill="none" d="M0 0h24v24H0V0z"></path>
          </svg>
        </md-button>
      `;
    }
  },
);
