import {Utilities} from './Utilities.ts';


export interface LoggerMetaInterface{
    service: string;
}

export class ApplicationLogger {


    static formatMessage(level: string, message: string, meta: LoggerMetaInterface): string {
        return `${Utilities.getFormattedDate()} [${level.padEnd(6,' ')}] [${meta.service.padEnd(20, ' ')}] ${message}`;
    }

    static info(message: string, meta: LoggerMetaInterface) {
        console.log(this.formatMessage('INFO', message, meta));
    }

    static error(message: string, meta:LoggerMetaInterface) {
        console.error(this.formatMessage('ERROR', message, meta));
    }
}