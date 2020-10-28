import { expect } from '@open-wc/testing';
import { localize } from '../../src/localize.js';
import { localizeTearDown } from '../../test-helpers.js';

import { formatDate } from '../../src/date/formatDate.js';
import { parseDate } from '../../src/date/parseDate.js';

const SUPPORTED_LOCALES = {
  'bg-BG': 'Bulgarian',
  'cs-CZ': 'Czech',
  'de-DE': 'German (Germany)',
  'en-AU': 'English (Australia)',
  'en-GB': 'English (United Kingdom)',
  'en-PH': 'English (Philippines)',
  'en-US': 'English (United States)',
  'es-ES': 'Spanish (Spain)',
  'fr-FR': 'French (France)',
  'fr-BE': 'French (Belgium)',
  'hu-HU': 'Hungarian (Hungary)',
  'id-ID': 'Indonesian (Indonesia)',
  'it-IT': 'Italian (Italy)',
  'nl-NL': 'Dutch (Netherlands)',
  'nl-BE': 'Dutch (Belgium)',
  'pl-PL': 'Polish (Poland)',
  'ro-RO': 'Romanian (Romania)',
  'ru-RU': 'Russian (Russia)',
  'sk-SK': 'Slovak (Slovakia)',
  'tr-TR': 'Turkish (Turkey)',
  'uk-UA': 'Ukrainian (Ukraine)',
  'zh-CN': 'Chinese (China)',
  'zh-Hans': 'Chinese (Simplified Han)',
  'zh-Hans-CN': 'Chinese (Simplified Han, China)',
  'zh-Hans-HK': 'Chinese (Simplified Han, Hong Kong SAR China)',
  'zh-Hans-MO': 'Chinese (Simplified Han, Macau SAR China)',
  'zh-Hans-SG': 'Chinese (Simplified Han, Singapore)',
  'zh-Hant': 'Chinese (Traditional Han)',
  'zh-Hant-HK': 'Chinese (Traditional Han, Hong Kong SAR China)',
  'zh-Hant-MO': 'Chinese (Traditional Han, Macau SAR China)',
  'zh-Hant-TW': 'Chinese (Traditional Han, Taiwan)',
};

