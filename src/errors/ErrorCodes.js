'use strict';
const { createEnum } = require('../util/Util');

/**
 * @typedef DiscordInteractionsErrorCodes
 *
 * @prop {'CommandHasCoolTime'} CommandHasCoolTime
 */
/** @type {DiscordInteractionsErrorCodes} */
module.exports = createEnum(['CommandHasCoolTime']);
