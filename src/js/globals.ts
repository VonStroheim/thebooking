import {DurationObject, StateAction, tbkCommonB, tbkCommonF} from "./typedefs";
import dompurify from 'dompurify';

declare const wpApiSettings: { nonce: any; };
declare const TBK: tbkCommonF;
declare const tbkCommon: tbkCommonB;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

interface Globals {
    eventSystem: EventSystem,

    uuidv4(): string,

    uuidDOM(): string,

    setContrast(elem: Element): void,

    parseColor(color: string): any,

    getHeaders(): Headers,

    dateFromMDYString(string: string): null | Date,

    groupDaysConsecutive(dates: Array<Date>): Array<any>,

    flatMap(array: Array<any>, fn: Function): Array<any>,

    classNames(): string,

    combineReducers(reducers: { [key: string]: (...args: any) => any }): (action: StateAction[], nextState?: any) => any,

    formatTime(date: Date): string,

    formatDate(date: Date): string,

    mimeTypes(): Array<object>,

    sanitizer(content: string): any,

    minutesToDhms(minutes: number): string,

    minutesToHM(minutes: number): string,

    getDaysArray(start: Date, end: Date): Date[],

    unique(src: any[]): any[],

    isDateInArray(array: Date[], date: Date): boolean,

    secondsToDurationObj(seconds: number): DurationObject,

    durationObjToSeconds(obj: DurationObject): number

}

interface EventSystem {
    events: object,

    subscribe(action: string, fn: Function, namespace?: string): void,

    unsubscribe(action: string, namespace?: string): void,

    trigger(action: string, ...args: Array<any>): void
}