describe('formatDate', () => {
  beforeEach(() => {
    localizeTearDown();
  });

  it('displays the appropriate date based on locale', async () => {
    const testDate = new Date('2012/05/21');

    expect(formatDate(testDate)).to.equal('21/05/2012');

    localize.locale = 'nl-NL';
    expect(formatDate(testDate)).to.equal('21-05-2012');

    localize.locale = 'fr-FR';
    expect(formatDate(testDate)).to.equal('21/05/2012');

    localize.locale = 'de-DE';
    expect(formatDate(testDate)).to.equal('21.05.2012');

    localize.locale = 'en-US';
    expect(formatDate(testDate)).to.equal('05/21/2012');
  });

  it('displays the date based on options', async () => {
    const testDate = new Date('2012/05/21');
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    };

    expect(formatDate(testDate, options)).to.equal('Monday, 21 May 2012');
    localize.locale = 'nl-NL';
    expect(formatDate(testDate, options)).to.equal('maandag 21 mei 2012');
    localize.locale = 'fr-FR';
    expect(formatDate(testDate, options)).to.equal('lundi 21 mai 2012');
    localize.locale = 'de-DE';
    expect(formatDate(testDate, options)).to.equal('Montag, 21. Mai 2012');
    localize.locale = 'en-US';
    expect(formatDate(testDate, options)).to.equal('Monday, May 21, 2012');
  });

  it('displays Hungarian dates correctly', async () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      locale: 'en-US',
    };
    localize.locale = 'hu-HU';
    let date = /** @type {Date} */ (parseDate('2018-5-28'));
    expect(formatDate(date)).to.equal('2018. 05. 28.');

    date = /** @type {Date} */ (parseDate('1970-11-3'));
    expect(formatDate(date, options)).to.equal('Tuesday, November 03, 1970');
  });

  it('displays Bulgarian dates correctly', async () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      locale: 'en-US',
    };
    localize.locale = 'bg-BG';
    let date = /** @type {Date} */ (parseDate('29-12-2017'));
    expect(formatDate(date)).to.equal('29.12.2017 г.');

    date = /** @type {Date} */ (parseDate('13-1-1940'));
    expect(formatDate(date)).to.equal('13.01.1940 г.');

    date = /** @type {Date} */ (parseDate('3-11-1970'));
    expect(formatDate(date, options)).to.equal('Tuesday, November 03, 1970');
  });

  it('displays US dates correctly', async () => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      locale: 'en-US',
    };
    localize.locale = 'en-US';
    let date = /** @type {Date} */ (parseDate('12-29-1940'));
    expect(formatDate(date)).to.equal('12/29/1940');

    date = /** @type {Date} */ (parseDate('1-13-1940'));
    expect(formatDate(date)).to.equal('01/13/1940');

    date = /** @type {Date} */ (parseDate('11-3-1970'));
    expect(formatDate(date, options)).to.equal('Tuesday, November 03, 1970');
  });

  it('handles locales in options', async () => {
    let options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      locale: 'en-US',
    };
    let parsedDate = /** @type {Date} */ (parseDate('05.11.2017'));
    expect(formatDate(parsedDate, options)).to.equal('Sunday, November 05, 2017');

    parsedDate = /** @type {Date} */ (parseDate('01-01-1940'));
    options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      locale: 'nl-BE',
    };
    expect(formatDate(parsedDate, options)).to.equal('maandag 01 januari 1940');
  });

  describe('Display dates correctly for each locale', () => {
    const LOCALE_FORMATTED_DATE_MAP = {
      'bg-BG': 'събота, 12 октомври 2019 г.',
      'cs-CZ': 'sobota 12. října 2019',
      'de-DE': 'Samstag, 12. Oktober 2019',
      'en-AU': 'Saturday, 12 October 2019',
      'en-GB': 'Saturday, 12 October 2019',
      'en-PH': 'Saturday, 12 October 2019',
      'en-US': 'Saturday, October 12, 2019',
      'es-ES': 'sábado, 12 de octubre de 2019',
      'fr-FR': 'samedi 12 octobre 2019',
      'fr-BE': 'samedi 12 octobre 2019',
      'hu-HU': '2019. október 12., szombat',
      'id-ID': 'Sabtu, 12 Oktober 2019',
      'it-IT': 'sabato 12 ottobre 2019',
      'nl-NL': 'zaterdag 12 oktober 2019',
      'nl-BE': 'zaterdag 12 oktober 2019',
      'pl-PL': 'sobota, 12 października 2019',
      'ro-RO': 'sâmbătă, 12 octombrie 2019',
      'ru-RU': 'суббота, 12 октября 2019 г.',
      'sk-SK': 'sobota 12. októbra 2019',
      'tr-TR': '12 Ekim 2019 Cumartesi',
      'uk-UA': 'субота, 12 жовтня 2019 р.',
      'zh-CN': '2019年10月12日星期六',
      'zh-Hans': '2019年10月12日星期六',
      'zh-Hans-CN': '2019年10月12日星期六',
      'zh-Hans-HK': '2019年10月12日星期六',
      'zh-Hans-MO': '2019年10月12日星期六',
      'zh-Hans-SG': '2019年10月12日星期六',
      'zh-Hant': '2019年10月12日 星期六',
      'zh-Hant-HK': '2019年10月12日星期六',
      'zh-Hant-MO': '2019年10月12日星期六',
      'zh-Hant-TW': '2019年10月12日 星期六',
    };

    Object.keys(SUPPORTED_LOCALES).forEach(locale => {
      it(`displays the date as expected for locale: ${locale}`, async () => {
        const options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          locale,
        };
        const parsedDate = /** @type {Date} */ (parseDate('12.10.2019'));
        expect(formatDate(parsedDate, options)).to.equal(LOCALE_FORMATTED_DATE_MAP[locale]);
      });
    });
  });

  describe('Date format options without "year"', () => {
    const LOCALE_FORMATTED_DATE_MAP = {
      'bg-BG': 'събота, 12 октомври',
      'cs-CZ': 'sobota 12. října',
      'de-DE': 'Samstag, 12. Oktober',
      'en-AU': 'Saturday, 12 October',
      'en-GB': 'Saturday, 12 October',
      'en-PH': 'Saturday, 12 October',
      'en-US': 'Saturday, October 12',
      'es-ES': 'sábado, 12 de octubre',
      'fr-FR': 'samedi 12 octobre',
      'fr-BE': 'samedi 12 octobre',
      'hu-HU': 'október 12., szombat',
      'id-ID': 'Sabtu, 12 Oktober',
      'it-IT': 'sabato 12 ottobre',
      'nl-NL': 'zaterdag 12 oktober',
      'nl-BE': 'zaterdag 12 oktober',
      'pl-PL': 'sobota, 12 października',
      'ro-RO': 'sâmbătă, 12 octombrie',
      'ru-RU': 'суббота, 12 октября',
      'sk-SK': 'sobota 12. októbra',
      'tr-TR': '12 Ekim Cumartesi',
      'uk-UA': 'субота, 12 жовтня',
      'zh-CN': '10月12日星期六',
      'zh-Hans': '10月12日星期六',
      'zh-Hans-CN': '10月12日星期六',
      'zh-Hans-HK': '10月12日星期六',
      'zh-Hans-MO': '10月12日星期六',
      'zh-Hans-SG': '10月12日星期六',
      'zh-Hant': '10月12日 星期六',
      'zh-Hant-HK': '10月12日星期六',
      'zh-Hant-MO': '10月12日星期六',
      'zh-Hant-TW': '10月12日 星期六',
    };

    Object.keys(SUPPORTED_LOCALES).forEach(locale => {
      it(`handles options without year for locale: ${locale}`, async () => {
        const options = {
          weekday: 'long',
          month: 'long',
          day: '2-digit',
          locale,
        };
        const parsedDate = /** @type {Date} */ (parseDate('12.10.2019'));
        expect(formatDate(parsedDate, options)).to.equal(LOCALE_FORMATTED_DATE_MAP[locale]);
      });
    });
  });

  describe('Date format options without "month"', () => {
    const LOCALE_FORMATTED_DATE_MAP = {
      'bg-BG': '2019 г. събота, 12',
      'cs-CZ': '2019 sobota 12.',
      'de-DE': '2019 Samstag, 12.',
      'en-AU': 'Saturday 12 2019',
      'en-GB': 'Saturday 12 2019',
      'en-PH': 'Saturday 12 2019',
      'en-US': '12 Saturday 2019',
      'es-ES': '2019 sábado 12',
      'fr-FR': '2019 samedi 12',
      'fr-BE': '2019 samedi 12',
      'hu-HU': '2019. 12., szombat',
      'id-ID': '2019 Sabtu, 12',
      'it-IT': '2019 sabato 12',
      'nl-NL': '2019 zaterdag 12',
      'nl-BE': '2019 zaterdag 12',
      'pl-PL': '2019 sobota, 12',
      'ro-RO': '2019 sâmbătă 12',
      'ru-RU': '2019 суббота, 12',
      'sk-SK': '2019 sobota 12.',
      'tr-TR': '2019 12 Cumartesi',
      'uk-UA': '2019 субота, 12',
      'zh-CN': '2019年 12日星期六',
      'zh-Hans': '2019年 12日星期六',
      'zh-Hans-CN': '2019年 12日星期六',
      'zh-Hans-HK': '2019年 12日星期六',
      'zh-Hans-MO': '2019年 12日星期六',
      'zh-Hans-SG': '2019年 12日星期六',
      'zh-Hant': '2019年 12 星期六',
      'zh-Hant-HK': '2019年 12 星期六',
      'zh-Hant-MO': '2019年 12 星期六',
      'zh-Hant-TW': '2019年 12 星期六',
    };

    Object.keys(SUPPORTED_LOCALES).forEach(locale => {
      it(`handles options without month for locale: ${locale}`, async () => {
        const options = {
          weekday: 'long',
          year: 'numeric',
          day: '2-digit',
          locale,
        };
        const parsedDate = /** @type {Date} */ (parseDate('12.10.2019'));
        expect(formatDate(parsedDate, options)).to.equal(LOCALE_FORMATTED_DATE_MAP[locale]);
      });
    });
  });

  describe('Date format options without "day"', () => {
    const LOCALE_FORMATTED_DATE_MAP = {
      'bg-BG': 'октомври 2019 г. събота',
      'cs-CZ': 'říjen 2019 sobota',
      'de-DE': 'Oktober 2019 Samstag',
      'en-AU': 'October 2019 Saturday',
      'en-GB': 'October 2019 Saturday',
      'en-PH': 'October 2019 Saturday',
      'en-US': 'October 2019 Saturday',
      'es-ES': 'octubre de 2019 sábado',
      'fr-FR': 'octobre 2019 samedi',
      'fr-BE': 'octobre 2019 samedi',
      'hu-HU': '2019. október szombat',
      'id-ID': 'Oktober 2019 Sabtu',
      'it-IT': 'ottobre 2019 sabato',
      'nl-NL': 'oktober 2019 zaterdag',
      'nl-BE': 'oktober 2019 zaterdag',
      'pl-PL': 'październik 2019 sobota',
      'ro-RO': 'octombrie 2019 sâmbătă',
      'ru-RU': 'октябрь 2019 г. суббота',
      'sk-SK': 'október 2019 sobota',
      'tr-TR': 'Ekim 2019 Cumartesi',
      'uk-UA': 'жовтень 2019 субота',
      'zh-CN': '2019年10月 星期六',
      'zh-Hans': '2019年10月 星期六',
      'zh-Hans-CN': '2019年10月 星期六',
      'zh-Hans-HK': '2019年10月 星期六',
      'zh-Hans-MO': '2019年10月 星期六',
      'zh-Hans-SG': '2019年10月 星期六',
      'zh-Hant': '2019年10月 星期六',
      'zh-Hant-HK': '2019年10月 星期六',
      'zh-Hant-MO': '2019年10月 星期六',
      'zh-Hant-TW': '2019年10月 星期六',
    };

    Object.keys(SUPPORTED_LOCALES).forEach(locale => {
      it(`handles options without day for locale: ${locale}`, async () => {
        const options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          locale,
        };
        const parsedDate = /** @type {Date} */ (parseDate('12.10.2019'));
        expect(formatDate(parsedDate, options)).to.equal(LOCALE_FORMATTED_DATE_MAP[locale]);
      });
    });
  });

  it('returns empty string when input is not a Date object', async () => {
    const date = '1-1-2016';
    // @ts-ignore tests what happens if you use a wrong type
    expect(formatDate(date)).to.equal('');
  });
});
