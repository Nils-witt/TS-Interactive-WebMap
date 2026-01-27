import {Utilities} from './Utilities.ts';


export interface LoggerMetaInterface {
    service: string;
    event?: Event;
}

enum LOG_LEVELS {
    ERROR,
    INFO,
    DEBUG
}

export class ApplicationLogger {
    public static logLevel: LOG_LEVELS = LOG_LEVELS.ERROR;

    static formatMessage(level: string, message: string, meta: LoggerMetaInterface): string {
        return `${Utilities.getFormattedDate()} [${level.padEnd(6, ' ')}] [${meta.service.padEnd(20, ' ')}] ${message}`;
    }

    static debug(message: string, meta: LoggerMetaInterface) {
        if (this.logLevel >= LOG_LEVELS.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, meta));
        }
    }

    static info(message: string, meta: LoggerMetaInterface) {
        if (this.logLevel >= LOG_LEVELS.INFO) {
            console.log(this.formatMessage('INFO', message, meta));
        }
    }

    static error(message: string, meta: LoggerMetaInterface) {
        if (this.logLevel >= LOG_LEVELS.ERROR) {
            console.error(this.formatMessage('ERROR', message, meta));
        }
    }
}