const Globals: Globals = {
    eventSystem         : {
        events: {},

        subscribe: function (action, fn, namespace = null) {
            if (typeof this.events[action] === 'undefined') {
                this.events[action] = [];
            }
            this.events[action].push({callable: fn, namespace: namespace});
        },

        unsubscribe: function (action, namespace = null) {
            if (namespace === null) {
                delete this.events[action];
            } else {
                if (typeof this.events[action] === 'undefined') {
                    return;
                }
                this.events[action].forEach((hooked: any, i: number) => {
                    if (hooked.namespace === namespace) {
                        delete this.events[action][i];
                    }
                })
            }
        },

        trigger: function (action, ...args) {
            if (typeof this.events[action] !== 'undefined') {
                this.events[action].forEach(function (hooked: any) {
                    hooked.callable.call(null, ...args);
                })
            } else {
                console.log('Event ' + action + ' not registered.');
            }
        }
    },
    uuidv4              : () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    uuidDOM             : () => {
        return 'tbkxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    setContrast         : (elem) => {
        const rgb = getComputedStyle(elem).backgroundColor.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (!rgb) {
            return;
        }
        // http://www.w3.org/TR/AERT#color-contrast
        const brightness = Math.round(((parseInt(rgb[1]) * 299) +
            (parseInt(rgb[2]) * 587) +
            (parseInt(rgb[3]) * 114)) / 1000);
        if (brightness > 125) {
            elem.classList.remove('bright-foreground');
        } else {
            elem.classList.add('bright-foreground');
        }
    },
    parseColor          : (color) => {
        let div = document.createElement('div'), m;
        div.style.color = color;
        m = getComputedStyle(div).color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (m) return [m[1], m[2], m[3]];
        else console.log("Colour " + color + " could not be parsed.");
        return false;
    },
    getHeaders          : () => {
        return new Headers({
            'Content-Type': 'application/json',
            'Accept'      : 'application/json',
            'X-WP-Nonce'  : wpApiSettings.nonce
        });
    },
    dateFromMDYString   : (string) => {
        if (typeof string !== 'string') {
            return null;
        }
        const mon = parseInt(string.substring(0, 2));
        const dy = parseInt(string.substring(3, 5));
        const yr = parseInt(string.substring(6, 10));
        const d = new Date(yr, mon - 1, dy);
        if (d instanceof Date && !isNaN(d.getTime())) {
            return d;
        }
        return null;
    },
    groupDaysConsecutive: (dates) => {
        let i = 0;
        let groups = dates.reduce(function (stack, b) {
            let cur = stack[i],
                a = cur ? cur[cur.length - 1] : 0;

            if (b.getTime() - ((a instanceof Date && !isNaN(a.getTime())) ? a.getTime() : a) > 86400000) {
                i++;
            }

            if (!stack[i])
                stack[i] = [];

            stack[i].push(b);

            return stack;
        }, []);
        groups.shift();
        return groups;
    },
    flatMap(array, fn) {
        let result: Array<any> = [];
        for (let i = 0; i < array.length; i++) {
            const mapping = fn(array[i]);
            result = result.concat(mapping);
        }
        return result;
    },
    classNames() {
        const classes = [];

        for (let i = 0; i < arguments.length; i++) {
            const arg = arguments[i];
            if (!arg) continue;

            const argType = typeof arg;

            if (argType === 'string' || argType === 'number') {
                classes.push(this && this[arg] || arg);
            } else if (Array.isArray(arg)) {
                classes.push(Globals.classNames.apply(this, arg));
            } else if (argType === 'object') {
                if (arg.toString !== Object.prototype.toString) {
                    classes.push(arg.toString());
                } else {
                    for (const key in arg) {
                        if ({}.hasOwnProperty.call(arg, key) && arg[key]) {
                            classes.push(this && this[key] || key);
                        }
                    }
                }
            }
        }

        return classes.join(' ');
    },
    combineReducers(reducers) {
        const reducerKeys: Array<string> = Object.keys(reducers);
        return function combination(action: StateAction[], initialState = {}) {
            let nextState = lodash.cloneDeep(initialState);
            for (let i = 0; i < reducerKeys.length; i++) {
                const key = reducerKeys[i]
                const reducer = reducers[key]
                action.forEach(act => {
                    nextState = {...nextState, ...reducer(nextState, act)}
                })
            }
            return nextState;
        }
    },
    formatTime(date) {
        const locale = (typeof TBK !== 'undefined') ? TBK.i18n.locale : (typeof tbkCommon !== 'undefined' ? tbkCommon.i18n.locale : null)
        return new Intl.DateTimeFormat(locale, {
            hour  : 'numeric',
            minute: 'numeric',
        }).format(date);
    },
    formatDate(date) {
        const locale = (typeof TBK !== 'undefined') ? TBK.i18n.locale : (typeof tbkCommon !== 'undefined' ? tbkCommon.i18n.locale : null)
        return new Intl.DateTimeFormat(locale, {
            year : 'numeric',
            month: 'numeric',
            day  : 'numeric'
        }).format(date);
    },
    mimeTypes() {
        return [
            {
                ext : '.aac',
                desc: 'AAC audio',
                mime: 'audio/aac'
            },
            {
                ext : '.avi',
                desc: 'AVI video',
                mime: 'video/x-msvideo'
            },
            {
                ext : '.bmp',
                desc: 'Windows Bitmap Graphics',
                mime: 'image/bmp'
            },
            {
                ext : '.csv',
                desc: 'Comma-separated values (CSV)',
                mime: 'text/csv'
            },
            {
                ext : '.doc',
                desc: 'Microsoft Word',
                mime: 'application/msword'
            },
            {
                ext : '.docx',
                desc: 'Microsoft Word (OpenXML)',
                mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            },
            {
                ext : '.gif',
                desc: 'Graphics Interchange Format (GIF)',
                mime: 'image/gif'
            },
            {
                ext : '.jpg',
                desc: 'JPEG images',
                mime: 'image/jpeg'
            },
            {
                ext : '.mp3',
                desc: 'MP3 audio',
                mime: 'audio/mpeg'
            },
            {
                ext : '.mpeg',
                desc: 'MPEG Video',
                mime: 'video/mpeg'
            },
            {
                ext : '.odp',
                desc: 'OpenDocument presentation document',
                mime: 'application/vnd.oasis.opendocument.presentation'
            },
            {
                ext : '.ods',
                desc: 'OpenDocument spreadsheet document',
                mime: 'application/vnd.oasis.opendocument.spreadsheet'
            },
            {
                ext : '.odt',
                desc: 'OpenDocument text document',
                mime: 'application/vnd.oasis.opendocument.text'
            },
            {
                ext : '.png',
                desc: 'Portable Network Graphics',
                mime: 'image/png'
            },
            {
                ext : '.pdf',
                desc: 'Adobe Portable Document Format (PDF)',
                mime: 'application/pdf'
            },
            {
                ext : '.rar',
                desc: 'RAR archive',
                mime: 'application/vnd.rar'
            },
            {
                ext : '.svg',
                desc: 'Scalable Vector Graphics (SVG)',
                mime: 'image/svg+xml'
            },
            {
                ext : '.tif',
                desc: 'Tagged Image File Format (TIFF)',
                mime: 'image/tiff'
            },
            {
                ext : '.txt',
                desc: 'Text',
                mime: 'text/plain'
            },
            {
                ext : '.wav',
                desc: 'Waveform Audio Format',
                mime: 'audio/wav'
            },
            {
                ext : '.xls',
                desc: 'Microsoft Excel',
                mime: 'application/vnd.ms-excel'
            },
            {
                ext : '.xlsx',
                desc: 'Microsoft Excel (OpenXML)',
                mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            {
                ext : '.xml',
                desc: 'XML',
                mime: 'application/xml'
            },
            {
                ext : '.zip',
                desc: 'ZIP archive',
                mime: 'application/zip'
            },
            {
                ext : '.7z',
                desc: '7-zip archive',
                mime: 'application/x-7z-compressed'
            },
        ]
    },
    sanitizer(content: string): any {
        return dompurify.sanitize(content);
    },
    minutesToDhms(minutes) {
        minutes = Number(minutes);
        const d = Math.floor(minutes / (60 * 24));
        const h = Math.floor(minutes % (60 * 24) / 60);
        const m = Math.floor(minutes % 60);

        const dDisplay = d > 0 ? sprintf(_n('%s day', '%s days', d, 'thebooking'), d) : '';
        const hDisplay = h > 0 ? sprintf(_n('%s hour', '%s hours', h, 'thebooking'), h) : '';
        const mDisplay = m > 0 ? sprintf(_n('%s minute', '%s minutes', m, 'thebooking'), m) : '';
        return (dDisplay + ', ' + hDisplay + ', ' + mDisplay).replace(/^,\s*|,\s*$/g, "");
    },
    minutesToHM(minutes: number) {
        minutes = Number(minutes);
        const d = Math.floor(minutes / (60 * 24));
        const h = Math.floor(minutes % (60 * 24) / 60);
        const m = Math.floor(minutes % 60);
        return sprintf(__('%dh%sm', 'thebooking'), h + d * 60, ('0' + m).slice(-2));
    },
    secondsToDurationObj(d) {
        return {
            days   : Math.floor(d / 86400),
            hours  : Math.floor(d % 86400 / 3600),
            minutes: Math.floor(d % 86400 % 3600 / 60),
        }
    },
    durationObjToSeconds(obj) {
        return obj.days * 86400 + obj.hours * 3600 + obj.minutes * 60;
    },
    getDaysArray(start, end) {
        const arr = [];
        let dt;
        for (dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            arr.push(new Date(dt));
        }
        return arr;
    },
    unique(src) {
        return [...new Set(src)]
    },
    isDateInArray(array, date) {
        return !!array.find((item: Date) => {
            return item.getTime() === date.getTime()
        });
    }
}

export default Globals;