/**
 * @desc Evaluates function within this module scope, ensuring it cannot access internals of a file.
 * TODO: sanitize so that it cannot mess around with globals: https://nodejs.org/api/globals.html
 * Ideally, do this with babel and reject whenever (harmful) globals are used.
 */

function safeEval(source) {
  // eslint-disable-next-line no-eval
  return eval(source);
}

module.exports = safeEval;
