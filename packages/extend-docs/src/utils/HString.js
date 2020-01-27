const h = require('./helpers.js');

class HString extends String {
  gReplace(...args) {
    return new HString(h.gReplace(this, ...args));
  }

  tagReplace(...args) {
    return new HString(h.tagReplace(this, ...args));
  }
}

// eslint-disable-next-line no-new-wrappers
Object.entries(new String()).forEach(([k, v]) => {
  HString.prototype[k] = (...args) => new HString(v(...args));
});

// Object.entries(h).forEach(([methodName, fn]) => {
//   HString.prototype[methodName] = fn.bind(HString.prototype, HString.prototype);
// });

module.exports = HString;
