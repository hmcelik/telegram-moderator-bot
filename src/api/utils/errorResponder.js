import logger from '../../common/services/logger.js';

const errorResponder = (err, req, res, next) => {
    let { statusCode = 500, message } = err;

    // For non-operational errors in production, send a generic message
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    // Log the error
    logger.error(err.message, { statusCode, stack: err.stack });

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message
    });
};

export default errorResponder;