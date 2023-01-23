'use strict';
// Heavily inspired by node's `internal/errors` module
const ErrorCodes = require('./ErrorCodes');
const Messages = require('./Messages');

class InteractionsError extends Error {
  constructor(code, data, ...args) {
    super(message(code, args));
    this.code = code;
    this.data = data;
    Error.captureStackTrace?.(this, InteractionsError);
  }

  get name() {
    return `${super.name} [${this.code}]`;
  }
}

/**
 * Format the message for an error.
 * @param {string} code The error code
 * @param {any[]} args Arguments to pass for util format or as function args
 * @return {string} Formatted string
 */
function message(code, args) {
  if (!(code in ErrorCodes)) {
    throw new Error('Error code must be a valid DiscordInteractionsErrorCodes');
  }
  const msg = Messages[code];
  if (!msg) throw new Error(`No message associated with error code: ${code}.`);
  if (typeof msg === 'function') return msg(...args);
  if (!args?.length) return msg;
  args.unshift(msg);
  return String(...args);
}

module.exports = { InteractionsError };
