const winston = require('winston');
const moment = require('moment-timezone');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
    filename: 'watch-temp-content-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: './logs/',
    // maxFiles: '14d'
  });

const config = {
    transports: [
        new winston.transports.Console(),
        transport
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({timestamp, level, message}) => {
            const localTime = moment(timestamp).tz('Europe/Moscow').format();
            return `${localTime} | ${level.toUpperCase()} | ${message}`;
        })
    )
};

module.exports.logger = winston.createLogger(config);