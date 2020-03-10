import '@lion/option/lion-option.js';
import { expect, fixture, html } from '@open-wc/testing';
import '../lion-combobox.js';
import './keyboardEventShimIE.js';
import { LionComboboxInvoker } from '../src/LionComboboxInvoker.js';
import { LionOptions } from '../src/LionOptions.js';

function mimicUserTyping(el, value) {
  // eslint-disable-next-line no-param-reassign
  el.focus();
  // eslint-disable-next-line no-param-reassign
  el._comboboxTextNode.value = value;
  el._comboboxTextNode.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

function getFilteredOptionValues(el, textboxValue, autocompleteMode) {
  let condition;
  if (autocompleteMode === 'none') {
    condition = () => true;
  } else {
    // if (autocompleteMode === 'list' || 'both')
    condition = option => option.value.includes(textboxValue);
  }
  const options = Array.from(el._listboxNode.children);
  mimicUserTyping(el, textboxValue);
  const filtered = options.filter(
    option => !condition(option) && option.disabled && option.style.display === 'none',
  );
  return filtered.map(option => option.value);
}

async function fruitFixture({ autocomplete }) {
  const instance = await fixture(html`
    <lion-combobox name="foo" autocomplete="${autocomplete}">
      <lion-option value="Artichoke">Artichoke</lion-option>
      <lion-option value="Chard">Chard</lion-option>
      <lion-option value="Chicory">Chicory</lion-option>
      <lion-option value="Victoria Plum">Victoria Plum</lion-option>
    </lion-combobox>
  `);
  return [instance, Array.from(instance._listboxNode.children)];
}

describe('lion-combobox', () => {
  it('has a listbox component', async () => {
    const el = await fixture(html`
      <lion-combobox name="foo">
        <lion-option value="10" checked>Item 1</lion-option>
        <lion-option value="20">Item 2</lion-option>
      </lion-combobox>
    `);
    expect(el._listboxNode).to.be.defined;
    expect(el._listboxNode).to.be.instanceOf(LionOptions);
  });

  it('has an LionComboboxInvoker component', async () => {
    const el = await fixture(html`
      <lion-combobox name="foo">
        <lion-option value="10" checked>Item 1</lion-option>
        <lion-option value="20">Item 2</lion-option>
      </lion-combobox>
    `);
    expect(el._comboboxNode).to.be.defined;
    expect(el._comboboxNode).to.be.instanceOf(LionComboboxInvoker);
  });

  // Notice that the LionComboboxInvoker always needs to be used in conjunction with the
  // LionCombobox, and therefore will be tested integrated,
  describe('Invoker component integration', () => {
    it('has a textbox', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo">
          <lion-option value="10" checked>Item 1</lion-option>
          <lion-option value="20">Item 2</lion-option>
        </lion-combobox>
      `);
      const invokerEl = el._comboboxNode;
      expect(invokerEl.getAttribute('role')).to.equal('combobox');
    });

    describe('Accessibility', () => {
      it('sets role="combobox" on textbox wrapper/listbox sibling', async () => {
        const el = await fixture(html`
          <lion-combobox name="foo">
            <lion-option value="10" checked>Item 1</lion-option>
            <lion-option value="20">Item 2</lion-option>
          </lion-combobox>
        `);
        expect(el.getAttribute('role')).to.equal('combobox');
      });

      it('makes sure listbox node is not focusable', async () => {
        const el = await fixture(html`
          <lion-combobox name="foo">
            <lion-option value="10" checked>Item 1</lion-option>
            <lion-option value="20">Item 2</lion-option>
          </lion-combobox>
        `);
        expect(el._listboxNode.hasAttribute('tabindex')).to.be.false;
      });
    });
  });

  describe('Autocompletion', () => {
    it('has autocomplete "both" by default', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo">
          <lion-option value="10" checked>Item 1</lion-option>
        </lion-combobox>
      `);
      expect(el.autocomplete).to.equal('both');
    });

    it('filters options when autocomplete is "both"', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" autocomplete="both">
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);
      expect(getFilteredOptionValues(el, 'ch', 'list')).to.eql(['Artichoke', 'Chard', 'Chicory']);
    });

    it('completes textbox when autocomplete is "both"', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" autocomplete="both">
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);
      mimicUserTyping(el, 'ch');
      expect(el._comboboxTextNode.value).to.equal('Chard');
      expect(el._comboboxTextNode.selectionStart).to.equal(2);
      expect(el._comboboxTextNode.selectionEnd).to.equal(el._comboboxTextNode.value.length);

      // We don't autocomplete when characters are removed
      mimicUserTyping(el, 'c'); // The user pressed backspace (number of chars decreased)
      expect(el._comboboxTextNode.value).to.equal('c');
      expect(el._comboboxTextNode.selectionStart).to.equal(el._comboboxTextNode.value.length);
    });

    it('filters options when autocomplete is "list"', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" autocomplete="none">
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);
      // Artichoke, Chard and Chicory match
      expect(getFilteredOptionValues(el, 'ch', 'list')).to.eql(['Artichoke', 'Chard', 'Chicory']);
      expect(el._comboboxTextNode.value).to.equal('ch');
    });

    it('does not filter options when autocomplete is "none"', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" autocomplete="none">
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);
      expect(getFilteredOptionValues(el, 'ch', 'list')).to.eql([
        'Artichoke',
        'Chard',
        'Chicory',
        'Victoria Plum',
      ]);
    });

    describe('Accessibility', () => {
      it('synchronizes autocomplete option to textbox', async () => {
        let el;

        [el] = await fruitFixture({ autocomplete: 'both' });
        expect(el._comboboxTextNode.getAttribute('aria-autocomplete')).to.equal('both');

        [el] = await fruitFixture({ autocomplete: 'list' });
        expect(el._comboboxTextNode.getAttribute('aria-autocomplete')).to.equal('list');

        [el] = await fruitFixture({ autocomplete: 'none' });
        expect(el._comboboxTextNode.getAttribute('aria-autocomplete')).to.equal('none');
      });

      it('updates aria-activedescendant on textbox node', async () => {
        let el;
        let options;

        [el, options] = await fruitFixture({ autocomplete: 'none' });
        mimicUserTyping(el, 'ch');
        expect(el._comboboxTextNode.getAttribute('aria-activedescendant')).to.equal('');
        expect(options[0].active).to.equal(false);

        [el, options] = await fruitFixture({ autocomplete: 'both' });
        mimicUserTyping(el, 'ch');
        expect(el._comboboxTextNode.getAttribute('aria-activedescendant')).to.equal(options[0].id);
        expect(options[1].active).to.equal(true);

        el.autocomplete = 'list';
        mimicUserTyping(el, 'ch');
        expect(el._comboboxTextNode.getAttribute('aria-activedescendant')).to.equal(options[0].id);
        expect(options[1].active).to.equal(true);
      });
    });
  });

  // TODO: move parts to ListboxMixin test
  describe('Multiple Choice', () => {
    it('does not uncheck siblings', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" multiple-choice>
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);
      const options = el.formElements;
      options[0].checked = true;
      options[1].checked = true;
      expect(options[0].checked).to.equal(true);
      expect(el.modelValue).to.eql(['Artichoke', 'Chard']);
    });

    it('does not close listbox on click/enter/space', async () => {
      const el = await fixture(html`
        <lion-combobox name="foo" multiple-choice>
          <lion-option value="Artichoke">Artichoke</lion-option>
          <lion-option value="Chard">Chard</lion-option>
          <lion-option value="Chicory">Chicory</lion-option>
          <lion-option value="Victoria Plum">Victoria Plum</lion-option>
        </lion-combobox>
      `);

      // activate opened listbox
      mimicUserTyping(el, 'ch');
      const visibleOptions = el.formElements.filter(o => o.style.display !== 'none');
      visibleOptions[0].click();
      expect(el.opened).to.equal(true);
      // visibleOptions[1].dispatchEvent(new KeyboardEvent('keyup', ));
      expect(el.opened).to.equal(true);
    });

    // TODO: move to LionComboboxInvoker test
    describe('Selected chips display', () => {
      it('displays chips next to textbox', async () => {});
      it('orders chips based on user selection', async () => {});
      it('stages deletable chips on [Backspace]', async () => {});
      it('deletes staged chip on [Backspace]', async () => {});
    });

    describe('Accessibility', () => {
      it('adds aria-multiselectable="true" to listbox node', async () => {});
      it('does not allow "follow focus"', async () => {});
      it('aria-activedescendant points to latest selected', async () => {});
    });
  });

  //
  describe('Match Mode', () => {
    it('has a default value of "all"', async () => {});

    it('will suggest partial (in the middle of the word) when "all"', async () => {});

    it('will suggest beginning matches when "begin"', async () => {});

    it('allows for custom matching functions when "custom"', async () => {});
  });

  // TODO: move to ListboxMixin tests
  describe('Orientation', () => {
    it('has a default value of "vertical"', async () => {});
    it('uses left and right arrow keys when "horizontal"', async () => {});
    describe('Accessibility', () => {
      it('adds aria-orientation to attribute to listbox node', async () => {});
    });
  });
});
