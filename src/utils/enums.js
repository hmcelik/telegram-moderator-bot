/**
 * @fileoverview Defines application-wide constants and enumerations.
 */

/**
 * Defines the penalty modes for repeat offenders.
 * Using an object like this prevents typos when comparing strings.
 * @readonly
 * @enum {string}
 */
export const PenaltyMode = {
    KICK: 'kick',
    BAN: 'ban',
};