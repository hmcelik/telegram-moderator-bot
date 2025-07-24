/**
 * @fileoverview Configures the Winston logging service for the application.
 * This setup provides structured, timestamped logging to the console and to files.
 */

import winston from 'winston';

/**
 * The configured Winston logger instance.
 *
 * It logs messages to:
 * - The console with colorization.
 * - `error.log`: Only logs messages with a level of 'error'.
 * - `combined.log`: Logs all messages.
 */
const logger = winston.createLogger({
  // The minimum level of messages to log.
  level: 'info',
  
  // Defines the format for log messages.
  format: winston.format.combine(
    winston.format.timestamp(), // Adds a timestamp to each log entry.
    // Defines a custom printf-style format for the output.
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  
  // Defines the transport mechanisms (where to send logs).
  transports: [
    new winston.transports.Console(), // Log to the standard console.
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log only errors to a file.
    new winston.transports.File({ filename: 'combined.log' }), // Log everything to another file.
  ],
});

export default logger;