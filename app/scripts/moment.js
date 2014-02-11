//! moment.js
//! version : 2.5.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
     Constants
     ************************************/

    var moment,
        VERSION = "2.5.1",
        global = this,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

    // internal storage for language config files
        languages = {},

    // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

    // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports && typeof require !== 'undefined'),

    // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

    // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

    // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

    //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

    // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

    // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

    // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

    // format function strings
        formatFunctions = {},

    // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
     Constructors
     ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
     Helpers
     ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months,
            minutes,
            hours;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        // store the minutes and hours so we can restore them
        if (days || months) {
            minutes = mom.minute();
            hours = mom.hour();
        }
        if (days) {
            mom.date(mom.date() + days * isAdding);
        }
        if (months) {
            mom.month(mom.month() + months * isAdding);
        }
        if (milliseconds && !ignoreUpdateOffset) {
            moment.updateOffset(mom);
        }
        // restore the minutes and hours after possibly changing dst
        if (days || months) {
            mom.minute(minutes);
            mom.hour(hours);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                    m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                        m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                            m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                                    m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                                        -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
     Languages
     ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
     Formatting
     ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
     Parsing
     ************************************/


        // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
            case 'DDDD':
                return parseTokenThreeDigits;
            case 'YYYY':
            case 'GGGG':
            case 'gggg':
                return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
            case 'Y':
            case 'G':
            case 'g':
                return parseTokenSignedNumber;
            case 'YYYYYY':
            case 'YYYYY':
            case 'GGGGG':
            case 'ggggg':
                return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
            case 'S':
                if (strict) { return parseTokenOneDigit; }
            /* falls through */
            case 'SS':
                if (strict) { return parseTokenTwoDigits; }
            /* falls through */
            case 'SSS':
                if (strict) { return parseTokenThreeDigits; }
            /* falls through */
            case 'DDD':
                return parseTokenOneToThreeDigits;
            case 'MMM':
            case 'MMMM':
            case 'dd':
            case 'ddd':
            case 'dddd':
                return parseTokenWord;
            case 'a':
            case 'A':
                return getLangDefinition(config._l)._meridiemParse;
            case 'X':
                return parseTokenTimestampMs;
            case 'Z':
            case 'ZZ':
                return parseTokenTimezone;
            case 'T':
                return parseTokenT;
            case 'SSSS':
                return parseTokenDigits;
            case 'MM':
            case 'DD':
            case 'YY':
            case 'GG':
            case 'gg':
            case 'HH':
            case 'hh':
            case 'mm':
            case 'ss':
            case 'ww':
            case 'WW':
                return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
            case 'M':
            case 'D':
            case 'd':
            case 'H':
            case 'h':
            case 'm':
            case 's':
            case 'w':
            case 'W':
            case 'e':
            case 'E':
                return parseTokenOneOrTwoDigits;
            default :
                a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
                return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
            // MONTH
            case 'M' : // fall through to MM
            case 'MM' :
                if (input != null) {
                    datePartArray[MONTH] = toInt(input) - 1;
                }
                break;
            case 'MMM' : // fall through to MMMM
            case 'MMMM' :
                a = getLangDefinition(config._l).monthsParse(input);
                // if we didn't find a month name, mark the date as invalid.
                if (a != null) {
                    datePartArray[MONTH] = a;
                } else {
                    config._pf.invalidMonth = input;
                }
                break;
            // DAY OF MONTH
            case 'D' : // fall through to DD
            case 'DD' :
                if (input != null) {
                    datePartArray[DATE] = toInt(input);
                }
                break;
            // DAY OF YEAR
            case 'DDD' : // fall through to DDDD
            case 'DDDD' :
                if (input != null) {
                    config._dayOfYear = toInt(input);
                }

                break;
            // YEAR
            case 'YY' :
                datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
                break;
            case 'YYYY' :
            case 'YYYYY' :
            case 'YYYYYY' :
                datePartArray[YEAR] = toInt(input);
                break;
            // AM / PM
            case 'a' : // fall through to A
            case 'A' :
                config._isPm = getLangDefinition(config._l).isPM(input);
                break;
            // 24 HOUR
            case 'H' : // fall through to hh
            case 'HH' : // fall through to hh
            case 'h' : // fall through to hh
            case 'hh' :
                datePartArray[HOUR] = toInt(input);
                break;
            // MINUTE
            case 'm' : // fall through to mm
            case 'mm' :
                datePartArray[MINUTE] = toInt(input);
                break;
            // SECOND
            case 's' : // fall through to ss
            case 'ss' :
                datePartArray[SECOND] = toInt(input);
                break;
            // MILLISECOND
            case 'S' :
            case 'SS' :
            case 'SSS' :
            case 'SSSS' :
                datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
                break;
            // UNIX TIMESTAMP WITH MS
            case 'X':
                config._d = new Date(parseFloat(input) * 1000);
                break;
            // TIMEZONE
            case 'Z' : // fall through to ZZ
            case 'ZZ' :
                config._useUTC = true;
                config._tzm = timezoneMinutesFromString(input);
                break;
            case 'w':
            case 'ww':
            case 'W':
            case 'WW':
            case 'd':
            case 'dd':
            case 'ddd':
            case 'dddd':
            case 'e':
            case 'E':
                token = token.substr(0, 1);
            /* falls through */
            case 'gg':
            case 'gggg':
            case 'GG':
            case 'GGGG':
            case 'GGGGG':
                token = token.substr(0, 2);
                if (input) {
                    config._w = config._w || {};
                    config._w[token] = input;
                }
                break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                var int_val = parseInt(val, 10);
                return val ?
                    (val.length < 3 ? (int_val > 68 ? 1900 + int_val : 2000 + int_val) : int_val) :
                    (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                    (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else {
            config._d = new Date(input);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
     Relative Time
     ************************************/


        // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
     Week of Year
     ************************************/


        // firstDayOfWeek       0 = sun, 6 = sat
        //                      the day of the week that starts the week
        //                      (usually sunday or monday)
        // firstDayOfWeekOfYear 0 = sun, 6 = sat
        //                      the first week is the week that contains the first
        //                      of this day of the week
        //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
     Top Level Functions
     ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
        // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function (input) {
        return moment(input).parseZone();
    };

    /************************************
     Moment Prototype
     ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                    (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                    (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                        units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                            units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                                units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var sod = makeAs(moment(), this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                        diff < 0 ? 'lastDay' :
                            diff < 1 ? 'sameDay' :
                                diff < 2 ? 'nextDay' :
                                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '',
                dayOfMonth;

            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }

                dayOfMonth = this.date();
                this.date(1);
                this._d['set' + utc + 'Month'](input);
                this.date(Math.min(dayOfMonth, this.daysInMonth()));

                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
                case 'year':
                    this.month(0);
                /* falls through */
                case 'month':
                    this.date(1);
                /* falls through */
                case 'week':
                case 'isoWeek':
                case 'day':
                    this.hours(0);
                /* falls through */
                case 'hour':
                    this.minutes(0);
                /* falls through */
                case 'minute':
                    this.seconds(0);
                /* falls through */
                case 'second':
                    this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        zone : function (input) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function () {
            return Math.ceil((this.month() + 1.0) / 3.0);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
     Duration Prototype
     ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
                this._days * 864e5 +
                (this._months % 12) * 2592e6 +
                toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
     Default Lang
     ************************************/


        // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
     Exposing Moment
     ************************************/

    function makeGlobal(deprecate) {
        var warned = false, local_moment = moment;
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        if (deprecate) {
            global.moment = function () {
                if (!warned && console && console.warn) {
                    warned = true;
                    console.warn(
                        "Accessing Moment through the global scope is " +
                            "deprecated, and will be removed in an upcoming " +
                            "release.");
                }
                return local_moment.apply(null, arguments);
            };
            extend(global.moment, local_moment);
        } else {
            global['moment'] = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
        makeGlobal(true);
    } else if (typeof define === "function" && define.amd) {
        define("moment", function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal !== true) {
                // If user provided noGlobal, he is aware of global
                makeGlobal(module.config().noGlobal === undefined);
            }

            return moment;
        });
    } else {
        makeGlobal();
    }
}).call(this);

// moment.js language configuration
// language : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ar-ma', {
        months : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§Ů_ŮŮŮŮŮ_ŮŮŮŮŮŘ˛_ŘşŘ´ŘŞ_Ř´ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŘ¨Řą_ŘŻŘŹŮŘ¨Řą".split("_"),
        monthsShort : "ŮŮŘ§ŮŘą_ŮŘ¨ŘąŘ§ŮŘą_ŮŘ§ŘąŘł_ŘŁŘ¨ŘąŮŮ_ŮŘ§Ů_ŮŮŮŮŮ_ŮŮŮŮŮŘ˛_ŘşŘ´ŘŞ_Ř´ŘŞŮŘ¨Řą_ŘŁŮŘŞŮŘ¨Řą_ŮŮŮŘ¨Řą_ŘŻŘŹŮŘ¨Řą".split("_"),
        weekdays : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŞŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
        weekdaysShort : "Ř§Ř­ŘŻ_Ř§ŘŞŮŮŮ_ŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŘąŘ¨ŘšŘ§ŘĄ_ŘŽŮŮŘł_ŘŹŮŘšŘŠ_ŘłŘ¨ŘŞ".split("_"),
        weekdaysMin : "Ř­_Ů_ŘŤ_Řą_ŘŽ_ŘŹ_Řł".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[Ř§ŮŮŮŮ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT",
            nextDay: '[ŘşŘŻŘ§ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            nextWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            lastDay: '[ŘŁŮŘł ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            lastWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "ŮŮ %s",
            past : "ŮŮŘ° %s",
            s : "ŘŤŮŘ§Ů",
            m : "ŘŻŮŮŮŘŠ",
            mm : "%d ŘŻŮŘ§ŘŚŮ",
            h : "ŘłŘ§ŘšŘŠ",
            hh : "%d ŘłŘ§ŘšŘ§ŘŞ",
            d : "ŮŮŮ",
            dd : "%d ŘŁŮŘ§Ů",
            M : "Ř´ŮŘą",
            MM : "%d ŘŁŘ´ŮŘą",
            y : "ŘłŮŘŠ",
            yy : "%d ŘłŮŮŘ§ŘŞ"
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Arabic (ar)
// author : Abdel Said : https://github.com/abdelsaid
// changes in months, weekdays : Ahmed Elkhatib

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ar', {
        months : "ŮŮŘ§ŮŘą/ ŮŘ§ŮŮŮ Ř§ŮŘŤŘ§ŮŮ_ŮŘ¨ŘąŘ§ŮŘą/ Ř´Ř¨Ř§Řˇ_ŮŘ§ŘąŘł/ Ř˘Ř°Ř§Řą_ŘŁŘ¨ŘąŮŮ/ ŮŮŘłŘ§Ů_ŮŘ§ŮŮ/ ŘŁŮŘ§Řą_ŮŮŮŮŮ/ Ř­Ř˛ŮŘąŘ§Ů_ŮŮŮŮŮ/ ŘŞŮŮŘ˛_ŘŁŘşŘłŘˇŘł/ Ř˘Ř¨_ŘłŘ¨ŘŞŮŘ¨Řą/ ŘŁŮŮŮŮ_ŘŁŮŘŞŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŁŮŮ_ŮŮŮŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŤŘ§ŮŮ_ŘŻŮŘłŮŘ¨Řą/ ŮŘ§ŮŮŮ Ř§ŮŘŁŮŮ".split("_"),
        monthsShort : "ŮŮŘ§ŮŘą/ ŮŘ§ŮŮŮ Ř§ŮŘŤŘ§ŮŮ_ŮŘ¨ŘąŘ§ŮŘą/ Ř´Ř¨Ř§Řˇ_ŮŘ§ŘąŘł/ Ř˘Ř°Ř§Řą_ŘŁŘ¨ŘąŮŮ/ ŮŮŘłŘ§Ů_ŮŘ§ŮŮ/ ŘŁŮŘ§Řą_ŮŮŮŮŮ/ Ř­Ř˛ŮŘąŘ§Ů_ŮŮŮŮŮ/ ŘŞŮŮŘ˛_ŘŁŘşŘłŘˇŘł/ Ř˘Ř¨_ŘłŘ¨ŘŞŮŘ¨Řą/ ŘŁŮŮŮŮ_ŘŁŮŘŞŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŁŮŮ_ŮŮŮŮŘ¨Řą/ ŘŞŘ´ŘąŮŮ Ř§ŮŘŤŘ§ŮŮ_ŘŻŮŘłŮŘ¨Řą/ ŮŘ§ŮŮŮ Ř§ŮŘŁŮŮ".split("_"),
        weekdays : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŤŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
        weekdaysShort : "Ř§ŮŘŁŘ­ŘŻ_Ř§ŮŘĽŘŤŮŮŮ_Ř§ŮŘŤŮŘ§ŘŤŘ§ŘĄ_Ř§ŮŘŁŘąŘ¨ŘšŘ§ŘĄ_Ř§ŮŘŽŮŮŘł_Ř§ŮŘŹŮŘšŘŠ_Ř§ŮŘłŘ¨ŘŞ".split("_"),
        weekdaysMin : "Ř­_Ů_ŘŤ_Řą_ŘŽ_ŘŹ_Řł".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[Ř§ŮŮŮŮ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT",
            nextDay: '[ŘşŘŻŘ§ ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            nextWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            lastDay: '[ŘŁŮŘł ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            lastWeek: 'dddd [ŘšŮŮ Ř§ŮŘłŘ§ŘšŘŠ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "ŮŮ %s",
            past : "ŮŮŘ° %s",
            s : "ŘŤŮŘ§Ů",
            m : "ŘŻŮŮŮŘŠ",
            mm : "%d ŘŻŮŘ§ŘŚŮ",
            h : "ŘłŘ§ŘšŘŠ",
            hh : "%d ŘłŘ§ŘšŘ§ŘŞ",
            d : "ŮŮŮ",
            dd : "%d ŘŁŮŘ§Ů",
            M : "Ř´ŮŘą",
            MM : "%d ŘŁŘ´ŮŘą",
            y : "ŘłŮŘŠ",
            yy : "%d ŘłŮŮŘ§ŘŞ"
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('bg', {
        months : "ŃĐ˝ŃĐ°ŃĐ¸_ŃĐľĐ˛ŃŃĐ°ŃĐ¸_ĐźĐ°ŃŃ_Đ°ĐżŃĐ¸Đť_ĐźĐ°Đš_ŃĐ˝Đ¸_ŃĐťĐ¸_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐżŃĐľĐźĐ˛ŃĐ¸_ĐžĐşŃĐžĐźĐ˛ŃĐ¸_Đ˝ĐžĐľĐźĐ˛ŃĐ¸_Đ´ĐľĐşĐľĐźĐ˛ŃĐ¸".split("_"),
        monthsShort : "ŃĐ˝Ń_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_ŃĐ˝Đ¸_ŃĐťĐ¸_Đ°Đ˛Đł_ŃĐľĐż_ĐžĐşŃ_Đ˝ĐžĐľ_Đ´ĐľĐş".split("_"),
        weekdays : "Đ˝ĐľĐ´ĐľĐťŃ_ĐżĐžĐ˝ĐľĐ´ĐľĐťĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃŃĐ´Đ°_ŃĐľŃĐ˛ŃŃŃŃĐş_ĐżĐľŃŃĐş_ŃŃĐąĐžŃĐ°".split("_"),
        weekdaysShort : "Đ˝ĐľĐ´_ĐżĐžĐ˝_Đ˛ŃĐž_ŃŃŃ_ŃĐľŃ_ĐżĐľŃ_ŃŃĐą".split("_"),
        weekdaysMin : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "D.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[ĐĐ˝ĐľŃ Đ˛] LT',
            nextDay : '[ĐŁŃŃĐľ Đ˛] LT',
            nextWeek : 'dddd [Đ˛] LT',
            lastDay : '[ĐŃĐľŃĐ° Đ˛] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return '[Đ Đ¸ĐˇĐźĐ¸Đ˝Đ°ĐťĐ°ŃĐ°] dddd [Đ˛] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[Đ Đ¸ĐˇĐźĐ¸Đ˝Đ°ĐťĐ¸Ń] dddd [Đ˛] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "ŃĐťĐľĐ´ %s",
            past : "ĐżŃĐľĐ´Đ¸ %s",
            s : "Đ˝ŃĐşĐžĐťĐşĐž ŃĐľĐşŃĐ˝Đ´Đ¸",
            m : "ĐźĐ¸Đ˝ŃŃĐ°",
            mm : "%d ĐźĐ¸Đ˝ŃŃĐ¸",
            h : "ŃĐ°Ń",
            hh : "%d ŃĐ°ŃĐ°",
            d : "Đ´ĐľĐ˝",
            dd : "%d Đ´Đ˝Đ¸",
            M : "ĐźĐľŃĐľŃ",
            MM : "%d ĐźĐľŃĐľŃĐ°",
            y : "ĐłĐžĐ´Đ¸Đ˝Đ°",
            yy : "%d ĐłĐžĐ´Đ¸Đ˝Đ¸"
        },
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-ĐľĐ˛';
            } else if (last2Digits === 0) {
                return number + '-ĐľĐ˝';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-ŃĐ¸';
            } else if (lastDigit === 1) {
                return number + '-Đ˛Đ¸';
            } else if (lastDigit === 2) {
                return number + '-ŃĐ¸';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ĐźĐ¸';
            } else {
                return number + '-ŃĐ¸';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function relativeTimeWithMutation(number, withoutSuffix, key) {
        var format = {
            'mm': "munutenn",
            'MM': "miz",
            'dd': "devezh"
        };
        return number + ' ' + mutation(format[key], number);
    }

    function specialMutationForYears(number) {
        switch (lastNumber(number)) {
            case 1:
            case 3:
            case 4:
            case 5:
            case 9:
                return number + ' bloaz';
            default:
                return number + ' vloaz';
        }
    }

    function lastNumber(number) {
        if (number > 9) {
            return lastNumber(number % 10);
        }
        return number;
    }

    function mutation(text, number) {
        if (number === 2) {
            return softMutation(text);
        }
        return text;
    }

    function softMutation(text) {
        var mutationTable = {
            'm': 'v',
            'b': 'v',
            'd': 'z'
        };
        if (mutationTable[text.charAt(0)] === undefined) {
            return text;
        }
        return mutationTable[text.charAt(0)] + text.substring(1);
    }

    return moment.lang('br', {
        months : "Genver_C'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
        monthsShort : "Gen_C'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
        weekdays : "Sul_Lun_Meurzh_Merc'her_Yaou_Gwener_Sadorn".split("_"),
        weekdaysShort : "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
        weekdaysMin : "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
        longDateFormat : {
            LT : "h[e]mm A",
            L : "DD/MM/YYYY",
            LL : "D [a viz] MMMM YYYY",
            LLL : "D [a viz] MMMM YYYY LT",
            LLLL : "dddd, D [a viz] MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[Hiziv da] LT',
            nextDay : '[Warc\'hoazh da] LT',
            nextWeek : 'dddd [da] LT',
            lastDay : '[Dec\'h da] LT',
            lastWeek : 'dddd [paset da] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "a-benn %s",
            past : "%s 'zo",
            s : "un nebeud segondennoĂš",
            m : "ur vunutenn",
            mm : relativeTimeWithMutation,
            h : "un eur",
            hh : "%d eur",
            d : "un devezh",
            dd : relativeTimeWithMutation,
            M : "ur miz",
            MM : relativeTimeWithMutation,
            y : "ur bloaz",
            yy : specialMutationForYears
        },
        ordinal : function (number) {
            var output = (number === 1) ? 'aĂą' : 'vet';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviÄ

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    function translate(number, withoutSuffix, key) {
        var result = number + " ";
        switch (key) {
            case 'm':
                return withoutSuffix ? 'jedna minuta' : 'jedne minute';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minuta';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'jedan sat' : 'jednog sata';
            case 'hh':
                if (number === 1) {
                    result += 'sat';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sata';
                } else {
                    result += 'sati';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dana';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mjesec';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'mjeseca';
                } else {
                    result += 'mjeseci';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'godina';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'godine';
                } else {
                    result += 'godina';
                }
                return result;
        }
    }

    return moment.lang('bs', {
        months : "januar_februar_mart_april_maj_juni_juli_avgust_septembar_oktobar_novembar_decembar".split("_"),
        monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
        weekdays : "nedjelja_ponedjeljak_utorak_srijeda_Äetvrtak_petak_subota".split("_"),
        weekdaysShort : "ned._pon._uto._sri._Äet._pet._sub.".split("_"),
        weekdaysMin : "ne_po_ut_sr_Äe_pe_su".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD. MM. YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedjelju] [u] LT';
                    case 3:
                        return '[u] [srijedu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÄer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                        return '[proĹĄlu] dddd [u] LT';
                    case 6:
                        return '[proĹĄle] [subote] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[proĹĄli] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "za %s",
            past   : "prije %s",
            s      : "par sekundi",
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : "dan",
            dd     : translate,
            M      : "mjesec",
            MM     : translate,
            y      : "godinu",
            yy     : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ca', {
        months : "gener_febrer_marĂ§_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre".split("_"),
        monthsShort : "gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.".split("_"),
        weekdays : "diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte".split("_"),
        weekdaysShort : "dg._dl._dt._dc._dj._dv._ds.".split("_"),
        weekdaysMin : "Dg_Dl_Dt_Dc_Dj_Dv_Ds".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay : function () {
                return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextDay : function () {
                return '[demĂ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastDay : function () {
                return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "en %s",
            past : "fa %s",
            s : "uns segons",
            m : "un minut",
            mm : "%d minuts",
            h : "una hora",
            hh : "%d hores",
            d : "un dia",
            dd : "%d dies",
            M : "un mes",
            MM : "%d mesos",
            y : "un any",
            yy : "%d anys"
        },
        ordinal : '%dÂş',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : czech (cs)
// author : petrbela : https://github.com/petrbela

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var months = "leden_Ăşnor_bĹezen_duben_kvÄten_Äerven_Äervenec_srpen_zĂĄĹĂ­_ĹĂ­jen_listopad_prosinec".split("_"),
        monthsShort = "led_Ăşno_bĹe_dub_kvÄ_Ävn_Ävc_srp_zĂĄĹ_ĹĂ­j_lis_pro".split("_");

    function plural(n) {
        return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + " ";
        switch (key) {
            case 's':  // a few seconds / in a few seconds / a few seconds ago
                return (withoutSuffix || isFuture) ? 'pĂĄr vteĹin' : 'pĂĄr vteĹinami';
            case 'm':  // a minute / in a minute / a minute ago
                return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
            case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'minuty' : 'minut');
                } else {
                    return result + 'minutami';
                }
                break;
            case 'h':  // an hour / in an hour / an hour ago
                return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
            case 'hh': // 9 hours / in 9 hours / 9 hours ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'hodiny' : 'hodin');
                } else {
                    return result + 'hodinami';
                }
                break;
            case 'd':  // a day / in a day / a day ago
                return (withoutSuffix || isFuture) ? 'den' : 'dnem';
            case 'dd': // 9 days / in 9 days / 9 days ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'dny' : 'dnĂ­');
                } else {
                    return result + 'dny';
                }
                break;
            case 'M':  // a month / in a month / a month ago
                return (withoutSuffix || isFuture) ? 'mÄsĂ­c' : 'mÄsĂ­cem';
            case 'MM': // 9 months / in 9 months / 9 months ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'mÄsĂ­ce' : 'mÄsĂ­cĹŻ');
                } else {
                    return result + 'mÄsĂ­ci';
                }
                break;
            case 'y':  // a year / in a year / a year ago
                return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
            case 'yy': // 9 years / in 9 years / 9 years ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'roky' : 'let');
                } else {
                    return result + 'lety';
                }
                break;
        }
    }

    return moment.lang('cs', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Äervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : "nedÄle_pondÄlĂ­_ĂşterĂ˝_stĹeda_Ätvrtek_pĂĄtek_sobota".split("_"),
        weekdaysShort : "ne_po_Ăşt_st_Ät_pĂĄ_so".split("_"),
        weekdaysMin : "ne_po_Ăşt_st_Ät_pĂĄ_so".split("_"),
        longDateFormat : {
            LT: "H:mm",
            L : "DD.MM.YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd D. MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[dnes v] LT",
            nextDay: '[zĂ­tra v] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[v nedÄli v] LT';
                    case 1:
                    case 2:
                        return '[v] dddd [v] LT';
                    case 3:
                        return '[ve stĹedu v] LT';
                    case 4:
                        return '[ve Ätvrtek v] LT';
                    case 5:
                        return '[v pĂĄtek v] LT';
                    case 6:
                        return '[v sobotu v] LT';
                }
            },
            lastDay: '[vÄera v] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[minulou nedÄli v] LT';
                    case 1:
                    case 2:
                        return '[minulĂŠ] dddd [v] LT';
                    case 3:
                        return '[minulou stĹedu v] LT';
                    case 4:
                    case 5:
                        return '[minulĂ˝] dddd [v] LT';
                    case 6:
                        return '[minulou sobotu v] LT';
                }
            },
            sameElse: "L"
        },
        relativeTime : {
            future : "za %s",
            past : "pĹed %s",
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('cv', {
        months : "ĐşÄŃĐťĐ°Ń_Đ˝Đ°ŃÄŃ_ĐżŃŃ_Đ°ĐşĐ°_ĐźĐ°Đš_Ă§ÄŃŃĐźĐľ_ŃŃÄ_Ă§ŃŃĐťĐ°_Đ°Đ˛ÄĐ˝_ŃĐżĐ°_ŃÓłĐş_ŃĐ°ŃŃĐ°Đ˛".split("_"),
        monthsShort : "ĐşÄŃ_Đ˝Đ°Ń_ĐżŃŃ_Đ°ĐşĐ°_ĐźĐ°Đš_Ă§ÄŃ_ŃŃÄ_Ă§ŃŃ_Đ°Đ˛_ŃĐżĐ°_ŃÓłĐş_ŃĐ°Ń".split("_"),
        weekdays : "Đ˛ŃŃŃĐ°ŃĐ˝Đ¸ĐşŃĐ˝_ŃŃĐ˝ŃĐ¸ĐşŃĐ˝_ŃŃĐťĐ°ŃĐ¸ĐşŃĐ˝_ŃĐ˝ĐşŃĐ˝_ĐşÄĂ§Đ˝ĐľŃĐ˝Đ¸ĐşŃĐ˝_ŃŃĐ˝ĐľĐşŃĐ˝_ŃÄĐźĐ°ŃĐşŃĐ˝".split("_"),
        weekdaysShort : "Đ˛ŃŃ_ŃŃĐ˝_ŃŃĐť_ŃĐ˝_ĐşÄĂ§_ŃŃĐ˝_ŃÄĐź".split("_"),
        weekdaysMin : "Đ˛Ń_ŃĐ˝_ŃŃ_ŃĐ˝_ĐşĂ§_ŃŃ_ŃĐź".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD-MM-YYYY",
            LL : "YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ]",
            LLL : "YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ], LT",
            LLLL : "dddd, YYYY [Ă§ŃĐťŃĐ¸] MMMM [ŃĐšÄŃÄĐ˝] D[-ĐźÄŃÄ], LT"
        },
        calendar : {
            sameDay: '[ĐĐ°ŃĐ˝] LT [ŃĐľŃĐľŃŃĐľ]',
            nextDay: '[ĐŤŃĐ°Đ˝] LT [ŃĐľŃĐľŃŃĐľ]',
            lastDay: '[ÄĐ˝ĐľŃ] LT [ŃĐľŃĐľŃŃĐľ]',
            nextWeek: '[ĂĐ¸ŃĐľŃ] dddd LT [ŃĐľŃĐľŃŃĐľ]',
            lastWeek: '[ĐŃŃĐ˝Ä] dddd LT [ŃĐľŃĐľŃŃĐľ]',
            sameElse: 'L'
        },
        relativeTime : {
            future : function (output) {
                var affix = /ŃĐľŃĐľŃ$/i.exec(output) ? "ŃĐľĐ˝" : /Ă§ŃĐť$/i.exec(output) ? "ŃĐ°Đ˝" : "ŃĐ°Đ˝";
                return output + affix;
            },
            past : "%s ĐşĐ°ŃĐťĐťĐ°",
            s : "ĐżÄŃ-Đ¸Đş Ă§ĐľĐşĐşŃĐ˝Ń",
            m : "ĐżÄŃ ĐźĐ¸Đ˝ŃŃ",
            mm : "%d ĐźĐ¸Đ˝ŃŃ",
            h : "ĐżÄŃ ŃĐľŃĐľŃ",
            hh : "%d ŃĐľŃĐľŃ",
            d : "ĐżÄŃ ĐşŃĐ˝",
            dd : "%d ĐşŃĐ˝",
            M : "ĐżÄŃ ŃĐšÄŃ",
            MM : "%d ŃĐšÄŃ",
            y : "ĐżÄŃ Ă§ŃĐť",
            yy : "%d Ă§ŃĐť"
        },
        ordinal : '%d-ĐźÄŃ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Welsh (cy)
// author : Robert Allen

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang("cy", {
        months: "Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr".split("_"),
        monthsShort: "Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag".split("_"),
        weekdays: "Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn".split("_"),
        weekdaysShort: "Sul_Llun_Maw_Mer_Iau_Gwe_Sad".split("_"),
        weekdaysMin: "Su_Ll_Ma_Me_Ia_Gw_Sa".split("_"),
        // time formats are the same as en-gb
        longDateFormat: {
            LT: "HH:mm",
            L: "DD/MM/YYYY",
            LL: "D MMMM YYYY",
            LLL: "D MMMM YYYY LT",
            LLLL: "dddd, D MMMM YYYY LT"
        },
        calendar: {
            sameDay: '[Heddiw am] LT',
            nextDay: '[Yfory am] LT',
            nextWeek: 'dddd [am] LT',
            lastDay: '[Ddoe am] LT',
            lastWeek: 'dddd [diwethaf am] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: "mewn %s",
            past: "%s yn Ă l",
            s: "ychydig eiliadau",
            m: "munud",
            mm: "%d munud",
            h: "awr",
            hh: "%d awr",
            d: "diwrnod",
            dd: "%d diwrnod",
            M: "mis",
            MM: "%d mis",
            y: "blwyddyn",
            yy: "%d flynedd"
        },
        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
        ordinal: function (number) {
            var b = number,
                output = '',
                lookup = [
                    '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                    'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                ];

            if (b > 20) {
                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                    output = 'fed'; // not 30ain, 70ain or 90ain
                } else {
                    output = 'ain';
                }
            } else if (b > 0) {
                output = lookup[b];
            }

            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('da', {
        months : "januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december".split("_"),
        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
        weekdays : "sĂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lĂ¸rdag".split("_"),
        weekdaysShort : "sĂ¸n_man_tir_ons_tor_fre_lĂ¸r".split("_"),
        weekdaysMin : "sĂ¸_ma_ti_on_to_fr_lĂ¸".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D. MMMM, YYYY LT"
        },
        calendar : {
            sameDay : '[I dag kl.] LT',
            nextDay : '[I morgen kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[I gĂĽr kl.] LT',
            lastWeek : '[sidste] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "om %s",
            past : "%s siden",
            s : "fĂĽ sekunder",
            m : "et minut",
            mm : "%d minutter",
            h : "en time",
            hh : "%d timer",
            d : "en dag",
            dd : "%d dage",
            M : "en mĂĽned",
            MM : "%d mĂĽneder",
            y : "et ĂĽr",
            yy : "%d ĂĽr"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensĂşle: https://github.com/Oire

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.lang('de', {
        months : "Januar_Februar_MĂ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
        monthsShort : "Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
        weekdays : "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
        weekdaysShort : "So._Mo._Di._Mi._Do._Fr._Sa.".split("_"),
        weekdaysMin : "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
        longDateFormat : {
            LT: "H:mm [Uhr]",
            L : "DD.MM.YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[Heute um] LT",
            sameElse: "L",
            nextDay: '[Morgen um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[Gestern um] LT',
            lastWeek: '[letzten] dddd [um] LT'
        },
        relativeTime : {
            future : "in %s",
            past : "vor %s",
            s : "ein paar Sekunden",
            m : processRelativeTime,
            mm : "%d Minuten",
            h : processRelativeTime,
            hh : "%d Stunden",
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('el', {
        monthsNominativeEl : "ÎÎąÎ˝ÎżĎÎŹĎÎšÎżĎ_ÎŚÎľÎ˛ĎÎżĎÎŹĎÎšÎżĎ_ÎÎŹĎĎÎšÎżĎ_ÎĎĎÎŻÎťÎšÎżĎ_ÎÎŹÎšÎżĎ_ÎÎżĎÎ˝ÎšÎżĎ_ÎÎżĎÎťÎšÎżĎ_ÎĎÎłÎżĎĎĎÎżĎ_ÎŁÎľĎĎÎ­ÎźÎ˛ĎÎšÎżĎ_ÎÎşĎĎÎ˛ĎÎšÎżĎ_ÎÎżÎ­ÎźÎ˛ĎÎšÎżĎ_ÎÎľÎşÎ­ÎźÎ˛ĎÎšÎżĎ".split("_"),
        monthsGenitiveEl : "ÎÎąÎ˝ÎżĎÎąĎÎŻÎżĎ_ÎŚÎľÎ˛ĎÎżĎÎąĎÎŻÎżĎ_ÎÎąĎĎÎŻÎżĎ_ÎĎĎÎšÎťÎŻÎżĎ_ÎÎąÎÎżĎ_ÎÎżĎÎ˝ÎŻÎżĎ_ÎÎżĎÎťÎŻÎżĎ_ÎĎÎłÎżĎĎĎÎżĎ_ÎŁÎľĎĎÎľÎźÎ˛ĎÎŻÎżĎ_ÎÎşĎĎÎ˛ĎÎŻÎżĎ_ÎÎżÎľÎźÎ˛ĎÎŻÎżĎ_ÎÎľÎşÎľÎźÎ˛ĎÎŻÎżĎ".split("_"),
        months : function (momentToFormat, format) {
            if (/D/.test(format.substring(0, format.indexOf("MMMM")))) { // if there is a day number before 'MMMM'
                return this._monthsGenitiveEl[momentToFormat.month()];
            } else {
                return this._monthsNominativeEl[momentToFormat.month()];
            }
        },
        monthsShort : "ÎÎąÎ˝_ÎŚÎľÎ˛_ÎÎąĎ_ÎĎĎ_ÎÎąĎ_ÎÎżĎÎ˝_ÎÎżĎÎť_ÎĎÎł_ÎŁÎľĎ_ÎÎşĎ_ÎÎżÎľ_ÎÎľÎş".split("_"),
        weekdays : "ÎĎĎÎšÎąÎşÎŽ_ÎÎľĎĎÎ­ĎÎą_Î¤ĎÎŻĎÎˇ_Î¤ÎľĎÎŹĎĎÎˇ_Î Î­ÎźĎĎÎˇ_Î ÎąĎÎąĎÎşÎľĎÎŽ_ÎŁÎŹÎ˛Î˛ÎąĎÎż".split("_"),
        weekdaysShort : "ÎĎĎ_ÎÎľĎ_Î¤ĎÎš_Î¤ÎľĎ_Î ÎľÎź_Î ÎąĎ_ÎŁÎąÎ˛".split("_"),
        weekdaysMin : "ÎĎ_ÎÎľ_Î¤Ď_Î¤Îľ_Î Îľ_Î Îą_ÎŁÎą".split("_"),
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'ÎźÎź' : 'ÎÎ';
            } else {
                return isLower ? 'ĎÎź' : 'Î Î';
            }
        },
        longDateFormat : {
            LT : "h:mm A",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendarEl : {
            sameDay : '[ÎŁÎŽÎźÎľĎÎą {}] LT',
            nextDay : '[ÎĎĎÎšÎż {}] LT',
            nextWeek : 'dddd [{}] LT',
            lastDay : '[Î§Î¸ÎľĎ {}] LT',
            lastWeek : '[ĎÎˇÎ˝ ĎĎÎżÎˇÎłÎżĎÎźÎľÎ˝Îˇ] dddd [{}] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendarEl[key],
                hours = mom && mom.hours();

            return output.replace("{}", (hours % 12 === 1 ? "ĎĎÎˇ" : "ĎĎÎšĎ"));
        },
        relativeTime : {
            future : "ĎÎľ %s",
            past : "%s ĎĎÎšÎ˝",
            s : "Î´ÎľĎĎÎľĎĎÎťÎľĎĎÎą",
            m : "Î­Î˝Îą ÎťÎľĎĎĎ",
            mm : "%d ÎťÎľĎĎÎŹ",
            h : "ÎźÎŻÎą ĎĎÎą",
            hh : "%d ĎĎÎľĎ",
            d : "ÎźÎŻÎą ÎźÎ­ĎÎą",
            dd : "%d ÎźÎ­ĎÎľĎ",
            M : "Î­Î˝ÎąĎ ÎźÎŽÎ˝ÎąĎ",
            MM : "%d ÎźÎŽÎ˝ÎľĎ",
            y : "Î­Î˝ÎąĎ ĎĎĎÎ˝ÎżĎ",
            yy : "%d ĎĎĎÎ˝ÎšÎą"
        },
        ordinal : function (number) {
            return number + 'Îˇ';
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : australian english (en-au)

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('en-au', {
        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('en-ca', {
        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "YYYY-MM-DD",
            LL : "D MMMM, YYYY",
            LLL : "D MMMM, YYYY LT",
            LLLL : "dddd, D MMMM, YYYY LT"
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });
}));

// moment.js language configuration
// language : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('en-gb', {
        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('eo', {
        months : "januaro_februaro_marto_aprilo_majo_junio_julio_aĹ­gusto_septembro_oktobro_novembro_decembro".split("_"),
        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aĹ­g_sep_okt_nov_dec".split("_"),
        weekdays : "DimanÄo_Lundo_Mardo_Merkredo_Ä´aĹ­do_Vendredo_Sabato".split("_"),
        weekdaysShort : "Dim_Lun_Mard_Merk_Ä´aĹ­_Ven_Sab".split("_"),
        weekdaysMin : "Di_Lu_Ma_Me_Ä´a_Ve_Sa".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "YYYY-MM-DD",
            LL : "D[-an de] MMMM, YYYY",
            LLL : "D[-an de] MMMM, YYYY LT",
            LLLL : "dddd, [la] D[-an de] MMMM, YYYY LT"
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'p.t.m.' : 'P.T.M.';
            } else {
                return isLower ? 'a.t.m.' : 'A.T.M.';
            }
        },
        calendar : {
            sameDay : '[HodiaĹ­ je] LT',
            nextDay : '[MorgaĹ­ je] LT',
            nextWeek : 'dddd [je] LT',
            lastDay : '[HieraĹ­ je] LT',
            lastWeek : '[pasinta] dddd [je] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "je %s",
            past : "antaĹ­ %s",
            s : "sekundoj",
            m : "minuto",
            mm : "%d minutoj",
            h : "horo",
            hh : "%d horoj",
            d : "tago",//ne 'diurno', Äar estas uzita por proksimumo
            dd : "%d tagoj",
            M : "monato",
            MM : "%d monatoj",
            y : "jaro",
            yy : "%d jaroj"
        },
        ordinal : "%da",
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : spanish (es)
// author : Julio NapurĂ­ : https://github.com/julionc

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('es', {
        months : "enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre".split("_"),
        monthsShort : "ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.".split("_"),
        weekdays : "domingo_lunes_martes_miĂŠrcoles_jueves_viernes_sĂĄbado".split("_"),
        weekdaysShort : "dom._lun._mar._miĂŠ._jue._vie._sĂĄb.".split("_"),
        weekdaysMin : "Do_Lu_Ma_Mi_Ju_Vi_SĂĄ".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD/MM/YYYY",
            LL : "D [de] MMMM [de] YYYY",
            LLL : "D [de] MMMM [de] YYYY LT",
            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
        },
        calendar : {
            sameDay : function () {
                return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextDay : function () {
                return '[maĂąana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastDay : function () {
                return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "en %s",
            past : "hace %s",
            s : "unos segundos",
            m : "un minuto",
            mm : "%d minutos",
            h : "una hora",
            hh : "%d horas",
            d : "un dĂ­a",
            dd : "%d dĂ­as",
            M : "un mes",
            MM : "%d meses",
            y : "un aĂąo",
            yy : "%d aĂąos"
        },
        ordinal : '%dÂş',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            's' : ['mĂľne sekundi', 'mĂľni sekund', 'paar sekundit'],
            'm' : ['Ăźhe minuti', 'Ăźks minut'],
            'mm': [number + ' minuti', number + ' minutit'],
            'h' : ['Ăźhe tunni', 'tund aega', 'Ăźks tund'],
            'hh': [number + ' tunni', number + ' tundi'],
            'd' : ['Ăźhe pĂ¤eva', 'Ăźks pĂ¤ev'],
            'M' : ['kuu aja', 'kuu aega', 'Ăźks kuu'],
            'MM': [number + ' kuu', number + ' kuud'],
            'y' : ['Ăźhe aasta', 'aasta', 'Ăźks aasta'],
            'yy': [number + ' aasta', number + ' aastat']
        };
        if (withoutSuffix) {
            return format[key][2] ? format[key][2] : format[key][1];
        }
        return isFuture ? format[key][0] : format[key][1];
    }

    return moment.lang('et', {
        months        : "jaanuar_veebruar_mĂ¤rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember".split("_"),
        monthsShort   : "jaan_veebr_mĂ¤rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets".split("_"),
        weekdays      : "pĂźhapĂ¤ev_esmaspĂ¤ev_teisipĂ¤ev_kolmapĂ¤ev_neljapĂ¤ev_reede_laupĂ¤ev".split("_"),
        weekdaysShort : "P_E_T_K_N_R_L".split("_"),
        weekdaysMin   : "P_E_T_K_N_R_L".split("_"),
        longDateFormat : {
            LT   : "H:mm",
            L    : "DD.MM.YYYY",
            LL   : "D. MMMM YYYY",
            LLL  : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay  : '[TĂ¤na,] LT',
            nextDay  : '[Homme,] LT',
            nextWeek : '[JĂ¤rgmine] dddd LT',
            lastDay  : '[Eile,] LT',
            lastWeek : '[Eelmine] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s pĂ¤rast",
            past   : "%s tagasi",
            s      : processRelativeTime,
            m      : processRelativeTime,
            mm     : processRelativeTime,
            h      : processRelativeTime,
            hh     : processRelativeTime,
            d      : processRelativeTime,
            dd     : '%d pĂ¤eva',
            M      : processRelativeTime,
            MM     : processRelativeTime,
            y      : processRelativeTime,
            yy     : processRelativeTime
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('eu', {
        months : "urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua".split("_"),
        monthsShort : "urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.".split("_"),
        weekdays : "igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata".split("_"),
        weekdaysShort : "ig._al._ar._az._og._ol._lr.".split("_"),
        weekdaysMin : "ig_al_ar_az_og_ol_lr".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "YYYY-MM-DD",
            LL : "YYYY[ko] MMMM[ren] D[a]",
            LLL : "YYYY[ko] MMMM[ren] D[a] LT",
            LLLL : "dddd, YYYY[ko] MMMM[ren] D[a] LT",
            l : "YYYY-M-D",
            ll : "YYYY[ko] MMM D[a]",
            lll : "YYYY[ko] MMM D[a] LT",
            llll : "ddd, YYYY[ko] MMM D[a] LT"
        },
        calendar : {
            sameDay : '[gaur] LT[etan]',
            nextDay : '[bihar] LT[etan]',
            nextWeek : 'dddd LT[etan]',
            lastDay : '[atzo] LT[etan]',
            lastWeek : '[aurreko] dddd LT[etan]',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s barru",
            past : "duela %s",
            s : "segundo batzuk",
            m : "minutu bat",
            mm : "%d minutu",
            h : "ordu bat",
            hh : "%d ordu",
            d : "egun bat",
            dd : "%d egun",
            M : "hilabete bat",
            MM : "%d hilabete",
            y : "urte bat",
            yy : "%d urte"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Persian Language
// author : Ebrahim Byagowi : https://github.com/ebraminio

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var symbolMap = {
        '1': 'Űą',
        '2': 'Ű˛',
        '3': 'Űł',
        '4': 'Ű´',
        '5': 'Űľ',
        '6': 'Űś',
        '7': 'Űˇ',
        '8': 'Ű¸',
        '9': 'Űš',
        '0': 'Ű°'
    }, numberMap = {
        'Űą': '1',
        'Ű˛': '2',
        'Űł': '3',
        'Ű´': '4',
        'Űľ': '5',
        'Űś': '6',
        'Űˇ': '7',
        'Ű¸': '8',
        'Űš': '9',
        'Ű°': '0'
    };

    return moment.lang('fa', {
        months : 'ÚŘ§ŮŮŰŮ_ŮŮŘąŰŮ_ŮŘ§ŘąŘł_Ř˘ŮŘąŰŮ_ŮŮ_ÚŮŘŚŮ_ÚŮŘŚŰŮ_Ř§ŮŘŞ_ŘłŮžŘŞŘ§ŮŘ¨Řą_Ř§ÚŠŘŞŘ¨Řą_ŮŮŘ§ŮŘ¨Řą_ŘŻŘłŘ§ŮŘ¨Řą'.split('_'),
        monthsShort : 'ÚŘ§ŮŮŰŮ_ŮŮŘąŰŮ_ŮŘ§ŘąŘł_Ř˘ŮŘąŰŮ_ŮŮ_ÚŮŘŚŮ_ÚŮŘŚŰŮ_Ř§ŮŘŞ_ŘłŮžŘŞŘ§ŮŘ¨Řą_Ř§ÚŠŘŞŘ¨Řą_ŮŮŘ§ŮŘ¨Řą_ŘŻŘłŘ§ŮŘ¨Řą'.split('_'),
        weekdays : 'ŰÚŠ\u200cŘ´ŮŘ¨Ů_ŘŻŮŘ´ŮŘ¨Ů_ŘłŮ\u200cŘ´ŮŘ¨Ů_ÚŮŘ§ŘąŘ´ŮŘ¨Ů_ŮžŮŘŹ\u200cŘ´ŮŘ¨Ů_ŘŹŮŘšŮ_Ř´ŮŘ¨Ů'.split('_'),
        weekdaysShort : 'ŰÚŠ\u200cŘ´ŮŘ¨Ů_ŘŻŮŘ´ŮŘ¨Ů_ŘłŮ\u200cŘ´ŮŘ¨Ů_ÚŮŘ§ŘąŘ´ŮŘ¨Ů_ŮžŮŘŹ\u200cŘ´ŮŘ¨Ů_ŘŹŮŘšŮ_Ř´ŮŘ¨Ů'.split('_'),
        weekdaysMin : 'Ű_ŘŻ_Řł_Ú_Ůž_ŘŹ_Ř´'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return "ŮŘ¨Ů Ř§Ř˛ Ř¸ŮŘą";
            } else {
                return "Ř¨ŘšŘŻ Ř§Ř˛ Ř¸ŮŘą";
            }
        },
        calendar : {
            sameDay : '[Ř§ŮŘąŮŘ˛ ŘłŘ§ŘšŘŞ] LT',
            nextDay : '[ŮŘąŘŻŘ§ ŘłŘ§ŘšŘŞ] LT',
            nextWeek : 'dddd [ŘłŘ§ŘšŘŞ] LT',
            lastDay : '[ŘŻŰŘąŮŘ˛ ŘłŘ§ŘšŘŞ] LT',
            lastWeek : 'dddd [ŮžŰŘ´] [ŘłŘ§ŘšŘŞ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ŘŻŘą %s',
            past : '%s ŮžŰŘ´',
            s : 'ÚŮŘŻŰŮ ŘŤŘ§ŮŰŮ',
            m : 'ŰÚŠ ŘŻŮŰŮŮ',
            mm : '%d ŘŻŮŰŮŮ',
            h : 'ŰÚŠ ŘłŘ§ŘšŘŞ',
            hh : '%d ŘłŘ§ŘšŘŞ',
            d : 'ŰÚŠ ŘąŮŘ˛',
            dd : '%d ŘąŮŘ˛',
            M : 'ŰÚŠ ŮŘ§Ů',
            MM : '%d ŮŘ§Ů',
            y : 'ŰÚŠ ŘłŘ§Ů',
            yy : '%d ŘłŘ§Ů'
        },
        preparse: function (string) {
            return string.replace(/[Ű°-Űš]/g, function (match) {
                return numberMap[match];
            }).replace(/Ř/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ř');
        },
        ordinal : '%dŮ',
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var numbers_past = 'nolla yksi kaksi kolme neljĂ¤ viisi kuusi seitsemĂ¤n kahdeksan yhdeksĂ¤n'.split(' '),
        numbers_future = ['nolla', 'yhden', 'kahden', 'kolmen', 'neljĂ¤n', 'viiden', 'kuuden',
            numbers_past[7], numbers_past[8], numbers_past[9]];

    function translate(number, withoutSuffix, key, isFuture) {
        var result = "";
        switch (key) {
            case 's':
                return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
            case 'm':
                return isFuture ? 'minuutin' : 'minuutti';
            case 'mm':
                result = isFuture ? 'minuutin' : 'minuuttia';
                break;
            case 'h':
                return isFuture ? 'tunnin' : 'tunti';
            case 'hh':
                result = isFuture ? 'tunnin' : 'tuntia';
                break;
            case 'd':
                return isFuture ? 'pĂ¤ivĂ¤n' : 'pĂ¤ivĂ¤';
            case 'dd':
                result = isFuture ? 'pĂ¤ivĂ¤n' : 'pĂ¤ivĂ¤Ă¤';
                break;
            case 'M':
                return isFuture ? 'kuukauden' : 'kuukausi';
            case 'MM':
                result = isFuture ? 'kuukauden' : 'kuukautta';
                break;
            case 'y':
                return isFuture ? 'vuoden' : 'vuosi';
            case 'yy':
                result = isFuture ? 'vuoden' : 'vuotta';
                break;
        }
        result = verbal_number(number, isFuture) + " " + result;
        return result;
    }

    function verbal_number(number, isFuture) {
        return number < 10 ? (isFuture ? numbers_future[number] : numbers_past[number]) : number;
    }

    return moment.lang('fi', {
        months : "tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesĂ¤kuu_heinĂ¤kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu".split("_"),
        monthsShort : "tammi_helmi_maalis_huhti_touko_kesĂ¤_heinĂ¤_elo_syys_loka_marras_joulu".split("_"),
        weekdays : "sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai".split("_"),
        weekdaysShort : "su_ma_ti_ke_to_pe_la".split("_"),
        weekdaysMin : "su_ma_ti_ke_to_pe_la".split("_"),
        longDateFormat : {
            LT : "HH.mm",
            L : "DD.MM.YYYY",
            LL : "Do MMMM[ta] YYYY",
            LLL : "Do MMMM[ta] YYYY, [klo] LT",
            LLLL : "dddd, Do MMMM[ta] YYYY, [klo] LT",
            l : "D.M.YYYY",
            ll : "Do MMM YYYY",
            lll : "Do MMM YYYY, [klo] LT",
            llll : "ddd, Do MMM YYYY, [klo] LT"
        },
        calendar : {
            sameDay : '[tĂ¤nĂ¤Ă¤n] [klo] LT',
            nextDay : '[huomenna] [klo] LT',
            nextWeek : 'dddd [klo] LT',
            lastDay : '[eilen] [klo] LT',
            lastWeek : '[viime] dddd[na] [klo] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s pĂ¤Ă¤stĂ¤",
            past : "%s sitten",
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinal : "%d.",
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('fo', {
        months : "januar_februar_mars_aprĂ­l_mai_juni_juli_august_september_oktober_november_desember".split("_"),
        monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
        weekdays : "sunnudagur_mĂĄnadagur_tĂ˝sdagur_mikudagur_hĂłsdagur_frĂ­ggjadagur_leygardagur".split("_"),
        weekdaysShort : "sun_mĂĄn_tĂ˝s_mik_hĂłs_frĂ­_ley".split("_"),
        weekdaysMin : "su_mĂĄ_tĂ˝_mi_hĂł_fr_le".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D. MMMM, YYYY LT"
        },
        calendar : {
            sameDay : '[Ă dag kl.] LT',
            nextDay : '[Ă morgin kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[Ă gjĂĄr kl.] LT',
            lastWeek : '[sĂ­Ă°stu] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "um %s",
            past : "%s sĂ­Ă°ani",
            s : "fĂĄ sekund",
            m : "ein minutt",
            mm : "%d minuttir",
            h : "ein tĂ­mi",
            hh : "%d tĂ­mar",
            d : "ein dagur",
            dd : "%d dagar",
            M : "ein mĂĄnaĂ°i",
            MM : "%d mĂĄnaĂ°ir",
            y : "eitt ĂĄr",
            yy : "%d ĂĄr"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('fr-ca', {
        months : "janvier_fĂŠvrier_mars_avril_mai_juin_juillet_aoĂťt_septembre_octobre_novembre_dĂŠcembre".split("_"),
        monthsShort : "janv._fĂŠvr._mars_avr._mai_juin_juil._aoĂťt_sept._oct._nov._dĂŠc.".split("_"),
        weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
        weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
        weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "YYYY-MM-DD",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[Aujourd'hui Ă ] LT",
            nextDay: '[Demain Ă ] LT',
            nextWeek: 'dddd [Ă ] LT',
            lastDay: '[Hier Ă ] LT',
            lastWeek: 'dddd [dernier Ă ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "dans %s",
            past : "il y a %s",
            s : "quelques secondes",
            m : "une minute",
            mm : "%d minutes",
            h : "une heure",
            hh : "%d heures",
            d : "un jour",
            dd : "%d jours",
            M : "un mois",
            MM : "%d mois",
            y : "un an",
            yy : "%d ans"
        },
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        }
    });
}));

// moment.js language configuration
// language : french (fr)
// author : John Fischer : https://github.com/jfroffice

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('fr', {
        months : "janvier_fĂŠvrier_mars_avril_mai_juin_juillet_aoĂťt_septembre_octobre_novembre_dĂŠcembre".split("_"),
        monthsShort : "janv._fĂŠvr._mars_avr._mai_juin_juil._aoĂťt_sept._oct._nov._dĂŠc.".split("_"),
        weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
        weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
        weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[Aujourd'hui Ă ] LT",
            nextDay: '[Demain Ă ] LT',
            nextWeek: 'dddd [Ă ] LT',
            lastDay: '[Hier Ă ] LT',
            lastWeek: 'dddd [dernier Ă ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "dans %s",
            past : "il y a %s",
            s : "quelques secondes",
            m : "une minute",
            mm : "%d minutes",
            h : "une heure",
            hh : "%d heures",
            d : "un jour",
            dd : "%d jours",
            M : "un mois",
            MM : "%d mois",
            y : "un an",
            yy : "%d ans"
        },
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('gl', {
        months : "Xaneiro_Febreiro_Marzo_Abril_Maio_XuĂąo_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro".split("_"),
        monthsShort : "Xan._Feb._Mar._Abr._Mai._XuĂą._Xul._Ago._Set._Out._Nov._Dec.".split("_"),
        weekdays : "Domingo_Luns_Martes_MĂŠrcores_Xoves_Venres_SĂĄbado".split("_"),
        weekdaysShort : "Dom._Lun._Mar._MĂŠr._Xov._Ven._SĂĄb.".split("_"),
        weekdaysMin : "Do_Lu_Ma_MĂŠ_Xo_Ve_SĂĄ".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay : function () {
                return '[hoxe ' + ((this.hours() !== 1) ? 'ĂĄs' : 'ĂĄ') + '] LT';
            },
            nextDay : function () {
                return '[maĂąĂĄ ' + ((this.hours() !== 1) ? 'ĂĄs' : 'ĂĄ') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [' + ((this.hours() !== 1) ? 'ĂĄs' : 'a') + '] LT';
            },
            lastDay : function () {
                return '[onte ' + ((this.hours() !== 1) ? 'ĂĄ' : 'a') + '] LT';
            },
            lastWeek : function () {
                return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'ĂĄs' : 'a') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : function (str) {
                if (str === "uns segundos") {
                    return "nuns segundos";
                }
                return "en " + str;
            },
            past : "hai %s",
            s : "uns segundos",
            m : "un minuto",
            mm : "%d minutos",
            h : "unha hora",
            hh : "%d horas",
            d : "un dĂ­a",
            dd : "%d dĂ­as",
            M : "un mes",
            MM : "%d meses",
            y : "un ano",
            yy : "%d anos"
        },
        ordinal : '%dÂş',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('he', {
        months : "×× ×××¨_×¤××¨×××¨_××¨×Ľ_××¤×¨××_×××_××× ×_××××_×××××Ą×_×Ą×¤××××¨_×××§××××¨_× ×××××¨_××Ś×××¨".split("_"),
        monthsShort : "×× ××ł_×¤××¨×ł_××¨×Ľ_××¤×¨×ł_×××_××× ×_××××_××××ł_×Ą×¤××ł_×××§×ł_× ×××ł_××Ś××ł".split("_"),
        weekdays : "×¨××Š××_×Š× ×_×Š×××Š×_×¨×××˘×_××××Š×_×Š××Š×_×Š××Ş".split("_"),
        weekdaysShort : "××ł_××ł_××ł_××ł_××ł_××ł_×Š×ł".split("_"),
        weekdaysMin : "×_×_×_×_×_×_×Š".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D [×]MMMM YYYY",
            LLL : "D [×]MMMM YYYY LT",
            LLLL : "dddd, D [×]MMMM YYYY LT",
            l : "D/M/YYYY",
            ll : "D MMM YYYY",
            lll : "D MMM YYYY LT",
            llll : "ddd, D MMM YYYY LT"
        },
        calendar : {
            sameDay : '[×××× ×Öž]LT',
            nextDay : '[×××¨ ×Öž]LT',
            nextWeek : 'dddd [××Š×˘×] LT',
            lastDay : '[××Ş××× ×Öž]LT',
            lastWeek : '[××××] dddd [××××¨×× ××Š×˘×] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "××˘×× %s",
            past : "××¤× × %s",
            s : "××Ą×¤×¨ ×Š× ×××Ş",
            m : "××§×",
            mm : "%d ××§××Ş",
            h : "×Š×˘×",
            hh : function (number) {
                if (number === 2) {
                    return "×Š×˘×Ş×××";
                }
                return number + " ×Š×˘××Ş";
            },
            d : "×××",
            dd : function (number) {
                if (number === 2) {
                    return "××××××";
                }
                return number + " ××××";
            },
            M : "××××Š",
            MM : function (number) {
                if (number === 2) {
                    return "××××Š×××";
                }
                return number + " ××××Š××";
            },
            y : "×Š× ×",
            yy : function (number) {
                if (number === 2) {
                    return "×Š× ×Ş×××";
                }
                return number + " ×Š× ××";
            }
        }
    });
}));

// moment.js language configuration
// language : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var symbolMap = {
            '1': 'ŕĽ§',
            '2': 'ŕĽ¨',
            '3': 'ŕĽŠ',
            '4': 'ŕĽŞ',
            '5': 'ŕĽŤ',
            '6': 'ŕĽŹ',
            '7': 'ŕĽ­',
            '8': 'ŕĽŽ',
            '9': 'ŕĽŻ',
            '0': 'ŕĽŚ'
        },
        numberMap = {
            'ŕĽ§': '1',
            'ŕĽ¨': '2',
            'ŕĽŠ': '3',
            'ŕĽŞ': '4',
            'ŕĽŤ': '5',
            'ŕĽŹ': '6',
            'ŕĽ­': '7',
            'ŕĽŽ': '8',
            'ŕĽŻ': '9',
            'ŕĽŚ': '0'
        };

    return moment.lang('hi', {
        months : 'ŕ¤ŕ¤¨ŕ¤ľŕ¤°ŕĽ_ŕ¤Ťŕ¤źŕ¤°ŕ¤ľŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕĽŕ¤˛_ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤_ŕ¤ŕ¤ŕ¤¸ŕĽŕ¤¤_ŕ¤¸ŕ¤żŕ¤¤ŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕ¤ľŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤Śŕ¤żŕ¤¸ŕ¤ŽŕĽŕ¤Źŕ¤°'.split("_"),
        monthsShort : 'ŕ¤ŕ¤¨._ŕ¤Ťŕ¤źŕ¤°._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛._ŕ¤ŕ¤._ŕ¤¸ŕ¤żŕ¤¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕ¤ľ._ŕ¤Śŕ¤żŕ¤¸.'.split("_"),
        weekdays : 'ŕ¤°ŕ¤ľŕ¤żŕ¤ľŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤ľŕ¤žŕ¤°_ŕ¤Žŕ¤ŕ¤ŕ¤˛ŕ¤ľŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤ľŕ¤žŕ¤°_ŕ¤ŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤ľŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤ľŕ¤žŕ¤°'.split("_"),
        weekdaysShort : 'ŕ¤°ŕ¤ľŕ¤ż_ŕ¤¸ŕĽŕ¤Ž_ŕ¤Žŕ¤ŕ¤ŕ¤˛_ŕ¤ŹŕĽŕ¤§_ŕ¤ŕĽŕ¤°ŕĽ_ŕ¤śŕĽŕ¤ŕĽŕ¤°_ŕ¤śŕ¤¨ŕ¤ż'.split("_"),
        weekdaysMin : 'ŕ¤°_ŕ¤¸ŕĽ_ŕ¤Žŕ¤_ŕ¤ŹŕĽ_ŕ¤ŕĽ_ŕ¤śŕĽ_ŕ¤ś'.split("_"),
        longDateFormat : {
            LT : "A h:mm ŕ¤Źŕ¤ŕĽ",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY, LT",
            LLLL : "dddd, D MMMM YYYY, LT"
        },
        calendar : {
            sameDay : '[ŕ¤ŕ¤] LT',
            nextDay : '[ŕ¤ŕ¤˛] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ŕ¤ŕ¤˛] LT',
            lastWeek : '[ŕ¤Şŕ¤żŕ¤ŕ¤˛ŕĽ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s ŕ¤ŽŕĽŕ¤",
            past : "%s ŕ¤Şŕ¤šŕ¤˛ŕĽ",
            s : "ŕ¤ŕĽŕ¤ ŕ¤šŕĽ ŕ¤ŕĽŕ¤ˇŕ¤Ł",
            m : "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕ¤",
            mm : "%d ŕ¤Žŕ¤żŕ¤¨ŕ¤",
            h : "ŕ¤ŕ¤ ŕ¤ŕ¤ŕ¤ŕ¤ž",
            hh : "%d ŕ¤ŕ¤ŕ¤ŕĽ",
            d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤¨",
            dd : "%d ŕ¤Śŕ¤żŕ¤¨",
            M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕĽŕ¤¨ŕĽ",
            MM : "%d ŕ¤Žŕ¤šŕĽŕ¤¨ŕĽ",
            y : "ŕ¤ŕ¤ ŕ¤ľŕ¤°ŕĽŕ¤ˇ",
            yy : "%d ŕ¤ľŕ¤°ŕĽŕ¤ˇ"
        },
        preparse: function (string) {
            return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return "ŕ¤°ŕ¤žŕ¤¤";
            } else if (hour < 10) {
                return "ŕ¤¸ŕĽŕ¤Źŕ¤š";
            } else if (hour < 17) {
                return "ŕ¤ŚŕĽŕ¤Şŕ¤šŕ¤°";
            } else if (hour < 20) {
                return "ŕ¤śŕ¤žŕ¤Ž";
            } else {
                return "ŕ¤°ŕ¤žŕ¤¤";
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : hrvatski (hr)
// author : Bojan MarkoviÄ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovĹĄek

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    function translate(number, withoutSuffix, key) {
        var result = number + " ";
        switch (key) {
            case 'm':
                return withoutSuffix ? 'jedna minuta' : 'jedne minute';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minuta';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'jedan sat' : 'jednog sata';
            case 'hh':
                if (number === 1) {
                    result += 'sat';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sata';
                } else {
                    result += 'sati';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dana';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mjesec';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'mjeseca';
                } else {
                    result += 'mjeseci';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'godina';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'godine';
                } else {
                    result += 'godina';
                }
                return result;
        }
    }

    return moment.lang('hr', {
        months : "sjeÄanj_veljaÄa_oĹžujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac".split("_"),
        monthsShort : "sje._vel._oĹžu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.".split("_"),
        weekdays : "nedjelja_ponedjeljak_utorak_srijeda_Äetvrtak_petak_subota".split("_"),
        weekdaysShort : "ned._pon._uto._sri._Äet._pet._sub.".split("_"),
        weekdaysMin : "ne_po_ut_sr_Äe_pe_su".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD. MM. YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedjelju] [u] LT';
                    case 3:
                        return '[u] [srijedu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÄer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                        return '[proĹĄlu] dddd [u] LT';
                    case 6:
                        return '[proĹĄle] [subote] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[proĹĄli] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "za %s",
            past   : "prije %s",
            s      : "par sekundi",
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : "dan",
            dd     : translate,
            M      : "mjesec",
            MM     : translate,
            y      : "godinu",
            yy     : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var weekEndings = 'vasĂĄrnap hĂŠtfĹn kedden szerdĂĄn csĂźtĂśrtĂśkĂśn pĂŠnteken szombaton'.split(' ');

    function translate(number, withoutSuffix, key, isFuture) {
        var num = number,
            suffix;

        switch (key) {
            case 's':
                return (isFuture || withoutSuffix) ? 'nĂŠhĂĄny mĂĄsodperc' : 'nĂŠhĂĄny mĂĄsodperce';
            case 'm':
                return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
            case 'mm':
                return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
            case 'h':
                return 'egy' + (isFuture || withoutSuffix ? ' Ăłra' : ' ĂłrĂĄja');
            case 'hh':
                return num + (isFuture || withoutSuffix ? ' Ăłra' : ' ĂłrĂĄja');
            case 'd':
                return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
            case 'dd':
                return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
            case 'M':
                return 'egy' + (isFuture || withoutSuffix ? ' hĂłnap' : ' hĂłnapja');
            case 'MM':
                return num + (isFuture || withoutSuffix ? ' hĂłnap' : ' hĂłnapja');
            case 'y':
                return 'egy' + (isFuture || withoutSuffix ? ' ĂŠv' : ' ĂŠve');
            case 'yy':
                return num + (isFuture || withoutSuffix ? ' ĂŠv' : ' ĂŠve');
        }

        return '';
    }

    function week(isFuture) {
        return (isFuture ? '' : '[mĂşlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
    }

    return moment.lang('hu', {
        months : "januĂĄr_februĂĄr_mĂĄrcius_ĂĄprilis_mĂĄjus_jĂşnius_jĂşlius_augusztus_szeptember_oktĂłber_november_december".split("_"),
        monthsShort : "jan_feb_mĂĄrc_ĂĄpr_mĂĄj_jĂşn_jĂşl_aug_szept_okt_nov_dec".split("_"),
        weekdays : "vasĂĄrnap_hĂŠtfĹ_kedd_szerda_csĂźtĂśrtĂśk_pĂŠntek_szombat".split("_"),
        weekdaysShort : "vas_hĂŠt_kedd_sze_csĂźt_pĂŠn_szo".split("_"),
        weekdaysMin : "v_h_k_sze_cs_p_szo".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "YYYY.MM.DD.",
            LL : "YYYY. MMMM D.",
            LLL : "YYYY. MMMM D., LT",
            LLLL : "YYYY. MMMM D., dddd LT"
        },
        calendar : {
            sameDay : '[ma] LT[-kor]',
            nextDay : '[holnap] LT[-kor]',
            nextWeek : function () {
                return week.call(this, true);
            },
            lastDay : '[tegnap] LT[-kor]',
            lastWeek : function () {
                return week.call(this, false);
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s mĂşlva",
            past : "%s",
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    function monthsCaseReplace(m, format) {
        var months = {
                'nominative': 'Ő°Ő¸ÖŐśŐžŐĄÖ_ÖŐĽŐżÖŐžŐĄÖ_Ő´ŐĄÖŐż_ŐĄŐşÖŐŤŐŹ_Ő´ŐĄŐľŐŤŐ˝_Ő°Ő¸ÖŐśŐŤŐ˝_Ő°Ő¸ÖŐŹŐŤŐ˝_ÖŐŁŐ¸Ő˝ŐżŐ¸Ő˝_Ő˝ŐĽŐşŐżŐĽŐ´Ő˘ŐĽÖ_Ő°Ő¸ŐŻŐżŐĽŐ´Ő˘ŐĽÖ_ŐśŐ¸ŐľŐĽŐ´Ő˘ŐĽÖ_Ő¤ŐĽŐŻŐżŐĽŐ´Ő˘ŐĽÖ'.split('_'),
                'accusative': 'Ő°Ő¸ÖŐśŐžŐĄÖŐŤ_ÖŐĽŐżÖŐžŐĄÖŐŤ_Ő´ŐĄÖŐżŐŤ_ŐĄŐşÖŐŤŐŹŐŤ_Ő´ŐĄŐľŐŤŐ˝ŐŤ_Ő°Ő¸ÖŐśŐŤŐ˝ŐŤ_Ő°Ő¸ÖŐŹŐŤŐ˝ŐŤ_ÖŐŁŐ¸Ő˝ŐżŐ¸Ő˝ŐŤ_Ő˝ŐĽŐşŐżŐĽŐ´Ő˘ŐĽÖŐŤ_Ő°Ő¸ŐŻŐżŐĽŐ´Ő˘ŐĽÖŐŤ_ŐśŐ¸ŐľŐĽŐ´Ő˘ŐĽÖŐŤ_Ő¤ŐĽŐŻŐżŐĽŐ´Ő˘ŐĽÖŐŤ'.split('_')
            },

            nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                'accusative' :
                'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = 'Ő°ŐśŐž_ÖŐżÖ_Ő´ÖŐż_ŐĄŐşÖ_Ő´ŐľŐ˝_Ő°ŐśŐ˝_Ő°ŐŹŐ˝_ÖŐŁŐ˝_Ő˝ŐşŐż_Ő°ŐŻŐż_ŐśŐ´Ő˘_Ő¤ŐŻŐż'.split('_');

        return monthsShort[m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = 'ŐŻŐŤÖŐĄŐŻŐŤ_ŐĽÖŐŻŐ¸ÖŐˇŐĄŐ˘ŐŠŐŤ_ŐĽÖŐĽÖŐˇŐĄŐ˘ŐŠŐŤ_ŐšŐ¸ÖŐĽÖŐˇŐĄŐ˘ŐŠŐŤ_Ő°ŐŤŐśŐŁŐˇŐĄŐ˘ŐŠŐŤ_Ő¸ÖÖŐ˘ŐĄŐŠ_ŐˇŐĄŐ˘ŐĄŐŠ'.split('_');

        return weekdays[m.day()];
    }

    return moment.lang('hy-am', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : "ŐŻÖŐŻ_ŐĽÖŐŻ_ŐĽÖÖ_ŐšÖÖ_Ő°ŐśŐŁ_Ő¸ÖÖŐ˘_ŐˇŐ˘ŐŠ".split("_"),
        weekdaysMin : "ŐŻÖŐŻ_ŐĽÖŐŻ_ŐĽÖÖ_ŐšÖÖ_Ő°ŐśŐŁ_Ő¸ÖÖŐ˘_ŐˇŐ˘ŐŠ".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY ŐŠ.",
            LLL : "D MMMM YYYY ŐŠ., LT",
            LLLL : "dddd, D MMMM YYYY ŐŠ., LT"
        },
        calendar : {
            sameDay: '[ŐĄŐľŐ˝ÖÖ] LT',
            nextDay: '[ŐžŐĄŐ˛Ő¨] LT',
            lastDay: '[ŐĽÖŐĽŐŻ] LT',
            nextWeek: function () {
                return 'dddd [ÖÖŐ¨ ŐŞŐĄŐ´Ő¨] LT';
            },
            lastWeek: function () {
                return '[ŐĄŐśÖŐĄŐŽ] dddd [ÖÖŐ¨ ŐŞŐĄŐ´Ő¨] LT';
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "%s Ő°ŐĽŐżŐ¸",
            past : "%s ŐĄŐźŐĄŐť",
            s : "Ő´ŐŤ ÖŐĄŐśŐŤ ŐžŐĄŐľÖŐŻŐľŐĄŐś",
            m : "ÖŐ¸ŐşŐĽ",
            mm : "%d ÖŐ¸ŐşŐĽ",
            h : "ŐŞŐĄŐ´",
            hh : "%d ŐŞŐĄŐ´",
            d : "ÖÖ",
            dd : "%d ÖÖ",
            M : "ŐĄŐ´ŐŤŐ˝",
            MM : "%d ŐĄŐ´ŐŤŐ˝",
            y : "ŐżŐĄÖŐŤ",
            yy : "%d ŐżŐĄÖŐŤ"
        },

        meridiem : function (hour) {
            if (hour < 4) {
                return "ŐŁŐŤŐˇŐĽÖŐžŐĄ";
            } else if (hour < 12) {
                return "ŐĄŐźŐĄŐžŐ¸ŐżŐžŐĄ";
            } else if (hour < 17) {
                return "ÖŐĽÖŐĽŐŻŐžŐĄ";
            } else {
                return "ŐĽÖŐĽŐŻŐ¸ŐľŐĄŐś";
            }
        },

        ordinal: function (number, period) {
            switch (period) {
                case 'DDD':
                case 'w':
                case 'W':
                case 'DDDo':
                    if (number === 1) {
                        return number + '-ŐŤŐś';
                    }
                    return number + '-ÖŐ¤';
                default:
                    return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('id', {
        months : "Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember".split("_"),
        monthsShort : "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des".split("_"),
        weekdays : "Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu".split("_"),
        weekdaysShort : "Min_Sen_Sel_Rab_Kam_Jum_Sab".split("_"),
        weekdaysMin : "Mg_Sn_Sl_Rb_Km_Jm_Sb".split("_"),
        longDateFormat : {
            LT : "HH.mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY [pukul] LT",
            LLLL : "dddd, D MMMM YYYY [pukul] LT"
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'siang';
            } else if (hours < 19) {
                return 'sore';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Besok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kemarin pukul] LT',
            lastWeek : 'dddd [lalu pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "dalam %s",
            past : "%s yang lalu",
            s : "beberapa detik",
            m : "semenit",
            mm : "%d menit",
            h : "sejam",
            hh : "%d jam",
            d : "sehari",
            dd : "%d hari",
            M : "sebulan",
            MM : "%d bulan",
            y : "setahun",
            yy : "%d tahun"
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : icelandic (is)
// author : Hinrik Ărn SigurĂ°sson : https://github.com/hinrik

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function plural(n) {
        if (n % 100 === 11) {
            return true;
        } else if (n % 10 === 1) {
            return false;
        }
        return true;
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + " ";
        switch (key) {
            case 's':
                return withoutSuffix || isFuture ? 'nokkrar sekĂşndur' : 'nokkrum sekĂşndum';
            case 'm':
                return withoutSuffix ? 'mĂ­nĂşta' : 'mĂ­nĂştu';
            case 'mm':
                if (plural(number)) {
                    return result + (withoutSuffix || isFuture ? 'mĂ­nĂştur' : 'mĂ­nĂştum');
                } else if (withoutSuffix) {
                    return result + 'mĂ­nĂşta';
                }
                return result + 'mĂ­nĂştu';
            case 'hh':
                if (plural(number)) {
                    return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
                }
                return result + 'klukkustund';
            case 'd':
                if (withoutSuffix) {
                    return 'dagur';
                }
                return isFuture ? 'dag' : 'degi';
            case 'dd':
                if (plural(number)) {
                    if (withoutSuffix) {
                        return result + 'dagar';
                    }
                    return result + (isFuture ? 'daga' : 'dĂśgum');
                } else if (withoutSuffix) {
                    return result + 'dagur';
                }
                return result + (isFuture ? 'dag' : 'degi');
            case 'M':
                if (withoutSuffix) {
                    return 'mĂĄnuĂ°ur';
                }
                return isFuture ? 'mĂĄnuĂ°' : 'mĂĄnuĂ°i';
            case 'MM':
                if (plural(number)) {
                    if (withoutSuffix) {
                        return result + 'mĂĄnuĂ°ir';
                    }
                    return result + (isFuture ? 'mĂĄnuĂ°i' : 'mĂĄnuĂ°um');
                } else if (withoutSuffix) {
                    return result + 'mĂĄnuĂ°ur';
                }
                return result + (isFuture ? 'mĂĄnuĂ°' : 'mĂĄnuĂ°i');
            case 'y':
                return withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄri';
            case 'yy':
                if (plural(number)) {
                    return result + (withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄrum');
                }
                return result + (withoutSuffix || isFuture ? 'ĂĄr' : 'ĂĄri');
        }
    }

    return moment.lang('is', {
        months : "janĂşar_febrĂşar_mars_aprĂ­l_maĂ­_jĂşnĂ­_jĂşlĂ­_ĂĄgĂşst_september_oktĂłber_nĂłvember_desember".split("_"),
        monthsShort : "jan_feb_mar_apr_maĂ­_jĂşn_jĂşl_ĂĄgĂş_sep_okt_nĂłv_des".split("_"),
        weekdays : "sunnudagur_mĂĄnudagur_ĂžriĂ°judagur_miĂ°vikudagur_fimmtudagur_fĂśstudagur_laugardagur".split("_"),
        weekdaysShort : "sun_mĂĄn_Ăžri_miĂ°_fim_fĂśs_lau".split("_"),
        weekdaysMin : "Su_MĂĄ_Ăr_Mi_Fi_FĂś_La".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD/MM/YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY [kl.] LT",
            LLLL : "dddd, D. MMMM YYYY [kl.] LT"
        },
        calendar : {
            sameDay : '[Ă­ dag kl.] LT',
            nextDay : '[ĂĄ morgun kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[Ă­ gĂŚr kl.] LT',
            lastWeek : '[sĂ­Ă°asta] dddd [kl.] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "eftir %s",
            past : "fyrir %s sĂ­Ă°an",
            s : translate,
            m : translate,
            mm : translate,
            h : "klukkustund",
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('it', {
        months : "Gennaio_Febbraio_Marzo_Aprile_Maggio_Giugno_Luglio_Agosto_Settembre_Ottobre_Novembre_Dicembre".split("_"),
        monthsShort : "Gen_Feb_Mar_Apr_Mag_Giu_Lug_Ago_Set_Ott_Nov_Dic".split("_"),
        weekdays : "Domenica_LunedĂŹ_MartedĂŹ_MercoledĂŹ_GiovedĂŹ_VenerdĂŹ_Sabato".split("_"),
        weekdaysShort : "Dom_Lun_Mar_Mer_Gio_Ven_Sab".split("_"),
        weekdaysMin : "D_L_Ma_Me_G_V_S".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: '[lo scorso] dddd [alle] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : function (s) {
                return ((/^[0-9].+$/).test(s) ? "tra" : "in") + " " + s;
            },
            past : "%s fa",
            s : "alcuni secondi",
            m : "un minuto",
            mm : "%d minuti",
            h : "un'ora",
            hh : "%d ore",
            d : "un giorno",
            dd : "%d giorni",
            M : "un mese",
            MM : "%d mesi",
            y : "un anno",
            yy : "%d anni"
        },
        ordinal: '%dÂş',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : japanese (ja)
// author : LI Long : https://github.com/baryon

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ja', {
        months : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
        monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
        weekdays : "ćĽććĽ_ćććĽ_çŤććĽ_ć°´ććĽ_ć¨ććĽ_éććĽ_ĺććĽ".split("_"),
        weekdaysShort : "ćĽ_ć_çŤ_ć°´_ć¨_é_ĺ".split("_"),
        weekdaysMin : "ćĽ_ć_çŤ_ć°´_ć¨_é_ĺ".split("_"),
        longDateFormat : {
            LT : "Ahćmĺ",
            L : "YYYY/MM/DD",
            LL : "YYYYĺš´MćDćĽ",
            LLL : "YYYYĺš´MćDćĽLT",
            LLLL : "YYYYĺš´MćDćĽLT dddd"
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return "ĺĺ";
            } else {
                return "ĺĺž";
            }
        },
        calendar : {
            sameDay : '[äťćĽ] LT',
            nextDay : '[ććĽ] LT',
            nextWeek : '[ćĽéą]dddd LT',
            lastDay : '[ć¨ćĽ] LT',
            lastWeek : '[ĺéą]dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%sĺž",
            past : "%sĺ",
            s : "ć°ç§",
            m : "1ĺ",
            mm : "%dĺ",
            h : "1ćé",
            hh : "%dćé",
            d : "1ćĽ",
            dd : "%dćĽ",
            M : "1ăść",
            MM : "%dăść",
            y : "1ĺš´",
            yy : "%dĺš´"
        }
    });
}));

// moment.js language configuration
// language : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    function monthsCaseReplace(m, format) {
        var months = {
                'nominative': 'áááááá á_ááááá áááá_ááá á˘á_ááá ááá_ááááĄá_áááááĄá_áááááĄá_áááááĄá˘á_áĄááĽá˘ááááá á_ááĽá˘ááááá á_ááááááá á_áááááááá á'.split('_'),
                'accusative': 'áááááá áĄ_ááááá ááááĄ_ááá á˘áĄ_ááá ááááĄ_ááááĄáĄ_áááááĄáĄ_áááááĄáĄ_áááááĄá˘áĄ_áĄááĽá˘ááááá áĄ_ááĽá˘ááááá áĄ_ááááááá áĄ_áááááááá áĄ'.split('_')
            },

            nounCase = (/D[oD] *MMMM?/).test(format) ?
                'accusative' :
                'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
                'nominative': 'áááá á_áá á¨ááááá_áĄááá¨ááááá_áááŽá¨ááááá_áŽáŁáá¨ááááá_ááá ááĄáááá_á¨ááááá'.split('_'),
                'accusative': 'áááá ááĄ_áá á¨áááááĄ_áĄááá¨áááááĄ_áááŽá¨áááááĄ_áŽáŁáá¨áááááĄ_ááá ááĄááááĄ_á¨áááááĄ'.split('_')
            },

            nounCase = (/(áŹááá|á¨ááááá)/).test(format) ?
                'accusative' :
                'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.lang('ka', {
        months : monthsCaseReplace,
        monthsShort : "ááá_ááá_ááá _ááá _ááá_ááá_ááá_ááá_áĄááĽ_ááĽá˘_ááá_ááá".split("_"),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : "ááá_áá á¨_áĄáá_áááŽ_áŽáŁá_ááá _á¨áá".split("_"),
        weekdaysMin : "áá_áá _áĄá_áá_áŽáŁ_áá_á¨á".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[ááŚááĄ] LT[-áá]',
            nextDay : '[áŽááá] LT[-áá]',
            lastDay : '[ááŁá¨áá] LT[-áá]',
            nextWeek : '[á¨ááááá] dddd LT[-áá]',
            lastWeek : '[áŹááá] dddd LT-áá',
            sameElse : 'L'
        },
        relativeTime : {
            future : function (s) {
                return (/(áŹááá|áŹáŁáá|áĄáááá|áŹááá)/).test(s) ?
                    s.replace(/á$/, "á¨á") :
                    s + "á¨á";
            },
            past : function (s) {
                if ((/(áŹááá|áŹáŁáá|áĄáááá|ááŚá|ááá)/).test(s)) {
                    return s.replace(/(á|á)$/, "ááĄ áŹáá");
                }
                if ((/áŹááá/).test(s)) {
                    return s.replace(/áŹááá$/, "áŹáááĄ áŹáá");
                }
            },
            s : "á áááááááá áŹááá",
            m : "áŹáŁáá",
            mm : "%d áŹáŁáá",
            h : "áĄáááá",
            hh : "%d áĄáááá",
            d : "ááŚá",
            dd : "%d ááŚá",
            M : "ááá",
            MM : "%d ááá",
            y : "áŹááá",
            yy : "%d áŹááá"
        },
        ordinal : function (number) {
            if (number === 0) {
                return number;
            }

            if (number === 1) {
                return number + "-áá";
            }

            if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                return "áá-" + number;
            }

            return number + "-á";
        },
        week : {
            dow : 1,
            doy : 7
        }
    });
}));

// moment.js language configuration
// language : korean (ko)
//
// authors 
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ko', {
        months : "1ě_2ě_3ě_4ě_5ě_6ě_7ě_8ě_9ě_10ě_11ě_12ě".split("_"),
        monthsShort : "1ě_2ě_3ě_4ě_5ě_6ě_7ě_8ě_9ě_10ě_11ě_12ě".split("_"),
        weekdays : "ěźěěź_ěěěź_íěěź_ěěěź_ëŞŠěěź_ę¸ěěź_í ěěź".split("_"),
        weekdaysShort : "ěź_ě_í_ě_ëŞŠ_ę¸_í ".split("_"),
        weekdaysMin : "ěź_ě_í_ě_ëŞŠ_ę¸_í ".split("_"),
        longDateFormat : {
            LT : "A hě mmëś",
            L : "YYYY.MM.DD",
            LL : "YYYYë MMMM Děź",
            LLL : "YYYYë MMMM Děź LT",
            LLLL : "YYYYë MMMM Děź dddd LT"
        },
        meridiem : function (hour, minute, isUpper) {
            return hour < 12 ? 'ě¤ě ' : 'ě¤í';
        },
        calendar : {
            sameDay : 'ě¤ë LT',
            nextDay : 'ë´ěź LT',
            nextWeek : 'dddd LT',
            lastDay : 'ě´ě  LT',
            lastWeek : 'ě§ëěŁź dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s í",
            past : "%s ě ",
            s : "ëŞě´",
            ss : "%dě´",
            m : "ěźëś",
            mm : "%dëś",
            h : "íěę°",
            hh : "%děę°",
            d : "íëŁ¨",
            dd : "%děź",
            M : "íëŹ",
            MM : "%dëŹ",
            y : "ěźë",
            yy : "%dë"
        },
        ordinal : '%děź',
        meridiemParse : /(ě¤ě |ě¤í)/,
        isPM : function (token) {
            return token === "ě¤í";
        }
    });
}));

// moment.js language configuration
// language : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch

// Note: Luxembourgish has a very particular phonological rule ("Eifeler Regel") that causes the
// deletion of the final "n" in certain contexts. That's what the "eifelerRegelAppliesToWeekday"
// and "eifelerRegelAppliesToNumber" methods are meant for

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eng Minutt', 'enger Minutt'],
            'h': ['eng Stonn', 'enger Stonn'],
            'd': ['een Dag', 'engem Dag'],
            'dd': [number + ' Deeg', number + ' Deeg'],
            'M': ['ee Mount', 'engem Mount'],
            'MM': [number + ' MĂŠint', number + ' MĂŠint'],
            'y': ['ee Joer', 'engem Joer'],
            'yy': [number + ' Joer', number + ' Joer']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    function processFutureTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return "a " + string;
        }
        return "an " + string;
    }

    function processPastTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return "viru " + string;
        }
        return "virun " + string;
    }

    function processLastWeek(string1) {
        var weekday = this.format('d');
        if (eifelerRegelAppliesToWeekday(weekday)) {
            return '[Leschte] dddd [um] LT';
        }
        return '[Leschten] dddd [um] LT';
    }

    /**
     * Returns true if the word before the given week day loses the "-n" ending.
     * e.g. "Leschten DĂŤnschdeg" but "Leschte MĂŠindeg"
     *
     * @param weekday {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToWeekday(weekday) {
        weekday = parseInt(weekday, 10);
        switch (weekday) {
            case 0: // Sonndeg
            case 1: // MĂŠindeg
            case 3: // MĂŤttwoch
            case 5: // Freideg
            case 6: // Samschdeg
                return true;
            default: // 2 DĂŤnschdeg, 4 Donneschdeg
                return false;
        }
    }

    /**
     * Returns true if the word before the given number loses the "-n" ending.
     * e.g. "an 10 Deeg" but "a 5 Deeg"
     *
     * @param number {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToNumber(number) {
        number = parseInt(number, 10);
        if (isNaN(number)) {
            return false;
        }
        if (number < 0) {
            // Negative Number --> always true
            return true;
        } else if (number < 10) {
            // Only 1 digit
            if (4 <= number && number <= 7) {
                return true;
            }
            return false;
        } else if (number < 100) {
            // 2 digits
            var lastDigit = number % 10, firstDigit = number / 10;
            if (lastDigit === 0) {
                return eifelerRegelAppliesToNumber(firstDigit);
            }
            return eifelerRegelAppliesToNumber(lastDigit);
        } else if (number < 10000) {
            // 3 or 4 digits --> recursively check first digit
            while (number >= 10) {
                number = number / 10;
            }
            return eifelerRegelAppliesToNumber(number);
        } else {
            // Anything larger than 4 digits: recursively check first n-3 digits
            number = number / 1000;
            return eifelerRegelAppliesToNumber(number);
        }
    }

    return moment.lang('lb', {
        months: "Januar_Februar_MĂ¤erz_AbrĂŤll_Mee_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
        monthsShort: "Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.".split("_"),
        weekdays: "Sonndeg_MĂŠindeg_DĂŤnschdeg_MĂŤttwoch_Donneschdeg_Freideg_Samschdeg".split("_"),
        weekdaysShort: "So._MĂŠ._DĂŤ._MĂŤ._Do._Fr._Sa.".split("_"),
        weekdaysMin: "So_MĂŠ_DĂŤ_MĂŤ_Do_Fr_Sa".split("_"),
        longDateFormat: {
            LT: "H:mm [Auer]",
            L: "DD.MM.YYYY",
            LL: "D. MMMM YYYY",
            LLL: "D. MMMM YYYY LT",
            LLLL: "dddd, D. MMMM YYYY LT"
        },
        calendar: {
            sameDay: "[Haut um] LT",
            sameElse: "L",
            nextDay: '[Muer um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[GĂŤschter um] LT',
            lastWeek: processLastWeek
        },
        relativeTime: {
            future: processFutureTime,
            past: processPastTime,
            s: "e puer Sekonnen",
            m: processRelativeTime,
            mm: "%d Minutten",
            h: processRelativeTime,
            hh: "%d Stonnen",
            d: processRelativeTime,
            dd: processRelativeTime,
            M: processRelativeTime,
            MM: processRelativeTime,
            y: processRelativeTime,
            yy: processRelativeTime
        },
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Lithuanian (lt)
// author : Mindaugas MozĹŤras : https://github.com/mmozuras

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var units = {
            "m" : "minutÄ_minutÄs_minutÄ",
            "mm": "minutÄs_minuÄiĹł_minutes",
            "h" : "valanda_valandos_valandÄ",
            "hh": "valandos_valandĹł_valandas",
            "d" : "diena_dienos_dienÄ",
            "dd": "dienos_dienĹł_dienas",
            "M" : "mÄnuo_mÄnesio_mÄnesÄŻ",
            "MM": "mÄnesiai_mÄnesiĹł_mÄnesius",
            "y" : "metai_metĹł_metus",
            "yy": "metai_metĹł_metus"
        },
        weekDays = "pirmadienis_antradienis_treÄiadienis_ketvirtadienis_penktadienis_ĹĄeĹĄtadienis_sekmadienis".split("_");

    function translateSeconds(number, withoutSuffix, key, isFuture) {
        if (withoutSuffix) {
            return "kelios sekundÄs";
        } else {
            return isFuture ? "keliĹł sekundĹžiĹł" : "kelias sekundes";
        }
    }

    function translateSingular(number, withoutSuffix, key, isFuture) {
        return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
    }

    function special(number) {
        return number % 10 === 0 || (number > 10 && number < 20);
    }

    function forms(key) {
        return units[key].split("_");
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + " ";
        if (number === 1) {
            return result + translateSingular(number, withoutSuffix, key[0], isFuture);
        } else if (withoutSuffix) {
            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
        } else {
            if (isFuture) {
                return result + forms(key)[1];
            } else {
                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
            }
        }
    }

    function relativeWeekDay(moment, format) {
        var nominative = format.indexOf('dddd LT') === -1,
            weekDay = weekDays[moment.weekday()];

        return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + "ÄŻ";
    }

    return moment.lang("lt", {
        months : "sausio_vasario_kovo_balandĹžio_geguĹžÄs_birĹžÄlio_liepos_rugpjĹŤÄio_rugsÄjo_spalio_lapkriÄio_gruodĹžio".split("_"),
        monthsShort : "sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd".split("_"),
        weekdays : relativeWeekDay,
        weekdaysShort : "Sek_Pir_Ant_Tre_Ket_Pen_Ĺ eĹĄ".split("_"),
        weekdaysMin : "S_P_A_T_K_Pn_Ĺ ".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "YYYY-MM-DD",
            LL : "YYYY [m.] MMMM D [d.]",
            LLL : "YYYY [m.] MMMM D [d.], LT [val.]",
            LLLL : "YYYY [m.] MMMM D [d.], dddd, LT [val.]",
            l : "YYYY-MM-DD",
            ll : "YYYY [m.] MMMM D [d.]",
            lll : "YYYY [m.] MMMM D [d.], LT [val.]",
            llll : "YYYY [m.] MMMM D [d.], ddd, LT [val.]"
        },
        calendar : {
            sameDay : "[Ĺ iandien] LT",
            nextDay : "[Rytoj] LT",
            nextWeek : "dddd LT",
            lastDay : "[Vakar] LT",
            lastWeek : "[PraÄjusÄŻ] dddd LT",
            sameElse : "L"
        },
        relativeTime : {
            future : "po %s",
            past : "prieĹĄ %s",
            s : translateSeconds,
            m : translateSingular,
            mm : translate,
            h : translateSingular,
            hh : translate,
            d : translateSingular,
            dd : translate,
            M : translateSingular,
            MM : translate,
            y : translateSingular,
            yy : translate
        },
        ordinal : function (number) {
            return number + '-oji';
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var units = {
        'mm': 'minĹŤti_minĹŤtes_minĹŤte_minĹŤtes',
        'hh': 'stundu_stundas_stunda_stundas',
        'dd': 'dienu_dienas_diena_dienas',
        'MM': 'mÄnesi_mÄneĹĄus_mÄnesis_mÄneĹĄi',
        'yy': 'gadu_gadus_gads_gadi'
    };

    function format(word, number, withoutSuffix) {
        var forms = word.split('_');
        if (withoutSuffix) {
            return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
        } else {
            return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
        }
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        return number + ' ' + format(units[key], number, withoutSuffix);
    }

    return moment.lang('lv', {
        months : "janvÄris_februÄris_marts_aprÄŤlis_maijs_jĹŤnijs_jĹŤlijs_augusts_septembris_oktobris_novembris_decembris".split("_"),
        monthsShort : "jan_feb_mar_apr_mai_jĹŤn_jĹŤl_aug_sep_okt_nov_dec".split("_"),
        weekdays : "svÄtdiena_pirmdiena_otrdiena_treĹĄdiena_ceturtdiena_piektdiena_sestdiena".split("_"),
        weekdaysShort : "Sv_P_O_T_C_Pk_S".split("_"),
        weekdaysMin : "Sv_P_O_T_C_Pk_S".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "YYYY. [gada] D. MMMM",
            LLL : "YYYY. [gada] D. MMMM, LT",
            LLLL : "YYYY. [gada] D. MMMM, dddd, LT"
        },
        calendar : {
            sameDay : '[Ĺ odien pulksten] LT',
            nextDay : '[RÄŤt pulksten] LT',
            nextWeek : 'dddd [pulksten] LT',
            lastDay : '[Vakar pulksten] LT',
            lastWeek : '[PagÄjuĹĄÄ] dddd [pulksten] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s vÄlÄk",
            past : "%s agrÄk",
            s : "daĹžas sekundes",
            m : "minĹŤti",
            mm : relativeTimeWithPlural,
            h : "stundu",
            hh : relativeTimeWithPlural,
            d : "dienu",
            dd : relativeTimeWithPlural,
            M : "mÄnesi",
            MM : relativeTimeWithPlural,
            y : "gadu",
            yy : relativeTimeWithPlural
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('mk', {
        months : "ŃĐ°Đ˝ŃĐ°ŃĐ¸_ŃĐľĐ˛ŃŃĐ°ŃĐ¸_ĐźĐ°ŃŃ_Đ°ĐżŃĐ¸Đť_ĐźĐ°Ń_ŃŃĐ˝Đ¸_ŃŃĐťĐ¸_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐżŃĐľĐźĐ˛ŃĐ¸_ĐžĐşŃĐžĐźĐ˛ŃĐ¸_Đ˝ĐžĐľĐźĐ˛ŃĐ¸_Đ´ĐľĐşĐľĐźĐ˛ŃĐ¸".split("_"),
        monthsShort : "ŃĐ°Đ˝_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Ń_ŃŃĐ˝_ŃŃĐť_Đ°Đ˛Đł_ŃĐľĐż_ĐžĐşŃ_Đ˝ĐžĐľ_Đ´ĐľĐş".split("_"),
        weekdays : "Đ˝ĐľĐ´ĐľĐťĐ°_ĐżĐžĐ˝ĐľĐ´ĐľĐťĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Đ°_ŃĐľŃĐ˛ŃŃĐžĐş_ĐżĐľŃĐžĐş_ŃĐ°ĐąĐžŃĐ°".split("_"),
        weekdaysShort : "Đ˝ĐľĐ´_ĐżĐžĐ˝_Đ˛ŃĐž_ŃŃĐľ_ŃĐľŃ_ĐżĐľŃ_ŃĐ°Đą".split("_"),
        weekdaysMin : "Đ˝e_Đżo_Đ˛Ń_ŃŃ_ŃĐľ_ĐżĐľ_Ńa".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "D.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[ĐĐľĐ˝ĐľŃ Đ˛Đž] LT',
            nextDay : '[ĐŁŃŃĐľ Đ˛Đž] LT',
            nextWeek : 'dddd [Đ˛Đž] LT',
            lastDay : '[ĐŃĐľŃĐ° Đ˛Đž] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return '[ĐĐž Đ¸ĐˇĐźĐ¸Đ˝Đ°ŃĐ°ŃĐ°] dddd [Đ˛Đž] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[ĐĐž Đ¸ĐˇĐźĐ¸Đ˝Đ°ŃĐ¸ĐžŃ] dddd [Đ˛Đž] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "ĐżĐžŃĐťĐľ %s",
            past : "ĐżŃĐľĐ´ %s",
            s : "Đ˝ĐľĐşĐžĐťĐşŃ ŃĐľĐşŃĐ˝Đ´Đ¸",
            m : "ĐźĐ¸Đ˝ŃŃĐ°",
            mm : "%d ĐźĐ¸Đ˝ŃŃĐ¸",
            h : "ŃĐ°Ń",
            hh : "%d ŃĐ°ŃĐ°",
            d : "Đ´ĐľĐ˝",
            dd : "%d Đ´ĐľĐ˝Đ°",
            M : "ĐźĐľŃĐľŃ",
            MM : "%d ĐźĐľŃĐľŃĐ¸",
            y : "ĐłĐžĐ´Đ¸Đ˝Đ°",
            yy : "%d ĐłĐžĐ´Đ¸Đ˝Đ¸"
        },
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-ĐľĐ˛';
            } else if (last2Digits === 0) {
                return number + '-ĐľĐ˝';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-ŃĐ¸';
            } else if (lastDigit === 1) {
                return number + '-Đ˛Đ¸';
            } else if (lastDigit === 2) {
                return number + '-ŃĐ¸';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ĐźĐ¸';
            } else {
                return number + '-ŃĐ¸';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ml', {
        months : 'ŕ´ŕ´¨ŕľŕ´ľŕ´°ŕ´ż_ŕ´Ťŕľŕ´Źŕľŕ´°ŕľŕ´ľŕ´°ŕ´ż_ŕ´Žŕ´žŕľźŕ´ŕľŕ´ŕľ_ŕ´ŕ´Şŕľŕ´°ŕ´żŕľ˝_ŕ´Žŕľŕ´Żŕľ_ŕ´ŕľŕľş_ŕ´ŕľŕ´˛ŕľ_ŕ´ŕ´ŕ´¸ŕľŕ´ąŕľŕ´ąŕľ_ŕ´¸ŕľŕ´Şŕľŕ´ąŕľŕ´ąŕ´ŕ´Źŕľź_ŕ´ŕ´ŕľŕ´ŕľŕ´Źŕľź_ŕ´¨ŕ´ľŕ´ŕ´Źŕľź_ŕ´Ąŕ´żŕ´¸ŕ´ŕ´Źŕľź'.split("_"),
        monthsShort : 'ŕ´ŕ´¨ŕľ._ŕ´Ťŕľŕ´Źŕľŕ´°ŕľ._ŕ´Žŕ´žŕľź._ŕ´ŕ´Şŕľŕ´°ŕ´ż._ŕ´Žŕľŕ´Żŕľ_ŕ´ŕľŕľş_ŕ´ŕľŕ´˛ŕľ._ŕ´ŕ´._ŕ´¸ŕľŕ´Şŕľŕ´ąŕľŕ´ą._ŕ´ŕ´ŕľŕ´ŕľ._ŕ´¨ŕ´ľŕ´._ŕ´Ąŕ´żŕ´¸ŕ´.'.split("_"),
        weekdays : 'ŕ´ŕ´žŕ´Żŕ´ąŕ´žŕ´´ŕľŕ´_ŕ´¤ŕ´żŕ´ŕľŕ´ŕ´łŕ´žŕ´´ŕľŕ´_ŕ´ŕľŕ´ľŕľŕ´ľŕ´žŕ´´ŕľŕ´_ŕ´Źŕľŕ´§ŕ´¨ŕ´žŕ´´ŕľŕ´_ŕ´ľŕľŕ´Żŕ´žŕ´´ŕ´žŕ´´ŕľŕ´_ŕ´ľŕľŕ´łŕľŕ´łŕ´żŕ´Żŕ´žŕ´´ŕľŕ´_ŕ´śŕ´¨ŕ´żŕ´Żŕ´žŕ´´ŕľŕ´'.split("_"),
        weekdaysShort : 'ŕ´ŕ´žŕ´Żŕľź_ŕ´¤ŕ´żŕ´ŕľŕ´ŕľž_ŕ´ŕľŕ´ľŕľŕ´ľ_ŕ´Źŕľŕ´§ŕľť_ŕ´ľŕľŕ´Żŕ´žŕ´´ŕ´_ŕ´ľŕľŕ´łŕľŕ´łŕ´ż_ŕ´śŕ´¨ŕ´ż'.split("_"),
        weekdaysMin : 'ŕ´ŕ´ž_ŕ´¤ŕ´ż_ŕ´ŕľ_ŕ´Źŕľ_ŕ´ľŕľŕ´Żŕ´ž_ŕ´ľŕľ_ŕ´ś'.split("_"),
        longDateFormat : {
            LT : "A h:mm -ŕ´¨ŕľ",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY, LT",
            LLLL : "dddd, D MMMM YYYY, LT"
        },
        calendar : {
            sameDay : '[ŕ´ŕ´¨ŕľŕ´¨ŕľ] LT',
            nextDay : '[ŕ´¨ŕ´žŕ´łŕľ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ŕ´ŕ´¨ŕľŕ´¨ŕ´˛ŕľ] LT',
            lastWeek : '[ŕ´ŕ´´ŕ´żŕ´ŕľŕ´] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s ŕ´ŕ´´ŕ´żŕ´ŕľŕ´ŕľ",
            past : "%s ŕ´Žŕľŕľťŕ´Şŕľ",
            s : "ŕ´ŕľ˝ŕ´Ş ŕ´¨ŕ´żŕ´Žŕ´żŕ´ˇŕ´ŕľŕ´ŕľž",
            m : "ŕ´ŕ´°ŕľ ŕ´Žŕ´żŕ´¨ŕ´żŕ´ąŕľŕ´ąŕľ",
            mm : "%d ŕ´Žŕ´żŕ´¨ŕ´żŕ´ąŕľŕ´ąŕľ",
            h : "ŕ´ŕ´°ŕľ ŕ´Žŕ´Łŕ´żŕ´ŕľŕ´ŕľŕľź",
            hh : "%d ŕ´Žŕ´Łŕ´żŕ´ŕľŕ´ŕľŕľź",
            d : "ŕ´ŕ´°ŕľ ŕ´Śŕ´żŕ´ľŕ´¸ŕ´",
            dd : "%d ŕ´Śŕ´żŕ´ľŕ´¸ŕ´",
            M : "ŕ´ŕ´°ŕľ ŕ´Žŕ´žŕ´¸ŕ´",
            MM : "%d ŕ´Žŕ´žŕ´¸ŕ´",
            y : "ŕ´ŕ´°ŕľ ŕ´ľŕľźŕ´ˇŕ´",
            yy : "%d ŕ´ľŕľźŕ´ˇŕ´"
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return "ŕ´°ŕ´žŕ´¤ŕľŕ´°ŕ´ż";
            } else if (hour < 12) {
                return "ŕ´°ŕ´žŕ´ľŕ´żŕ´˛ŕľ";
            } else if (hour < 17) {
                return "ŕ´ŕ´ŕľŕ´ ŕ´ŕ´´ŕ´żŕ´ŕľŕ´ŕľ";
            } else if (hour < 20) {
                return "ŕ´ľŕľŕ´ŕľŕ´¨ŕľŕ´¨ŕľŕ´°ŕ´";
            } else {
                return "ŕ´°ŕ´žŕ´¤ŕľŕ´°ŕ´ż";
            }
        }
    });
}));

// moment.js language configuration
// language : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var symbolMap = {
            '1': 'ŕĽ§',
            '2': 'ŕĽ¨',
            '3': 'ŕĽŠ',
            '4': 'ŕĽŞ',
            '5': 'ŕĽŤ',
            '6': 'ŕĽŹ',
            '7': 'ŕĽ­',
            '8': 'ŕĽŽ',
            '9': 'ŕĽŻ',
            '0': 'ŕĽŚ'
        },
        numberMap = {
            'ŕĽ§': '1',
            'ŕĽ¨': '2',
            'ŕĽŠ': '3',
            'ŕĽŞ': '4',
            'ŕĽŤ': '5',
            'ŕĽŹ': '6',
            'ŕĽ­': '7',
            'ŕĽŽ': '8',
            'ŕĽŻ': '9',
            'ŕĽŚ': '0'
        };

    return moment.lang('mr', {
        months : 'ŕ¤ŕ¤žŕ¤¨ŕĽŕ¤ľŕ¤žŕ¤°ŕĽ_ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤żŕ¤˛_ŕ¤ŽŕĽ_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕĽ_ŕ¤ŕ¤ŕ¤¸ŕĽŕ¤_ŕ¤¸ŕ¤ŞŕĽŕ¤ŕĽŕ¤ŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕĽŕ¤ľŕĽŕ¤šŕĽŕ¤ŕ¤Źŕ¤°_ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤ŕ¤Źŕ¤°'.split("_"),
        monthsShort: 'ŕ¤ŕ¤žŕ¤¨ŕĽ._ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤._ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤ż._ŕ¤ŽŕĽ._ŕ¤ŕĽŕ¤¨._ŕ¤ŕĽŕ¤˛ŕĽ._ŕ¤ŕ¤._ŕ¤¸ŕ¤ŞŕĽŕ¤ŕĽŕ¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕĽŕ¤ľŕĽŕ¤šŕĽŕ¤._ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤.'.split("_"),
        weekdays : 'ŕ¤°ŕ¤ľŕ¤żŕ¤ľŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤ľŕ¤žŕ¤°_ŕ¤Žŕ¤ŕ¤ŕ¤łŕ¤ľŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤ľŕ¤žŕ¤°_ŕ¤ŕĽŕ¤°ŕĽŕ¤ľŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤ľŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤ľŕ¤žŕ¤°'.split("_"),
        weekdaysShort : 'ŕ¤°ŕ¤ľŕ¤ż_ŕ¤¸ŕĽŕ¤Ž_ŕ¤Žŕ¤ŕ¤ŕ¤ł_ŕ¤ŹŕĽŕ¤§_ŕ¤ŕĽŕ¤°ŕĽ_ŕ¤śŕĽŕ¤ŕĽŕ¤°_ŕ¤śŕ¤¨ŕ¤ż'.split("_"),
        weekdaysMin : 'ŕ¤°_ŕ¤¸ŕĽ_ŕ¤Žŕ¤_ŕ¤ŹŕĽ_ŕ¤ŕĽ_ŕ¤śŕĽ_ŕ¤ś'.split("_"),
        longDateFormat : {
            LT : "A h:mm ŕ¤ľŕ¤žŕ¤ŕ¤¤ŕ¤ž",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY, LT",
            LLLL : "dddd, D MMMM YYYY, LT"
        },
        calendar : {
            sameDay : '[ŕ¤ŕ¤] LT',
            nextDay : '[ŕ¤ŕ¤ŚŕĽŕ¤Żŕ¤ž] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ŕ¤ŕ¤žŕ¤˛] LT',
            lastWeek: '[ŕ¤Žŕ¤žŕ¤ŕĽŕ¤˛] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s ŕ¤¨ŕ¤ŕ¤¤ŕ¤°",
            past : "%s ŕ¤ŞŕĽŕ¤°ŕĽŕ¤ľŕĽ",
            s : "ŕ¤¸ŕĽŕ¤ŕ¤ŕ¤Ś",
            m: "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕ¤żŕ¤",
            mm: "%d ŕ¤Žŕ¤żŕ¤¨ŕ¤żŕ¤ŕĽ",
            h : "ŕ¤ŕ¤ ŕ¤¤ŕ¤žŕ¤¸",
            hh : "%d ŕ¤¤ŕ¤žŕ¤¸",
            d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤ľŕ¤¸",
            dd : "%d ŕ¤Śŕ¤żŕ¤ľŕ¤¸",
            M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
            MM : "%d ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕĽ",
            y : "ŕ¤ŕ¤ ŕ¤ľŕ¤°ŕĽŕ¤ˇ",
            yy : "%d ŕ¤ľŕ¤°ŕĽŕ¤ˇŕĽ"
        },
        preparse: function (string) {
            return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiem: function (hour, minute, isLower)
        {
            if (hour < 4) {
                return "ŕ¤°ŕ¤žŕ¤¤ŕĽŕ¤°ŕĽ";
            } else if (hour < 10) {
                return "ŕ¤¸ŕ¤ŕ¤žŕ¤łŕĽ";
            } else if (hour < 17) {
                return "ŕ¤ŚŕĽŕ¤Şŕ¤žŕ¤°ŕĽ";
            } else if (hour < 20) {
                return "ŕ¤¸ŕ¤žŕ¤Żŕ¤ŕ¤ŕ¤žŕ¤łŕĽ";
            } else {
                return "ŕ¤°ŕ¤žŕ¤¤ŕĽŕ¤°ŕĽ";
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('ms-my', {
        months : "Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember".split("_"),
        monthsShort : "Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis".split("_"),
        weekdays : "Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu".split("_"),
        weekdaysShort : "Ahd_Isn_Sel_Rab_Kha_Jum_Sab".split("_"),
        weekdaysMin : "Ah_Is_Sl_Rb_Km_Jm_Sb".split("_"),
        longDateFormat : {
            LT : "HH.mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY [pukul] LT",
            LLLL : "dddd, D MMMM YYYY [pukul] LT"
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Esok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kelmarin pukul] LT',
            lastWeek : 'dddd [lepas pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "dalam %s",
            past : "%s yang lepas",
            s : "beberapa saat",
            m : "seminit",
            mm : "%d minit",
            h : "sejam",
            hh : "%d jam",
            d : "sehari",
            dd : "%d hari",
            M : "sebulan",
            MM : "%d bulan",
            y : "setahun",
            yy : "%d tahun"
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : norwegian bokmĂĽl (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('nb', {
        months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
        monthsShort : "jan._feb._mars_april_mai_juni_juli_aug._sep._okt._nov._des.".split("_"),
        weekdays : "sĂ¸ndag_mandag_tirsdag_onsdag_torsdag_fredag_lĂ¸rdag".split("_"),
        weekdaysShort : "sĂ¸._ma._ti._on._to._fr._lĂ¸.".split("_"),
        weekdaysMin : "sĂ¸_ma_ti_on_to_fr_lĂ¸".split("_"),
        longDateFormat : {
            LT : "H.mm",
            L : "DD.MM.YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY [kl.] LT",
            LLLL : "dddd D. MMMM YYYY [kl.] LT"
        },
        calendar : {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[i gĂĽr kl.] LT',
            lastWeek: '[forrige] dddd [kl.] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "om %s",
            past : "for %s siden",
            s : "noen sekunder",
            m : "ett minutt",
            mm : "%d minutter",
            h : "en time",
            hh : "%d timer",
            d : "en dag",
            dd : "%d dager",
            M : "en mĂĽned",
            MM : "%d mĂĽneder",
            y : "ett ĂĽr",
            yy : "%d ĂĽr"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : nepali/nepalese
// author : suvash : https://github.com/suvash

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var symbolMap = {
            '1': 'ŕĽ§',
            '2': 'ŕĽ¨',
            '3': 'ŕĽŠ',
            '4': 'ŕĽŞ',
            '5': 'ŕĽŤ',
            '6': 'ŕĽŹ',
            '7': 'ŕĽ­',
            '8': 'ŕĽŽ',
            '9': 'ŕĽŻ',
            '0': 'ŕĽŚ'
        },
        numberMap = {
            'ŕĽ§': '1',
            'ŕĽ¨': '2',
            'ŕĽŠ': '3',
            'ŕĽŞ': '4',
            'ŕĽŤ': '5',
            'ŕĽŹ': '6',
            'ŕĽ­': '7',
            'ŕĽŽ': '8',
            'ŕĽŻ': '9',
            'ŕĽŚ': '0'
        };

    return moment.lang('ne', {
        months : 'ŕ¤ŕ¤¨ŕ¤ľŕ¤°ŕĽ_ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽŕ¤ľŕ¤°ŕĽ_ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤żŕ¤˛_ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤_ŕ¤ŕ¤ŕ¤ˇŕĽŕ¤_ŕ¤¸ŕĽŕ¤ŞŕĽŕ¤ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤ŕ¤ŕĽŕ¤ŕĽŕ¤Źŕ¤°_ŕ¤¨ŕĽŕ¤­ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°_ŕ¤Ąŕ¤żŕ¤¸ŕĽŕ¤ŽŕĽŕ¤Źŕ¤°'.split("_"),
        monthsShort : 'ŕ¤ŕ¤¨._ŕ¤ŤŕĽŕ¤ŹŕĽŕ¤°ŕĽ._ŕ¤Žŕ¤žŕ¤°ŕĽŕ¤_ŕ¤ŕ¤ŞŕĽŕ¤°ŕ¤ż._ŕ¤Žŕ¤_ŕ¤ŕĽŕ¤¨_ŕ¤ŕĽŕ¤˛ŕ¤žŕ¤._ŕ¤ŕ¤._ŕ¤¸ŕĽŕ¤ŞŕĽŕ¤._ŕ¤ŕ¤ŕĽŕ¤ŕĽ._ŕ¤¨ŕĽŕ¤­ŕĽ._ŕ¤Ąŕ¤żŕ¤¸ŕĽ.'.split("_"),
        weekdays : 'ŕ¤ŕ¤ŕ¤¤ŕ¤Źŕ¤žŕ¤°_ŕ¤¸ŕĽŕ¤Žŕ¤Źŕ¤žŕ¤°_ŕ¤Žŕ¤ŕĽŕ¤ŕ¤˛ŕ¤Źŕ¤žŕ¤°_ŕ¤ŹŕĽŕ¤§ŕ¤Źŕ¤žŕ¤°_ŕ¤Źŕ¤żŕ¤šŕ¤żŕ¤Źŕ¤žŕ¤°_ŕ¤śŕĽŕ¤ŕĽŕ¤°ŕ¤Źŕ¤žŕ¤°_ŕ¤śŕ¤¨ŕ¤żŕ¤Źŕ¤žŕ¤°'.split("_"),
        weekdaysShort : 'ŕ¤ŕ¤ŕ¤¤._ŕ¤¸ŕĽŕ¤Ž._ŕ¤Žŕ¤ŕĽŕ¤ŕ¤˛._ŕ¤ŹŕĽŕ¤§._ŕ¤Źŕ¤żŕ¤šŕ¤ż._ŕ¤śŕĽŕ¤ŕĽŕ¤°._ŕ¤śŕ¤¨ŕ¤ż.'.split("_"),
        weekdaysMin : 'ŕ¤ŕ¤._ŕ¤¸ŕĽ._ŕ¤Žŕ¤ŕĽ_ŕ¤ŹŕĽ._ŕ¤Źŕ¤ż._ŕ¤śŕĽ._ŕ¤ś.'.split("_"),
        longDateFormat : {
            LT : "Aŕ¤ŕĽ h:mm ŕ¤Źŕ¤ŕĽ",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY, LT",
            LLLL : "dddd, D MMMM YYYY, LT"
        },
        preparse: function (string) {
            return string.replace(/[ŕĽ§ŕĽ¨ŕĽŠŕĽŞŕĽŤŕĽŹŕĽ­ŕĽŽŕĽŻŕĽŚ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 3) {
                return "ŕ¤°ŕ¤žŕ¤¤ŕĽ";
            } else if (hour < 10) {
                return "ŕ¤Źŕ¤żŕ¤šŕ¤žŕ¤¨";
            } else if (hour < 15) {
                return "ŕ¤Śŕ¤żŕ¤ŕ¤ŕ¤¸ŕĽ";
            } else if (hour < 18) {
                return "ŕ¤ŹŕĽŕ¤˛ŕĽŕ¤ŕ¤ž";
            } else if (hour < 20) {
                return "ŕ¤¸ŕ¤žŕ¤ŕ¤";
            } else {
                return "ŕ¤°ŕ¤žŕ¤¤ŕĽ";
            }
        },
        calendar : {
            sameDay : '[ŕ¤ŕ¤] LT',
            nextDay : '[ŕ¤­ŕĽŕ¤˛ŕĽ] LT',
            nextWeek : '[ŕ¤ŕ¤ŕ¤ŕ¤ŚŕĽ] dddd[,] LT',
            lastDay : '[ŕ¤šŕ¤żŕ¤ŕĽ] LT',
            lastWeek : '[ŕ¤ŕ¤ŕ¤ŕĽ] dddd[,] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%sŕ¤Žŕ¤ž",
            past : "%s ŕ¤ŕ¤ŕ¤žŕ¤ĄŕĽ",
            s : "ŕ¤ŕĽŕ¤šŕĽ ŕ¤¸ŕ¤Žŕ¤Ż",
            m : "ŕ¤ŕ¤ ŕ¤Žŕ¤żŕ¤¨ŕĽŕ¤",
            mm : "%d ŕ¤Žŕ¤żŕ¤¨ŕĽŕ¤",
            h : "ŕ¤ŕ¤ ŕ¤ŕ¤ŁŕĽŕ¤ŕ¤ž",
            hh : "%d ŕ¤ŕ¤ŁŕĽŕ¤ŕ¤ž",
            d : "ŕ¤ŕ¤ ŕ¤Śŕ¤żŕ¤¨",
            dd : "%d ŕ¤Śŕ¤żŕ¤¨",
            M : "ŕ¤ŕ¤ ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
            MM : "%d ŕ¤Žŕ¤šŕ¤żŕ¤¨ŕ¤ž",
            y : "ŕ¤ŕ¤ ŕ¤Źŕ¤°ŕĽŕ¤ˇ",
            yy : "%d ŕ¤Źŕ¤°ŕĽŕ¤ˇ"
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : dutch (nl)
// author : Joris RĂśling : https://github.com/jjupiter

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var monthsShortWithDots = "jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.".split("_"),
        monthsShortWithoutDots = "jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec".split("_");

    return moment.lang('nl', {
        months : "januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december".split("_"),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : "zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag".split("_"),
        weekdaysShort : "zo._ma._di._wo._do._vr._za.".split("_"),
        weekdaysMin : "Zo_Ma_Di_Wo_Do_Vr_Za".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD-MM-YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "over %s",
            past : "%s geleden",
            s : "een paar seconden",
            m : "ĂŠĂŠn minuut",
            mm : "%d minuten",
            h : "ĂŠĂŠn uur",
            hh : "%d uur",
            d : "ĂŠĂŠn dag",
            dd : "%d dagen",
            M : "ĂŠĂŠn maand",
            MM : "%d maanden",
            y : "ĂŠĂŠn jaar",
            yy : "%d jaar"
        },
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('nn', {
        months : "januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember".split("_"),
        monthsShort : "jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des".split("_"),
        weekdays : "sundag_mĂĽndag_tysdag_onsdag_torsdag_fredag_laurdag".split("_"),
        weekdaysShort : "sun_mĂĽn_tys_ons_tor_fre_lau".split("_"),
        weekdaysMin : "su_mĂĽ_ty_on_to_fr_lĂ¸".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: '[I dag klokka] LT',
            nextDay: '[I morgon klokka] LT',
            nextWeek: 'dddd [klokka] LT',
            lastDay: '[I gĂĽr klokka] LT',
            lastWeek: '[FĂ¸regĂĽende] dddd [klokka] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "om %s",
            past : "for %s siden",
            s : "noen sekund",
            m : "ett minutt",
            mm : "%d minutt",
            h : "en time",
            hh : "%d timar",
            d : "en dag",
            dd : "%d dagar",
            M : "en mĂĽnad",
            MM : "%d mĂĽnader",
            y : "ett ĂĽr",
            yy : "%d ĂĽr"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var monthsNominative = "styczeĹ_luty_marzec_kwiecieĹ_maj_czerwiec_lipiec_sierpieĹ_wrzesieĹ_paĹşdziernik_listopad_grudzieĹ".split("_"),
        monthsSubjective = "stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeĹnia_paĹşdziernika_listopada_grudnia".split("_");

    function plural(n) {
        return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
    }

    function translate(number, withoutSuffix, key) {
        var result = number + " ";
        switch (key) {
            case 'm':
                return withoutSuffix ? 'minuta' : 'minutÄ';
            case 'mm':
                return result + (plural(number) ? 'minuty' : 'minut');
            case 'h':
                return withoutSuffix  ? 'godzina'  : 'godzinÄ';
            case 'hh':
                return result + (plural(number) ? 'godziny' : 'godzin');
            case 'MM':
                return result + (plural(number) ? 'miesiÄce' : 'miesiÄcy');
            case 'yy':
                return result + (plural(number) ? 'lata' : 'lat');
        }
    }

    return moment.lang('pl', {
        months : function (momentToFormat, format) {
            if (/D MMMM/.test(format)) {
                return monthsSubjective[momentToFormat.month()];
            } else {
                return monthsNominative[momentToFormat.month()];
            }
        },
        monthsShort : "sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paĹş_lis_gru".split("_"),
        weekdays : "niedziela_poniedziaĹek_wtorek_Ĺroda_czwartek_piÄtek_sobota".split("_"),
        weekdaysShort : "nie_pon_wt_Ĺr_czw_pt_sb".split("_"),
        weekdaysMin : "N_Pn_Wt_Ĺr_Cz_Pt_So".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay: '[DziĹ o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: '[W] dddd [o] LT',
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[W zeszĹÄ niedzielÄ o] LT';
                    case 3:
                        return '[W zeszĹÄ ĹrodÄ o] LT';
                    case 6:
                        return '[W zeszĹÄ sobotÄ o] LT';
                    default:
                        return '[W zeszĹy] dddd [o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "za %s",
            past : "%s temu",
            s : "kilka sekund",
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : "1 dzieĹ",
            dd : '%d dni',
            M : "miesiÄc",
            MM : translate,
            y : "rok",
            yy : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('pt-br', {
        months : "Janeiro_Fevereiro_MarĂ§o_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),
        monthsShort : "Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),
        weekdays : "Domingo_Segunda-feira_TerĂ§a-feira_Quarta-feira_Quinta-feira_Sexta-feira_SĂĄbado".split("_"),
        weekdaysShort : "Dom_Seg_Ter_Qua_Qui_Sex_SĂĄb".split("_"),
        weekdaysMin : "Dom_2ÂŞ_3ÂŞ_4ÂŞ_5ÂŞ_6ÂŞ_SĂĄb".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D [de] MMMM [de] YYYY",
            LLL : "D [de] MMMM [de] YYYY LT",
            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
        },
        calendar : {
            sameDay: '[Hoje Ă s] LT',
            nextDay: '[AmanhĂŁ Ă s] LT',
            nextWeek: 'dddd [Ă s] LT',
            lastDay: '[Ontem Ă s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Ăltimo] dddd [Ă s] LT' : // Saturday + Sunday
                    '[Ăltima] dddd [Ă s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "em %s",
            past : "%s atrĂĄs",
            s : "segundos",
            m : "um minuto",
            mm : "%d minutos",
            h : "uma hora",
            hh : "%d horas",
            d : "um dia",
            dd : "%d dias",
            M : "um mĂŞs",
            MM : "%d meses",
            y : "um ano",
            yy : "%d anos"
        },
        ordinal : '%dÂş'
    });
}));

// moment.js language configuration
// language : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('pt', {
        months : "Janeiro_Fevereiro_MarĂ§o_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),
        monthsShort : "Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),
        weekdays : "Domingo_Segunda-feira_TerĂ§a-feira_Quarta-feira_Quinta-feira_Sexta-feira_SĂĄbado".split("_"),
        weekdaysShort : "Dom_Seg_Ter_Qua_Qui_Sex_SĂĄb".split("_"),
        weekdaysMin : "Dom_2ÂŞ_3ÂŞ_4ÂŞ_5ÂŞ_6ÂŞ_SĂĄb".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D [de] MMMM [de] YYYY",
            LLL : "D [de] MMMM [de] YYYY LT",
            LLLL : "dddd, D [de] MMMM [de] YYYY LT"
        },
        calendar : {
            sameDay: '[Hoje Ă s] LT',
            nextDay: '[AmanhĂŁ Ă s] LT',
            nextWeek: 'dddd [Ă s] LT',
            lastDay: '[Ontem Ă s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Ăltimo] dddd [Ă s] LT' : // Saturday + Sunday
                    '[Ăltima] dddd [Ă s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "em %s",
            past : "%s atrĂĄs",
            s : "segundos",
            m : "um minuto",
            mm : "%d minutos",
            h : "uma hora",
            hh : "%d horas",
            d : "um dia",
            dd : "%d dias",
            M : "um mĂŞs",
            MM : "%d meses",
            y : "um ano",
            yy : "%d anos"
        },
        ordinal : '%dÂş',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
                'mm': 'minute',
                'hh': 'ore',
                'dd': 'zile',
                'MM': 'luni',
                'yy': 'ani'
            },
            separator = ' ';
        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
            separator = ' de ';
        }

        return number + separator + format[key];
    }

    return moment.lang('ro', {
        months : "ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie".split("_"),
        monthsShort : "ian_feb_mar_apr_mai_iun_iul_aug_sep_oct_noi_dec".split("_"),
        weekdays : "duminicÄ_luni_marČi_miercuri_joi_vineri_sĂ˘mbÄtÄ".split("_"),
        weekdaysShort : "Dum_Lun_Mar_Mie_Joi_Vin_SĂ˘m".split("_"),
        weekdaysMin : "Du_Lu_Ma_Mi_Jo_Vi_SĂ˘".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY H:mm",
            LLLL : "dddd, D MMMM YYYY H:mm"
        },
        calendar : {
            sameDay: "[azi la] LT",
            nextDay: '[mĂ˘ine la] LT',
            nextWeek: 'dddd [la] LT',
            lastDay: '[ieri la] LT',
            lastWeek: '[fosta] dddd [la] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "peste %s",
            past : "%s ĂŽn urmÄ",
            s : "cĂ˘teva secunde",
            m : "un minut",
            mm : relativeTimeWithPlural,
            h : "o orÄ",
            hh : relativeTimeWithPlural,
            d : "o zi",
            dd : relativeTimeWithPlural,
            M : "o lunÄ",
            MM : relativeTimeWithPlural,
            y : "un an",
            yy : relativeTimeWithPlural
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : serbian (rs)
// author : Limon Monte : https://github.com/limonte
// based on (bs) translation by Nedim Cholich

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    function translate(number, withoutSuffix, key) {
        var result = number + " ";
        switch (key) {
            case 'm':
                return withoutSuffix ? 'jedna minuta' : 'jedne minute';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minuta';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'jedan sat' : 'jednog sata';
            case 'hh':
                if (number === 1) {
                    result += 'sat';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sata';
                } else {
                    result += 'sati';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dana';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mesec';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'meseca';
                } else {
                    result += 'meseci';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'godina';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'godine';
                } else {
                    result += 'godina';
                }
                return result;
        }
    }

    return moment.lang('rs', {
        months : "januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar".split("_"),
        monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
        weekdays : "nedelja_ponedeljak_utorak_sreda_Äetvrtak_petak_subota".split("_"),
        weekdaysShort : "ned._pon._uto._sre._Äet._pet._sub.".split("_"),
        weekdaysMin : "ne_po_ut_sr_Äe_pe_su".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD. MM. YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedelju] [u] LT';
                    case 3:
                        return '[u] [sredu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juÄe u] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                        return '[proĹĄlu] dddd [u] LT';
                    case 6:
                        return '[proĹĄle] [subote] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[proĹĄli] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "za %s",
            past   : "pre %s",
            s      : "par sekundi",
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : "dan",
            dd     : translate,
            M      : "mesec",
            MM     : translate,
            y      : "godinu",
            yy     : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensĂşle : https://github.com/Oire

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': 'ĐźĐ¸Đ˝ŃŃĐ°_ĐźĐ¸Đ˝ŃŃŃ_ĐźĐ¸Đ˝ŃŃ',
            'hh': 'ŃĐ°Ń_ŃĐ°ŃĐ°_ŃĐ°ŃĐžĐ˛',
            'dd': 'Đ´ĐľĐ˝Ń_Đ´Đ˝Ń_Đ´Đ˝ĐľĐš',
            'MM': 'ĐźĐľŃŃŃ_ĐźĐľŃŃŃĐ°_ĐźĐľŃŃŃĐľĐ˛',
            'yy': 'ĐłĐžĐ´_ĐłĐžĐ´Đ°_ĐťĐľŃ'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ĐźĐ¸Đ˝ŃŃĐ°' : 'ĐźĐ¸Đ˝ŃŃŃ';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
                'nominative': 'ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃ_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ'.split('_'),
                'accusative': 'ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃĐ°_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Ń_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃĐ°_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ'.split('_')
            },

            nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                'accusative' :
                'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = {
                'nominative': 'ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş'.split('_'),
                'accusative': 'ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Ń_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş'.split('_')
            },

            nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                'accusative' :
                'nominative';

        return monthsShort[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
                'nominative': 'Đ˛ĐžŃĐşŃĐľŃĐľĐ˝ŃĐľ_ĐżĐžĐ˝ĐľĐ´ĐľĐťŃĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Đ°_ŃĐľŃĐ˛ĐľŃĐł_ĐżŃŃĐ˝Đ¸ŃĐ°_ŃŃĐąĐąĐžŃĐ°'.split('_'),
                'accusative': 'Đ˛ĐžŃĐşŃĐľŃĐľĐ˝ŃĐľ_ĐżĐžĐ˝ĐľĐ´ĐľĐťŃĐ˝Đ¸Đş_Đ˛ŃĐžŃĐ˝Đ¸Đş_ŃŃĐľĐ´Ń_ŃĐľŃĐ˛ĐľŃĐł_ĐżŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐąĐžŃŃ'.split('_')
            },

            nounCase = (/\[ ?[ĐĐ˛] ?(?:ĐżŃĐžŃĐťŃŃ|ŃĐťĐľĐ´ŃŃŃŃŃ)? ?\] ?dddd/).test(format) ?
                'accusative' :
                'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.lang('ru', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : "Đ˛Ń_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
        weekdaysMin : "Đ˛Ń_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
        monthsParse : [/^ŃĐ˝Đ˛/i, /^ŃĐľĐ˛/i, /^ĐźĐ°Ń/i, /^Đ°ĐżŃ/i, /^ĐźĐ°[Đš|Ń]/i, /^Đ¸ŃĐ˝/i, /^Đ¸ŃĐť/i, /^Đ°Đ˛Đł/i, /^ŃĐľĐ˝/i, /^ĐžĐşŃ/i, /^Đ˝ĐžŃ/i, /^Đ´ĐľĐş/i],
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY Đł.",
            LLL : "D MMMM YYYY Đł., LT",
            LLLL : "dddd, D MMMM YYYY Đł., LT"
        },
        calendar : {
            sameDay: '[ĐĄĐľĐłĐžĐ´Đ˝Ń Đ˛] LT',
            nextDay: '[ĐĐ°Đ˛ŃŃĐ° Đ˛] LT',
            lastDay: '[ĐŃĐľŃĐ° Đ˛] LT',
            nextWeek: function () {
                return this.day() === 2 ? '[ĐĐž] dddd [Đ˛] LT' : '[Đ] dddd [Đ˛] LT';
            },
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[Đ ĐżŃĐžŃĐťĐžĐľ] dddd [Đ˛] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[Đ ĐżŃĐžŃĐťŃĐš] dddd [Đ˛] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[Đ ĐżŃĐžŃĐťŃŃ] dddd [Đ˛] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "ŃĐľŃĐľĐˇ %s",
            past : "%s Đ˝Đ°ĐˇĐ°Đ´",
            s : "Đ˝ĐľŃĐşĐžĐťŃĐşĐž ŃĐľĐşŃĐ˝Đ´",
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : "ŃĐ°Ń",
            hh : relativeTimeWithPlural,
            d : "Đ´ĐľĐ˝Ń",
            dd : relativeTimeWithPlural,
            M : "ĐźĐľŃŃŃ",
            MM : relativeTimeWithPlural,
            y : "ĐłĐžĐ´",
            yy : relativeTimeWithPlural
        },

        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return "Đ˝ĐžŃĐ¸";
            } else if (hour < 12) {
                return "ŃŃŃĐ°";
            } else if (hour < 17) {
                return "Đ´Đ˝Ń";
            } else {
                return "Đ˛ĐľŃĐľŃĐ°";
            }
        },

        ordinal: function (number, period) {
            switch (period) {
                case 'M':
                case 'd':
                case 'DDD':
                    return number + '-Đš';
                case 'D':
                    return number + '-ĐłĐž';
                case 'w':
                case 'W':
                    return number + '-Ń';
                default:
                    return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    var months = "januĂĄr_februĂĄr_marec_aprĂ­l_mĂĄj_jĂşn_jĂşl_august_september_oktĂłber_november_december".split("_"),
        monthsShort = "jan_feb_mar_apr_mĂĄj_jĂşn_jĂşl_aug_sep_okt_nov_dec".split("_");

    function plural(n) {
        return (n > 1) && (n < 5);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + " ";
        switch (key) {
            case 's':  // a few seconds / in a few seconds / a few seconds ago
                return (withoutSuffix || isFuture) ? 'pĂĄr sekĂşnd' : 'pĂĄr sekundami';
            case 'm':  // a minute / in a minute / a minute ago
                return withoutSuffix ? 'minĂşta' : (isFuture ? 'minĂştu' : 'minĂştou');
            case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'minĂşty' : 'minĂşt');
                } else {
                    return result + 'minĂştami';
                }
                break;
            case 'h':  // an hour / in an hour / an hour ago
                return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
            case 'hh': // 9 hours / in 9 hours / 9 hours ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'hodiny' : 'hodĂ­n');
                } else {
                    return result + 'hodinami';
                }
                break;
            case 'd':  // a day / in a day / a day ago
                return (withoutSuffix || isFuture) ? 'deĹ' : 'dĹom';
            case 'dd': // 9 days / in 9 days / 9 days ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'dni' : 'dnĂ­');
                } else {
                    return result + 'dĹami';
                }
                break;
            case 'M':  // a month / in a month / a month ago
                return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
            case 'MM': // 9 months / in 9 months / 9 months ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'mesiace' : 'mesiacov');
                } else {
                    return result + 'mesiacmi';
                }
                break;
            case 'y':  // a year / in a year / a year ago
                return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
            case 'yy': // 9 years / in 9 years / 9 years ago
                if (withoutSuffix || isFuture) {
                    return result + (plural(number) ? 'roky' : 'rokov');
                } else {
                    return result + 'rokmi';
                }
                break;
        }
    }

    return moment.lang('sk', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Äervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : "nedeÄža_pondelok_utorok_streda_ĹĄtvrtok_piatok_sobota".split("_"),
        weekdaysShort : "ne_po_ut_st_ĹĄt_pi_so".split("_"),
        weekdaysMin : "ne_po_ut_st_ĹĄt_pi_so".split("_"),
        longDateFormat : {
            LT: "H:mm",
            L : "DD.MM.YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd D. MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[dnes o] LT",
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[v nedeÄžu o] LT';
                    case 1:
                    case 2:
                        return '[v] dddd [o] LT';
                    case 3:
                        return '[v stredu o] LT';
                    case 4:
                        return '[vo ĹĄtvrtok o] LT';
                    case 5:
                        return '[v piatok o] LT';
                    case 6:
                        return '[v sobotu o] LT';
                }
            },
            lastDay: '[vÄera o] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[minulĂş nedeÄžu o] LT';
                    case 1:
                    case 2:
                        return '[minulĂ˝] dddd [o] LT';
                    case 3:
                        return '[minulĂş stredu o] LT';
                    case 4:
                    case 5:
                        return '[minulĂ˝] dddd [o] LT';
                    case 6:
                        return '[minulĂş sobotu o] LT';
                }
            },
            sameElse: "L"
        },
        relativeTime : {
            future : "za %s",
            past : "pred %s",
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : slovenian (sl)
// author : Robert SedovĹĄek : https://github.com/sedovsek

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + " ";
        switch (key) {
            case 'm':
                return withoutSuffix ? 'ena minuta' : 'eno minuto';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2) {
                    result += 'minuti';
                } else if (number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minut';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'ena ura' : 'eno uro';
            case 'hh':
                if (number === 1) {
                    result += 'ura';
                } else if (number === 2) {
                    result += 'uri';
                } else if (number === 3 || number === 4) {
                    result += 'ure';
                } else {
                    result += 'ur';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dni';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mesec';
                } else if (number === 2) {
                    result += 'meseca';
                } else if (number === 3 || number === 4) {
                    result += 'mesece';
                } else {
                    result += 'mesecev';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'leto';
                } else if (number === 2) {
                    result += 'leti';
                } else if (number === 3 || number === 4) {
                    result += 'leta';
                } else {
                    result += 'let';
                }
                return result;
        }
    }

    return moment.lang('sl', {
        months : "januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december".split("_"),
        monthsShort : "jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.".split("_"),
        weekdays : "nedelja_ponedeljek_torek_sreda_Äetrtek_petek_sobota".split("_"),
        weekdaysShort : "ned._pon._tor._sre._Äet._pet._sob.".split("_"),
        weekdaysMin : "ne_po_to_sr_Äe_pe_so".split("_"),
        longDateFormat : {
            LT : "H:mm",
            L : "DD. MM. YYYY",
            LL : "D. MMMM YYYY",
            LLL : "D. MMMM YYYY LT",
            LLLL : "dddd, D. MMMM YYYY LT"
        },
        calendar : {
            sameDay  : '[danes ob] LT',
            nextDay  : '[jutri ob] LT',

            nextWeek : function () {
                switch (this.day()) {
                    case 0:
                        return '[v] [nedeljo] [ob] LT';
                    case 3:
                        return '[v] [sredo] [ob] LT';
                    case 6:
                        return '[v] [soboto] [ob] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[v] dddd [ob] LT';
                }
            },
            lastDay  : '[vÄeraj ob] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return '[prejĹĄnja] dddd [ob] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[prejĹĄnji] dddd [ob] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : "Äez %s",
            past   : "%s nazaj",
            s      : "nekaj sekund",
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : "en dan",
            dd     : translate,
            M      : "en mesec",
            MM     : translate,
            y      : "eno leto",
            yy     : translate
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Albanian (sq)
// author : FlakĂŤrim Ismani : https://github.com/flakerimi
// author: Menelion ElensĂşle: https://github.com/Oire (tests)

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('sq', {
        months : "Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NĂŤntor_Dhjetor".split("_"),
        monthsShort : "Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NĂŤn_Dhj".split("_"),
        weekdays : "E Diel_E HĂŤnĂŤ_E Marte_E MĂŤrkure_E Enjte_E Premte_E ShtunĂŤ".split("_"),
        weekdaysShort : "Die_HĂŤn_Mar_MĂŤr_Enj_Pre_Sht".split("_"),
        weekdaysMin : "D_H_Ma_MĂŤ_E_P_Sh".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[Sot nĂŤ] LT',
            nextDay : '[Neser nĂŤ] LT',
            nextWeek : 'dddd [nĂŤ] LT',
            lastDay : '[Dje nĂŤ] LT',
            lastWeek : 'dddd [e kaluar nĂŤ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "nĂŤ %s",
            past : "%s me parĂŤ",
            s : "disa sekonda",
            m : "njĂŤ minut",
            mm : "%d minuta",
            h : "njĂŤ orĂŤ",
            hh : "%d orĂŤ",
            d : "njĂŤ ditĂŤ",
            dd : "%d ditĂŤ",
            M : "njĂŤ muaj",
            MM : "%d muaj",
            y : "njĂŤ vit",
            yy : "%d vite"
        },
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('sv', {
        months : "januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december".split("_"),
        monthsShort : "jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec".split("_"),
        weekdays : "sĂśndag_mĂĽndag_tisdag_onsdag_torsdag_fredag_lĂśrdag".split("_"),
        weekdaysShort : "sĂśn_mĂĽn_tis_ons_tor_fre_lĂśr".split("_"),
        weekdaysMin : "sĂś_mĂĽ_ti_on_to_fr_lĂś".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "YYYY-MM-DD",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: '[Idag] LT',
            nextDay: '[Imorgon] LT',
            lastDay: '[IgĂĽr] LT',
            nextWeek: 'dddd LT',
            lastWeek: '[FĂśrra] dddd[en] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "om %s",
            past : "fĂśr %s sedan",
            s : "nĂĽgra sekunder",
            m : "en minut",
            mm : "%d minuter",
            h : "en timme",
            hh : "%d timmar",
            d : "en dag",
            dd : "%d dagar",
            M : "en mĂĽnad",
            MM : "%d mĂĽnader",
            y : "ett ĂĽr",
            yy : "%d ĂĽr"
        },
        ordinal : function (number) {
            var b = number % 10,
                output = (~~ (number % 100 / 10) === 1) ? 'e' :
                    (b === 1) ? 'a' :
                        (b === 2) ? 'a' :
                            (b === 3) ? 'e' : 'e';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    /*var symbolMap = {
     '1': 'ŕŻ§',
     '2': 'ŕŻ¨',
     '3': 'ŕŻŠ',
     '4': 'ŕŻŞ',
     '5': 'ŕŻŤ',
     '6': 'ŕŻŹ',
     '7': 'ŕŻ­',
     '8': 'ŕŻŽ',
     '9': 'ŕŻŻ',
     '0': 'ŕŻŚ'
     },
     numberMap = {
     'ŕŻ§': '1',
     'ŕŻ¨': '2',
     'ŕŻŠ': '3',
     'ŕŻŞ': '4',
     'ŕŻŤ': '5',
     'ŕŻŹ': '6',
     'ŕŻ­': '7',
     'ŕŻŽ': '8',
     'ŕŻŻ': '9',
     'ŕŻŚ': '0'
     }; */

    return moment.lang('ta', {
        months : 'ŕŽŕŽŠŕŽľŕŽ°ŕŽż_ŕŽŞŕŽżŕŽŞŕŻŕŽ°ŕŽľŕŽ°ŕŽż_ŕŽŽŕŽžŕŽ°ŕŻŕŽŕŻ_ŕŽŕŽŞŕŻŕŽ°ŕŽ˛ŕŻ_ŕŽŽŕŻ_ŕŽŕŻŕŽŠŕŻ_ŕŽŕŻŕŽ˛ŕŻ_ŕŽŕŽŕŽ¸ŕŻŕŽŕŻ_ŕŽŕŻŕŽŞŕŻŕŽŕŻŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽŕŻŕŽŕŻŕŽžŕŽŞŕŽ°ŕŻ_ŕŽ¨ŕŽľŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽżŕŽŕŽŽŕŻŕŽŞŕŽ°ŕŻ'.split("_"),
        monthsShort : 'ŕŽŕŽŠŕŽľŕŽ°ŕŽż_ŕŽŞŕŽżŕŽŞŕŻŕŽ°ŕŽľŕŽ°ŕŽż_ŕŽŽŕŽžŕŽ°ŕŻŕŽŕŻ_ŕŽŕŽŞŕŻŕŽ°ŕŽ˛ŕŻ_ŕŽŽŕŻ_ŕŽŕŻŕŽŠŕŻ_ŕŽŕŻŕŽ˛ŕŻ_ŕŽŕŽŕŽ¸ŕŻŕŽŕŻ_ŕŽŕŻŕŽŞŕŻŕŽŕŻŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽŕŻŕŽŕŻŕŽžŕŽŞŕŽ°ŕŻ_ŕŽ¨ŕŽľŕŽŽŕŻŕŽŞŕŽ°ŕŻ_ŕŽŕŽżŕŽŕŽŽŕŻŕŽŞŕŽ°ŕŻ'.split("_"),
        weekdays : 'ŕŽŕŽžŕŽŻŕŽżŕŽąŕŻŕŽąŕŻŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽ¤ŕŽżŕŽŕŻŕŽŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŕŻŕŽľŕŻŕŽľŕŽžŕŽŻŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŞŕŻŕŽ¤ŕŽŠŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽľŕŽżŕŽŻŕŽžŕŽ´ŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽľŕŻŕŽłŕŻŕŽłŕŽżŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ_ŕŽŕŽŠŕŽżŕŽŕŻŕŽŕŽżŕŽ´ŕŽŽŕŻ'.split("_"),
        weekdaysShort : 'ŕŽŕŽžŕŽŻŕŽżŕŽąŕŻ_ŕŽ¤ŕŽżŕŽŕŻŕŽŕŽłŕŻ_ŕŽŕŻŕŽľŕŻŕŽľŕŽžŕŽŻŕŻ_ŕŽŞŕŻŕŽ¤ŕŽŠŕŻ_ŕŽľŕŽżŕŽŻŕŽžŕŽ´ŕŽŠŕŻ_ŕŽľŕŻŕŽłŕŻŕŽłŕŽż_ŕŽŕŽŠŕŽż'.split("_"),
        weekdaysMin : 'ŕŽŕŽž_ŕŽ¤ŕŽż_ŕŽŕŻ_ŕŽŞŕŻ_ŕŽľŕŽż_ŕŽľŕŻ_ŕŽ'.split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY, LT",
            LLLL : "dddd, D MMMM YYYY, LT"
        },
        calendar : {
            sameDay : '[ŕŽŕŽŠŕŻŕŽąŕŻ] LT',
            nextDay : '[ŕŽ¨ŕŽžŕŽłŕŻ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ŕŽ¨ŕŻŕŽąŕŻŕŽąŕŻ] LT',
            lastWeek : '[ŕŽŕŽŕŽ¨ŕŻŕŽ¤ ŕŽľŕŽžŕŽ°ŕŽŽŕŻ] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s ŕŽŕŽ˛ŕŻ",
            past : "%s ŕŽŽŕŻŕŽŠŕŻ",
            s : "ŕŽŕŽ°ŕŻ ŕŽŕŽżŕŽ˛ ŕŽľŕŽżŕŽ¨ŕŽžŕŽŕŽżŕŽŕŽłŕŻ",
            m : "ŕŽŕŽ°ŕŻ ŕŽ¨ŕŽżŕŽŽŕŽżŕŽŕŽŽŕŻ",
            mm : "%d ŕŽ¨ŕŽżŕŽŽŕŽżŕŽŕŽŕŻŕŽŕŽłŕŻ",
            h : "ŕŽŕŽ°ŕŻ ŕŽŽŕŽŁŕŽż ŕŽ¨ŕŻŕŽ°ŕŽŽŕŻ",
            hh : "%d ŕŽŽŕŽŁŕŽż ŕŽ¨ŕŻŕŽ°ŕŽŽŕŻ",
            d : "ŕŽŕŽ°ŕŻ ŕŽ¨ŕŽžŕŽłŕŻ",
            dd : "%d ŕŽ¨ŕŽžŕŽŕŻŕŽŕŽłŕŻ",
            M : "ŕŽŕŽ°ŕŻ ŕŽŽŕŽžŕŽ¤ŕŽŽŕŻ",
            MM : "%d ŕŽŽŕŽžŕŽ¤ŕŽŕŻŕŽŕŽłŕŻ",
            y : "ŕŽŕŽ°ŕŻ ŕŽľŕŽ°ŕŻŕŽŕŽŽŕŻ",
            yy : "%d ŕŽŕŽŁŕŻŕŽŕŻŕŽŕŽłŕŻ"
        },
        /*        preparse: function (string) {
         return string.replace(/[ŕŻ§ŕŻ¨ŕŻŠŕŻŞŕŻŤŕŻŹŕŻ­ŕŻŽŕŻŻŕŻŚ]/g, function (match) {
         return numberMap[match];
         });
         },
         postformat: function (string) {
         return string.replace(/\d/g, function (match) {
         return symbolMap[match];
         });
         },*/
        ordinal : function (number) {
            return number + 'ŕŽľŕŽ¤ŕŻ';
        },


// refer http://ta.wikipedia.org/s/1er1      

        meridiem : function (hour, minute, isLower) {
            if (hour >= 6 && hour <= 10) {
                return " ŕŽŕŽžŕŽ˛ŕŻ";
            } else   if (hour >= 10 && hour <= 14) {
                return " ŕŽ¨ŕŽŁŕŻŕŽŞŕŽŕŽ˛ŕŻ";
            } else    if (hour >= 14 && hour <= 18) {
                return " ŕŽŕŽąŕŻŕŽŞŕŽžŕŽŕŻ";
            } else   if (hour >= 18 && hour <= 20) {
                return " ŕŽŽŕŽžŕŽ˛ŕŻ";
            } else  if (hour >= 20 && hour <= 24) {
                return " ŕŽŕŽ°ŕŽľŕŻ";
            } else  if (hour >= 0 && hour <= 6) {
                return " ŕŽľŕŻŕŽŕŽąŕŻ";
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('th', {
        months : "ŕ¸Ąŕ¸ŕ¸Łŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸¸ŕ¸Ąŕ¸ ŕ¸˛ŕ¸ŕ¸ąŕ¸ŕ¸ŕš_ŕ¸Ąŕ¸ľŕ¸ŕ¸˛ŕ¸ŕ¸Ą_ŕšŕ¸Ąŕ¸Šŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸¤ŕ¸Šŕ¸ ŕ¸˛ŕ¸ŕ¸Ą_ŕ¸Ąŕ¸´ŕ¸ŕ¸¸ŕ¸ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸Łŕ¸ŕ¸ŕ¸˛ŕ¸ŕ¸Ą_ŕ¸Şŕ¸´ŕ¸ŕ¸Ťŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸ąŕ¸ŕ¸˘ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸¸ŕ¸Ľŕ¸˛ŕ¸ŕ¸Ą_ŕ¸ŕ¸¤ŕ¸¨ŕ¸ŕ¸´ŕ¸ŕ¸˛ŕ¸˘ŕ¸_ŕ¸ŕ¸ąŕ¸ŕ¸§ŕ¸˛ŕ¸ŕ¸Ą".split("_"),
        monthsShort : "ŕ¸Ąŕ¸ŕ¸Łŕ¸˛_ŕ¸ŕ¸¸ŕ¸Ąŕ¸ ŕ¸˛_ŕ¸Ąŕ¸ľŕ¸ŕ¸˛_ŕšŕ¸Ąŕ¸Šŕ¸˛_ŕ¸ŕ¸¤ŕ¸Šŕ¸ ŕ¸˛_ŕ¸Ąŕ¸´ŕ¸ŕ¸¸ŕ¸ŕ¸˛_ŕ¸ŕ¸Łŕ¸ŕ¸ŕ¸˛_ŕ¸Şŕ¸´ŕ¸ŕ¸Ťŕ¸˛_ŕ¸ŕ¸ąŕ¸ŕ¸˘ŕ¸˛_ŕ¸ŕ¸¸ŕ¸Ľŕ¸˛_ŕ¸ŕ¸¤ŕ¸¨ŕ¸ŕ¸´ŕ¸ŕ¸˛_ŕ¸ŕ¸ąŕ¸ŕ¸§ŕ¸˛".split("_"),
        weekdays : "ŕ¸­ŕ¸˛ŕ¸ŕ¸´ŕ¸ŕ¸˘ŕš_ŕ¸ŕ¸ąŕ¸ŕ¸ŕ¸Łŕš_ŕ¸­ŕ¸ąŕ¸ŕ¸ŕ¸˛ŕ¸Ł_ŕ¸ŕ¸¸ŕ¸_ŕ¸ŕ¸¤ŕ¸Ťŕ¸ąŕ¸Şŕ¸ŕ¸ŕ¸ľ_ŕ¸¨ŕ¸¸ŕ¸ŕ¸Łŕš_ŕšŕ¸Şŕ¸˛ŕ¸Łŕš".split("_"),
        weekdaysShort : "ŕ¸­ŕ¸˛ŕ¸ŕ¸´ŕ¸ŕ¸˘ŕš_ŕ¸ŕ¸ąŕ¸ŕ¸ŕ¸Łŕš_ŕ¸­ŕ¸ąŕ¸ŕ¸ŕ¸˛ŕ¸Ł_ŕ¸ŕ¸¸ŕ¸_ŕ¸ŕ¸¤ŕ¸Ťŕ¸ąŕ¸Ş_ŕ¸¨ŕ¸¸ŕ¸ŕ¸Łŕš_ŕšŕ¸Şŕ¸˛ŕ¸Łŕš".split("_"), // yes, three characters difference
        weekdaysMin : "ŕ¸­ŕ¸˛._ŕ¸._ŕ¸­._ŕ¸._ŕ¸ŕ¸¤._ŕ¸¨._ŕ¸Ş.".split("_"),
        longDateFormat : {
            LT : "H ŕ¸ŕ¸˛ŕ¸Źŕ¸´ŕ¸ŕ¸˛ m ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
            L : "YYYY/MM/DD",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY ŕšŕ¸§ŕ¸Ľŕ¸˛ LT",
            LLLL : "ŕ¸§ŕ¸ąŕ¸ddddŕ¸ŕ¸ľŕš D MMMM YYYY ŕšŕ¸§ŕ¸Ľŕ¸˛ LT"
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return "ŕ¸ŕšŕ¸­ŕ¸ŕšŕ¸ŕ¸ľŕšŕ¸˘ŕ¸";
            } else {
                return "ŕ¸Ťŕ¸Ľŕ¸ąŕ¸ŕšŕ¸ŕ¸ľŕšŕ¸˘ŕ¸";
            }
        },
        calendar : {
            sameDay : '[ŕ¸§ŕ¸ąŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
            nextDay : '[ŕ¸ŕ¸Łŕ¸¸ŕšŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
            nextWeek : 'dddd[ŕ¸Ťŕ¸ŕšŕ¸˛ ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
            lastDay : '[ŕšŕ¸Ąŕ¸ˇŕšŕ¸­ŕ¸§ŕ¸˛ŕ¸ŕ¸ŕ¸ľŕš ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
            lastWeek : '[ŕ¸§ŕ¸ąŕ¸]dddd[ŕ¸ŕ¸ľŕšŕšŕ¸Ľŕšŕ¸§ ŕšŕ¸§ŕ¸Ľŕ¸˛] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "ŕ¸­ŕ¸ľŕ¸ %s",
            past : "%sŕ¸ŕ¸ľŕšŕšŕ¸Ľŕšŕ¸§",
            s : "ŕšŕ¸Ąŕšŕ¸ŕ¸ľŕšŕ¸§ŕ¸´ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
            m : "1 ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
            mm : "%d ŕ¸ŕ¸˛ŕ¸ŕ¸ľ",
            h : "1 ŕ¸ŕ¸ąŕšŕ¸§ŕšŕ¸Ąŕ¸",
            hh : "%d ŕ¸ŕ¸ąŕšŕ¸§ŕšŕ¸Ąŕ¸",
            d : "1 ŕ¸§ŕ¸ąŕ¸",
            dd : "%d ŕ¸§ŕ¸ąŕ¸",
            M : "1 ŕšŕ¸ŕ¸ˇŕ¸­ŕ¸",
            MM : "%d ŕšŕ¸ŕ¸ˇŕ¸­ŕ¸",
            y : "1 ŕ¸ŕ¸ľ",
            yy : "%d ŕ¸ŕ¸ľ"
        }
    });
}));

// moment.js language configuration
// language : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('tl-ph', {
        months : "Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre".split("_"),
        monthsShort : "Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis".split("_"),
        weekdays : "Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado".split("_"),
        weekdaysShort : "Lin_Lun_Mar_Miy_Huw_Biy_Sab".split("_"),
        weekdaysMin : "Li_Lu_Ma_Mi_Hu_Bi_Sab".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "MM/D/YYYY",
            LL : "MMMM D, YYYY",
            LLL : "MMMM D, YYYY LT",
            LLLL : "dddd, MMMM DD, YYYY LT"
        },
        calendar : {
            sameDay: "[Ngayon sa] LT",
            nextDay: '[Bukas sa] LT',
            nextWeek: 'dddd [sa] LT',
            lastDay: '[Kahapon sa] LT',
            lastWeek: 'dddd [huling linggo] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "sa loob ng %s",
            past : "%s ang nakalipas",
            s : "ilang segundo",
            m : "isang minuto",
            mm : "%d minuto",
            h : "isang oras",
            hh : "%d oras",
            d : "isang araw",
            dd : "%d araw",
            M : "isang buwan",
            MM : "%d buwan",
            y : "isang taon",
            yy : "%d taon"
        },
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiÄit Kaya: https://github.com/BYK

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {

    var suffixes = {
        1: "'inci",
        5: "'inci",
        8: "'inci",
        70: "'inci",
        80: "'inci",

        2: "'nci",
        7: "'nci",
        20: "'nci",
        50: "'nci",

        3: "'ĂźncĂź",
        4: "'ĂźncĂź",
        100: "'ĂźncĂź",

        6: "'ncÄą",

        9: "'uncu",
        10: "'uncu",
        30: "'uncu",

        60: "'ÄąncÄą",
        90: "'ÄąncÄą"
    };

    return moment.lang('tr', {
        months : "Ocak_Ĺubat_Mart_Nisan_MayÄąs_Haziran_Temmuz_AÄustos_EylĂźl_Ekim_KasÄąm_AralÄąk".split("_"),
        monthsShort : "Oca_Ĺub_Mar_Nis_May_Haz_Tem_AÄu_Eyl_Eki_Kas_Ara".split("_"),
        weekdays : "Pazar_Pazartesi_SalÄą_ĂarĹamba_PerĹembe_Cuma_Cumartesi".split("_"),
        weekdaysShort : "Paz_Pts_Sal_Ăar_Per_Cum_Cts".split("_"),
        weekdaysMin : "Pz_Pt_Sa_Ăa_Pe_Cu_Ct".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd, D MMMM YYYY LT"
        },
        calendar : {
            sameDay : '[bugĂźn saat] LT',
            nextDay : '[yarÄąn saat] LT',
            nextWeek : '[haftaya] dddd [saat] LT',
            lastDay : '[dĂźn] LT',
            lastWeek : '[geĂ§en hafta] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s sonra",
            past : "%s Ăśnce",
            s : "birkaĂ§ saniye",
            m : "bir dakika",
            mm : "%d dakika",
            h : "bir saat",
            hh : "%d saat",
            d : "bir gĂźn",
            dd : "%d gĂźn",
            M : "bir ay",
            MM : "%d ay",
            y : "bir yÄąl",
            yy : "%d yÄąl"
        },
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + "'ÄąncÄą";
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Morocco Central Atlas TamaziÉŁt in Latin (tzm-la)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('tzm-la', {
        months : "innayr_brË¤ayrË¤_marË¤sË¤_ibrir_mayyw_ywnyw_ywlywz_ÉŁwĹĄt_ĹĄwtanbir_ktË¤wbrË¤_nwwanbir_dwjnbir".split("_"),
        monthsShort : "innayr_brË¤ayrË¤_marË¤sË¤_ibrir_mayyw_ywnyw_ywlywz_ÉŁwĹĄt_ĹĄwtanbir_ktË¤wbrË¤_nwwanbir_dwjnbir".split("_"),
        weekdays : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
        weekdaysShort : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
        weekdaysMin : "asamas_aynas_asinas_akras_akwas_asimwas_asiá¸yas".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[asdkh g] LT",
            nextDay: '[aska g] LT',
            nextWeek: 'dddd [g] LT',
            lastDay: '[assant g] LT',
            lastWeek: 'dddd [g] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "dadkh s yan %s",
            past : "yan %s",
            s : "imik",
            m : "minuá¸",
            mm : "%d minuá¸",
            h : "saÉa",
            hh : "%d tassaÉin",
            d : "ass",
            dd : "%d ossan",
            M : "ayowr",
            MM : "%d iyyirn",
            y : "asgas",
            yy : "%d isgasn"
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : Morocco Central Atlas TamaziÉŁt (tzm)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('tzm', {
        months : "âľâľâľâ´°âľ˘âľ_â´ąâľâ´°âľ˘âľ_âľâ´°âľâľ_âľâ´ąâľâľâľ_âľâ´°âľ˘âľ˘âľ_âľ˘âľâľâľ˘âľ_âľ˘âľâľâľ˘âľâľŁ_âľâľâľâľ_âľâľâľâ´°âľâ´ąâľâľ_â´˝âľâľâ´ąâľ_âľâľâľĄâ´°âľâ´ąâľâľ_â´ˇâľâľâľâ´ąâľâľ".split("_"),
        monthsShort : "âľâľâľâ´°âľ˘âľ_â´ąâľâ´°âľ˘âľ_âľâ´°âľâľ_âľâ´ąâľâľâľ_âľâ´°âľ˘âľ˘âľ_âľ˘âľâľâľ˘âľ_âľ˘âľâľâľ˘âľâľŁ_âľâľâľâľ_âľâľâľâ´°âľâ´ąâľâľ_â´˝âľâľâ´ąâľ_âľâľâľĄâ´°âľâ´ąâľâľ_â´ˇâľâľâľâ´ąâľâľ".split("_"),
        weekdays : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
        weekdaysShort : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
        weekdaysMin : "â´°âľâ´°âľâ´°âľ_â´°âľ˘âľâ´°âľ_â´°âľâľâľâ´°âľ_â´°â´˝âľâ´°âľ_â´°â´˝âľĄâ´°âľ_â´°âľâľâľâľĄâ´°âľ_â´°âľâľâ´šâľ˘â´°âľ".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "dddd D MMMM YYYY LT"
        },
        calendar : {
            sameDay: "[â´°âľâ´ˇâľ â´´] LT",
            nextDay: '[â´°âľâ´˝â´° â´´] LT',
            nextWeek: 'dddd [â´´] LT',
            lastDay: '[â´°âľâ´°âľâľ â´´] LT',
            lastWeek: 'dddd [â´´] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "â´ˇâ´°â´ˇâľ âľ âľ˘â´°âľ %s",
            past : "âľ˘â´°âľ %s",
            s : "âľâľâľâ´˝",
            m : "âľâľâľâľâ´ş",
            mm : "%d âľâľâľâľâ´ş",
            h : "âľâ´°âľâ´°",
            hh : "%d âľâ´°âľâľâ´°âľâľâľ",
            d : "â´°âľâľ",
            dd : "%d oâľâľâ´°âľ",
            M : "â´°âľ˘oâľâľ",
            MM : "%d âľâľ˘âľ˘âľâľâľ",
            y : "â´°âľâ´łâ´°âľ",
            yy : "%d âľâľâ´łâ´°âľâľ"
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensĂşle : https://github.com/Oire

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ°_ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ¸_ŃĐ˛Đ¸ĐťĐ¸Đ˝',
            'hh': 'ĐłĐžĐ´Đ¸Đ˝Đ°_ĐłĐžĐ´Đ¸Đ˝Đ¸_ĐłĐžĐ´Đ¸Đ˝',
            'dd': 'Đ´ĐľĐ˝Ń_Đ´Đ˝Ń_Đ´Đ˝ŃĐ˛',
            'MM': 'ĐźŃŃŃŃŃ_ĐźŃŃŃŃŃ_ĐźŃŃŃŃŃĐ˛',
            'yy': 'ŃŃĐş_ŃĐžĐşĐ¸_ŃĐžĐşŃĐ˛'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Đ°' : 'ŃĐ˛Đ¸ĐťĐ¸Đ˝Ń';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'ĐłĐžĐ´Đ¸Đ˝Đ°' : 'ĐłĐžĐ´Đ¸Đ˝Ń';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
                'nominative': 'ŃŃŃĐľĐ˝Ń_ĐťŃŃĐ¸Đš_ĐąĐľŃĐľĐˇĐľĐ˝Ń_ĐşĐ˛ŃŃĐľĐ˝Ń_ŃŃĐ°Đ˛ĐľĐ˝Ń_ŃĐľŃĐ˛ĐľĐ˝Ń_ĐťĐ¸ĐżĐľĐ˝Ń_ŃĐľŃĐżĐľĐ˝Ń_Đ˛ĐľŃĐľŃĐľĐ˝Ń_ĐśĐžĐ˛ŃĐľĐ˝Ń_ĐťĐ¸ŃŃĐžĐżĐ°Đ´_ĐłŃŃĐ´ĐľĐ˝Ń'.split('_'),
                'accusative': 'ŃŃŃĐ˝Ń_ĐťŃŃĐžĐłĐž_ĐąĐľŃĐľĐˇĐ˝Ń_ĐşĐ˛ŃŃĐ˝Ń_ŃŃĐ°Đ˛Đ˝Ń_ŃĐľŃĐ˛Đ˝Ń_ĐťĐ¸ĐżĐ˝Ń_ŃĐľŃĐżĐ˝Ń_Đ˛ĐľŃĐľŃĐ˝Ń_ĐśĐžĐ˛ŃĐ˝Ń_ĐťĐ¸ŃŃĐžĐżĐ°Đ´Đ°_ĐłŃŃĐ´Đ˝Ń'.split('_')
            },

            nounCase = (/D[oD]? *MMMM?/).test(format) ?
                'accusative' :
                'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
                'nominative': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐžĐş_Đ˛ŃĐ˛ŃĐžŃĐžĐş_ŃĐľŃĐľĐ´Đ°_ŃĐľŃĐ˛ĐľŃ_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃĐ°'.split('_'),
                'accusative': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐžĐş_Đ˛ŃĐ˛ŃĐžŃĐžĐş_ŃĐľŃĐľĐ´Ń_ŃĐľŃĐ˛ĐľŃ_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃŃ'.split('_'),
                'genitive': 'Đ˝ĐľĐ´ŃĐťŃ_ĐżĐžĐ˝ĐľĐ´ŃĐťĐşĐ°_Đ˛ŃĐ˛ŃĐžŃĐşĐ°_ŃĐľŃĐľĐ´Đ¸_ŃĐľŃĐ˛ĐľŃĐłĐ°_ĐżâŃŃĐ˝Đ¸ŃŃ_ŃŃĐąĐžŃĐ¸'.split('_')
            },

            nounCase = (/(\[[ĐĐ˛ĐŁŃ]\]) ?dddd/).test(format) ?
                'accusative' :
                ((/\[?(?:ĐźĐ¸Đ˝ŃĐťĐžŃ|Đ˝Đ°ŃŃŃĐżĐ˝ĐžŃ)? ?\] ?dddd/).test(format) ?
                    'genitive' :
                    'nominative');

        return weekdays[nounCase][m.day()];
    }

    function processHoursFunction(str) {
        return function () {
            return str + 'Đž' + (this.hours() === 11 ? 'Đą' : '') + '] LT';
        };
    }

    return moment.lang('uk', {
        months : monthsCaseReplace,
        monthsShort : "ŃŃŃ_ĐťŃŃ_ĐąĐľŃ_ĐşĐ˛ŃŃ_ŃŃĐ°Đ˛_ŃĐľŃĐ˛_ĐťĐ¸Đż_ŃĐľŃĐż_Đ˛ĐľŃ_ĐśĐžĐ˛Ń_ĐťĐ¸ŃŃ_ĐłŃŃĐ´".split("_"),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
        weekdaysMin : "Đ˝Đ´_ĐżĐ˝_Đ˛Ń_ŃŃ_ŃŃ_ĐżŃ_ŃĐą".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD.MM.YYYY",
            LL : "D MMMM YYYY Ń.",
            LLL : "D MMMM YYYY Ń., LT",
            LLLL : "dddd, D MMMM YYYY Ń., LT"
        },
        calendar : {
            sameDay: processHoursFunction('[ĐĄŃĐžĐłĐžĐ´Đ˝Ń '),
            nextDay: processHoursFunction('[ĐĐ°Đ˛ŃŃĐ° '),
            lastDay: processHoursFunction('[ĐŃĐžŃĐ° '),
            nextWeek: processHoursFunction('[ĐŁ] dddd ['),
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 5:
                    case 6:
                        return processHoursFunction('[ĐĐ¸Đ˝ŃĐťĐžŃ] dddd [').call(this);
                    case 1:
                    case 2:
                    case 4:
                        return processHoursFunction('[ĐĐ¸Đ˝ŃĐťĐžĐłĐž] dddd [').call(this);
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : "ĐˇĐ° %s",
            past : "%s ŃĐžĐźŃ",
            s : "Đ´ĐľĐşŃĐťŃĐşĐ° ŃĐľĐşŃĐ˝Đ´",
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : "ĐłĐžĐ´Đ¸Đ˝Ń",
            hh : relativeTimeWithPlural,
            d : "Đ´ĐľĐ˝Ń",
            dd : relativeTimeWithPlural,
            M : "ĐźŃŃŃŃŃ",
            MM : relativeTimeWithPlural,
            y : "ŃŃĐş",
            yy : relativeTimeWithPlural
        },

        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return "Đ˝ĐžŃŃ";
            } else if (hour < 12) {
                return "ŃĐ°Đ˝ĐşŃ";
            } else if (hour < 17) {
                return "Đ´Đ˝Ń";
            } else {
                return "Đ˛ĐľŃĐžŃĐ°";
            }
        },

        ordinal: function (number, period) {
            switch (period) {
                case 'M':
                case 'd':
                case 'DDD':
                case 'w':
                case 'W':
                    return number + '-Đš';
                case 'D':
                    return number + '-ĐłĐž';
                default:
                    return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : uzbek
// author : Sardor Muminov : https://github.com/muminoff

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('uz', {
        months : "ŃĐ˝Đ˛Đ°ŃŃ_ŃĐľĐ˛ŃĐ°ĐťŃ_ĐźĐ°ŃŃ_Đ°ĐżŃĐľĐťŃ_ĐźĐ°Đš_Đ¸ŃĐ˝Ń_Đ¸ŃĐťŃ_Đ°Đ˛ĐłŃŃŃ_ŃĐľĐ˝ŃŃĐąŃŃ_ĐžĐşŃŃĐąŃŃ_Đ˝ĐžŃĐąŃŃ_Đ´ĐľĐşĐ°ĐąŃŃ".split("_"),
        monthsShort : "ŃĐ˝Đ˛_ŃĐľĐ˛_ĐźĐ°Ń_Đ°ĐżŃ_ĐźĐ°Đš_Đ¸ŃĐ˝_Đ¸ŃĐť_Đ°Đ˛Đł_ŃĐľĐ˝_ĐžĐşŃ_Đ˝ĐžŃ_Đ´ĐľĐş".split("_"),
        weekdays : "ĐŻĐşŃĐ°Đ˝ĐąĐ°_ĐŃŃĐ°Đ˝ĐąĐ°_ĐĄĐľŃĐ°Đ˝ĐąĐ°_Đ§ĐžŃŃĐ°Đ˝ĐąĐ°_ĐĐ°ĐšŃĐ°Đ˝ĐąĐ°_ĐŃĐźĐ°_Đ¨Đ°Đ˝ĐąĐ°".split("_"),
        weekdaysShort : "ĐŻĐşŃ_ĐŃŃ_ĐĄĐľŃ_Đ§ĐžŃ_ĐĐ°Đš_ĐŃĐź_Đ¨Đ°Đ˝".split("_"),
        weekdaysMin : "ĐŻĐş_ĐŃ_ĐĄĐľ_Đ§Đž_ĐĐ°_ĐŃ_Đ¨Đ°".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM YYYY",
            LLL : "D MMMM YYYY LT",
            LLLL : "D MMMM YYYY, dddd LT"
        },
        calendar : {
            sameDay : '[ĐŃĐłŃĐ˝ ŃĐžĐ°Ń] LT [Đ´Đ°]',
            nextDay : '[Đ­ŃŃĐ°ĐłĐ°] LT [Đ´Đ°]',
            nextWeek : 'dddd [ĐşŃĐ˝Đ¸ ŃĐžĐ°Ń] LT [Đ´Đ°]',
            lastDay : '[ĐĐľŃĐ° ŃĐžĐ°Ń] LT [Đ´Đ°]',
            lastWeek : '[ĐŁŃĐłĐ°Đ˝] dddd [ĐşŃĐ˝Đ¸ ŃĐžĐ°Ń] LT [Đ´Đ°]',
            sameElse : 'L'
        },
        relativeTime : {
            future : "ĐŻĐşĐ¸Đ˝ %s Đ¸ŃĐ¸Đ´Đ°",
            past : "ĐĐ¸Ń Đ˝ĐľŃĐ° %s ĐžĐťĐ´Đ¸Đ˝",
            s : "ŃŃŃŃĐ°Ń",
            m : "ĐąĐ¸Ń Đ´Đ°ĐşĐ¸ĐşĐ°",
            mm : "%d Đ´Đ°ĐşĐ¸ĐşĐ°",
            h : "ĐąĐ¸Ń ŃĐžĐ°Ń",
            hh : "%d ŃĐžĐ°Ń",
            d : "ĐąĐ¸Ń ĐşŃĐ˝",
            dd : "%d ĐşŃĐ˝",
            M : "ĐąĐ¸Ń ĐžĐš",
            MM : "%d ĐžĐš",
            y : "ĐąĐ¸Ń ĐšĐ¸Đť",
            yy : "%d ĐšĐ¸Đť"
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : vietnamese (vn)
// author : Bang Nguyen : https://github.com/bangnk

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('vn', {
        months : "thĂĄng 1_thĂĄng 2_thĂĄng 3_thĂĄng 4_thĂĄng 5_thĂĄng 6_thĂĄng 7_thĂĄng 8_thĂĄng 9_thĂĄng 10_thĂĄng 11_thĂĄng 12".split("_"),
        monthsShort : "Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12".split("_"),
        weekdays : "cháť§ nháş­t_tháťŠ hai_tháťŠ ba_tháťŠ tĆ°_tháťŠ nÄm_tháťŠ sĂĄu_tháťŠ báşŁy".split("_"),
        weekdaysShort : "CN_T2_T3_T4_T5_T6_T7".split("_"),
        weekdaysMin : "CN_T2_T3_T4_T5_T6_T7".split("_"),
        longDateFormat : {
            LT : "HH:mm",
            L : "DD/MM/YYYY",
            LL : "D MMMM [nÄm] YYYY",
            LLL : "D MMMM [nÄm] YYYY LT",
            LLLL : "dddd, D MMMM [nÄm] YYYY LT",
            l : "DD/M/YYYY",
            ll : "D MMM YYYY",
            lll : "D MMM YYYY LT",
            llll : "ddd, D MMM YYYY LT"
        },
        calendar : {
            sameDay: "[HĂ´m nay lĂşc] LT",
            nextDay: '[NgĂ y mai lĂşc] LT',
            nextWeek: 'dddd [tuáş§n táťi lĂşc] LT',
            lastDay: '[HĂ´m qua lĂşc] LT',
            lastWeek: 'dddd [tuáş§n ráťi lĂşc] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : "%s táťi",
            past : "%s trĆ°áťc",
            s : "vĂ i giĂ˘y",
            m : "máťt phĂşt",
            mm : "%d phĂşt",
            h : "máťt giáť",
            hh : "%d giáť",
            d : "máťt ngĂ y",
            dd : "%d ngĂ y",
            M : "máťt thĂĄng",
            MM : "%d thĂĄng",
            y : "máťt nÄm",
            yy : "%d nÄm"
        },
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : chinese
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('zh-cn', {
        months : "ä¸ć_äşć_ä¸ć_ĺć_äşć_ĺ­ć_ä¸ć_ĺŤć_äšć_ĺć_ĺä¸ć_ĺäşć".split("_"),
        monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
        weekdays : "ćććĽ_ććä¸_ććäş_ććä¸_ććĺ_ććäş_ććĺ­".split("_"),
        weekdaysShort : "ĺ¨ćĽ_ĺ¨ä¸_ĺ¨äş_ĺ¨ä¸_ĺ¨ĺ_ĺ¨äş_ĺ¨ĺ­".split("_"),
        weekdaysMin : "ćĽ_ä¸_äş_ä¸_ĺ_äş_ĺ­".split("_"),
        longDateFormat : {
            LT : "Ahçšmm",
            L : "YYYY-MM-DD",
            LL : "YYYYĺš´MMMDćĽ",
            LLL : "YYYYĺš´MMMDćĽLT",
            LLLL : "YYYYĺš´MMMDćĽddddLT",
            l : "YYYY-MM-DD",
            ll : "YYYYĺš´MMMDćĽ",
            lll : "YYYYĺš´MMMDćĽLT",
            llll : "YYYYĺš´MMMDćĽddddLT"
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return "ĺć¨";
            } else if (hm < 900) {
                return "ćŠä¸";
            } else if (hm < 1130) {
                return "ä¸ĺ";
            } else if (hm < 1230) {
                return "ä¸­ĺ";
            } else if (hm < 1800) {
                return "ä¸ĺ";
            } else {
                return "ćä¸";
            }
        },
        calendar : {
            sameDay : function () {
                return this.minutes() === 0 ? "[äťĺ¤Š]Ah[çšć´]" : "[äťĺ¤Š]LT";
            },
            nextDay : function () {
                return this.minutes() === 0 ? "[ćĺ¤Š]Ah[çšć´]" : "[ćĺ¤Š]LT";
            },
            lastDay : function () {
                return this.minutes() === 0 ? "[ć¨ĺ¤Š]Ah[çšć´]" : "[ć¨ĺ¤Š]LT";
            },
            nextWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[ä¸]' : '[ćŹ]';
                return this.minutes() === 0 ? prefix + "dddAhçšć´" : prefix + "dddAhçšmm";
            },
            lastWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() < startOfWeek.unix()  ? '[ä¸]' : '[ćŹ]';
                return this.minutes() === 0 ? prefix + "dddAhçšć´" : prefix + "dddAhçšmm";
            },
            sameElse : 'LL'
        },
        ordinal : function (number, period) {
            switch (period) {
                case "d":
                case "D":
                case "DDD":
                    return number + "ćĽ";
                case "M":
                    return number + "ć";
                case "w":
                case "W":
                    return number + "ĺ¨";
                default:
                    return number;
            }
        },
        relativeTime : {
            future : "%sĺ",
            past : "%sĺ",
            s : "ĺ ç§",
            m : "1ĺé",
            mm : "%dĺé",
            h : "1ĺ°ćś",
            hh : "%dĺ°ćś",
            d : "1ĺ¤Š",
            dd : "%dĺ¤Š",
            M : "1ä¸Şć",
            MM : "%dä¸Şć",
            y : "1ĺš´",
            yy : "%dĺš´"
        },
        week : {
            // GB/T 7408-1994ăć°ćŽĺĺäş¤ć˘ć źĺźÂˇäżĄćŻäş¤ć˘ÂˇćĽćĺćśé´čĄ¨ç¤şćłăä¸ISO 8601:1988ç­ć
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));

// moment.js language configuration
// language : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['moment'], factory); // AMD
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../moment')); // Node
    } else {
        factory(window.moment); // Browser global
    }
}(function (moment) {
    return moment.lang('zh-tw', {
        months : "ä¸ć_äşć_ä¸ć_ĺć_äşć_ĺ­ć_ä¸ć_ĺŤć_äšć_ĺć_ĺä¸ć_ĺäşć".split("_"),
        monthsShort : "1ć_2ć_3ć_4ć_5ć_6ć_7ć_8ć_9ć_10ć_11ć_12ć".split("_"),
        weekdays : "ćććĽ_ććä¸_ććäş_ććä¸_ććĺ_ććäş_ććĺ­".split("_"),
        weekdaysShort : "éąćĽ_éąä¸_éąäş_éąä¸_éąĺ_éąäş_éąĺ­".split("_"),
        weekdaysMin : "ćĽ_ä¸_äş_ä¸_ĺ_äş_ĺ­".split("_"),
        longDateFormat : {
            LT : "Ahéťmm",
            L : "YYYYĺš´MMMDćĽ",
            LL : "YYYYĺš´MMMDćĽ",
            LLL : "YYYYĺš´MMMDćĽLT",
            LLLL : "YYYYĺš´MMMDćĽddddLT",
            l : "YYYYĺš´MMMDćĽ",
            ll : "YYYYĺš´MMMDćĽ",
            lll : "YYYYĺš´MMMDćĽLT",
            llll : "YYYYĺš´MMMDćĽddddLT"
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 900) {
                return "ćŠä¸";
            } else if (hm < 1130) {
                return "ä¸ĺ";
            } else if (hm < 1230) {
                return "ä¸­ĺ";
            } else if (hm < 1800) {
                return "ä¸ĺ";
            } else {
                return "ćä¸";
            }
        },
        calendar : {
            sameDay : '[äťĺ¤Š]LT',
            nextDay : '[ćĺ¤Š]LT',
            nextWeek : '[ä¸]ddddLT',
            lastDay : '[ć¨ĺ¤Š]LT',
            lastWeek : '[ä¸]ddddLT',
            sameElse : 'L'
        },
        ordinal : function (number, period) {
            switch (period) {
                case "d" :
                case "D" :
                case "DDD" :
                    return number + "ćĽ";
                case "M" :
                    return number + "ć";
                case "w" :
                case "W" :
                    return number + "éą";
                default :
                    return number;
            }
        },
        relativeTime : {
            future : "%sĺ§",
            past : "%sĺ",
            s : "ĺšžç§",
            m : "ä¸ĺé",
            mm : "%dĺé",
            h : "ä¸ĺ°ć",
            hh : "%dĺ°ć",
            d : "ä¸ĺ¤Š",
            dd : "%dĺ¤Š",
            M : "ä¸ĺć",
            MM : "%dĺć",
            y : "ä¸ĺš´",
            yy : "%dĺš´"
        }
    });
}));

// moment-timezone.js
// version : 0.0.1
// author : Tim Wood
// license : MIT
// github.com/timrwood/moment-timezone

(function () {

    var VERSION = "0.0.1";

    function onload(moment) {
        var oldZoneName = moment.fn.zoneName,
            oldZoneAbbr = moment.fn.zoneAbbr,

            defaultRule,
            rules = {},
            ruleSets = {},
            zones = {},
            zoneSets = {},
            links = {},

            TIME_RULE_WALL_CLOCK = 0,
            TIME_RULE_UTC        = 1,
            TIME_RULE_STANDARD   = 2,

            DAY_RULE_DAY_OF_MONTH   = 7,
            DAY_RULE_LAST_WEEKDAY   = 8;

        // converts time in the HH:mm:ss format to absolute number of minutes
        function parseMinutes (input) {
            input = input + '';
            var output = input.split(':'),
                sign = ~input.indexOf('-') ? -1 : 1,
                hour = Math.abs(+output[0]),
                minute = parseInt(output[1], 10) || 0,
                second = parseInt(output[2], 10) || 0;

            return sign * ((hour * 60) + (minute) + (second / 60));
        }

        /************************************
         Rules
         ************************************/

        function Rule (name, startYear, endYear, month, day, dayRule, time, timeRule, offset, letters) {
            this.name      = name;
            this.startYear = +startYear;
            this.endYear   = +endYear;
            this.month     = +month;
            this.day       = +day;
            this.dayRule   = +dayRule;
            this.time      = parseMinutes(time);
            this.timeRule  = +timeRule;
            this.offset    = parseMinutes(offset);
            this.letters   = letters || '';
        }

        Rule.prototype = {
            contains : function (year) {
                return (year >= this.startYear && year <= this.endYear);
            },

            start : function (year) {
                year = Math.min(Math.max(year, this.startYear), this.endYear);
                return moment.utc([year, this.month, this.date(year), 0, this.time]);
            },

            date : function (year) {
                if (this.dayRule === DAY_RULE_DAY_OF_MONTH) {
                    return this.day;
                } else if (this.dayRule === DAY_RULE_LAST_WEEKDAY) {
                    return this.lastWeekday(year);
                }
                return this.weekdayAfter(year);
            },

            weekdayAfter : function (year) {
                var day = this.day,
                    firstDayOfWeek = moment([year, this.month, 1]).day(),
                    output = this.dayRule + 1 - firstDayOfWeek;

                while (output < day) {
                    output += 7;
                }

                return output;
            },

            lastWeekday : function (year) {
                var day = this.day,
                    dow = day % 7,
                    lastDowOfMonth = moment([year, this.month + 1, 1]).day(),
                    daysInMonth = moment([year, this.month, 1]).daysInMonth(),
                    output = daysInMonth + (dow - (lastDowOfMonth - 1)) - (~~(day / 7) * 7);

                if (dow >= lastDowOfMonth) {
                    output -= 7;
                }
                return output;
            }
        };

        /************************************
         Rule Year
         ************************************/

        function RuleYear (year, rule) {
            this.rule = rule;
            this.start = rule.start(year);
        }

        RuleYear.prototype = {
            equals : function (other) {
                if (!other || other.rule !== this.rule) {
                    return false;
                }
                return Math.abs(other.start - this.start) < 86400000; // 24 * 60 * 60 * 1000
            }
        };

        function sortRuleYears (a, b) {
            if (a.isLast) {
                return -1;
            }
            if (b.isLast) {
                return 1;
            }
            return b.start - a.start;
        }

        /************************************
         Rule Sets
         ************************************/

        function RuleSet (name) {
            this.name = name;
            this.rules = [];
        }

        RuleSet.prototype = {
            add : function (rule) {
                this.rules.push(rule);
            },

            ruleYears : function (mom, lastZone) {
                var i, j,
                    year = mom.year(),
                    rule,
                    lastZoneRule,
                    rules = [];

                for (i = 0; i < this.rules.length; i++) {
                    rule = this.rules[i];
                    if (rule.contains(year)) {
                        rules.push(new RuleYear(year, rule));
                    } else if (rule.contains(year + 1)) {
                        rules.push(new RuleYear(year + 1, rule));
                    }
                }
                rules.push(new RuleYear(year - 1, this.lastYearRule(year - 1)));

                if (lastZone) {
                    lastZoneRule = new RuleYear(year - 1, lastZone.lastRule());
                    lastZoneRule.start = lastZone.until.clone().utc();
                    lastZoneRule.isLast = lastZone.ruleSet !== this;
                    rules.push(lastZoneRule);
                }

                rules.sort(sortRuleYears);
                return rules;
            },

            rule : function (mom, offset, lastZone) {
                var rules = this.ruleYears(mom, lastZone),
                    lastOffset = 0,
                    rule,
                    lastZoneOffset,
                    lastZoneOffsetAbs,
                    lastRule,
                    i;

                if (lastZone) {
                    lastZoneOffset = lastZone.offset + lastZone.lastRule().offset;
                    lastZoneOffsetAbs = Math.abs(lastZoneOffset) * 90000;
                }

                // make sure to include the previous rule's offset
                for (i = rules.length - 1; i > -1; i--) {
                    lastRule = rule;
                    rule = rules[i];

                    if (rule.equals(lastRule)) {
                        continue;
                    }

                    if (lastZone && !rule.isLast && Math.abs(rule.start - lastZone.until) <= lastZoneOffsetAbs) {
                        lastOffset += lastZoneOffset - offset;
                    }

                    if (rule.rule.timeRule === TIME_RULE_STANDARD) {
                        lastOffset = offset;
                    }

                    if (rule.rule.timeRule !== TIME_RULE_UTC) {
                        rule.start.add('m', -lastOffset);
                    }

                    lastOffset = rule.rule.offset + offset;
                }

                for (i = 0; i < rules.length; i++) {
                    rule = rules[i];
                    if (mom >= rule.start && !rule.isLast) {
                        return rule.rule;
                    }
                }

                return defaultRule;
            },

            lastYearRule : function (year) {
                var i,
                    rule,
                    start,
                    bestRule = defaultRule,
                    largest = -1e30;

                for (i = 0; i < this.rules.length; i++) {
                    rule = this.rules[i];
                    if (year >= rule.startYear) {
                        start = rule.start(year);
                        if (start > largest) {
                            largest = start;
                            bestRule = rule;
                        }
                    }
                }

                return bestRule;
            }
        };

        /************************************
         Zone
         ************************************/

        function Zone (name, offset, ruleSet, letters, until, untilOffset) {
            var i,
                untilArray = typeof until === 'string' ? until.split('_') : [9999];

            this.name = name;
            this.offset = parseMinutes(offset);
            this.ruleSet = ruleSet;
            this.letters = letters;

            for (i = 0; i < untilArray.length; i++) {
                untilArray[i] = +untilArray[i];
            }
            this.until = moment.utc(untilArray).subtract('m', parseMinutes(untilOffset));
        }

        Zone.prototype = {
            rule : function (mom, lastZone) {
                return this.ruleSet.rule(mom, this.offset, lastZone);
            },

            lastRule : function () {
                if (!this._lastRule) {
                    this._lastRule = this.rule(this.until);
                }
                return this._lastRule;
            },

            format : function (rule) {
                return this.letters.replace("%s", rule.letters);
            }
        };

        /************************************
         Zone Set
         ************************************/

        function sortZones (a, b) {
            return a.until - b.until;
        }

        function ZoneSet (name) {
            this.name = normalizeName(name);
            this.displayName = name;
            this.zones = [];
        }

        ZoneSet.prototype = {
            zoneAndRule : function (mom) {
                var i,
                    zone,
                    lastZone;

                mom = mom.clone().utc();
                for (i = 0; i < this.zones.length; i++) {
                    zone = this.zones[i];
                    if (mom < zone.until) {
                        break;
                    }
                    lastZone = zone;
                }

                return [zone, zone.rule(mom, lastZone)];
            },

            add : function (zone) {
                this.zones.push(zone);
                this.zones.sort(sortZones);
            },

            format : function (mom) {
                var zoneAndRule = this.zoneAndRule(mom);
                return zoneAndRule[0].format(zoneAndRule[1]);
            },

            offset : function (mom) {
                var zoneAndRule = this.zoneAndRule(mom);
                return -(zoneAndRule[0].offset + zoneAndRule[1].offset);
            }
        };

        /************************************
         Global Methods
         ************************************/

        function addRules (rules) {
            var i, j, rule;
            for (i in rules) {
                rule = rules[i];
                for (j = 0; j < rule.length; j++) {
                    addRule(i + '\t' + rule[j]);
                }
            }
        }

        function addRule (ruleString) {
            // don't duplicate rules
            if (rules[ruleString]) {
                return rules[ruleString];
            }

            var p = ruleString.split(/\s/),
                name = normalizeName(p[0]),
                rule = new Rule(name, p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10]);

            // cache the rule so we don't add it again
            rules[ruleString] = rule;

            // add to the ruleset
            getRuleSet(name).add(rule);

            return rule;
        }

        function normalizeName (name) {
            return (name || '').toLowerCase().replace(/\//g, '_');
        }

        function addZones (zones) {
            var i, j, zone;
            for (i in zones) {
                zone = zones[i];
                for (j = 0; j < zone.length; j++) {
                    addZone(i + '\t' + zone[j]);
                }
            }
        }

        function addLinks (linksToAdd) {
            var i;
            for (i in linksToAdd) {
                links[normalizeName(i)] = normalizeName(linksToAdd[i]);
            }
        }

        function addZone (zoneString) {
            // don't duplicate zones
            if (zones[zoneString]) {
                return zones[zoneString];
            }

            var p = zoneString.split(/\s/),
                name = normalizeName(p[0]),
                zone = new Zone(name, p[1], getRuleSet(p[2]), p[3], p[4], p[5]);

            // cache the zone so we don't add it again
            zones[zoneString] = zone;

            // add to the zoneset
            getZoneSet(p[0]).add(zone);

            return zone;
        }

        function getRuleSet (name) {
            name = normalizeName(name);
            if (!ruleSets[name]) {
                ruleSets[name] = new RuleSet(name);
            }
            return ruleSets[name];
        }

        function getZoneSet (name) {
            var machineName = normalizeName(name);
            if (links[machineName]) {
                machineName = links[machineName];
            }
            if (!zoneSets[machineName]) {
                zoneSets[machineName] = new ZoneSet(name);
            }
            return zoneSets[machineName];
        }

        function add (data) {
            if (!data) {
                return;
            }
            if (data.zones) {
                addZones(data.zones);
            }
            if (data.rules) {
                addRules(data.rules);
            }
            if (data.links) {
                addLinks(data.links);
            }
        }

        // overwrite moment.updateOffset
        moment.updateOffset = function (mom) {
            var offset;
            if (mom._z) {
                offset = mom._z.offset(mom);
                if (Math.abs(offset) < 16) {
                    offset = offset / 60;
                }
                mom.zone(offset);
            }
        };

        moment.fn.tz = function (name) {
            if (name) {
                this._z = getZoneSet(name);
                if (this._z) {
                    moment.updateOffset(this);
                }
                return this;
            }
            if (this._z) {
                return this._z.displayName;
            }
        };

        moment.fn.zoneName = function () {
            if (this._z) {
                return this._z.format(this);
            }
            return oldZoneName.call(this);
        };

        moment.fn.zoneAbbr = function () {
            if (this._z) {
                return this._z.format(this);
            }
            return oldZoneAbbr.call(this);
        };

        moment.tz = function () {
            var args = [], i, len = arguments.length - 1;
            for (i = 0; i < len; i++) {
                args[i] = arguments[i];
            }
            return moment.apply(null, args).tz(arguments[len]);
        };

        moment.tz.add = add;
        moment.tz.addRule = addRule;
        moment.tz.addZone = addZone;

        moment.tz.version = VERSION;

        // add default rule
        defaultRule = addRule("- 0 9999 0 0 0 0 0 0");

        return moment;
    }

    if (typeof define === "function" && define.amd) {
        define("moment-timezone", ["moment"], onload);
    } else if (typeof window !== "undefined" && window.moment) {
        onload(window.moment);
    } else if (typeof module !== 'undefined') {
        module.exports = onload(require('moment'));
    }
}).apply(this);

(function(){
    window.momentTZData =

    {
        "links": {
            "America/Kralendijk": "America/Curacao",
            "America/Lower_Princes": "America/Curacao",
            "America/Marigot": "America/Guadeloupe",
            "America/Shiprock": "America/Denver",
            "America/St_Barthelemy": "America/Guadeloupe",
            "Antarctica/South_Pole": "Antarctica/McMurdo",
            "Arctic/Longyearbyen": "Europe/Oslo",
            "Asia/Istanbul": "Europe/Istanbul",
            "Europe/Bratislava": "Europe/Prague",
            "Europe/Busingen": "Europe/Zurich",
            "Europe/Guernsey": "Europe/London",
            "Europe/Isle_of_Man": "Europe/London",
            "Europe/Jersey": "Europe/London",
            "Europe/Ljubljana": "Europe/Belgrade",
            "Europe/Mariehamn": "Europe/Helsinki",
            "Europe/Nicosia": "Asia/Nicosia",
            "Europe/Podgorica": "Europe/Belgrade",
            "Europe/San_Marino": "Europe/Rome",
            "Europe/Sarajevo": "Europe/Belgrade",
            "Europe/Skopje": "Europe/Belgrade",
            "Europe/Vatican": "Europe/Rome",
            "Europe/Zagreb": "Europe/Belgrade"
        },
        "meta": {
            "Africa/Abidjan": {
                "lat": 5.3167,
                "lon": -3.9667,
                "rules": ""
            },
            "Africa/Accra": {
                "lat": 5.55,
                "lon": 0.2167,
                "rules": "Ghana"
            },
            "Africa/Addis_Ababa": {
                "lat": 9.0333,
                "lon": 38.7,
                "rules": ""
            },
            "Africa/Algiers": {
                "lat": 36.7833,
                "lon": 3.05,
                "rules": "Algeria"
            },
            "Africa/Asmara": {
                "lat": 15.3333,
                "lon": 38.8833,
                "rules": ""
            },
            "Africa/Bamako": {
                "lat": 12.65,
                "lon": -8,
                "rules": ""
            },
            "Africa/Bangui": {
                "lat": 4.3667,
                "lon": 18.5833,
                "rules": ""
            },
            "Africa/Banjul": {
                "lat": 13.4667,
                "lon": -15.35,
                "rules": ""
            },
            "Africa/Bissau": {
                "lat": 11.85,
                "lon": -14.4167,
                "rules": ""
            },
            "Africa/Blantyre": {
                "lat": -14.2167,
                "lon": 35,
                "rules": ""
            },
            "Africa/Brazzaville": {
                "lat": -3.7333,
                "lon": 15.2833,
                "rules": ""
            },
            "Africa/Bujumbura": {
                "lat": -2.6167,
                "lon": 29.3667,
                "rules": ""
            },
            "Africa/Cairo": {
                "lat": 30.05,
                "lon": 31.25,
                "rules": "Egypt"
            },
            "Africa/Casablanca": {
                "lat": 33.65,
                "lon": -6.4167,
                "rules": "Morocco"
            },
            "Africa/Ceuta": {
                "lat": 35.8833,
                "lon": -4.6833,
                "rules": "Spain SpainAfrica EU"
            },
            "Africa/Conakry": {
                "lat": 9.5167,
                "lon": -12.2833,
                "rules": ""
            },
            "Africa/Dakar": {
                "lat": 14.6667,
                "lon": -16.5667,
                "rules": ""
            },
            "Africa/Dar_es_Salaam": {
                "lat": -5.2,
                "lon": 39.2833,
                "rules": ""
            },
            "Africa/Djibouti": {
                "lat": 11.6,
                "lon": 43.15,
                "rules": ""
            },
            "Africa/Douala": {
                "lat": 4.05,
                "lon": 9.7,
                "rules": ""
            },
            "Africa/El_Aaiun": {
                "lat": 27.15,
                "lon": -12.8,
                "rules": ""
            },
            "Africa/Freetown": {
                "lat": 8.5,
                "lon": -12.75,
                "rules": "SL"
            },
            "Africa/Gaborone": {
                "lat": -23.35,
                "lon": 25.9167,
                "rules": ""
            },
            "Africa/Harare": {
                "lat": -16.1667,
                "lon": 31.05,
                "rules": ""
            },
            "Africa/Johannesburg": {
                "lat": -25.75,
                "lon": 28,
                "rules": "SA"
            },
            "Africa/Juba": {
                "lat": 4.85,
                "lon": 31.6,
                "rules": "Sudan"
            },
            "Africa/Kampala": {
                "lat": 0.3167,
                "lon": 32.4167,
                "rules": ""
            },
            "Africa/Khartoum": {
                "lat": 15.6,
                "lon": 32.5333,
                "rules": "Sudan"
            },
            "Africa/Kigali": {
                "lat": -0.05,
                "lon": 30.0667,
                "rules": ""
            },
            "Africa/Kinshasa": {
                "lat": -3.7,
                "lon": 15.3,
                "rules": ""
            },
            "Africa/Lagos": {
                "lat": 6.45,
                "lon": 3.4,
                "rules": ""
            },
            "Africa/Libreville": {
                "lat": 0.3833,
                "lon": 9.45,
                "rules": ""
            },
            "Africa/Lome": {
                "lat": 6.1333,
                "lon": 1.2167,
                "rules": ""
            },
            "Africa/Luanda": {
                "lat": -7.2,
                "lon": 13.2333,
                "rules": ""
            },
            "Africa/Lubumbashi": {
                "lat": -10.3333,
                "lon": 27.4667,
                "rules": ""
            },
            "Africa/Lusaka": {
                "lat": -14.5833,
                "lon": 28.2833,
                "rules": ""
            },
            "Africa/Malabo": {
                "lat": 3.75,
                "lon": 8.7833,
                "rules": ""
            },
            "Africa/Maputo": {
                "lat": -24.0333,
                "lon": 32.5833,
                "rules": ""
            },
            "Africa/Maseru": {
                "lat": -28.5333,
                "lon": 27.5,
                "rules": ""
            },
            "Africa/Mbabane": {
                "lat": -25.7,
                "lon": 31.1,
                "rules": ""
            },
            "Africa/Mogadishu": {
                "lat": 2.0667,
                "lon": 45.3667,
                "rules": ""
            },
            "Africa/Monrovia": {
                "lat": 6.3,
                "lon": -9.2167,
                "rules": ""
            },
            "Africa/Nairobi": {
                "lat": -0.7167,
                "lon": 36.8167,
                "rules": ""
            },
            "Africa/Ndjamena": {
                "lat": 12.1167,
                "lon": 15.05,
                "rules": ""
            },
            "Africa/Niamey": {
                "lat": 13.5167,
                "lon": 2.1167,
                "rules": ""
            },
            "Africa/Nouakchott": {
                "lat": 18.1,
                "lon": -14.05,
                "rules": ""
            },
            "Africa/Ouagadougou": {
                "lat": 12.3667,
                "lon": -0.4833,
                "rules": ""
            },
            "Africa/Porto-Novo": {
                "lat": 6.4833,
                "lon": 2.6167,
                "rules": ""
            },
            "Africa/Sao_Tome": {
                "lat": 0.3333,
                "lon": 6.7333,
                "rules": ""
            },
            "Africa/Tripoli": {
                "lat": 32.9,
                "lon": 13.1833,
                "rules": "Libya"
            },
            "Africa/Tunis": {
                "lat": 36.8,
                "lon": 10.1833,
                "rules": "Tunisia"
            },
            "Africa/Windhoek": {
                "lat": -21.4333,
                "lon": 17.1,
                "rules": "Namibia"
            },
            "America/Adak": {
                "lat": 51.88,
                "lon": -175.3419,
                "rules": "US"
            },
            "America/Anchorage": {
                "lat": 61.2181,
                "lon": -148.0997,
                "rules": "US"
            },
            "America/Anguilla": {
                "lat": 18.2,
                "lon": -62.9333,
                "rules": ""
            },
            "America/Antigua": {
                "lat": 17.05,
                "lon": -60.2,
                "rules": ""
            },
            "America/Araguaina": {
                "lat": -6.8,
                "lon": -47.8,
                "rules": "Brazil"
            },
            "America/Argentina/Buenos_Aires": {
                "lat": -33.4,
                "lon": -57.55,
                "rules": "Arg"
            },
            "America/Argentina/Catamarca": {
                "lat": -27.5333,
                "lon": -64.2167,
                "rules": "Arg"
            },
            "America/Argentina/Cordoba": {
                "lat": -30.6,
                "lon": -63.8167,
                "rules": "Arg"
            },
            "America/Argentina/Jujuy": {
                "lat": -23.8167,
                "lon": -64.7,
                "rules": "Arg"
            },
            "America/Argentina/La_Rioja": {
                "lat": -28.5667,
                "lon": -65.15,
                "rules": "Arg"
            },
            "America/Argentina/Mendoza": {
                "lat": -31.1167,
                "lon": -67.1833,
                "rules": "Arg"
            },
            "America/Argentina/Rio_Gallegos": {
                "lat": -50.3667,
                "lon": -68.7833,
                "rules": "Arg"
            },
            "America/Argentina/Salta": {
                "lat": -23.2167,
                "lon": -64.5833,
                "rules": "Arg"
            },
            "America/Argentina/San_Juan": {
                "lat": -30.4667,
                "lon": -67.4833,
                "rules": "Arg"
            },
            "America/Argentina/San_Luis": {
                "lat": -32.6833,
                "lon": -65.65,
                "rules": "Arg SanLuis"
            },
            "America/Argentina/Tucuman": {
                "lat": -25.1833,
                "lon": -64.7833,
                "rules": "Arg"
            },
            "America/Argentina/Ushuaia": {
                "lat": -53.2,
                "lon": -67.7,
                "rules": "Arg"
            },
            "America/Aruba": {
                "lat": 12.5,
                "lon": -68.0333,
                "rules": ""
            },
            "America/Asuncion": {
                "lat": -24.7333,
                "lon": -56.3333,
                "rules": "Para"
            },
            "America/Atikokan": {
                "lat": 48.7586,
                "lon": -90.3783,
                "rules": "Canada"
            },
            "America/Bahia": {
                "lat": -11.0167,
                "lon": -37.4833,
                "rules": "Brazil"
            },
            "America/Bahia_Banderas": {
                "lat": 20.8,
                "lon": -104.75,
                "rules": "Mexico"
            },
            "America/Barbados": {
                "lat": 13.1,
                "lon": -58.3833,
                "rules": "Barb"
            },
            "America/Belem": {
                "lat": -0.55,
                "lon": -47.5167,
                "rules": "Brazil"
            },
            "America/Belize": {
                "lat": 17.5,
                "lon": -87.8,
                "rules": "Belize"
            },
            "America/Blanc-Sablon": {
                "lat": 51.4167,
                "lon": -56.8833,
                "rules": "Canada"
            },
            "America/Boa_Vista": {
                "lat": 2.8167,
                "lon": -59.3333,
                "rules": "Brazil"
            },
            "America/Bogota": {
                "lat": 4.6,
                "lon": -73.9167,
                "rules": "CO"
            },
            "America/Boise": {
                "lat": 43.6136,
                "lon": -115.7975,
                "rules": "US"
            },
            "America/Cambridge_Bay": {
                "lat": 69.1139,
                "lon": -104.9472,
                "rules": "NT_YK Canada"
            },
            "America/Campo_Grande": {
                "lat": -19.55,
                "lon": -53.3833,
                "rules": "Brazil"
            },
            "America/Cancun": {
                "lat": 21.0833,
                "lon": -85.2333,
                "rules": "Mexico"
            },
            "America/Caracas": {
                "lat": 10.5,
                "lon": -65.0667,
                "rules": ""
            },
            "America/Cayenne": {
                "lat": 4.9333,
                "lon": -51.6667,
                "rules": ""
            },
            "America/Cayman": {
                "lat": 19.3,
                "lon": -80.6167,
                "rules": ""
            },
            "America/Chicago": {
                "lat": 41.85,
                "lon": -86.35,
                "rules": "US Chicago"
            },
            "America/Chihuahua": {
                "lat": 28.6333,
                "lon": -105.9167,
                "rules": "Mexico"
            },
            "America/Costa_Rica": {
                "lat": 9.9333,
                "lon": -83.9167,
                "rules": "CR"
            },
            "America/Creston": {
                "lat": 49.1,
                "lon": -115.4833,
                "rules": ""
            },
            "America/Cuiaba": {
                "lat": -14.4167,
                "lon": -55.9167,
                "rules": "Brazil"
            },
            "America/Curacao": {
                "lat": 12.1833,
                "lon": -69,
                "rules": ""
            },
            "America/Danmarkshavn": {
                "lat": 76.7667,
                "lon": -17.3333,
                "rules": "EU"
            },
            "America/Dawson": {
                "lat": 64.0667,
                "lon": -138.5833,
                "rules": "NT_YK Canada"
            },
            "America/Dawson_Creek": {
                "lat": 59.7667,
                "lon": -119.7667,
                "rules": "Canada Vanc"
            },
            "America/Denver": {
                "lat": 39.7392,
                "lon": -103.0158,
                "rules": "US Denver"
            },
            "America/Detroit": {
                "lat": 42.3314,
                "lon": -82.9542,
                "rules": "US Detroit"
            },
            "America/Dominica": {
                "lat": 15.3,
                "lon": -60.6,
                "rules": ""
            },
            "America/Edmonton": {
                "lat": 53.55,
                "lon": -112.5333,
                "rules": "Edm Canada"
            },
            "America/Eirunepe": {
                "lat": -5.3333,
                "lon": -68.1333,
                "rules": "Brazil"
            },
            "America/El_Salvador": {
                "lat": 13.7,
                "lon": -88.8,
                "rules": "Salv"
            },
            "America/Fortaleza": {
                "lat": -2.2833,
                "lon": -37.5,
                "rules": "Brazil"
            },
            "America/Glace_Bay": {
                "lat": 46.2,
                "lon": -58.05,
                "rules": "Canada Halifax"
            },
            "America/Godthab": {
                "lat": 64.1833,
                "lon": -50.2667,
                "rules": "EU"
            },
            "America/Goose_Bay": {
                "lat": 53.3333,
                "lon": -59.5833,
                "rules": "Canada StJohns"
            },
            "America/Grand_Turk": {
                "lat": 21.4667,
                "lon": -70.8667,
                "rules": "TC"
            },
            "America/Grenada": {
                "lat": 12.05,
                "lon": -60.25,
                "rules": ""
            },
            "America/Guadeloupe": {
                "lat": 16.2333,
                "lon": -60.4667,
                "rules": ""
            },
            "America/Guatemala": {
                "lat": 14.6333,
                "lon": -89.4833,
                "rules": "Guat"
            },
            "America/Guayaquil": {
                "lat": -1.8333,
                "lon": -78.1667,
                "rules": ""
            },
            "America/Guyana": {
                "lat": 6.8,
                "lon": -57.8333,
                "rules": ""
            },
            "America/Halifax": {
                "lat": 44.65,
                "lon": -62.4,
                "rules": "Halifax Canada"
            },
            "America/Havana": {
                "lat": 23.1333,
                "lon": -81.6333,
                "rules": "Cuba"
            },
            "America/Hermosillo": {
                "lat": 29.0667,
                "lon": -109.0333,
                "rules": "Mexico"
            },
            "America/Indiana/Indianapolis": {
                "lat": 39.7683,
                "lon": -85.8419,
                "rules": "US Indianapolis"
            },
            "America/Indiana/Knox": {
                "lat": 41.2958,
                "lon": -85.375,
                "rules": "US Starke"
            },
            "America/Indiana/Marengo": {
                "lat": 38.3756,
                "lon": -85.6553,
                "rules": "US Marengo"
            },
            "America/Indiana/Petersburg": {
                "lat": 38.4919,
                "lon": -86.7214,
                "rules": "US Pike"
            },
            "America/Indiana/Tell_City": {
                "lat": 37.9531,
                "lon": -85.2386,
                "rules": "US Perry"
            },
            "America/Indiana/Vevay": {
                "lat": 38.7478,
                "lon": -84.9328,
                "rules": "US"
            },
            "America/Indiana/Vincennes": {
                "lat": 38.6772,
                "lon": -86.4714,
                "rules": "US Vincennes"
            },
            "America/Indiana/Winamac": {
                "lat": 41.0514,
                "lon": -85.3969,
                "rules": "US Pulaski"
            },
            "America/Inuvik": {
                "lat": 68.3497,
                "lon": -132.2833,
                "rules": "NT_YK Canada"
            },
            "America/Iqaluit": {
                "lat": 63.7333,
                "lon": -67.5333,
                "rules": "NT_YK Canada"
            },
            "America/Jamaica": {
                "lat": 18,
                "lon": -75.2,
                "rules": "US"
            },
            "America/Juneau": {
                "lat": 58.3019,
                "lon": -133.5803,
                "rules": "US"
            },
            "America/Kentucky/Louisville": {
                "lat": 38.2542,
                "lon": -84.2406,
                "rules": "US Louisville"
            },
            "America/Kentucky/Monticello": {
                "lat": 36.8297,
                "lon": -83.1508,
                "rules": "US"
            },
            "America/Kralendijk": {
                "lat": 12.1508,
                "lon": -67.7233,
                "rules": ""
            },
            "America/La_Paz": {
                "lat": -15.5,
                "lon": -67.85,
                "rules": ""
            },
            "America/Lima": {
                "lat": -11.95,
                "lon": -76.95,
                "rules": "Peru"
            },
            "America/Los_Angeles": {
                "lat": 34.0522,
                "lon": -117.7572,
                "rules": "US CA"
            },
            "America/Lower_Princes": {
                "lat": 18.0514,
                "lon": -62.9528,
                "rules": ""
            },
            "America/Maceio": {
                "lat": -8.3333,
                "lon": -34.2833,
                "rules": "Brazil"
            },
            "America/Managua": {
                "lat": 12.15,
                "lon": -85.7167,
                "rules": "Nic"
            },
            "America/Manaus": {
                "lat": -2.8667,
                "lon": -59.9833,
                "rules": "Brazil"
            },
            "America/Marigot": {
                "lat": 18.0667,
                "lon": -62.9167,
                "rules": ""
            },
            "America/Martinique": {
                "lat": 14.6,
                "lon": -60.9167,
                "rules": ""
            },
            "America/Matamoros": {
                "lat": 25.8333,
                "lon": -96.5,
                "rules": "US Mexico"
            },
            "America/Mazatlan": {
                "lat": 23.2167,
                "lon": -105.5833,
                "rules": "Mexico"
            },
            "America/Menominee": {
                "lat": 45.1078,
                "lon": -86.3858,
                "rules": "US Menominee"
            },
            "America/Merida": {
                "lat": 20.9667,
                "lon": -88.3833,
                "rules": "Mexico"
            },
            "America/Metlakatla": {
                "lat": 55.1269,
                "lon": -130.4236,
                "rules": "US"
            },
            "America/Mexico_City": {
                "lat": 19.4,
                "lon": -98.85,
                "rules": "Mexico"
            },
            "America/Miquelon": {
                "lat": 47.05,
                "lon": -55.6667,
                "rules": "Canada"
            },
            "America/Moncton": {
                "lat": 46.1,
                "lon": -63.2167,
                "rules": "Canada Moncton"
            },
            "America/Monterrey": {
                "lat": 25.6667,
                "lon": -99.6833,
                "rules": "US Mexico"
            },
            "America/Montevideo": {
                "lat": -33.1167,
                "lon": -55.8167,
                "rules": "Uruguay"
            },
            "America/Montreal": {
                "lat": 45.5167,
                "lon": -72.4333,
                "rules": "Mont Canada"
            },
            "America/Montserrat": {
                "lat": 16.7167,
                "lon": -61.7833,
                "rules": ""
            },
            "America/Nassau": {
                "lat": 25.0833,
                "lon": -76.65,
                "rules": "Bahamas US"
            },
            "America/New_York": {
                "lat": 40.7142,
                "lon": -73.9936,
                "rules": "US NYC"
            },
            "America/Nipigon": {
                "lat": 49.0167,
                "lon": -87.7333,
                "rules": "Canada"
            },
            "America/Nome": {
                "lat": 64.5011,
                "lon": -164.5936,
                "rules": "US"
            },
            "America/Noronha": {
                "lat": -2.15,
                "lon": -31.5833,
                "rules": "Brazil"
            },
            "America/North_Dakota/Beulah": {
                "lat": 47.2642,
                "lon": -100.2222,
                "rules": "US"
            },
            "America/North_Dakota/Center": {
                "lat": 47.1164,
                "lon": -100.7008,
                "rules": "US"
            },
            "America/North_Dakota/New_Salem": {
                "lat": 46.845,
                "lon": -100.5892,
                "rules": "US"
            },
            "America/Ojinaga": {
                "lat": 29.5667,
                "lon": -103.5833,
                "rules": "Mexico US"
            },
            "America/Panama": {
                "lat": 8.9667,
                "lon": -78.4667,
                "rules": ""
            },
            "America/Pangnirtung": {
                "lat": 66.1333,
                "lon": -64.2667,
                "rules": "NT_YK Canada"
            },
            "America/Paramaribo": {
                "lat": 5.8333,
                "lon": -54.8333,
                "rules": ""
            },
            "America/Phoenix": {
                "lat": 33.4483,
                "lon": -111.9267,
                "rules": "US"
            },
            "America/Port-au-Prince": {
                "lat": 18.5333,
                "lon": -71.6667,
                "rules": "Haiti"
            },
            "America/Port_of_Spain": {
                "lat": 10.65,
                "lon": -60.4833,
                "rules": ""
            },
            "America/Porto_Velho": {
                "lat": -7.2333,
                "lon": -62.1,
                "rules": "Brazil"
            },
            "America/Puerto_Rico": {
                "lat": 18.4683,
                "lon": -65.8939,
                "rules": "US"
            },
            "America/Rainy_River": {
                "lat": 48.7167,
                "lon": -93.4333,
                "rules": "Canada"
            },
            "America/Rankin_Inlet": {
                "lat": 62.8167,
                "lon": -91.9169,
                "rules": "NT_YK Canada"
            },
            "America/Recife": {
                "lat": -7.95,
                "lon": -33.1,
                "rules": "Brazil"
            },
            "America/Regina": {
                "lat": 50.4,
                "lon": -103.35,
                "rules": "Regina"
            },
            "America/Resolute": {
                "lat": 74.6956,
                "lon": -93.1708,
                "rules": "NT_YK Canada"
            },
            "America/Rio_Branco": {
                "lat": -8.0333,
                "lon": -66.2,
                "rules": "Brazil"
            },
            "America/Santa_Isabel": {
                "lat": 30.3,
                "lon": -113.1333,
                "rules": "CA US Mexico"
            },
            "America/Santarem": {
                "lat": -1.5667,
                "lon": -53.1333,
                "rules": "Brazil"
            },
            "America/Santiago": {
                "lat": -32.55,
                "lon": -69.3333,
                "rules": "Chile"
            },
            "America/Santo_Domingo": {
                "lat": 18.4667,
                "lon": -68.1,
                "rules": "DR US"
            },
            "America/Sao_Paulo": {
                "lat": -22.4667,
                "lon": -45.3833,
                "rules": "Brazil"
            },
            "America/Scoresbysund": {
                "lat": 70.4833,
                "lon": -20.0333,
                "rules": "C-Eur EU"
            },
            "America/Shiprock": {
                "lat": 36.7856,
                "lon": -107.3136,
                "rules": ""
            },
            "America/Sitka": {
                "lat": 57.1764,
                "lon": -134.6981,
                "rules": "US"
            },
            "America/St_Barthelemy": {
                "lat": 17.8833,
                "lon": -61.15,
                "rules": ""
            },
            "America/St_Johns": {
                "lat": 47.5667,
                "lon": -51.2833,
                "rules": "StJohns Canada"
            },
            "America/St_Kitts": {
                "lat": 17.3,
                "lon": -61.2833,
                "rules": ""
            },
            "America/St_Lucia": {
                "lat": 14.0167,
                "lon": -61,
                "rules": ""
            },
            "America/St_Thomas": {
                "lat": 18.35,
                "lon": -63.0667,
                "rules": ""
            },
            "America/St_Vincent": {
                "lat": 13.15,
                "lon": -60.7667,
                "rules": ""
            },
            "America/Swift_Current": {
                "lat": 50.2833,
                "lon": -106.1667,
                "rules": "Canada Regina Swift"
            },
            "America/Tegucigalpa": {
                "lat": 14.1,
                "lon": -86.7833,
                "rules": "Hond"
            },
            "America/Thule": {
                "lat": 76.5667,
                "lon": -67.2167,
                "rules": "Thule"
            },
            "America/Thunder_Bay": {
                "lat": 48.3833,
                "lon": -88.75,
                "rules": "Canada Mont"
            },
            "America/Tijuana": {
                "lat": 32.5333,
                "lon": -116.9833,
                "rules": "CA US Mexico"
            },
            "America/Toronto": {
                "lat": 43.65,
                "lon": -78.6167,
                "rules": "Canada Toronto"
            },
            "America/Tortola": {
                "lat": 18.45,
                "lon": -63.3833,
                "rules": ""
            },
            "America/Vancouver": {
                "lat": 49.2667,
                "lon": -122.8833,
                "rules": "Vanc Canada"
            },
            "America/Whitehorse": {
                "lat": 60.7167,
                "lon": -134.95,
                "rules": "NT_YK Canada"
            },
            "America/Winnipeg": {
                "lat": 49.8833,
                "lon": -96.85,
                "rules": "Winn Canada"
            },
            "America/Yakutat": {
                "lat": 59.5469,
                "lon": -138.2728,
                "rules": "US"
            },
            "America/Yellowknife": {
                "lat": 62.45,
                "lon": -113.65,
                "rules": "NT_YK Canada"
            },
            "Antarctica/Casey": {
                "lat": -65.7167,
                "lon": 110.5167,
                "rules": ""
            },
            "Antarctica/Davis": {
                "lat": -67.4167,
                "lon": 77.9667,
                "rules": ""
            },
            "Antarctica/DumontDUrville": {
                "lat": -65.3333,
                "lon": 140.0167,
                "rules": ""
            },
            "Antarctica/Macquarie": {
                "lat": -53.5,
                "lon": 158.95,
                "rules": "Aus AT"
            },
            "Antarctica/Mawson": {
                "lat": -66.4,
                "lon": 62.8833,
                "rules": ""
            },
            "Antarctica/McMurdo": {
                "lat": -76.1667,
                "lon": 166.6,
                "rules": "NZAQ"
            },
            "Antarctica/Palmer": {
                "lat": -63.2,
                "lon": -63.9,
                "rules": "ArgAQ ChileAQ"
            },
            "Antarctica/Rothera": {
                "lat": -66.4333,
                "lon": -67.8667,
                "rules": ""
            },
            "Antarctica/South_Pole": {
                "lat": -90,
                "lon": 0,
                "rules": ""
            },
            "Antarctica/Syowa": {
                "lat": -68.9939,
                "lon": 39.59,
                "rules": ""
            },
            "Antarctica/Vostok": {
                "lat": -77.6,
                "lon": 106.9,
                "rules": ""
            },
            "Arctic/Longyearbyen": {
                "lat": 78,
                "lon": 16,
                "rules": ""
            },
            "Asia/Aden": {
                "lat": 12.75,
                "lon": 45.2,
                "rules": ""
            },
            "Asia/Almaty": {
                "lat": 43.25,
                "lon": 76.95,
                "rules": "RussiaAsia"
            },
            "Asia/Amman": {
                "lat": 31.95,
                "lon": 35.9333,
                "rules": "Jordan"
            },
            "Asia/Anadyr": {
                "lat": 64.75,
                "lon": 177.4833,
                "rules": "Russia"
            },
            "Asia/Aqtau": {
                "lat": 44.5167,
                "lon": 50.2667,
                "rules": "RussiaAsia"
            },
            "Asia/Aqtobe": {
                "lat": 50.2833,
                "lon": 57.1667,
                "rules": "RussiaAsia"
            },
            "Asia/Ashgabat": {
                "lat": 37.95,
                "lon": 58.3833,
                "rules": "RussiaAsia"
            },
            "Asia/Baghdad": {
                "lat": 33.35,
                "lon": 44.4167,
                "rules": "Iraq"
            },
            "Asia/Bahrain": {
                "lat": 26.3833,
                "lon": 50.5833,
                "rules": ""
            },
            "Asia/Baku": {
                "lat": 40.3833,
                "lon": 49.85,
                "rules": "RussiaAsia EUAsia Azer"
            },
            "Asia/Bangkok": {
                "lat": 13.75,
                "lon": 100.5167,
                "rules": ""
            },
            "Asia/Beirut": {
                "lat": 33.8833,
                "lon": 35.5,
                "rules": "Lebanon"
            },
            "Asia/Bishkek": {
                "lat": 42.9,
                "lon": 74.6,
                "rules": "RussiaAsia Kyrgyz"
            },
            "Asia/Brunei": {
                "lat": 4.9333,
                "lon": 114.9167,
                "rules": ""
            },
            "Asia/Choibalsan": {
                "lat": 48.0667,
                "lon": 114.5,
                "rules": "Mongol"
            },
            "Asia/Chongqing": {
                "lat": 29.5667,
                "lon": 106.5833,
                "rules": "PRC"
            },
            "Asia/Colombo": {
                "lat": 6.9333,
                "lon": 79.85,
                "rules": ""
            },
            "Asia/Damascus": {
                "lat": 33.5,
                "lon": 36.3,
                "rules": "Syria"
            },
            "Asia/Dhaka": {
                "lat": 23.7167,
                "lon": 90.4167,
                "rules": "Dhaka"
            },
            "Asia/Dili": {
                "lat": -7.45,
                "lon": 125.5833,
                "rules": ""
            },
            "Asia/Dubai": {
                "lat": 25.3,
                "lon": 55.3,
                "rules": ""
            },
            "Asia/Dushanbe": {
                "lat": 38.5833,
                "lon": 68.8,
                "rules": "RussiaAsia"
            },
            "Asia/Gaza": {
                "lat": 31.5,
                "lon": 34.4667,
                "rules": "Zion EgyptAsia Jordan Palestine"
            },
            "Asia/Harbin": {
                "lat": 45.75,
                "lon": 126.6833,
                "rules": "PRC"
            },
            "Asia/Hebron": {
                "lat": 31.5333,
                "lon": 35.095,
                "rules": "Zion EgyptAsia Jordan Palestine"
            },
            "Asia/Ho_Chi_Minh": {
                "lat": 10.75,
                "lon": 106.6667,
                "rules": ""
            },
            "Asia/Hong_Kong": {
                "lat": 22.2833,
                "lon": 114.15,
                "rules": "HK"
            },
            "Asia/Hovd": {
                "lat": 48.0167,
                "lon": 91.65,
                "rules": "Mongol"
            },
            "Asia/Irkutsk": {
                "lat": 52.2667,
                "lon": 104.3333,
                "rules": "Russia"
            },
            "Asia/Jakarta": {
                "lat": -5.8333,
                "lon": 106.8,
                "rules": ""
            },
            "Asia/Jayapura": {
                "lat": -1.4667,
                "lon": 140.7,
                "rules": ""
            },
            "Asia/Jerusalem": {
                "lat": 31.7667,
                "lon": 35.2333,
                "rules": "Zion"
            },
            "Asia/Kabul": {
                "lat": 34.5167,
                "lon": 69.2,
                "rules": ""
            },
            "Asia/Kamchatka": {
                "lat": 53.0167,
                "lon": 158.65,
                "rules": "Russia"
            },
            "Asia/Karachi": {
                "lat": 24.8667,
                "lon": 67.05,
                "rules": "Pakistan"
            },
            "Asia/Kashgar": {
                "lat": 39.4833,
                "lon": 75.9833,
                "rules": "PRC"
            },
            "Asia/Kathmandu": {
                "lat": 27.7167,
                "lon": 85.3167,
                "rules": ""
            },
            "Asia/Khandyga": {
                "lat": 62.6564,
                "lon": 135.5539,
                "rules": "Russia"
            },
            "Asia/Kolkata": {
                "lat": 22.5333,
                "lon": 88.3667,
                "rules": ""
            },
            "Asia/Krasnoyarsk": {
                "lat": 56.0167,
                "lon": 92.8333,
                "rules": "Russia"
            },
            "Asia/Kuala_Lumpur": {
                "lat": 3.1667,
                "lon": 101.7,
                "rules": ""
            },
            "Asia/Kuching": {
                "lat": 1.55,
                "lon": 110.3333,
                "rules": "NBorneo"
            },
            "Asia/Kuwait": {
                "lat": 29.3333,
                "lon": 47.9833,
                "rules": ""
            },
            "Asia/Macau": {
                "lat": 22.2333,
                "lon": 113.5833,
                "rules": "Macau PRC"
            },
            "Asia/Magadan": {
                "lat": 59.5667,
                "lon": 150.8,
                "rules": "Russia"
            },
            "Asia/Makassar": {
                "lat": -4.8833,
                "lon": 119.4,
                "rules": ""
            },
            "Asia/Manila": {
                "lat": 14.5833,
                "lon": 121,
                "rules": "Phil"
            },
            "Asia/Muscat": {
                "lat": 23.6,
                "lon": 58.5833,
                "rules": ""
            },
            "Asia/Nicosia": {
                "lat": 35.1667,
                "lon": 33.3667,
                "rules": "Cyprus EUAsia"
            },
            "Asia/Novokuznetsk": {
                "lat": 53.75,
                "lon": 87.1167,
                "rules": "Russia"
            },
            "Asia/Novosibirsk": {
                "lat": 55.0333,
                "lon": 82.9167,
                "rules": "Russia"
            },
            "Asia/Omsk": {
                "lat": 55,
                "lon": 73.4,
                "rules": "Russia"
            },
            "Asia/Oral": {
                "lat": 51.2167,
                "lon": 51.35,
                "rules": "RussiaAsia"
            },
            "Asia/Phnom_Penh": {
                "lat": 11.55,
                "lon": 104.9167,
                "rules": ""
            },
            "Asia/Pontianak": {
                "lat": 0.0333,
                "lon": 109.3333,
                "rules": ""
            },
            "Asia/Pyongyang": {
                "lat": 39.0167,
                "lon": 125.75,
                "rules": ""
            },
            "Asia/Qatar": {
                "lat": 25.2833,
                "lon": 51.5333,
                "rules": ""
            },
            "Asia/Qyzylorda": {
                "lat": 44.8,
                "lon": 65.4667,
                "rules": "RussiaAsia"
            },
            "Asia/Rangoon": {
                "lat": 16.7833,
                "lon": 96.1667,
                "rules": ""
            },
            "Asia/Riyadh": {
                "lat": 24.6333,
                "lon": 46.7167,
                "rules": ""
            },
            "Asia/Sakhalin": {
                "lat": 46.9667,
                "lon": 142.7,
                "rules": "Russia"
            },
            "Asia/Samarkand": {
                "lat": 39.6667,
                "lon": 66.8,
                "rules": "RussiaAsia"
            },
            "Asia/Seoul": {
                "lat": 37.55,
                "lon": 126.9667,
                "rules": "ROK"
            },
            "Asia/Shanghai": {
                "lat": 31.2333,
                "lon": 121.4667,
                "rules": "Shang PRC"
            },
            "Asia/Singapore": {
                "lat": 1.2833,
                "lon": 103.85,
                "rules": ""
            },
            "Asia/Taipei": {
                "lat": 25.05,
                "lon": 121.5,
                "rules": "Taiwan"
            },
            "Asia/Tashkent": {
                "lat": 41.3333,
                "lon": 69.3,
                "rules": "RussiaAsia"
            },
            "Asia/Tbilisi": {
                "lat": 41.7167,
                "lon": 44.8167,
                "rules": "RussiaAsia E-EurAsia"
            },
            "Asia/Tehran": {
                "lat": 35.6667,
                "lon": 51.4333,
                "rules": "Iran"
            },
            "Asia/Thimphu": {
                "lat": 27.4667,
                "lon": 89.65,
                "rules": ""
            },
            "Asia/Tokyo": {
                "lat": 35.6544,
                "lon": 139.7447,
                "rules": "Japan"
            },
            "Asia/Ulaanbaatar": {
                "lat": 47.9167,
                "lon": 106.8833,
                "rules": "Mongol"
            },
            "Asia/Urumqi": {
                "lat": 43.8,
                "lon": 87.5833,
                "rules": "PRC"
            },
            "Asia/Ust-Nera": {
                "lat": 64.5603,
                "lon": 143.2267,
                "rules": "Russia"
            },
            "Asia/Vientiane": {
                "lat": 17.9667,
                "lon": 102.6,
                "rules": ""
            },
            "Asia/Vladivostok": {
                "lat": 43.1667,
                "lon": 131.9333,
                "rules": "Russia"
            },
            "Asia/Yakutsk": {
                "lat": 62,
                "lon": 129.6667,
                "rules": "Russia"
            },
            "Asia/Yekaterinburg": {
                "lat": 56.85,
                "lon": 60.6,
                "rules": "Russia"
            },
            "Asia/Yerevan": {
                "lat": 40.1833,
                "lon": 44.5,
                "rules": "RussiaAsia"
            },
            "Atlantic/Azores": {
                "lat": 37.7333,
                "lon": -24.3333,
                "rules": "Port W-Eur EU"
            },
            "Atlantic/Bermuda": {
                "lat": 32.2833,
                "lon": -63.2333,
                "rules": "Bahamas US"
            },
            "Atlantic/Canary": {
                "lat": 28.1,
                "lon": -14.6,
                "rules": "EU"
            },
            "Atlantic/Cape_Verde": {
                "lat": 14.9167,
                "lon": -22.4833,
                "rules": ""
            },
            "Atlantic/Faroe": {
                "lat": 62.0167,
                "lon": -5.2333,
                "rules": "EU"
            },
            "Atlantic/Madeira": {
                "lat": 32.6333,
                "lon": -15.1,
                "rules": "Port EU"
            },
            "Atlantic/Reykjavik": {
                "lat": 64.15,
                "lon": -20.15,
                "rules": "Iceland"
            },
            "Atlantic/South_Georgia": {
                "lat": -53.7333,
                "lon": -35.4667,
                "rules": ""
            },
            "Atlantic/St_Helena": {
                "lat": -14.0833,
                "lon": -4.3,
                "rules": ""
            },
            "Atlantic/Stanley": {
                "lat": -50.3,
                "lon": -56.15,
                "rules": "Falk"
            },
            "Australia/Adelaide": {
                "lat": -33.0833,
                "lon": 138.5833,
                "rules": "Aus AS"
            },
            "Australia/Brisbane": {
                "lat": -26.5333,
                "lon": 153.0333,
                "rules": "Aus AQ"
            },
            "Australia/Broken_Hill": {
                "lat": -30.05,
                "lon": 141.45,
                "rules": "Aus AN AS"
            },
            "Australia/Currie": {
                "lat": -38.0667,
                "lon": 143.8667,
                "rules": "Aus AT"
            },
            "Australia/Darwin": {
                "lat": -11.5333,
                "lon": 130.8333,
                "rules": "Aus"
            },
            "Australia/Eucla": {
                "lat": -30.2833,
                "lon": 128.8667,
                "rules": "Aus AW"
            },
            "Australia/Hobart": {
                "lat": -41.1167,
                "lon": 147.3167,
                "rules": "Aus AT"
            },
            "Australia/Lindeman": {
                "lat": -19.7333,
                "lon": 149,
                "rules": "Aus AQ Holiday"
            },
            "Australia/Lord_Howe": {
                "lat": -30.45,
                "lon": 159.0833,
                "rules": "LH"
            },
            "Australia/Melbourne": {
                "lat": -36.1833,
                "lon": 144.9667,
                "rules": "Aus AV"
            },
            "Australia/Perth": {
                "lat": -30.05,
                "lon": 115.85,
                "rules": "Aus AW"
            },
            "Australia/Sydney": {
                "lat": -32.1333,
                "lon": 151.2167,
                "rules": "Aus AN"
            },
            "CET": {
                "rules": "C-Eur"
            },
            "CST6CDT": {
                "rules": "US"
            },
            "EET": {
                "rules": "EU"
            },
            "EST": {
                "rules": ""
            },
            "EST5EDT": {
                "rules": "US"
            },
            "Europe/Amsterdam": {
                "lat": 52.3667,
                "lon": 4.9,
                "rules": "Neth C-Eur EU"
            },
            "Europe/Andorra": {
                "lat": 42.5,
                "lon": 1.5167,
                "rules": "EU"
            },
            "Europe/Athens": {
                "lat": 37.9667,
                "lon": 23.7167,
                "rules": "Greece EU"
            },
            "Europe/Belgrade": {
                "lat": 44.8333,
                "lon": 20.5,
                "rules": "C-Eur EU"
            },
            "Europe/Berlin": {
                "lat": 52.5,
                "lon": 13.3667,
                "rules": "C-Eur SovietZone Germany EU"
            },
            "Europe/Bratislava": {
                "lat": 48.15,
                "lon": 17.1167,
                "rules": ""
            },
            "Europe/Brussels": {
                "lat": 50.8333,
                "lon": 4.3333,
                "rules": "C-Eur Belgium EU"
            },
            "Europe/Bucharest": {
                "lat": 44.4333,
                "lon": 26.1,
                "rules": "Romania C-Eur E-Eur EU"
            },
            "Europe/Budapest": {
                "lat": 47.5,
                "lon": 19.0833,
                "rules": "C-Eur Hungary EU"
            },
            "Europe/Busingen": {
                "lat": 47.7,
                "lon": 8.6833,
                "rules": ""
            },
            "Europe/Chisinau": {
                "lat": 47,
                "lon": 28.8333,
                "rules": "Romania C-Eur Russia E-Eur EU"
            },
            "Europe/Copenhagen": {
                "lat": 55.6667,
                "lon": 12.5833,
                "rules": "Denmark C-Eur EU"
            },
            "Europe/Dublin": {
                "lat": 53.3333,
                "lon": -5.75,
                "rules": "GB-Eire EU"
            },
            "Europe/Gibraltar": {
                "lat": 36.1333,
                "lon": -4.65,
                "rules": "GB-Eire EU"
            },
            "Europe/Guernsey": {
                "lat": 49.45,
                "lon": -1.4667,
                "rules": ""
            },
            "Europe/Helsinki": {
                "lat": 60.1667,
                "lon": 24.9667,
                "rules": "Finland EU"
            },
            "Europe/Isle_of_Man": {
                "lat": 54.15,
                "lon": -3.5333,
                "rules": ""
            },
            "Europe/Istanbul": {
                "lat": 41.0167,
                "lon": 28.9667,
                "rules": "Turkey EU"
            },
            "Europe/Jersey": {
                "lat": 49.2,
                "lon": -1.8833,
                "rules": ""
            },
            "Europe/Kaliningrad": {
                "lat": 54.7167,
                "lon": 20.5,
                "rules": "C-Eur Poland Russia"
            },
            "Europe/Kiev": {
                "lat": 50.4333,
                "lon": 30.5167,
                "rules": "C-Eur Russia E-Eur EU"
            },
            "Europe/Lisbon": {
                "lat": 38.7167,
                "lon": -8.8667,
                "rules": "Port W-Eur EU"
            },
            "Europe/Ljubljana": {
                "lat": 46.05,
                "lon": 14.5167,
                "rules": ""
            },
            "Europe/London": {
                "lat": 51.5083,
                "lon": 0.1253,
                "rules": "GB-Eire EU"
            },
            "Europe/Luxembourg": {
                "lat": 49.6,
                "lon": 6.15,
                "rules": "Lux Belgium C-Eur EU"
            },
            "Europe/Madrid": {
                "lat": 40.4,
                "lon": -2.3167,
                "rules": "Spain EU"
            },
            "Europe/Malta": {
                "lat": 35.9,
                "lon": 14.5167,
                "rules": "Italy C-Eur Malta EU"
            },
            "Europe/Mariehamn": {
                "lat": 60.1,
                "lon": 19.95,
                "rules": ""
            },
            "Europe/Minsk": {
                "lat": 53.9,
                "lon": 27.5667,
                "rules": "C-Eur Russia"
            },
            "Europe/Monaco": {
                "lat": 43.7,
                "lon": 7.3833,
                "rules": "France EU"
            },
            "Europe/Moscow": {
                "lat": 55.75,
                "lon": 37.5833,
                "rules": "Russia"
            },
            "Europe/Oslo": {
                "lat": 59.9167,
                "lon": 10.75,
                "rules": "Norway C-Eur EU"
            },
            "Europe/Paris": {
                "lat": 48.8667,
                "lon": 2.3333,
                "rules": "France C-Eur EU"
            },
            "Europe/Podgorica": {
                "lat": 42.4333,
                "lon": 19.2667,
                "rules": ""
            },
            "Europe/Prague": {
                "lat": 50.0833,
                "lon": 14.4333,
                "rules": "C-Eur Czech EU"
            },
            "Europe/Riga": {
                "lat": 56.95,
                "lon": 24.1,
                "rules": "C-Eur Russia Latvia EU"
            },
            "Europe/Rome": {
                "lat": 41.9,
                "lon": 12.4833,
                "rules": "Italy C-Eur EU"
            },
            "Europe/Samara": {
                "lat": 53.2,
                "lon": 50.15,
                "rules": "Russia"
            },
            "Europe/San_Marino": {
                "lat": 43.9167,
                "lon": 12.4667,
                "rules": ""
            },
            "Europe/Sarajevo": {
                "lat": 43.8667,
                "lon": 18.4167,
                "rules": ""
            },
            "Europe/Simferopol": {
                "lat": 44.95,
                "lon": 34.1,
                "rules": "C-Eur Russia E-Eur EU"
            },
            "Europe/Skopje": {
                "lat": 41.9833,
                "lon": 21.4333,
                "rules": ""
            },
            "Europe/Sofia": {
                "lat": 42.6833,
                "lon": 23.3167,
                "rules": "C-Eur Bulg E-Eur EU"
            },
            "Europe/Stockholm": {
                "lat": 59.3333,
                "lon": 18.05,
                "rules": "EU"
            },
            "Europe/Tallinn": {
                "lat": 59.4167,
                "lon": 24.75,
                "rules": "C-Eur Russia EU"
            },
            "Europe/Tirane": {
                "lat": 41.3333,
                "lon": 19.8333,
                "rules": "Albania EU"
            },
            "Europe/Uzhgorod": {
                "lat": 48.6167,
                "lon": 22.3,
                "rules": "C-Eur Russia E-Eur EU"
            },
            "Europe/Vaduz": {
                "lat": 47.15,
                "lon": 9.5167,
                "rules": "EU"
            },
            "Europe/Vatican": {
                "lat": 41.9022,
                "lon": 12.4531,
                "rules": ""
            },
            "Europe/Vienna": {
                "lat": 48.2167,
                "lon": 16.3333,
                "rules": "C-Eur Austria EU"
            },
            "Europe/Vilnius": {
                "lat": 54.6833,
                "lon": 25.3167,
                "rules": "C-Eur Russia EU"
            },
            "Europe/Volgograd": {
                "lat": 48.7333,
                "lon": 44.4167,
                "rules": "Russia"
            },
            "Europe/Warsaw": {
                "lat": 52.25,
                "lon": 21,
                "rules": "C-Eur Poland W-Eur EU"
            },
            "Europe/Zagreb": {
                "lat": 45.8,
                "lon": 15.9667,
                "rules": ""
            },
            "Europe/Zaporozhye": {
                "lat": 47.8333,
                "lon": 35.1667,
                "rules": "C-Eur Russia E-Eur EU"
            },
            "Europe/Zurich": {
                "lat": 47.3833,
                "lon": 8.5333,
                "rules": "Swiss EU"
            },
            "HST": {
                "rules": ""
            },
            "Indian/Antananarivo": {
                "lat": -17.0833,
                "lon": 47.5167,
                "rules": ""
            },
            "Indian/Chagos": {
                "lat": -6.6667,
                "lon": 72.4167,
                "rules": ""
            },
            "Indian/Christmas": {
                "lat": -9.5833,
                "lon": 105.7167,
                "rules": ""
            },
            "Indian/Cocos": {
                "lat": -11.8333,
                "lon": 96.9167,
                "rules": ""
            },
            "Indian/Comoro": {
                "lat": -10.3167,
                "lon": 43.2667,
                "rules": ""
            },
            "Indian/Kerguelen": {
                "lat": -48.6472,
                "lon": 70.2175,
                "rules": ""
            },
            "Indian/Mahe": {
                "lat": -3.3333,
                "lon": 55.4667,
                "rules": ""
            },
            "Indian/Maldives": {
                "lat": 4.1667,
                "lon": 73.5,
                "rules": ""
            },
            "Indian/Mauritius": {
                "lat": -19.8333,
                "lon": 57.5,
                "rules": "Mauritius"
            },
            "Indian/Mayotte": {
                "lat": -11.2167,
                "lon": 45.2333,
                "rules": ""
            },
            "Indian/Reunion": {
                "lat": -19.1333,
                "lon": 55.4667,
                "rules": ""
            },
            "MET": {
                "rules": "C-Eur"
            },
            "MST": {
                "rules": ""
            },
            "MST7MDT": {
                "rules": "US"
            },
            "PST8PDT": {
                "rules": "US"
            },
            "Pacific/Apia": {
                "lat": -12.1667,
                "lon": -170.2667,
                "rules": "WS"
            },
            "Pacific/Auckland": {
                "lat": -35.1333,
                "lon": 174.7667,
                "rules": "NZ"
            },
            "Pacific/Chatham": {
                "lat": -42.05,
                "lon": -175.45,
                "rules": "Chatham"
            },
            "Pacific/Chuuk": {
                "lat": 7.4167,
                "lon": 151.7833,
                "rules": ""
            },
            "Pacific/Easter": {
                "lat": -26.85,
                "lon": -108.5667,
                "rules": "Chile"
            },
            "Pacific/Efate": {
                "lat": -16.3333,
                "lon": 168.4167,
                "rules": "Vanuatu"
            },
            "Pacific/Enderbury": {
                "lat": -2.8667,
                "lon": -170.9167,
                "rules": ""
            },
            "Pacific/Fakaofo": {
                "lat": -8.6333,
                "lon": -170.7667,
                "rules": ""
            },
            "Pacific/Fiji": {
                "lat": -17.8667,
                "lon": 178.4167,
                "rules": "Fiji"
            },
            "Pacific/Funafuti": {
                "lat": -7.4833,
                "lon": 179.2167,
                "rules": ""
            },
            "Pacific/Galapagos": {
                "lat": 0.9,
                "lon": -88.4,
                "rules": ""
            },
            "Pacific/Gambier": {
                "lat": -22.8667,
                "lon": -133.05,
                "rules": ""
            },
            "Pacific/Guadalcanal": {
                "lat": -8.4667,
                "lon": 160.2,
                "rules": ""
            },
            "Pacific/Guam": {
                "lat": 13.4667,
                "lon": 144.75,
                "rules": ""
            },
            "Pacific/Honolulu": {
                "lat": 21.3069,
                "lon": -156.1417,
                "rules": ""
            },
            "Pacific/Johnston": {
                "lat": 16.75,
                "lon": -168.4833,
                "rules": ""
            },
            "Pacific/Kiritimati": {
                "lat": 1.8667,
                "lon": -156.6667,
                "rules": ""
            },
            "Pacific/Kosrae": {
                "lat": 5.3167,
                "lon": 162.9833,
                "rules": ""
            },
            "Pacific/Kwajalein": {
                "lat": 9.0833,
                "lon": 167.3333,
                "rules": ""
            },
            "Pacific/Majuro": {
                "lat": 7.15,
                "lon": 171.2,
                "rules": ""
            },
            "Pacific/Marquesas": {
                "lat": -9,
                "lon": -138.5,
                "rules": ""
            },
            "Pacific/Midway": {
                "lat": 28.2167,
                "lon": -176.6333,
                "rules": ""
            },
            "Pacific/Nauru": {
                "lat": 0.5167,
                "lon": 166.9167,
                "rules": ""
            },
            "Pacific/Niue": {
                "lat": -18.9833,
                "lon": -168.0833,
                "rules": ""
            },
            "Pacific/Norfolk": {
                "lat": -28.95,
                "lon": 167.9667,
                "rules": ""
            },
            "Pacific/Noumea": {
                "lat": -21.7333,
                "lon": 166.45,
                "rules": "NC"
            },
            "Pacific/Pago_Pago": {
                "lat": -13.7333,
                "lon": -169.3,
                "rules": ""
            },
            "Pacific/Palau": {
                "lat": 7.3333,
                "lon": 134.4833,
                "rules": ""
            },
            "Pacific/Pitcairn": {
                "lat": -24.9333,
                "lon": -129.9167,
                "rules": ""
            },
            "Pacific/Pohnpei": {
                "lat": 6.9667,
                "lon": 158.2167,
                "rules": ""
            },
            "Pacific/Port_Moresby": {
                "lat": -8.5,
                "lon": 147.1667,
                "rules": ""
            },
            "Pacific/Rarotonga": {
                "lat": -20.7667,
                "lon": -158.2333,
                "rules": "Cook"
            },
            "Pacific/Saipan": {
                "lat": 15.2,
                "lon": 145.75,
                "rules": ""
            },
            "Pacific/Tahiti": {
                "lat": -16.4667,
                "lon": -148.4333,
                "rules": ""
            },
            "Pacific/Tarawa": {
                "lat": 1.4167,
                "lon": 173,
                "rules": ""
            },
            "Pacific/Tongatapu": {
                "lat": -20.8333,
                "lon": -174.8333,
                "rules": "Tonga"
            },
            "Pacific/Wake": {
                "lat": 19.2833,
                "lon": 166.6167,
                "rules": ""
            },
            "Pacific/Wallis": {
                "lat": -12.7,
                "lon": -175.8333,
                "rules": ""
            },
            "WET": {
                "rules": "EU"
            }
        },
        "rules": {
            "AN": [
                "1971 1985 9 0 8 2 2 1",
                "1972 1972 1 27 7 2 2 0",
                "1973 1981 2 1 0 2 2 0",
                "1982 1982 3 1 0 2 2 0",
                "1983 1985 2 1 0 2 2 0",
                "1986 1989 2 15 0 2 2 0",
                "1986 1986 9 19 7 2 2 1",
                "1987 1999 9 0 8 2 2 1",
                "1990 1995 2 1 0 2 2 0",
                "1996 2005 2 0 8 2 2 0",
                "2000 2000 7 0 8 2 2 1",
                "2001 2007 9 0 8 2 2 1",
                "2006 2006 3 1 0 2 2 0",
                "2007 2007 2 0 8 2 2 0",
                "2008 9999 3 1 0 2 2 0",
                "2008 9999 9 1 0 2 2 1"
            ],
            "AQ": [
                "1971 1971 9 0 8 2 2 1",
                "1972 1972 1 0 8 2 2 0",
                "1989 1991 9 0 8 2 2 1",
                "1990 1992 2 1 0 2 2 0"
            ],
            "AS": [
                "1971 1985 9 0 8 2 2 1",
                "1986 1986 9 19 7 2 2 1",
                "1987 2007 9 0 8 2 2 1",
                "1972 1972 1 27 7 2 2 0",
                "1973 1985 2 1 0 2 2 0",
                "1986 1990 2 15 0 2 2 0",
                "1991 1991 2 3 7 2 2 0",
                "1992 1992 2 22 7 2 2 0",
                "1993 1993 2 7 7 2 2 0",
                "1994 1994 2 20 7 2 2 0",
                "1995 2005 2 0 8 2 2 0",
                "2006 2006 3 2 7 2 2 0",
                "2007 2007 2 0 8 2 2 0",
                "2008 9999 3 1 0 2 2 0",
                "2008 9999 9 1 0 2 2 1"
            ],
            "AT": [
                "1967 1967 9 1 0 2 2 1",
                "1968 1968 2 0 8 2 2 0",
                "1968 1985 9 0 8 2 2 1",
                "1969 1971 2 8 0 2 2 0",
                "1972 1972 1 0 8 2 2 0",
                "1973 1981 2 1 0 2 2 0",
                "1982 1983 2 0 8 2 2 0",
                "1984 1986 2 1 0 2 2 0",
                "1986 1986 9 15 0 2 2 1",
                "1987 1990 2 15 0 2 2 0",
                "1987 1987 9 22 0 2 2 1",
                "1988 1990 9 0 8 2 2 1",
                "1991 1999 9 1 0 2 2 1",
                "1991 2005 2 0 8 2 2 0",
                "2000 2000 7 0 8 2 2 1",
                "2001 9999 9 1 0 2 2 1",
                "2006 2006 3 1 0 2 2 0",
                "2007 2007 2 0 8 2 2 0",
                "2008 9999 3 1 0 2 2 0"
            ],
            "AV": [
                "1971 1985 9 0 8 2 2 1",
                "1972 1972 1 0 8 2 2 0",
                "1973 1985 2 1 0 2 2 0",
                "1986 1990 2 15 0 2 2 0",
                "1986 1987 9 15 0 2 2 1",
                "1988 1999 9 0 8 2 2 1",
                "1991 1994 2 1 0 2 2 0",
                "1995 2005 2 0 8 2 2 0",
                "2000 2000 7 0 8 2 2 1",
                "2001 2007 9 0 8 2 2 1",
                "2006 2006 3 1 0 2 2 0",
                "2007 2007 2 0 8 2 2 0",
                "2008 9999 3 1 0 2 2 0",
                "2008 9999 9 1 0 2 2 1"
            ],
            "AW": [
                "1974 1974 9 0 8 2 2 1",
                "1975 1975 2 1 0 2 2 0",
                "1983 1983 9 0 8 2 2 1",
                "1984 1984 2 1 0 2 2 0",
                "1991 1991 10 17 7 2 2 1",
                "1992 1992 2 1 0 2 2 0",
                "2006 2006 11 3 7 2 2 1",
                "2007 2009 2 0 8 2 2 0",
                "2007 2008 9 0 8 2 2 1"
            ],
            "Albania": [
                "1940 1940 5 16 7 0 0 1 S",
                "1942 1942 10 2 7 3 0 0",
                "1943 1943 2 29 7 2 0 1 S",
                "1943 1943 3 10 7 3 0 0",
                "1974 1974 4 4 7 0 0 1 S",
                "1974 1974 9 2 7 0 0 0",
                "1975 1975 4 1 7 0 0 1 S",
                "1975 1975 9 2 7 0 0 0",
                "1976 1976 4 2 7 0 0 1 S",
                "1976 1976 9 3 7 0 0 0",
                "1977 1977 4 8 7 0 0 1 S",
                "1977 1977 9 2 7 0 0 0",
                "1978 1978 4 6 7 0 0 1 S",
                "1978 1978 9 1 7 0 0 0",
                "1979 1979 4 5 7 0 0 1 S",
                "1979 1979 8 30 7 0 0 0",
                "1980 1980 4 3 7 0 0 1 S",
                "1980 1980 9 4 7 0 0 0",
                "1981 1981 3 26 7 0 0 1 S",
                "1981 1981 8 27 7 0 0 0",
                "1982 1982 4 2 7 0 0 1 S",
                "1982 1982 9 3 7 0 0 0",
                "1983 1983 3 18 7 0 0 1 S",
                "1983 1983 9 1 7 0 0 0",
                "1984 1984 3 1 7 0 0 1 S"
            ],
            "Algeria": [
                "1916 1916 5 14 7 23 2 1 S",
                "1916 1919 9 1 0 23 2 0",
                "1917 1917 2 24 7 23 2 1 S",
                "1918 1918 2 9 7 23 2 1 S",
                "1919 1919 2 1 7 23 2 1 S",
                "1920 1920 1 14 7 23 2 1 S",
                "1920 1920 9 23 7 23 2 0",
                "1921 1921 2 14 7 23 2 1 S",
                "1921 1921 5 21 7 23 2 0",
                "1939 1939 8 11 7 23 2 1 S",
                "1939 1939 10 19 7 1 0 0",
                "1944 1945 3 1 1 2 0 1 S",
                "1944 1944 9 8 7 2 0 0",
                "1945 1945 8 16 7 1 0 0",
                "1971 1971 3 25 7 23 2 1 S",
                "1971 1971 8 26 7 23 2 0",
                "1977 1977 4 6 7 0 0 1 S",
                "1977 1977 9 21 7 0 0 0",
                "1978 1978 2 24 7 1 0 1 S",
                "1978 1978 8 22 7 3 0 0",
                "1980 1980 3 25 7 0 0 1 S",
                "1980 1980 9 31 7 2 0 0"
            ],
            "Arg": [
                "1930 1930 11 1 7 0 0 1 S",
                "1931 1931 3 1 7 0 0 0",
                "1931 1931 9 15 7 0 0 1 S",
                "1932 1940 2 1 7 0 0 0",
                "1932 1939 10 1 7 0 0 1 S",
                "1940 1940 6 1 7 0 0 1 S",
                "1941 1941 5 15 7 0 0 0",
                "1941 1941 9 15 7 0 0 1 S",
                "1943 1943 7 1 7 0 0 0",
                "1943 1943 9 15 7 0 0 1 S",
                "1946 1946 2 1 7 0 0 0",
                "1946 1946 9 1 7 0 0 1 S",
                "1963 1963 9 1 7 0 0 0",
                "1963 1963 11 15 7 0 0 1 S",
                "1964 1966 2 1 7 0 0 0",
                "1964 1966 9 15 7 0 0 1 S",
                "1967 1967 3 2 7 0 0 0",
                "1967 1968 9 1 0 0 0 1 S",
                "1968 1969 3 1 0 0 0 0",
                "1974 1974 0 23 7 0 0 1 S",
                "1974 1974 4 1 7 0 0 0",
                "1988 1988 11 1 7 0 0 1 S",
                "1989 1993 2 1 0 0 0 0",
                "1989 1992 9 15 0 0 0 1 S",
                "1999 1999 9 1 0 0 0 1 S",
                "2000 2000 2 3 7 0 0 0",
                "2007 2007 11 30 7 0 0 1 S",
                "2008 2009 2 15 0 0 0 0",
                "2008 2008 9 15 0 0 0 1 S"
            ],
            "ArgAQ": [
                "1964 1966 2 1 7 0 0 0",
                "1964 1966 9 15 7 0 0 1 S",
                "1967 1967 3 2 7 0 0 0",
                "1967 1968 9 1 0 0 0 1 S",
                "1968 1969 3 1 0 0 0 0",
                "1974 1974 0 23 7 0 0 1 S",
                "1974 1974 4 1 7 0 0 0"
            ],
            "Aus": [
                "1917 1917 0 1 7 0:1 0 1",
                "1917 1917 2 25 7 2 0 0",
                "1942 1942 0 1 7 2 0 1",
                "1942 1942 2 29 7 2 0 0",
                "1942 1942 8 27 7 2 0 1",
                "1943 1944 2 0 8 2 0 0",
                "1943 1943 9 3 7 2 0 1"
            ],
            "Austria": [
                "1920 1920 3 5 7 2 2 1 S",
                "1920 1920 8 13 7 2 2 0",
                "1946 1946 3 14 7 2 2 1 S",
                "1946 1948 9 1 0 2 2 0",
                "1947 1947 3 6 7 2 2 1 S",
                "1948 1948 3 18 7 2 2 1 S",
                "1980 1980 3 6 7 0 0 1 S",
                "1980 1980 8 28 7 0 0 0"
            ],
            "Azer": [
                "1997 9999 2 0 8 4 0 1 S",
                "1997 9999 9 0 8 5 0 0"
            ],
            "Bahamas": [
                "1964 1975 9 0 8 2 0 0 S",
                "1964 1975 3 0 8 2 0 1 D"
            ],
            "Barb": [
                "1977 1977 5 12 7 2 0 1 D",
                "1977 1978 9 1 0 2 0 0 S",
                "1978 1980 3 15 0 2 0 1 D",
                "1979 1979 8 30 7 2 0 0 S",
                "1980 1980 8 25 7 2 0 0 S"
            ],
            "Belgium": [
                "1918 1918 2 9 7 0 2 1 S",
                "1918 1919 9 1 6 23 2 0",
                "1919 1919 2 1 7 23 2 1 S",
                "1920 1920 1 14 7 23 2 1 S",
                "1920 1920 9 23 7 23 2 0",
                "1921 1921 2 14 7 23 2 1 S",
                "1921 1921 9 25 7 23 2 0",
                "1922 1922 2 25 7 23 2 1 S",
                "1922 1927 9 1 6 23 2 0",
                "1923 1923 3 21 7 23 2 1 S",
                "1924 1924 2 29 7 23 2 1 S",
                "1925 1925 3 4 7 23 2 1 S",
                "1926 1926 3 17 7 23 2 1 S",
                "1927 1927 3 9 7 23 2 1 S",
                "1928 1928 3 14 7 23 2 1 S",
                "1928 1938 9 2 0 2 2 0",
                "1929 1929 3 21 7 2 2 1 S",
                "1930 1930 3 13 7 2 2 1 S",
                "1931 1931 3 19 7 2 2 1 S",
                "1932 1932 3 3 7 2 2 1 S",
                "1933 1933 2 26 7 2 2 1 S",
                "1934 1934 3 8 7 2 2 1 S",
                "1935 1935 2 31 7 2 2 1 S",
                "1936 1936 3 19 7 2 2 1 S",
                "1937 1937 3 4 7 2 2 1 S",
                "1938 1938 2 27 7 2 2 1 S",
                "1939 1939 3 16 7 2 2 1 S",
                "1939 1939 10 19 7 2 2 0",
                "1940 1940 1 25 7 2 2 1 S",
                "1944 1944 8 17 7 2 2 0",
                "1945 1945 3 2 7 2 2 1 S",
                "1945 1945 8 16 7 2 2 0",
                "1946 1946 4 19 7 2 2 1 S",
                "1946 1946 9 7 7 2 2 0"
            ],
            "Belize": [
                "1918 1942 9 2 0 0 0 0:30 HD",
                "1919 1943 1 9 0 0 0 0 S",
                "1973 1973 11 5 7 0 0 1 D",
                "1974 1974 1 9 7 0 0 0 S",
                "1982 1982 11 18 7 0 0 1 D",
                "1983 1983 1 12 7 0 0 0 S"
            ],
            "Brazil": [
                "1931 1931 9 3 7 11 0 1 S",
                "1932 1933 3 1 7 0 0 0",
                "1932 1932 9 3 7 0 0 1 S",
                "1949 1952 11 1 7 0 0 1 S",
                "1950 1950 3 16 7 1 0 0",
                "1951 1952 3 1 7 0 0 0",
                "1953 1953 2 1 7 0 0 0",
                "1963 1963 11 9 7 0 0 1 S",
                "1964 1964 2 1 7 0 0 0",
                "1965 1965 0 31 7 0 0 1 S",
                "1965 1965 2 31 7 0 0 0",
                "1965 1965 11 1 7 0 0 1 S",
                "1966 1968 2 1 7 0 0 0",
                "1966 1967 10 1 7 0 0 1 S",
                "1985 1985 10 2 7 0 0 1 S",
                "1986 1986 2 15 7 0 0 0",
                "1986 1986 9 25 7 0 0 1 S",
                "1987 1987 1 14 7 0 0 0",
                "1987 1987 9 25 7 0 0 1 S",
                "1988 1988 1 7 7 0 0 0",
                "1988 1988 9 16 7 0 0 1 S",
                "1989 1989 0 29 7 0 0 0",
                "1989 1989 9 15 7 0 0 1 S",
                "1990 1990 1 11 7 0 0 0",
                "1990 1990 9 21 7 0 0 1 S",
                "1991 1991 1 17 7 0 0 0",
                "1991 1991 9 20 7 0 0 1 S",
                "1992 1992 1 9 7 0 0 0",
                "1992 1992 9 25 7 0 0 1 S",
                "1993 1993 0 31 7 0 0 0",
                "1993 1995 9 11 0 0 0 1 S",
                "1994 1995 1 15 0 0 0 0",
                "1996 1996 1 11 7 0 0 0",
                "1996 1996 9 6 7 0 0 1 S",
                "1997 1997 1 16 7 0 0 0",
                "1997 1997 9 6 7 0 0 1 S",
                "1998 1998 2 1 7 0 0 0",
                "1998 1998 9 11 7 0 0 1 S",
                "1999 1999 1 21 7 0 0 0",
                "1999 1999 9 3 7 0 0 1 S",
                "2000 2000 1 27 7 0 0 0",
                "2000 2001 9 8 0 0 0 1 S",
                "2001 2006 1 15 0 0 0 0",
                "2002 2002 10 3 7 0 0 1 S",
                "2003 2003 9 19 7 0 0 1 S",
                "2004 2004 10 2 7 0 0 1 S",
                "2005 2005 9 16 7 0 0 1 S",
                "2006 2006 10 5 7 0 0 1 S",
                "2007 2007 1 25 7 0 0 0",
                "2007 2007 9 8 0 0 0 1 S",
                "2008 9999 9 15 0 0 0 1 S",
                "2008 2011 1 15 0 0 0 0",
                "2012 2012 1 22 0 0 0 0",
                "2013 2014 1 15 0 0 0 0",
                "2015 2015 1 22 0 0 0 0",
                "2016 2022 1 15 0 0 0 0",
                "2023 2023 1 22 0 0 0 0",
                "2024 2025 1 15 0 0 0 0",
                "2026 2026 1 22 0 0 0 0",
                "2027 2033 1 15 0 0 0 0",
                "2034 2034 1 22 0 0 0 0",
                "2035 2036 1 15 0 0 0 0",
                "2037 2037 1 22 0 0 0 0",
                "2038 9999 1 15 0 0 0 0"
            ],
            "Bulg": [
                "1979 1979 2 31 7 23 0 1 S",
                "1979 1979 9 1 7 1 0 0",
                "1980 1982 3 1 6 23 0 1 S",
                "1980 1980 8 29 7 1 0 0",
                "1981 1981 8 27 7 2 0 0"
            ],
            "C-Eur": [
                "1916 1916 3 30 7 23 0 1 S",
                "1916 1916 9 1 7 1 0 0",
                "1917 1918 3 15 1 2 2 1 S",
                "1917 1918 8 15 1 2 2 0",
                "1940 1940 3 1 7 2 2 1 S",
                "1942 1942 10 2 7 2 2 0",
                "1943 1943 2 29 7 2 2 1 S",
                "1943 1943 9 4 7 2 2 0",
                "1944 1945 3 1 1 2 2 1 S",
                "1944 1944 9 2 7 2 2 0",
                "1945 1945 8 16 7 2 2 0",
                "1977 1980 3 1 0 2 2 1 S",
                "1977 1977 8 0 8 2 2 0",
                "1978 1978 9 1 7 2 2 0",
                "1979 1995 8 0 8 2 2 0",
                "1981 9999 2 0 8 2 2 1 S",
                "1996 9999 9 0 8 2 2 0"
            ],
            "CA": [
                "1948 1948 2 14 7 2 0 1 D",
                "1949 1949 0 1 7 2 0 0 S",
                "1950 1966 3 0 8 2 0 1 D",
                "1950 1961 8 0 8 2 0 0 S",
                "1962 1966 9 0 8 2 0 0 S"
            ],
            "CO": [
                "1992 1992 4 3 7 0 0 1 S",
                "1993 1993 3 4 7 0 0 0"
            ],
            "CR": [
                "1979 1980 1 0 8 0 0 1 D",
                "1979 1980 5 1 0 0 0 0 S",
                "1991 1992 0 15 6 0 0 1 D",
                "1991 1991 6 1 7 0 0 0 S",
                "1992 1992 2 15 7 0 0 0 S"
            ],
            "Canada": [
                "1918 1918 3 14 7 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 30 7 2 0 0 S",
                "1974 1986 3 0 8 2 0 1 D",
                "1974 2006 9 0 8 2 0 0 S",
                "1987 2006 3 1 0 2 0 1 D",
                "2007 9999 2 8 0 2 0 1 D",
                "2007 9999 10 1 0 2 0 0 S"
            ],
            "Chatham": [
                "1974 1974 10 1 0 2:45 2 1 D",
                "1975 1975 1 0 8 2:45 2 0 S",
                "1975 1988 9 0 8 2:45 2 1 D",
                "1976 1989 2 1 0 2:45 2 0 S",
                "1989 1989 9 8 0 2:45 2 1 D",
                "1990 2006 9 1 0 2:45 2 1 D",
                "1990 2007 2 15 0 2:45 2 0 S",
                "2007 9999 8 0 8 2:45 2 1 D",
                "2008 9999 3 1 0 2:45 2 0 S"
            ],
            "Chicago": [
                "1920 1920 5 13 7 2 0 1 D",
                "1920 1921 9 0 8 2 0 0 S",
                "1921 1921 2 0 8 2 0 1 D",
                "1922 1966 3 0 8 2 0 1 D",
                "1922 1954 8 0 8 2 0 0 S",
                "1955 1966 9 0 8 2 0 0 S"
            ],
            "Chile": [
                "1927 1932 8 1 7 0 0 1 S",
                "1928 1932 3 1 7 0 0 0",
                "1942 1942 5 1 7 4 1 0",
                "1942 1942 7 1 7 5 1 1 S",
                "1946 1946 6 15 7 4 1 1 S",
                "1946 1946 8 1 7 3 1 0",
                "1947 1947 3 1 7 4 1 0",
                "1968 1968 10 3 7 4 1 1 S",
                "1969 1969 2 30 7 3 1 0",
                "1969 1969 10 23 7 4 1 1 S",
                "1970 1970 2 29 7 3 1 0",
                "1971 1971 2 14 7 3 1 0",
                "1970 1972 9 9 0 4 1 1 S",
                "1972 1986 2 9 0 3 1 0",
                "1973 1973 8 30 7 4 1 1 S",
                "1974 1987 9 9 0 4 1 1 S",
                "1987 1987 3 12 7 3 1 0",
                "1988 1989 2 9 0 3 1 0",
                "1988 1988 9 1 0 4 1 1 S",
                "1989 1989 9 9 0 4 1 1 S",
                "1990 1990 2 18 7 3 1 0",
                "1990 1990 8 16 7 4 1 1 S",
                "1991 1996 2 9 0 3 1 0",
                "1991 1997 9 9 0 4 1 1 S",
                "1997 1997 2 30 7 3 1 0",
                "1998 1998 2 9 0 3 1 0",
                "1998 1998 8 27 7 4 1 1 S",
                "1999 1999 3 4 7 3 1 0",
                "1999 2010 9 9 0 4 1 1 S",
                "2000 2007 2 9 0 3 1 0",
                "2008 2008 2 30 7 3 1 0",
                "2009 2009 2 9 0 3 1 0",
                "2010 2010 3 1 0 3 1 0",
                "2011 2011 4 2 0 3 1 0",
                "2011 2011 7 16 0 4 1 1 S",
                "2012 9999 3 23 0 3 1 0",
                "2012 9999 8 2 0 4 1 1 S"
            ],
            "ChileAQ": [
                "1972 1986 2 9 0 3 1 0",
                "1974 1987 9 9 0 4 1 1 S",
                "1987 1987 3 12 7 3 1 0",
                "1988 1989 2 9 0 3 1 0",
                "1988 1988 9 1 0 4 1 1 S",
                "1989 1989 9 9 0 4 1 1 S",
                "1990 1990 2 18 7 3 1 0",
                "1990 1990 8 16 7 4 1 1 S",
                "1991 1996 2 9 0 3 1 0",
                "1991 1997 9 9 0 4 1 1 S",
                "1997 1997 2 30 7 3 1 0",
                "1998 1998 2 9 0 3 1 0",
                "1998 1998 8 27 7 4 1 1 S",
                "1999 1999 3 4 7 3 1 0",
                "1999 2010 9 9 0 4 1 1 S",
                "2000 2007 2 9 0 3 1 0",
                "2008 2008 2 30 7 3 1 0",
                "2009 2009 2 9 0 3 1 0",
                "2010 2010 3 1 0 3 1 0",
                "2011 2011 4 2 0 3 1 0",
                "2011 2011 7 16 0 4 1 1 S",
                "2012 9999 3 23 0 3 1 0",
                "2012 9999 8 2 0 4 1 1 S"
            ],
            "Cook": [
                "1978 1978 10 12 7 0 0 0:30 HS",
                "1979 1991 2 1 0 0 0 0",
                "1979 1990 9 0 8 0 0 0:30 HS"
            ],
            "Cuba": [
                "1928 1928 5 10 7 0 0 1 D",
                "1928 1928 9 10 7 0 0 0 S",
                "1940 1942 5 1 0 0 0 1 D",
                "1940 1942 8 1 0 0 0 0 S",
                "1945 1946 5 1 0 0 0 1 D",
                "1945 1946 8 1 0 0 0 0 S",
                "1965 1965 5 1 7 0 0 1 D",
                "1965 1965 8 30 7 0 0 0 S",
                "1966 1966 4 29 7 0 0 1 D",
                "1966 1966 9 2 7 0 0 0 S",
                "1967 1967 3 8 7 0 0 1 D",
                "1967 1968 8 8 0 0 0 0 S",
                "1968 1968 3 14 7 0 0 1 D",
                "1969 1977 3 0 8 0 0 1 D",
                "1969 1971 9 0 8 0 0 0 S",
                "1972 1974 9 8 7 0 0 0 S",
                "1975 1977 9 0 8 0 0 0 S",
                "1978 1978 4 7 7 0 0 1 D",
                "1978 1990 9 8 0 0 0 0 S",
                "1979 1980 2 15 0 0 0 1 D",
                "1981 1985 4 5 0 0 0 1 D",
                "1986 1989 2 14 0 0 0 1 D",
                "1990 1997 3 1 0 0 0 1 D",
                "1991 1995 9 8 0 0 2 0 S",
                "1996 1996 9 6 7 0 2 0 S",
                "1997 1997 9 12 7 0 2 0 S",
                "1998 1999 2 0 8 0 2 1 D",
                "1998 2003 9 0 8 0 2 0 S",
                "2000 2004 3 1 0 0 2 1 D",
                "2006 2010 9 0 8 0 2 0 S",
                "2007 2007 2 8 0 0 2 1 D",
                "2008 2008 2 15 0 0 2 1 D",
                "2009 2010 2 8 0 0 2 1 D",
                "2011 2011 2 15 0 0 2 1 D",
                "2011 2011 10 13 7 0 2 0 S",
                "2012 2012 3 1 7 0 2 1 D",
                "2012 9999 10 1 0 0 2 0 S",
                "2013 9999 2 8 0 0 2 1 D"
            ],
            "Cyprus": [
                "1975 1975 3 13 7 0 0 1 S",
                "1975 1975 9 12 7 0 0 0",
                "1976 1976 4 15 7 0 0 1 S",
                "1976 1976 9 11 7 0 0 0",
                "1977 1980 3 1 0 0 0 1 S",
                "1977 1977 8 25 7 0 0 0",
                "1978 1978 9 2 7 0 0 0",
                "1979 1997 8 0 8 0 0 0",
                "1981 1998 2 0 8 0 0 1 S"
            ],
            "Czech": [
                "1945 1945 3 8 7 2 2 1 S",
                "1945 1945 10 18 7 2 2 0",
                "1946 1946 4 6 7 2 2 1 S",
                "1946 1949 9 1 0 2 2 0",
                "1947 1947 3 20 7 2 2 1 S",
                "1948 1948 3 18 7 2 2 1 S",
                "1949 1949 3 9 7 2 2 1 S"
            ],
            "DR": [
                "1966 1966 9 30 7 0 0 1 D",
                "1967 1967 1 28 7 0 0 0 S",
                "1969 1973 9 0 8 0 0 0:30 HD",
                "1970 1970 1 21 7 0 0 0 S",
                "1971 1971 0 20 7 0 0 0 S",
                "1972 1974 0 21 7 0 0 0 S"
            ],
            "Denmark": [
                "1916 1916 4 14 7 23 0 1 S",
                "1916 1916 8 30 7 23 0 0",
                "1940 1940 4 15 7 0 0 1 S",
                "1945 1945 3 2 7 2 2 1 S",
                "1945 1945 7 15 7 2 2 0",
                "1946 1946 4 1 7 2 2 1 S",
                "1946 1946 8 1 7 2 2 0",
                "1947 1947 4 4 7 2 2 1 S",
                "1947 1947 7 10 7 2 2 0",
                "1948 1948 4 9 7 2 2 1 S",
                "1948 1948 7 8 7 2 2 0"
            ],
            "Denver": [
                "1920 1921 2 0 8 2 0 1 D",
                "1920 1920 9 0 8 2 0 0 S",
                "1921 1921 4 22 7 2 0 0 S",
                "1965 1966 3 0 8 2 0 1 D",
                "1965 1966 9 0 8 2 0 0 S"
            ],
            "Detroit": [
                "1948 1948 3 0 8 2 0 1 D",
                "1948 1948 8 0 8 2 0 0 S",
                "1967 1967 5 14 7 2 0 1 D",
                "1967 1967 9 0 8 2 0 0 S"
            ],
            "Dhaka": [
                "2009 2009 5 19 7 23 0 1 S",
                "2009 2009 11 31 7 23:59 0 0"
            ],
            "E-Eur": [
                "1977 1980 3 1 0 0 0 1 S",
                "1977 1977 8 0 8 0 0 0",
                "1978 1978 9 1 7 0 0 0",
                "1979 1995 8 0 8 0 0 0",
                "1981 9999 2 0 8 0 0 1 S",
                "1996 9999 9 0 8 0 0 0"
            ],
            "E-EurAsia": [
                "1981 9999 2 0 8 0 0 1 S",
                "1979 1995 8 0 8 0 0 0",
                "1996 9999 9 0 8 0 0 0"
            ],
            "EU": [
                "1977 1980 3 1 0 1 1 1 S",
                "1977 1977 8 0 8 1 1 0",
                "1978 1978 9 1 7 1 1 0",
                "1979 1995 8 0 8 1 1 0",
                "1981 9999 2 0 8 1 1 1 S",
                "1996 9999 9 0 8 1 1 0"
            ],
            "EUAsia": [
                "1981 9999 2 0 8 1 1 1 S",
                "1979 1995 8 0 8 1 1 0",
                "1996 9999 9 0 8 1 1 0"
            ],
            "Edm": [
                "1918 1919 3 8 0 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1919 1919 4 27 7 2 0 0 S",
                "1920 1923 3 0 8 2 0 1 D",
                "1920 1920 9 0 8 2 0 0 S",
                "1921 1923 8 0 8 2 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 0 8 2 0 0 S",
                "1947 1947 3 0 8 2 0 1 D",
                "1947 1947 8 0 8 2 0 0 S",
                "1967 1967 3 0 8 2 0 1 D",
                "1967 1967 9 0 8 2 0 0 S",
                "1969 1969 3 0 8 2 0 1 D",
                "1969 1969 9 0 8 2 0 0 S",
                "1972 1986 3 0 8 2 0 1 D",
                "1972 2006 9 0 8 2 0 0 S"
            ],
            "Egypt": [
                "1940 1940 6 15 7 0 0 1 S",
                "1940 1940 9 1 7 0 0 0",
                "1941 1941 3 15 7 0 0 1 S",
                "1941 1941 8 16 7 0 0 0",
                "1942 1944 3 1 7 0 0 1 S",
                "1942 1942 9 27 7 0 0 0",
                "1943 1945 10 1 7 0 0 0",
                "1945 1945 3 16 7 0 0 1 S",
                "1957 1957 4 10 7 0 0 1 S",
                "1957 1958 9 1 7 0 0 0",
                "1958 1958 4 1 7 0 0 1 S",
                "1959 1981 4 1 7 1 0 1 S",
                "1959 1965 8 30 7 3 0 0",
                "1966 1994 9 1 7 3 0 0",
                "1982 1982 6 25 7 1 0 1 S",
                "1983 1983 6 12 7 1 0 1 S",
                "1984 1988 4 1 7 1 0 1 S",
                "1989 1989 4 6 7 1 0 1 S",
                "1990 1994 4 1 7 1 0 1 S",
                "1995 2010 3 5 8 0 2 1 S",
                "1995 2005 8 4 8 23 2 0",
                "2006 2006 8 21 7 23 2 0",
                "2007 2007 8 1 4 23 2 0",
                "2008 2008 7 4 8 23 2 0",
                "2009 2009 7 20 7 23 2 0",
                "2010 2010 7 11 7 0 0 0",
                "2010 2010 8 10 7 0 0 1 S",
                "2010 2010 8 4 8 23 2 0"
            ],
            "EgyptAsia": [
                "1957 1957 4 10 7 0 0 1 S",
                "1957 1958 9 1 7 0 0 0",
                "1958 1958 4 1 7 0 0 1 S",
                "1959 1967 4 1 7 1 0 1 S",
                "1959 1965 8 30 7 3 0 0",
                "1966 1966 9 1 7 3 0 0"
            ],
            "Falk": [
                "1937 1938 8 0 8 0 0 1 S",
                "1938 1942 2 19 0 0 0 0",
                "1939 1939 9 1 7 0 0 1 S",
                "1940 1942 8 0 8 0 0 1 S",
                "1943 1943 0 1 7 0 0 0",
                "1983 1983 8 0 8 0 0 1 S",
                "1984 1985 3 0 8 0 0 0",
                "1984 1984 8 16 7 0 0 1 S",
                "1985 2000 8 9 0 0 0 1 S",
                "1986 2000 3 16 0 0 0 0",
                "2001 2010 3 15 0 2 0 0",
                "2001 2010 8 1 0 2 0 1 S"
            ],
            "Fiji": [
                "1998 1999 10 1 0 2 0 1 S",
                "1999 2000 1 0 8 3 0 0",
                "2009 2009 10 29 7 2 0 1 S",
                "2010 2010 2 0 8 3 0 0",
                "2010 9999 9 18 0 2 0 1 S",
                "2011 2011 2 1 0 3 0 0",
                "2012 9999 0 18 0 3 0 0"
            ],
            "Finland": [
                "1942 1942 3 3 7 0 0 1 S",
                "1942 1942 9 3 7 0 0 0",
                "1981 1982 2 0 8 2 0 1 S",
                "1981 1982 8 0 8 3 0 0"
            ],
            "France": [
                "1916 1916 5 14 7 23 2 1 S",
                "1916 1919 9 1 0 23 2 0",
                "1917 1917 2 24 7 23 2 1 S",
                "1918 1918 2 9 7 23 2 1 S",
                "1919 1919 2 1 7 23 2 1 S",
                "1920 1920 1 14 7 23 2 1 S",
                "1920 1920 9 23 7 23 2 0",
                "1921 1921 2 14 7 23 2 1 S",
                "1921 1921 9 25 7 23 2 0",
                "1922 1922 2 25 7 23 2 1 S",
                "1922 1938 9 1 6 23 2 0",
                "1923 1923 4 26 7 23 2 1 S",
                "1924 1924 2 29 7 23 2 1 S",
                "1925 1925 3 4 7 23 2 1 S",
                "1926 1926 3 17 7 23 2 1 S",
                "1927 1927 3 9 7 23 2 1 S",
                "1928 1928 3 14 7 23 2 1 S",
                "1929 1929 3 20 7 23 2 1 S",
                "1930 1930 3 12 7 23 2 1 S",
                "1931 1931 3 18 7 23 2 1 S",
                "1932 1932 3 2 7 23 2 1 S",
                "1933 1933 2 25 7 23 2 1 S",
                "1934 1934 3 7 7 23 2 1 S",
                "1935 1935 2 30 7 23 2 1 S",
                "1936 1936 3 18 7 23 2 1 S",
                "1937 1937 3 3 7 23 2 1 S",
                "1938 1938 2 26 7 23 2 1 S",
                "1939 1939 3 15 7 23 2 1 S",
                "1939 1939 10 18 7 23 2 0",
                "1940 1940 1 25 7 2 0 1 S",
                "1941 1941 4 5 7 0 0 2 M",
                "1941 1941 9 6 7 0 0 1 S",
                "1942 1942 2 9 7 0 0 2 M",
                "1942 1942 10 2 7 3 0 1 S",
                "1943 1943 2 29 7 2 0 2 M",
                "1943 1943 9 4 7 3 0 1 S",
                "1944 1944 3 3 7 2 0 2 M",
                "1944 1944 9 8 7 1 0 1 S",
                "1945 1945 3 2 7 2 0 2 M",
                "1945 1945 8 16 7 3 0 0",
                "1976 1976 2 28 7 1 0 1 S",
                "1976 1976 8 26 7 1 0 0"
            ],
            "GB-Eire": [
                "1916 1916 4 21 7 2 2 1 BST",
                "1916 1916 9 1 7 2 2 0 GMT",
                "1917 1917 3 8 7 2 2 1 BST",
                "1917 1917 8 17 7 2 2 0 GMT",
                "1918 1918 2 24 7 2 2 1 BST",
                "1918 1918 8 30 7 2 2 0 GMT",
                "1919 1919 2 30 7 2 2 1 BST",
                "1919 1919 8 29 7 2 2 0 GMT",
                "1920 1920 2 28 7 2 2 1 BST",
                "1920 1920 9 25 7 2 2 0 GMT",
                "1921 1921 3 3 7 2 2 1 BST",
                "1921 1921 9 3 7 2 2 0 GMT",
                "1922 1922 2 26 7 2 2 1 BST",
                "1922 1922 9 8 7 2 2 0 GMT",
                "1923 1923 3 16 0 2 2 1 BST",
                "1923 1924 8 16 0 2 2 0 GMT",
                "1924 1924 3 9 0 2 2 1 BST",
                "1925 1926 3 16 0 2 2 1 BST",
                "1925 1938 9 2 0 2 2 0 GMT",
                "1927 1927 3 9 0 2 2 1 BST",
                "1928 1929 3 16 0 2 2 1 BST",
                "1930 1930 3 9 0 2 2 1 BST",
                "1931 1932 3 16 0 2 2 1 BST",
                "1933 1933 3 9 0 2 2 1 BST",
                "1934 1934 3 16 0 2 2 1 BST",
                "1935 1935 3 9 0 2 2 1 BST",
                "1936 1937 3 16 0 2 2 1 BST",
                "1938 1938 3 9 0 2 2 1 BST",
                "1939 1939 3 16 0 2 2 1 BST",
                "1939 1939 10 16 0 2 2 0 GMT",
                "1940 1940 1 23 0 2 2 1 BST",
                "1941 1941 4 2 0 1 2 2 BDST",
                "1941 1943 7 9 0 1 2 1 BST",
                "1942 1944 3 2 0 1 2 2 BDST",
                "1944 1944 8 16 0 1 2 1 BST",
                "1945 1945 3 2 1 1 2 2 BDST",
                "1945 1945 6 9 0 1 2 1 BST",
                "1945 1946 9 2 0 2 2 0 GMT",
                "1946 1946 3 9 0 2 2 1 BST",
                "1947 1947 2 16 7 2 2 1 BST",
                "1947 1947 3 13 7 1 2 2 BDST",
                "1947 1947 7 10 7 1 2 1 BST",
                "1947 1947 10 2 7 2 2 0 GMT",
                "1948 1948 2 14 7 2 2 1 BST",
                "1948 1948 9 31 7 2 2 0 GMT",
                "1949 1949 3 3 7 2 2 1 BST",
                "1949 1949 9 30 7 2 2 0 GMT",
                "1950 1952 3 14 0 2 2 1 BST",
                "1950 1952 9 21 0 2 2 0 GMT",
                "1953 1953 3 16 0 2 2 1 BST",
                "1953 1960 9 2 0 2 2 0 GMT",
                "1954 1954 3 9 0 2 2 1 BST",
                "1955 1956 3 16 0 2 2 1 BST",
                "1957 1957 3 9 0 2 2 1 BST",
                "1958 1959 3 16 0 2 2 1 BST",
                "1960 1960 3 9 0 2 2 1 BST",
                "1961 1963 2 0 8 2 2 1 BST",
                "1961 1968 9 23 0 2 2 0 GMT",
                "1964 1967 2 19 0 2 2 1 BST",
                "1968 1968 1 18 7 2 2 1 BST",
                "1972 1980 2 16 0 2 2 1 BST",
                "1972 1980 9 23 0 2 2 0 GMT",
                "1981 1995 2 0 8 1 1 1 BST",
                "1981 1989 9 23 0 1 1 0 GMT",
                "1990 1995 9 22 0 1 1 0 GMT"
            ],
            "Germany": [
                "1946 1946 3 14 7 2 2 1 S",
                "1946 1946 9 7 7 2 2 0",
                "1947 1949 9 1 0 2 2 0",
                "1947 1947 3 6 7 3 2 1 S",
                "1947 1947 4 11 7 2 2 2 M",
                "1947 1947 5 29 7 3 0 1 S",
                "1948 1948 3 18 7 2 2 1 S",
                "1949 1949 3 10 7 2 2 1 S"
            ],
            "Ghana": [
                "1936 1942 8 1 7 0 0 0:20 GHST",
                "1936 1942 11 31 7 0 0 0 GMT"
            ],
            "Greece": [
                "1932 1932 6 7 7 0 0 1 S",
                "1932 1932 8 1 7 0 0 0",
                "1941 1941 3 7 7 0 0 1 S",
                "1942 1942 10 2 7 3 0 0",
                "1943 1943 2 30 7 0 0 1 S",
                "1943 1943 9 4 7 0 0 0",
                "1952 1952 6 1 7 0 0 1 S",
                "1952 1952 10 2 7 0 0 0",
                "1975 1975 3 12 7 0 2 1 S",
                "1975 1975 10 26 7 0 2 0",
                "1976 1976 3 11 7 2 2 1 S",
                "1976 1976 9 10 7 2 2 0",
                "1977 1978 3 1 0 2 2 1 S",
                "1977 1977 8 26 7 2 2 0",
                "1978 1978 8 24 7 4 0 0",
                "1979 1979 3 1 7 9 0 1 S",
                "1979 1979 8 29 7 2 0 0",
                "1980 1980 3 1 7 0 0 1 S",
                "1980 1980 8 28 7 0 0 0"
            ],
            "Guat": [
                "1973 1973 10 25 7 0 0 1 D",
                "1974 1974 1 24 7 0 0 0 S",
                "1983 1983 4 21 7 0 0 1 D",
                "1983 1983 8 22 7 0 0 0 S",
                "1991 1991 2 23 7 0 0 1 D",
                "1991 1991 8 7 7 0 0 0 S",
                "2006 2006 3 30 7 0 0 1 D",
                "2006 2006 9 1 7 0 0 0 S"
            ],
            "HK": [
                "1941 1941 3 1 7 3:30 0 1 S",
                "1941 1941 8 30 7 3:30 0 0",
                "1946 1946 3 20 7 3:30 0 1 S",
                "1946 1946 11 1 7 3:30 0 0",
                "1947 1947 3 13 7 3:30 0 1 S",
                "1947 1947 11 30 7 3:30 0 0",
                "1948 1948 4 2 7 3:30 0 1 S",
                "1948 1951 9 0 8 3:30 0 0",
                "1952 1952 9 25 7 3:30 0 0",
                "1949 1953 3 1 0 3:30 0 1 S",
                "1953 1953 10 1 7 3:30 0 0",
                "1954 1964 2 18 0 3:30 0 1 S",
                "1954 1954 9 31 7 3:30 0 0",
                "1955 1964 10 1 0 3:30 0 0",
                "1965 1976 3 16 0 3:30 0 1 S",
                "1965 1976 9 16 0 3:30 0 0",
                "1973 1973 11 30 7 3:30 0 1 S",
                "1979 1979 4 8 0 3:30 0 1 S",
                "1979 1979 9 16 0 3:30 0 0"
            ],
            "Haiti": [
                "1983 1983 4 8 7 0 0 1 D",
                "1984 1987 3 0 8 0 0 1 D",
                "1983 1987 9 0 8 0 0 0 S",
                "1988 1997 3 1 0 1 2 1 D",
                "1988 1997 9 0 8 1 2 0 S",
                "2005 2006 3 1 0 0 0 1 D",
                "2005 2006 9 0 8 0 0 0 S",
                "2012 9999 2 8 0 2 0 1 D",
                "2012 9999 10 1 0 2 0 0 S"
            ],
            "Halifax": [
                "1916 1916 3 1 7 0 0 1 D",
                "1916 1916 9 1 7 0 0 0 S",
                "1920 1920 4 9 7 0 0 1 D",
                "1920 1920 7 29 7 0 0 0 S",
                "1921 1921 4 6 7 0 0 1 D",
                "1921 1922 8 5 7 0 0 0 S",
                "1922 1922 3 30 7 0 0 1 D",
                "1923 1925 4 1 0 0 0 1 D",
                "1923 1923 8 4 7 0 0 0 S",
                "1924 1924 8 15 7 0 0 0 S",
                "1925 1925 8 28 7 0 0 0 S",
                "1926 1926 4 16 7 0 0 1 D",
                "1926 1926 8 13 7 0 0 0 S",
                "1927 1927 4 1 7 0 0 1 D",
                "1927 1927 8 26 7 0 0 0 S",
                "1928 1931 4 8 0 0 0 1 D",
                "1928 1928 8 9 7 0 0 0 S",
                "1929 1929 8 3 7 0 0 0 S",
                "1930 1930 8 15 7 0 0 0 S",
                "1931 1932 8 24 1 0 0 0 S",
                "1932 1932 4 1 7 0 0 1 D",
                "1933 1933 3 30 7 0 0 1 D",
                "1933 1933 9 2 7 0 0 0 S",
                "1934 1934 4 20 7 0 0 1 D",
                "1934 1934 8 16 7 0 0 0 S",
                "1935 1935 5 2 7 0 0 1 D",
                "1935 1935 8 30 7 0 0 0 S",
                "1936 1936 5 1 7 0 0 1 D",
                "1936 1936 8 14 7 0 0 0 S",
                "1937 1938 4 1 0 0 0 1 D",
                "1937 1941 8 24 1 0 0 0 S",
                "1939 1939 4 28 7 0 0 1 D",
                "1940 1941 4 1 0 0 0 1 D",
                "1946 1949 3 0 8 2 0 1 D",
                "1946 1949 8 0 8 2 0 0 S",
                "1951 1954 3 0 8 2 0 1 D",
                "1951 1954 8 0 8 2 0 0 S",
                "1956 1959 3 0 8 2 0 1 D",
                "1956 1959 8 0 8 2 0 0 S",
                "1962 1973 3 0 8 2 0 1 D",
                "1962 1973 9 0 8 2 0 0 S"
            ],
            "Holiday": [
                "1992 1993 9 0 8 2 2 1",
                "1993 1994 2 1 0 2 2 0"
            ],
            "Hond": [
                "1987 1988 4 1 0 0 0 1 D",
                "1987 1988 8 0 8 0 0 0 S",
                "2006 2006 4 1 0 0 0 1 D",
                "2006 2006 7 1 1 0 0 0 S"
            ],
            "Hungary": [
                "1918 1918 3 1 7 3 0 1 S",
                "1918 1918 8 29 7 3 0 0",
                "1919 1919 3 15 7 3 0 1 S",
                "1919 1919 8 15 7 3 0 0",
                "1920 1920 3 5 7 3 0 1 S",
                "1920 1920 8 30 7 3 0 0",
                "1945 1945 4 1 7 23 0 1 S",
                "1945 1945 10 3 7 0 0 0",
                "1946 1946 2 31 7 2 2 1 S",
                "1946 1949 9 1 0 2 2 0",
                "1947 1949 3 4 0 2 2 1 S",
                "1950 1950 3 17 7 2 2 1 S",
                "1950 1950 9 23 7 2 2 0",
                "1954 1955 4 23 7 0 0 1 S",
                "1954 1955 9 3 7 0 0 0",
                "1956 1956 5 1 0 0 0 1 S",
                "1956 1956 8 0 8 0 0 0",
                "1957 1957 5 1 0 1 0 1 S",
                "1957 1957 8 0 8 3 0 0",
                "1980 1980 3 6 7 1 0 1 S"
            ],
            "Iceland": [
                "1917 1918 1 19 7 23 0 1 S",
                "1917 1917 9 21 7 1 0 0",
                "1918 1918 10 16 7 1 0 0",
                "1939 1939 3 29 7 23 0 1 S",
                "1939 1939 10 29 7 2 0 0",
                "1940 1940 1 25 7 2 0 1 S",
                "1940 1940 10 3 7 2 0 0",
                "1941 1941 2 2 7 1 2 1 S",
                "1941 1941 10 2 7 1 2 0",
                "1942 1942 2 8 7 1 2 1 S",
                "1942 1942 9 25 7 1 2 0",
                "1943 1946 2 1 0 1 2 1 S",
                "1943 1948 9 22 0 1 2 0",
                "1947 1967 3 1 0 1 2 1 S",
                "1949 1949 9 30 7 1 2 0",
                "1950 1966 9 22 0 1 2 0",
                "1967 1967 9 29 7 1 2 0"
            ],
            "Indianapolis": [
                "1941 1941 5 22 7 2 0 1 D",
                "1941 1954 8 0 8 2 0 0 S",
                "1946 1954 3 0 8 2 0 1 D"
            ],
            "Iran": [
                "1978 1980 2 21 7 0 0 1 D",
                "1978 1978 9 21 7 0 0 0 S",
                "1979 1979 8 19 7 0 0 0 S",
                "1980 1980 8 23 7 0 0 0 S",
                "1991 1991 4 3 7 0 0 1 D",
                "1992 1995 2 22 7 0 0 1 D",
                "1991 1995 8 22 7 0 0 0 S",
                "1996 1996 2 21 7 0 0 1 D",
                "1996 1996 8 21 7 0 0 0 S",
                "1997 1999 2 22 7 0 0 1 D",
                "1997 1999 8 22 7 0 0 0 S",
                "2000 2000 2 21 7 0 0 1 D",
                "2000 2000 8 21 7 0 0 0 S",
                "2001 2003 2 22 7 0 0 1 D",
                "2001 2003 8 22 7 0 0 0 S",
                "2004 2004 2 21 7 0 0 1 D",
                "2004 2004 8 21 7 0 0 0 S",
                "2005 2005 2 22 7 0 0 1 D",
                "2005 2005 8 22 7 0 0 0 S",
                "2008 2008 2 21 7 0 0 1 D",
                "2008 2008 8 21 7 0 0 0 S",
                "2009 2011 2 22 7 0 0 1 D",
                "2009 2011 8 22 7 0 0 0 S",
                "2012 2012 2 21 7 0 0 1 D",
                "2012 2012 8 21 7 0 0 0 S",
                "2013 2015 2 22 7 0 0 1 D",
                "2013 2015 8 22 7 0 0 0 S",
                "2016 2016 2 21 7 0 0 1 D",
                "2016 2016 8 21 7 0 0 0 S",
                "2017 2019 2 22 7 0 0 1 D",
                "2017 2019 8 22 7 0 0 0 S",
                "2020 2020 2 21 7 0 0 1 D",
                "2020 2020 8 21 7 0 0 0 S",
                "2021 2023 2 22 7 0 0 1 D",
                "2021 2023 8 22 7 0 0 0 S",
                "2024 2024 2 21 7 0 0 1 D",
                "2024 2024 8 21 7 0 0 0 S",
                "2025 2027 2 22 7 0 0 1 D",
                "2025 2027 8 22 7 0 0 0 S",
                "2028 2029 2 21 7 0 0 1 D",
                "2028 2029 8 21 7 0 0 0 S",
                "2030 2031 2 22 7 0 0 1 D",
                "2030 2031 8 22 7 0 0 0 S",
                "2032 2033 2 21 7 0 0 1 D",
                "2032 2033 8 21 7 0 0 0 S",
                "2034 2035 2 22 7 0 0 1 D",
                "2034 2035 8 22 7 0 0 0 S",
                "2036 2037 2 21 7 0 0 1 D",
                "2036 2037 8 21 7 0 0 0 S"
            ],
            "Iraq": [
                "1982 1982 4 1 7 0 0 1 D",
                "1982 1984 9 1 7 0 0 0 S",
                "1983 1983 2 31 7 0 0 1 D",
                "1984 1985 3 1 7 0 0 1 D",
                "1985 1990 8 0 8 1 2 0 S",
                "1986 1990 2 0 8 1 2 1 D",
                "1991 2007 3 1 7 3 2 1 D",
                "1991 2007 9 1 7 3 2 0 S"
            ],
            "Italy": [
                "1916 1916 5 3 7 0 2 1 S",
                "1916 1916 9 1 7 0 2 0",
                "1917 1917 3 1 7 0 2 1 S",
                "1917 1917 8 30 7 0 2 0",
                "1918 1918 2 10 7 0 2 1 S",
                "1918 1919 9 1 0 0 2 0",
                "1919 1919 2 2 7 0 2 1 S",
                "1920 1920 2 21 7 0 2 1 S",
                "1920 1920 8 19 7 0 2 0",
                "1940 1940 5 15 7 0 2 1 S",
                "1944 1944 8 17 7 0 2 0",
                "1945 1945 3 2 7 2 0 1 S",
                "1945 1945 8 15 7 0 2 0",
                "1946 1946 2 17 7 2 2 1 S",
                "1946 1946 9 6 7 2 2 0",
                "1947 1947 2 16 7 0 2 1 S",
                "1947 1947 9 5 7 0 2 0",
                "1948 1948 1 29 7 2 2 1 S",
                "1948 1948 9 3 7 2 2 0",
                "1966 1968 4 22 0 0 0 1 S",
                "1966 1969 8 22 0 0 0 0",
                "1969 1969 5 1 7 0 0 1 S",
                "1970 1970 4 31 7 0 0 1 S",
                "1970 1970 8 0 8 0 0 0",
                "1971 1972 4 22 0 0 0 1 S",
                "1971 1971 8 0 8 1 0 0",
                "1972 1972 9 1 7 0 0 0",
                "1973 1973 5 3 7 0 0 1 S",
                "1973 1974 8 0 8 0 0 0",
                "1974 1974 4 26 7 0 0 1 S",
                "1975 1975 5 1 7 0 2 1 S",
                "1975 1977 8 0 8 0 2 0",
                "1976 1976 4 30 7 0 2 1 S",
                "1977 1979 4 22 0 0 2 1 S",
                "1978 1978 9 1 7 0 2 0",
                "1979 1979 8 30 7 0 2 0"
            ],
            "Japan": [
                "1948 1948 4 1 0 2 0 1 D",
                "1948 1951 8 8 6 2 0 0 S",
                "1949 1949 3 1 0 2 0 1 D",
                "1950 1951 4 1 0 2 0 1 D"
            ],
            "Jordan": [
                "1973 1973 5 6 7 0 0 1 S",
                "1973 1975 9 1 7 0 0 0",
                "1974 1977 4 1 7 0 0 1 S",
                "1976 1976 10 1 7 0 0 0",
                "1977 1977 9 1 7 0 0 0",
                "1978 1978 3 30 7 0 0 1 S",
                "1978 1978 8 30 7 0 0 0",
                "1985 1985 3 1 7 0 0 1 S",
                "1985 1985 9 1 7 0 0 0",
                "1986 1988 3 1 5 0 0 1 S",
                "1986 1990 9 1 5 0 0 0",
                "1989 1989 4 8 7 0 0 1 S",
                "1990 1990 3 27 7 0 0 1 S",
                "1991 1991 3 17 7 0 0 1 S",
                "1991 1991 8 27 7 0 0 0",
                "1992 1992 3 10 7 0 0 1 S",
                "1992 1993 9 1 5 0 0 0",
                "1993 1998 3 1 5 0 0 1 S",
                "1994 1994 8 15 5 0 0 0",
                "1995 1998 8 15 5 0 2 0",
                "1999 1999 6 1 7 0 2 1 S",
                "1999 2002 8 5 8 0 2 0",
                "2000 2001 2 4 8 0 2 1 S",
                "2002 9999 2 4 8 24 0 1 S",
                "2003 2003 9 24 7 0 2 0",
                "2004 2004 9 15 7 0 2 0",
                "2005 2005 8 5 8 0 2 0",
                "2006 2011 9 5 8 0 2 0",
                "2013 9999 9 5 8 0 2 0"
            ],
            "Kyrgyz": [
                "1992 1996 3 7 0 0 2 1 S",
                "1992 1996 8 0 8 0 0 0",
                "1997 2005 2 0 8 2:30 0 1 S",
                "1997 2004 9 0 8 2:30 0 0"
            ],
            "LH": [
                "1981 1984 9 0 8 2 0 1",
                "1982 1985 2 1 0 2 0 0",
                "1985 1985 9 0 8 2 0 0:30",
                "1986 1989 2 15 0 2 0 0",
                "1986 1986 9 19 7 2 0 0:30",
                "1987 1999 9 0 8 2 0 0:30",
                "1990 1995 2 1 0 2 0 0",
                "1996 2005 2 0 8 2 0 0",
                "2000 2000 7 0 8 2 0 0:30",
                "2001 2007 9 0 8 2 0 0:30",
                "2006 2006 3 1 0 2 0 0",
                "2007 2007 2 0 8 2 0 0",
                "2008 9999 3 1 0 2 0 0",
                "2008 9999 9 1 0 2 0 0:30"
            ],
            "Latvia": [
                "1989 1996 2 0 8 2 2 1 S",
                "1989 1996 8 0 8 2 2 0"
            ],
            "Lebanon": [
                "1920 1920 2 28 7 0 0 1 S",
                "1920 1920 9 25 7 0 0 0",
                "1921 1921 3 3 7 0 0 1 S",
                "1921 1921 9 3 7 0 0 0",
                "1922 1922 2 26 7 0 0 1 S",
                "1922 1922 9 8 7 0 0 0",
                "1923 1923 3 22 7 0 0 1 S",
                "1923 1923 8 16 7 0 0 0",
                "1957 1961 4 1 7 0 0 1 S",
                "1957 1961 9 1 7 0 0 0",
                "1972 1972 5 22 7 0 0 1 S",
                "1972 1977 9 1 7 0 0 0",
                "1973 1977 4 1 7 0 0 1 S",
                "1978 1978 3 30 7 0 0 1 S",
                "1978 1978 8 30 7 0 0 0",
                "1984 1987 4 1 7 0 0 1 S",
                "1984 1991 9 16 7 0 0 0",
                "1988 1988 5 1 7 0 0 1 S",
                "1989 1989 4 10 7 0 0 1 S",
                "1990 1992 4 1 7 0 0 1 S",
                "1992 1992 9 4 7 0 0 0",
                "1993 9999 2 0 8 0 0 1 S",
                "1993 1998 8 0 8 0 0 0",
                "1999 9999 9 0 8 0 0 0"
            ],
            "Libya": [
                "1951 1951 9 14 7 2 0 1 S",
                "1952 1952 0 1 7 0 0 0",
                "1953 1953 9 9 7 2 0 1 S",
                "1954 1954 0 1 7 0 0 0",
                "1955 1955 8 30 7 0 0 1 S",
                "1956 1956 0 1 7 0 0 0",
                "1982 1984 3 1 7 0 0 1 S",
                "1982 1985 9 1 7 0 0 0",
                "1985 1985 3 6 7 0 0 1 S",
                "1986 1986 3 4 7 0 0 1 S",
                "1986 1986 9 3 7 0 0 0",
                "1987 1989 3 1 7 0 0 1 S",
                "1987 1989 9 1 7 0 0 0",
                "1997 1997 3 4 7 0 0 1 S",
                "1997 1997 9 4 7 0 0 0",
                "2013 9999 2 5 8 1 0 1 S",
                "2013 9999 9 5 8 2 0 0"
            ],
            "Louisville": [
                "1921 1921 4 1 7 2 0 1 D",
                "1921 1921 8 1 7 2 0 0 S",
                "1941 1961 3 0 8 2 0 1 D",
                "1941 1941 8 0 8 2 0 0 S",
                "1946 1946 5 2 7 2 0 0 S",
                "1950 1955 8 0 8 2 0 0 S",
                "1956 1960 9 0 8 2 0 0 S"
            ],
            "Lux": [
                "1916 1916 4 14 7 23 0 1 S",
                "1916 1916 9 1 7 1 0 0",
                "1917 1917 3 28 7 23 0 1 S",
                "1917 1917 8 17 7 1 0 0",
                "1918 1918 3 15 1 2 2 1 S",
                "1918 1918 8 15 1 2 2 0",
                "1919 1919 2 1 7 23 0 1 S",
                "1919 1919 9 5 7 3 0 0",
                "1920 1920 1 14 7 23 0 1 S",
                "1920 1920 9 24 7 2 0 0",
                "1921 1921 2 14 7 23 0 1 S",
                "1921 1921 9 26 7 2 0 0",
                "1922 1922 2 25 7 23 0 1 S",
                "1922 1922 9 2 0 1 0 0",
                "1923 1923 3 21 7 23 0 1 S",
                "1923 1923 9 2 0 2 0 0",
                "1924 1924 2 29 7 23 0 1 S",
                "1924 1928 9 2 0 1 0 0",
                "1925 1925 3 5 7 23 0 1 S",
                "1926 1926 3 17 7 23 0 1 S",
                "1927 1927 3 9 7 23 0 1 S",
                "1928 1928 3 14 7 23 0 1 S",
                "1929 1929 3 20 7 23 0 1 S"
            ],
            "Macau": [
                "1961 1962 2 16 0 3:30 0 1 S",
                "1961 1964 10 1 0 3:30 0 0",
                "1963 1963 2 16 0 0 0 1 S",
                "1964 1964 2 16 0 3:30 0 1 S",
                "1965 1965 2 16 0 0 0 1 S",
                "1965 1965 9 31 7 0 0 0",
                "1966 1971 3 16 0 3:30 0 1 S",
                "1966 1971 9 16 0 3:30 0 0",
                "1972 1974 3 15 0 0 0 1 S",
                "1972 1973 9 15 0 0 0 0",
                "1974 1977 9 15 0 3:30 0 0",
                "1975 1977 3 15 0 3:30 0 1 S",
                "1978 1980 3 15 0 0 0 1 S",
                "1978 1980 9 15 0 0 0 0"
            ],
            "Malta": [
                "1973 1973 2 31 7 0 2 1 S",
                "1973 1973 8 29 7 0 2 0",
                "1974 1974 3 21 7 0 2 1 S",
                "1974 1974 8 16 7 0 2 0",
                "1975 1979 3 15 0 2 0 1 S",
                "1975 1980 8 15 0 2 0 0",
                "1980 1980 2 31 7 2 0 1 S"
            ],
            "Marengo": [
                "1951 1951 3 0 8 2 0 1 D",
                "1951 1951 8 0 8 2 0 0 S",
                "1954 1960 3 0 8 2 0 1 D",
                "1954 1960 8 0 8 2 0 0 S"
            ],
            "Mauritius": [
                "1982 1982 9 10 7 0 0 1 S",
                "1983 1983 2 21 7 0 0 0",
                "2008 2008 9 0 8 2 0 1 S",
                "2009 2009 2 0 8 2 0 0"
            ],
            "Menominee": [
                "1946 1946 3 0 8 2 0 1 D",
                "1946 1946 8 0 8 2 0 0 S",
                "1966 1966 3 0 8 2 0 1 D",
                "1966 1966 9 0 8 2 0 0 S"
            ],
            "Mexico": [
                "1939 1939 1 5 7 0 0 1 D",
                "1939 1939 5 25 7 0 0 0 S",
                "1940 1940 11 9 7 0 0 1 D",
                "1941 1941 3 1 7 0 0 0 S",
                "1943 1943 11 16 7 0 0 1 W",
                "1944 1944 4 1 7 0 0 0 S",
                "1950 1950 1 12 7 0 0 1 D",
                "1950 1950 6 30 7 0 0 0 S",
                "1996 2000 3 1 0 2 0 1 D",
                "1996 2000 9 0 8 2 0 0 S",
                "2001 2001 4 1 0 2 0 1 D",
                "2001 2001 8 0 8 2 0 0 S",
                "2002 9999 3 1 0 2 0 1 D",
                "2002 9999 9 0 8 2 0 0 S"
            ],
            "Moncton": [
                "1933 1935 5 8 0 1 0 1 D",
                "1933 1935 8 8 0 1 0 0 S",
                "1936 1938 5 1 0 1 0 1 D",
                "1936 1938 8 1 0 1 0 0 S",
                "1939 1939 4 27 7 1 0 1 D",
                "1939 1941 8 21 6 1 0 0 S",
                "1940 1940 4 19 7 1 0 1 D",
                "1941 1941 4 4 7 1 0 1 D",
                "1946 1972 3 0 8 2 0 1 D",
                "1946 1956 8 0 8 2 0 0 S",
                "1957 1972 9 0 8 2 0 0 S",
                "1993 2006 3 1 0 0:1 0 1 D",
                "1993 2006 9 0 8 0:1 0 0 S"
            ],
            "Mongol": [
                "1983 1984 3 1 7 0 0 1 S",
                "1983 1983 9 1 7 0 0 0",
                "1985 1998 2 0 8 0 0 1 S",
                "1984 1998 8 0 8 0 0 0",
                "2001 2001 3 6 8 2 0 1 S",
                "2001 2006 8 6 8 2 0 0",
                "2002 2006 2 6 8 2 0 1 S"
            ],
            "Mont": [
                "1917 1917 2 25 7 2 0 1 D",
                "1917 1917 3 24 7 0 0 0 S",
                "1919 1919 2 31 7 2:30 0 1 D",
                "1919 1919 9 25 7 2:30 0 0 S",
                "1920 1920 4 2 7 2:30 0 1 D",
                "1920 1922 9 1 0 2:30 0 0 S",
                "1921 1921 4 1 7 2 0 1 D",
                "1922 1922 3 30 7 2 0 1 D",
                "1924 1924 4 17 7 2 0 1 D",
                "1924 1926 8 0 8 2:30 0 0 S",
                "1925 1926 4 1 0 2 0 1 D",
                "1927 1927 4 1 7 0 0 1 D",
                "1927 1932 8 0 8 0 0 0 S",
                "1928 1931 3 0 8 0 0 1 D",
                "1932 1932 4 1 7 0 0 1 D",
                "1933 1940 3 0 8 0 0 1 D",
                "1933 1933 9 1 7 0 0 0 S",
                "1934 1939 8 0 8 0 0 0 S",
                "1946 1973 3 0 8 2 0 1 D",
                "1945 1948 8 0 8 2 0 0 S",
                "1949 1950 9 0 8 2 0 0 S",
                "1951 1956 8 0 8 2 0 0 S",
                "1957 1973 9 0 8 2 0 0 S"
            ],
            "Morocco": [
                "1939 1939 8 12 7 0 0 1 S",
                "1939 1939 10 19 7 0 0 0",
                "1940 1940 1 25 7 0 0 1 S",
                "1945 1945 10 18 7 0 0 0",
                "1950 1950 5 11 7 0 0 1 S",
                "1950 1950 9 29 7 0 0 0",
                "1967 1967 5 3 7 12 0 1 S",
                "1967 1967 9 1 7 0 0 0",
                "1974 1974 5 24 7 0 0 1 S",
                "1974 1974 8 1 7 0 0 0",
                "1976 1977 4 1 7 0 0 1 S",
                "1976 1976 7 1 7 0 0 0",
                "1977 1977 8 28 7 0 0 0",
                "1978 1978 5 1 7 0 0 1 S",
                "1978 1978 7 4 7 0 0 0",
                "2008 2008 5 1 7 0 0 1 S",
                "2008 2008 8 1 7 0 0 0",
                "2009 2009 5 1 7 0 0 1 S",
                "2009 2009 7 21 7 0 0 0",
                "2010 2010 4 2 7 0 0 1 S",
                "2010 2010 7 8 7 0 0 0",
                "2011 2011 3 3 7 0 0 1 S",
                "2011 2011 6 31 7 0 0 0",
                "2012 2019 3 0 8 2 0 1 S",
                "2012 9999 8 0 8 3 0 0",
                "2012 2012 6 20 7 3 0 0",
                "2012 2012 7 20 7 2 0 1 S",
                "2013 2013 6 9 7 3 0 0",
                "2013 2013 7 8 7 2 0 1 S",
                "2014 2014 5 29 7 3 0 0",
                "2014 2014 6 29 7 2 0 1 S",
                "2015 2015 5 18 7 3 0 0",
                "2015 2015 6 18 7 2 0 1 S",
                "2016 2016 5 7 7 3 0 0",
                "2016 2016 6 7 7 2 0 1 S",
                "2017 2017 4 27 7 3 0 0",
                "2017 2017 5 26 7 2 0 1 S",
                "2018 2018 4 16 7 3 0 0",
                "2018 2018 5 15 7 2 0 1 S",
                "2019 2019 4 6 7 3 0 0",
                "2019 2019 5 5 7 2 0 1 S",
                "2020 2020 4 24 7 2 0 1 S",
                "2021 2021 4 13 7 2 0 1 S",
                "2022 2022 4 3 7 2 0 1 S",
                "2023 9999 3 0 8 2 0 1 S"
            ],
            "NBorneo": [
                "1935 1941 8 14 7 0 0 0:20 TS",
                "1935 1941 11 14 7 0 0 0"
            ],
            "NC": [
                "1977 1978 11 1 0 0 0 1 S",
                "1978 1979 1 27 7 0 0 0",
                "1996 1996 11 1 7 2 2 1 S",
                "1997 1997 2 2 7 2 2 0"
            ],
            "NT_YK": [
                "1918 1918 3 14 7 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1919 1919 4 25 7 2 0 1 D",
                "1919 1919 10 1 7 0 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 30 7 2 0 0 S",
                "1965 1965 3 0 8 0 0 2 DD",
                "1965 1965 9 0 8 2 0 0 S",
                "1980 1986 3 0 8 2 0 1 D",
                "1980 2006 9 0 8 2 0 0 S",
                "1987 2006 3 1 0 2 0 1 D"
            ],
            "NYC": [
                "1920 1920 2 0 8 2 0 1 D",
                "1920 1920 9 0 8 2 0 0 S",
                "1921 1966 3 0 8 2 0 1 D",
                "1921 1954 8 0 8 2 0 0 S",
                "1955 1966 9 0 8 2 0 0 S"
            ],
            "NZ": [
                "1927 1927 10 6 7 2 0 1 S",
                "1928 1928 2 4 7 2 0 0 M",
                "1928 1933 9 8 0 2 0 0:30 S",
                "1929 1933 2 15 0 2 0 0 M",
                "1934 1940 3 0 8 2 0 0 M",
                "1934 1940 8 0 8 2 0 0:30 S",
                "1946 1946 0 1 7 0 0 0 S",
                "1974 1974 10 1 0 2 2 1 D",
                "1975 1975 1 0 8 2 2 0 S",
                "1975 1988 9 0 8 2 2 1 D",
                "1976 1989 2 1 0 2 2 0 S",
                "1989 1989 9 8 0 2 2 1 D",
                "1990 2006 9 1 0 2 2 1 D",
                "1990 2007 2 15 0 2 2 0 S",
                "2007 9999 8 0 8 2 2 1 D",
                "2008 9999 3 1 0 2 2 0 S"
            ],
            "NZAQ": [
                "1974 1974 10 3 7 2 2 1 D",
                "1975 1988 9 0 8 2 2 1 D",
                "1989 1989 9 8 7 2 2 1 D",
                "1990 2006 9 1 0 2 2 1 D",
                "1975 1975 1 23 7 2 2 0 S",
                "1976 1989 2 1 0 2 2 0 S",
                "1990 2007 2 15 0 2 2 0 S",
                "2007 9999 8 0 8 2 2 1 D",
                "2008 9999 3 1 0 2 2 0 S"
            ],
            "Namibia": [
                "1994 9999 8 1 0 2 0 1 S",
                "1995 9999 3 1 0 2 0 0"
            ],
            "Neth": [
                "1916 1916 4 1 7 0 0 1 NST",
                "1916 1916 9 1 7 0 0 0 AMT",
                "1917 1917 3 16 7 2 2 1 NST",
                "1917 1917 8 17 7 2 2 0 AMT",
                "1918 1921 3 1 1 2 2 1 NST",
                "1918 1921 8 1 8 2 2 0 AMT",
                "1922 1922 2 0 8 2 2 1 NST",
                "1922 1936 9 2 0 2 2 0 AMT",
                "1923 1923 5 1 5 2 2 1 NST",
                "1924 1924 2 0 8 2 2 1 NST",
                "1925 1925 5 1 5 2 2 1 NST",
                "1926 1931 4 15 7 2 2 1 NST",
                "1932 1932 4 22 7 2 2 1 NST",
                "1933 1936 4 15 7 2 2 1 NST",
                "1937 1937 4 22 7 2 2 1 NST",
                "1937 1937 6 1 7 0 0 1 S",
                "1937 1939 9 2 0 2 2 0",
                "1938 1939 4 15 7 2 2 1 S",
                "1945 1945 3 2 7 2 2 1 S",
                "1945 1945 8 16 7 2 2 0"
            ],
            "Nic": [
                "1979 1980 2 16 0 0 0 1 D",
                "1979 1980 5 23 1 0 0 0 S",
                "2005 2005 3 10 7 0 0 1 D",
                "2005 2005 9 1 0 0 0 0 S",
                "2006 2006 3 30 7 2 0 1 D",
                "2006 2006 9 1 0 1 0 0 S"
            ],
            "Norway": [
                "1916 1916 4 22 7 1 0 1 S",
                "1916 1916 8 30 7 0 0 0",
                "1945 1945 3 2 7 2 2 1 S",
                "1945 1945 9 1 7 2 2 0",
                "1959 1964 2 15 0 2 2 1 S",
                "1959 1965 8 15 0 2 2 0",
                "1965 1965 3 25 7 2 2 1 S"
            ],
            "PRC": [
                "1986 1986 4 4 7 0 0 1 D",
                "1986 1991 8 11 0 0 0 0 S",
                "1987 1991 3 10 0 0 0 1 D"
            ],
            "Pakistan": [
                "2002 2002 3 2 0 0:1 0 1 S",
                "2002 2002 9 2 0 0:1 0 0",
                "2008 2008 5 1 7 0 0 1 S",
                "2008 2008 10 1 7 0 0 0",
                "2009 2009 3 15 7 0 0 1 S",
                "2009 2009 10 1 7 0 0 0"
            ],
            "Palestine": [
                "1999 2005 3 15 5 0 0 1 S",
                "1999 2003 9 15 5 0 0 0",
                "2004 2004 9 1 7 1 0 0",
                "2005 2005 9 4 7 2 0 0",
                "2006 2007 3 1 7 0 0 1 S",
                "2006 2006 8 22 7 0 0 0",
                "2007 2007 8 8 4 2 0 0",
                "2008 2009 2 5 8 0 0 1 S",
                "2008 2008 8 1 7 0 0 0",
                "2009 2009 8 1 5 1 0 0",
                "2010 2010 2 26 7 0 0 1 S",
                "2010 2010 7 11 7 0 0 0",
                "2011 2011 3 1 7 0:1 0 1 S",
                "2011 2011 7 1 7 0 0 0",
                "2011 2011 7 30 7 0 0 1 S",
                "2011 2011 8 30 7 0 0 0",
                "2012 9999 2 4 8 24 0 1 S",
                "2012 9999 8 21 5 1 0 0"
            ],
            "Para": [
                "1975 1988 9 1 7 0 0 1 S",
                "1975 1978 2 1 7 0 0 0",
                "1979 1991 3 1 7 0 0 0",
                "1989 1989 9 22 7 0 0 1 S",
                "1990 1990 9 1 7 0 0 1 S",
                "1991 1991 9 6 7 0 0 1 S",
                "1992 1992 2 1 7 0 0 0",
                "1992 1992 9 5 7 0 0 1 S",
                "1993 1993 2 31 7 0 0 0",
                "1993 1995 9 1 7 0 0 1 S",
                "1994 1995 1 0 8 0 0 0",
                "1996 1996 2 1 7 0 0 0",
                "1996 2001 9 1 0 0 0 1 S",
                "1997 1997 1 0 8 0 0 0",
                "1998 2001 2 1 0 0 0 0",
                "2002 2004 3 1 0 0 0 0",
                "2002 2003 8 1 0 0 0 1 S",
                "2004 2009 9 15 0 0 0 1 S",
                "2005 2009 2 8 0 0 0 0",
                "2010 9999 9 1 0 0 0 1 S",
                "2010 2012 3 8 0 0 0 0",
                "2013 9999 2 22 0 0 0 0"
            ],
            "Perry": [
                "1946 1946 3 0 8 2 0 1 D",
                "1946 1946 8 0 8 2 0 0 S",
                "1953 1954 3 0 8 2 0 1 D",
                "1953 1959 8 0 8 2 0 0 S",
                "1955 1955 4 1 7 0 0 1 D",
                "1956 1963 3 0 8 2 0 1 D",
                "1960 1960 9 0 8 2 0 0 S",
                "1961 1961 8 0 8 2 0 0 S",
                "1962 1963 9 0 8 2 0 0 S"
            ],
            "Peru": [
                "1938 1938 0 1 7 0 0 1 S",
                "1938 1938 3 1 7 0 0 0",
                "1938 1939 8 0 8 0 0 1 S",
                "1939 1940 2 24 0 0 0 0",
                "1986 1987 0 1 7 0 0 1 S",
                "1986 1987 3 1 7 0 0 0",
                "1990 1990 0 1 7 0 0 1 S",
                "1990 1990 3 1 7 0 0 0",
                "1994 1994 0 1 7 0 0 1 S",
                "1994 1994 3 1 7 0 0 0"
            ],
            "Phil": [
                "1936 1936 10 1 7 0 0 1 S",
                "1937 1937 1 1 7 0 0 0",
                "1954 1954 3 12 7 0 0 1 S",
                "1954 1954 6 1 7 0 0 0",
                "1978 1978 2 22 7 0 0 1 S",
                "1978 1978 8 21 7 0 0 0"
            ],
            "Pike": [
                "1955 1955 4 1 7 0 0 1 D",
                "1955 1960 8 0 8 2 0 0 S",
                "1956 1964 3 0 8 2 0 1 D",
                "1961 1964 9 0 8 2 0 0 S"
            ],
            "Poland": [
                "1918 1919 8 16 7 2 2 0",
                "1919 1919 3 15 7 2 2 1 S",
                "1944 1944 3 3 7 2 2 1 S",
                "1944 1944 9 4 7 2 0 0",
                "1945 1945 3 29 7 0 0 1 S",
                "1945 1945 10 1 7 0 0 0",
                "1946 1946 3 14 7 0 2 1 S",
                "1946 1946 9 7 7 2 2 0",
                "1947 1947 4 4 7 2 2 1 S",
                "1947 1949 9 1 0 2 2 0",
                "1948 1948 3 18 7 2 2 1 S",
                "1949 1949 3 10 7 2 2 1 S",
                "1957 1957 5 2 7 1 2 1 S",
                "1957 1958 8 0 8 1 2 0",
                "1958 1958 2 30 7 1 2 1 S",
                "1959 1959 4 31 7 1 2 1 S",
                "1959 1961 9 1 0 1 2 0",
                "1960 1960 3 3 7 1 2 1 S",
                "1961 1964 4 0 8 1 2 1 S",
                "1962 1964 8 0 8 1 2 0"
            ],
            "Port": [
                "1916 1916 5 17 7 23 0 1 S",
                "1916 1916 10 1 7 1 0 0",
                "1917 1917 1 28 7 23 2 1 S",
                "1917 1921 9 14 7 23 2 0",
                "1918 1918 2 1 7 23 2 1 S",
                "1919 1919 1 28 7 23 2 1 S",
                "1920 1920 1 29 7 23 2 1 S",
                "1921 1921 1 28 7 23 2 1 S",
                "1924 1924 3 16 7 23 2 1 S",
                "1924 1924 9 14 7 23 2 0",
                "1926 1926 3 17 7 23 2 1 S",
                "1926 1929 9 1 6 23 2 0",
                "1927 1927 3 9 7 23 2 1 S",
                "1928 1928 3 14 7 23 2 1 S",
                "1929 1929 3 20 7 23 2 1 S",
                "1931 1931 3 18 7 23 2 1 S",
                "1931 1932 9 1 6 23 2 0",
                "1932 1932 3 2 7 23 2 1 S",
                "1934 1934 3 7 7 23 2 1 S",
                "1934 1938 9 1 6 23 2 0",
                "1935 1935 2 30 7 23 2 1 S",
                "1936 1936 3 18 7 23 2 1 S",
                "1937 1937 3 3 7 23 2 1 S",
                "1938 1938 2 26 7 23 2 1 S",
                "1939 1939 3 15 7 23 2 1 S",
                "1939 1939 10 18 7 23 2 0",
                "1940 1940 1 24 7 23 2 1 S",
                "1940 1941 9 5 7 23 2 0",
                "1941 1941 3 5 7 23 2 1 S",
                "1942 1945 2 8 6 23 2 1 S",
                "1942 1942 3 25 7 22 2 2 M",
                "1942 1942 7 15 7 22 2 1 S",
                "1942 1945 9 24 6 23 2 0",
                "1943 1943 3 17 7 22 2 2 M",
                "1943 1945 7 25 6 22 2 1 S",
                "1944 1945 3 21 6 22 2 2 M",
                "1946 1946 3 1 6 23 2 1 S",
                "1946 1946 9 1 6 23 2 0",
                "1947 1949 3 1 0 2 2 1 S",
                "1947 1949 9 1 0 2 2 0",
                "1951 1965 3 1 0 2 2 1 S",
                "1951 1965 9 1 0 2 2 0",
                "1977 1977 2 27 7 0 2 1 S",
                "1977 1977 8 25 7 0 2 0",
                "1978 1979 3 1 0 0 2 1 S",
                "1978 1978 9 1 7 0 2 0",
                "1979 1982 8 0 8 1 2 0",
                "1980 1980 2 0 8 0 2 1 S",
                "1981 1982 2 0 8 1 2 1 S",
                "1983 1983 2 0 8 2 2 1 S"
            ],
            "Pulaski": [
                "1946 1960 3 0 8 2 0 1 D",
                "1946 1954 8 0 8 2 0 0 S",
                "1955 1956 9 0 8 2 0 0 S",
                "1957 1960 8 0 8 2 0 0 S"
            ],
            "ROK": [
                "1960 1960 4 15 7 0 0 1 D",
                "1960 1960 8 13 7 0 0 0 S",
                "1987 1988 4 8 0 0 0 1 D",
                "1987 1988 9 8 0 0 0 0 S"
            ],
            "Regina": [
                "1918 1918 3 14 7 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1930 1934 4 1 0 0 0 1 D",
                "1930 1934 9 1 0 0 0 0 S",
                "1937 1941 3 8 0 0 0 1 D",
                "1937 1937 9 8 0 0 0 0 S",
                "1938 1938 9 1 0 0 0 0 S",
                "1939 1941 9 8 0 0 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 0 8 2 0 0 S",
                "1946 1946 3 8 0 2 0 1 D",
                "1946 1946 9 8 0 2 0 0 S",
                "1947 1957 3 0 8 2 0 1 D",
                "1947 1957 8 0 8 2 0 0 S",
                "1959 1959 3 0 8 2 0 1 D",
                "1959 1959 9 0 8 2 0 0 S"
            ],
            "Romania": [
                "1932 1932 4 21 7 0 2 1 S",
                "1932 1939 9 1 0 0 2 0",
                "1933 1939 3 2 0 0 2 1 S",
                "1979 1979 4 27 7 0 0 1 S",
                "1979 1979 8 0 8 0 0 0",
                "1980 1980 3 5 7 23 0 1 S",
                "1980 1980 8 0 8 1 0 0",
                "1991 1993 2 0 8 0 2 1 S",
                "1991 1993 8 0 8 0 2 0"
            ],
            "Russia": [
                "1917 1917 6 1 7 23 0 1 MST",
                "1917 1917 11 28 7 0 0 0 MMT",
                "1918 1918 4 31 7 22 0 2 MDST",
                "1918 1918 8 16 7 1 0 1 MST",
                "1919 1919 4 31 7 23 0 2 MDST",
                "1919 1919 6 1 7 2 0 1 S",
                "1919 1919 7 16 7 0 0 0",
                "1921 1921 1 14 7 23 0 1 S",
                "1921 1921 2 20 7 23 0 2 M",
                "1921 1921 8 1 7 0 0 1 S",
                "1921 1921 9 1 7 0 0 0",
                "1981 1984 3 1 7 0 0 1 S",
                "1981 1983 9 1 7 0 0 0",
                "1984 1991 8 0 8 2 2 0",
                "1985 1991 2 0 8 2 2 1 S",
                "1992 1992 2 6 8 23 0 1 S",
                "1992 1992 8 6 8 23 0 0",
                "1993 2010 2 0 8 2 2 1 S",
                "1993 1995 8 0 8 2 2 0",
                "1996 2010 9 0 8 2 2 0"
            ],
            "RussiaAsia": [
                "1981 1984 3 1 7 0 0 1 S",
                "1981 1983 9 1 7 0 0 0",
                "1984 1991 8 0 8 2 2 0",
                "1985 1991 2 0 8 2 2 1 S",
                "1992 1992 2 6 8 23 0 1 S",
                "1992 1992 8 6 8 23 0 0",
                "1993 9999 2 0 8 2 2 1 S",
                "1993 1995 8 0 8 2 2 0",
                "1996 9999 9 0 8 2 2 0"
            ],
            "SA": [
                "1942 1943 8 15 0 2 0 1",
                "1943 1944 2 15 0 2 0 0"
            ],
            "SL": [
                "1935 1942 5 1 7 0 0 0:40 SLST",
                "1935 1942 9 1 7 0 0 0 WAT",
                "1957 1962 5 1 7 0 0 1 SLST",
                "1957 1962 8 1 7 0 0 0 GMT"
            ],
            "Salv": [
                "1987 1988 4 1 0 0 0 1 D",
                "1987 1988 8 0 8 0 0 0 S"
            ],
            "SanLuis": [
                "2008 2009 2 8 0 0 0 0",
                "2007 2009 9 8 0 0 0 1 S"
            ],
            "Shang": [
                "1940 1940 5 3 7 0 0 1 D",
                "1940 1941 9 1 7 0 0 0 S",
                "1941 1941 2 16 7 0 0 1 D"
            ],
            "SovietZone": [
                "1945 1945 4 24 7 2 0 2 M",
                "1945 1945 8 24 7 3 0 1 S",
                "1945 1945 10 18 7 2 2 0"
            ],
            "Spain": [
                "1917 1917 4 5 7 23 2 1 S",
                "1917 1919 9 6 7 23 2 0",
                "1918 1918 3 15 7 23 2 1 S",
                "1919 1919 3 5 7 23 2 1 S",
                "1924 1924 3 16 7 23 2 1 S",
                "1924 1924 9 4 7 23 2 0",
                "1926 1926 3 17 7 23 2 1 S",
                "1926 1929 9 1 6 23 2 0",
                "1927 1927 3 9 7 23 2 1 S",
                "1928 1928 3 14 7 23 2 1 S",
                "1929 1929 3 20 7 23 2 1 S",
                "1937 1937 4 22 7 23 2 1 S",
                "1937 1939 9 1 6 23 2 0",
                "1938 1938 2 22 7 23 2 1 S",
                "1939 1939 3 15 7 23 2 1 S",
                "1940 1940 2 16 7 23 2 1 S",
                "1942 1942 4 2 7 22 2 2 M",
                "1942 1942 8 1 7 22 2 1 S",
                "1943 1946 3 13 6 22 2 2 M",
                "1943 1943 9 3 7 22 2 1 S",
                "1944 1944 9 10 7 22 2 1 S",
                "1945 1945 8 30 7 1 0 1 S",
                "1946 1946 8 30 7 0 0 0",
                "1949 1949 3 30 7 23 0 1 S",
                "1949 1949 8 30 7 1 0 0",
                "1974 1975 3 13 6 23 0 1 S",
                "1974 1975 9 1 0 1 0 0",
                "1976 1976 2 27 7 23 0 1 S",
                "1976 1977 8 0 8 1 0 0",
                "1977 1978 3 2 7 23 0 1 S",
                "1978 1978 9 1 7 1 0 0"
            ],
            "SpainAfrica": [
                "1967 1967 5 3 7 12 0 1 S",
                "1967 1967 9 1 7 0 0 0",
                "1974 1974 5 24 7 0 0 1 S",
                "1974 1974 8 1 7 0 0 0",
                "1976 1977 4 1 7 0 0 1 S",
                "1976 1976 7 1 7 0 0 0",
                "1977 1977 8 28 7 0 0 0",
                "1978 1978 5 1 7 0 0 1 S",
                "1978 1978 7 4 7 0 0 0"
            ],
            "StJohns": [
                "1917 1917 3 8 7 2 0 1 D",
                "1917 1917 8 17 7 2 0 0 S",
                "1919 1919 4 5 7 23 0 1 D",
                "1919 1919 7 12 7 23 0 0 S",
                "1920 1935 4 1 0 23 0 1 D",
                "1920 1935 9 0 8 23 0 0 S",
                "1936 1941 4 9 1 0 0 1 D",
                "1936 1941 9 2 1 0 0 0 S",
                "1946 1950 4 8 0 2 0 1 D",
                "1946 1950 9 2 0 2 0 0 S",
                "1951 1986 3 0 8 2 0 1 D",
                "1951 1959 8 0 8 2 0 0 S",
                "1960 1986 9 0 8 2 0 0 S",
                "1987 1987 3 1 0 0:1 0 1 D",
                "1987 2006 9 0 8 0:1 0 0 S",
                "1988 1988 3 1 0 0:1 0 2 DD",
                "1989 2006 3 1 0 0:1 0 1 D",
                "2007 2011 2 8 0 0:1 0 1 D",
                "2007 2010 10 1 0 0:1 0 0 S"
            ],
            "Starke": [
                "1947 1961 3 0 8 2 0 1 D",
                "1947 1954 8 0 8 2 0 0 S",
                "1955 1956 9 0 8 2 0 0 S",
                "1957 1958 8 0 8 2 0 0 S",
                "1959 1961 9 0 8 2 0 0 S"
            ],
            "Sudan": [
                "1970 1970 4 1 7 0 0 1 S",
                "1970 1985 9 15 7 0 0 0",
                "1971 1971 3 30 7 0 0 1 S",
                "1972 1985 3 0 8 0 0 1 S"
            ],
            "Swift": [
                "1957 1957 3 0 8 2 0 1 D",
                "1957 1957 9 0 8 2 0 0 S",
                "1959 1961 3 0 8 2 0 1 D",
                "1959 1959 9 0 8 2 0 0 S",
                "1960 1961 8 0 8 2 0 0 S"
            ],
            "Swiss": [
                "1941 1942 4 1 1 1 0 1 S",
                "1941 1942 9 1 1 2 0 0"
            ],
            "Syria": [
                "1920 1923 3 15 0 2 0 1 S",
                "1920 1923 9 1 0 2 0 0",
                "1962 1962 3 29 7 2 0 1 S",
                "1962 1962 9 1 7 2 0 0",
                "1963 1965 4 1 7 2 0 1 S",
                "1963 1963 8 30 7 2 0 0",
                "1964 1964 9 1 7 2 0 0",
                "1965 1965 8 30 7 2 0 0",
                "1966 1966 3 24 7 2 0 1 S",
                "1966 1976 9 1 7 2 0 0",
                "1967 1978 4 1 7 2 0 1 S",
                "1977 1978 8 1 7 2 0 0",
                "1983 1984 3 9 7 2 0 1 S",
                "1983 1984 9 1 7 2 0 0",
                "1986 1986 1 16 7 2 0 1 S",
                "1986 1986 9 9 7 2 0 0",
                "1987 1987 2 1 7 2 0 1 S",
                "1987 1988 9 31 7 2 0 0",
                "1988 1988 2 15 7 2 0 1 S",
                "1989 1989 2 31 7 2 0 1 S",
                "1989 1989 9 1 7 2 0 0",
                "1990 1990 3 1 7 2 0 1 S",
                "1990 1990 8 30 7 2 0 0",
                "1991 1991 3 1 7 0 0 1 S",
                "1991 1992 9 1 7 0 0 0",
                "1992 1992 3 8 7 0 0 1 S",
                "1993 1993 2 26 7 0 0 1 S",
                "1993 1993 8 25 7 0 0 0",
                "1994 1996 3 1 7 0 0 1 S",
                "1994 2005 9 1 7 0 0 0",
                "1997 1998 2 1 8 0 0 1 S",
                "1999 2006 3 1 7 0 0 1 S",
                "2006 2006 8 22 7 0 0 0",
                "2007 2007 2 5 8 0 0 1 S",
                "2007 2007 10 1 5 0 0 0",
                "2008 2008 3 1 5 0 0 1 S",
                "2008 2008 10 1 7 0 0 0",
                "2009 2009 2 5 8 0 0 1 S",
                "2010 2011 3 1 5 0 0 1 S",
                "2012 9999 2 5 8 0 0 1 S",
                "2009 9999 9 5 8 0 0 0"
            ],
            "TC": [
                "1979 1986 3 0 8 2 0 1 D",
                "1979 2006 9 0 8 2 0 0 S",
                "1987 2006 3 1 0 2 0 1 D",
                "2007 9999 2 8 0 2 0 1 D",
                "2007 9999 10 1 0 2 0 0 S"
            ],
            "Taiwan": [
                "1945 1951 4 1 7 0 0 1 D",
                "1945 1951 9 1 7 0 0 0 S",
                "1952 1952 2 1 7 0 0 1 D",
                "1952 1954 10 1 7 0 0 0 S",
                "1953 1959 3 1 7 0 0 1 D",
                "1955 1961 9 1 7 0 0 0 S",
                "1960 1961 5 1 7 0 0 1 D",
                "1974 1975 3 1 7 0 0 1 D",
                "1974 1975 9 1 7 0 0 0 S",
                "1979 1979 5 30 7 0 0 1 D",
                "1979 1979 8 30 7 0 0 0 S"
            ],
            "Thule": [
                "1991 1992 2 0 8 2 0 1 D",
                "1991 1992 8 0 8 2 0 0 S",
                "1993 2006 3 1 0 2 0 1 D",
                "1993 2006 9 0 8 2 0 0 S",
                "2007 9999 2 8 0 2 0 1 D",
                "2007 9999 10 1 0 2 0 0 S"
            ],
            "Tonga": [
                "1999 1999 9 7 7 2 2 1 S",
                "2000 2000 2 19 7 2 2 0",
                "2000 2001 10 1 0 2 0 1 S",
                "2001 2002 0 0 8 2 0 0"
            ],
            "Toronto": [
                "1919 1919 2 30 7 23:30 0 1 D",
                "1919 1919 9 26 7 0 0 0 S",
                "1920 1920 4 2 7 2 0 1 D",
                "1920 1920 8 26 7 0 0 0 S",
                "1921 1921 4 15 7 2 0 1 D",
                "1921 1921 8 15 7 2 0 0 S",
                "1922 1923 4 8 0 2 0 1 D",
                "1922 1926 8 15 0 2 0 0 S",
                "1924 1927 4 1 0 2 0 1 D",
                "1927 1932 8 0 8 2 0 0 S",
                "1928 1931 3 0 8 2 0 1 D",
                "1932 1932 4 1 7 2 0 1 D",
                "1933 1940 3 0 8 2 0 1 D",
                "1933 1933 9 1 7 2 0 0 S",
                "1934 1939 8 0 8 2 0 0 S",
                "1945 1946 8 0 8 2 0 0 S",
                "1946 1946 3 0 8 2 0 1 D",
                "1947 1949 3 0 8 0 0 1 D",
                "1947 1948 8 0 8 0 0 0 S",
                "1949 1949 10 0 8 0 0 0 S",
                "1950 1973 3 0 8 2 0 1 D",
                "1950 1950 10 0 8 2 0 0 S",
                "1951 1956 8 0 8 2 0 0 S",
                "1957 1973 9 0 8 2 0 0 S"
            ],
            "Tunisia": [
                "1939 1939 3 15 7 23 2 1 S",
                "1939 1939 10 18 7 23 2 0",
                "1940 1940 1 25 7 23 2 1 S",
                "1941 1941 9 6 7 0 0 0",
                "1942 1942 2 9 7 0 0 1 S",
                "1942 1942 10 2 7 3 0 0",
                "1943 1943 2 29 7 2 0 1 S",
                "1943 1943 3 17 7 2 0 0",
                "1943 1943 3 25 7 2 0 1 S",
                "1943 1943 9 4 7 2 0 0",
                "1944 1945 3 1 1 2 0 1 S",
                "1944 1944 9 8 7 0 0 0",
                "1945 1945 8 16 7 0 0 0",
                "1977 1977 3 30 7 0 2 1 S",
                "1977 1977 8 24 7 0 2 0",
                "1978 1978 4 1 7 0 2 1 S",
                "1978 1978 9 1 7 0 2 0",
                "1988 1988 5 1 7 0 2 1 S",
                "1988 1990 8 0 8 0 2 0",
                "1989 1989 2 26 7 0 2 1 S",
                "1990 1990 4 1 7 0 2 1 S",
                "2005 2005 4 1 7 0 2 1 S",
                "2005 2005 8 30 7 1 2 0",
                "2006 2008 2 0 8 2 2 1 S",
                "2006 2008 9 0 8 2 2 0"
            ],
            "Turkey": [
                "1916 1916 4 1 7 0 0 1 S",
                "1916 1916 9 1 7 0 0 0",
                "1920 1920 2 28 7 0 0 1 S",
                "1920 1920 9 25 7 0 0 0",
                "1921 1921 3 3 7 0 0 1 S",
                "1921 1921 9 3 7 0 0 0",
                "1922 1922 2 26 7 0 0 1 S",
                "1922 1922 9 8 7 0 0 0",
                "1924 1924 4 13 7 0 0 1 S",
                "1924 1925 9 1 7 0 0 0",
                "1925 1925 4 1 7 0 0 1 S",
                "1940 1940 5 30 7 0 0 1 S",
                "1940 1940 9 5 7 0 0 0",
                "1940 1940 11 1 7 0 0 1 S",
                "1941 1941 8 21 7 0 0 0",
                "1942 1942 3 1 7 0 0 1 S",
                "1942 1942 10 1 7 0 0 0",
                "1945 1945 3 2 7 0 0 1 S",
                "1945 1945 9 8 7 0 0 0",
                "1946 1946 5 1 7 0 0 1 S",
                "1946 1946 9 1 7 0 0 0",
                "1947 1948 3 16 0 0 0 1 S",
                "1947 1950 9 2 0 0 0 0",
                "1949 1949 3 10 7 0 0 1 S",
                "1950 1950 3 19 7 0 0 1 S",
                "1951 1951 3 22 7 0 0 1 S",
                "1951 1951 9 8 7 0 0 0",
                "1962 1962 6 15 7 0 0 1 S",
                "1962 1962 9 8 7 0 0 0",
                "1964 1964 4 15 7 0 0 1 S",
                "1964 1964 9 1 7 0 0 0",
                "1970 1972 4 2 0 0 0 1 S",
                "1970 1972 9 2 0 0 0 0",
                "1973 1973 5 3 7 1 0 1 S",
                "1973 1973 10 4 7 3 0 0",
                "1974 1974 2 31 7 2 0 1 S",
                "1974 1974 10 3 7 5 0 0",
                "1975 1975 2 30 7 0 0 1 S",
                "1975 1976 9 0 8 0 0 0",
                "1976 1976 5 1 7 0 0 1 S",
                "1977 1978 3 1 0 0 0 1 S",
                "1977 1977 9 16 7 0 0 0",
                "1979 1980 3 1 0 3 0 1 S",
                "1979 1982 9 11 1 0 0 0",
                "1981 1982 2 0 8 3 0 1 S",
                "1983 1983 6 31 7 0 0 1 S",
                "1983 1983 9 2 7 0 0 0",
                "1985 1985 3 20 7 0 0 1 S",
                "1985 1985 8 28 7 0 0 0",
                "1986 1990 2 0 8 2 2 1 S",
                "1986 1990 8 0 8 2 2 0",
                "1991 2006 2 0 8 1 2 1 S",
                "1991 1995 8 0 8 1 2 0",
                "1996 2006 9 0 8 1 2 0"
            ],
            "US": [
                "1918 1919 2 0 8 2 0 1 D",
                "1918 1919 9 0 8 2 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 30 7 2 0 0 S",
                "1967 2006 9 0 8 2 0 0 S",
                "1967 1973 3 0 8 2 0 1 D",
                "1974 1974 0 6 7 2 0 1 D",
                "1975 1975 1 23 7 2 0 1 D",
                "1976 1986 3 0 8 2 0 1 D",
                "1987 2006 3 1 0 2 0 1 D",
                "2007 9999 2 8 0 2 0 1 D",
                "2007 9999 10 1 0 2 0 0 S"
            ],
            "Uruguay": [
                "1923 1923 9 2 7 0 0 0:30 HS",
                "1924 1926 3 1 7 0 0 0",
                "1924 1925 9 1 7 0 0 0:30 HS",
                "1933 1935 9 0 8 0 0 0:30 HS",
                "1934 1936 2 25 6 23:30 2 0",
                "1936 1936 10 1 7 0 0 0:30 HS",
                "1937 1941 2 0 8 0 0 0",
                "1937 1940 9 0 8 0 0 0:30 HS",
                "1941 1941 7 1 7 0 0 0:30 HS",
                "1942 1942 0 1 7 0 0 0",
                "1942 1942 11 14 7 0 0 1 S",
                "1943 1943 2 14 7 0 0 0",
                "1959 1959 4 24 7 0 0 1 S",
                "1959 1959 10 15 7 0 0 0",
                "1960 1960 0 17 7 0 0 1 S",
                "1960 1960 2 6 7 0 0 0",
                "1965 1967 3 1 0 0 0 1 S",
                "1965 1965 8 26 7 0 0 0",
                "1966 1967 9 31 7 0 0 0",
                "1968 1970 4 27 7 0 0 0:30 HS",
                "1968 1970 11 2 7 0 0 0",
                "1972 1972 3 24 7 0 0 1 S",
                "1972 1972 7 15 7 0 0 0",
                "1974 1974 2 10 7 0 0 0:30 HS",
                "1974 1974 11 22 7 0 0 1 S",
                "1976 1976 9 1 7 0 0 0",
                "1977 1977 11 4 7 0 0 1 S",
                "1978 1978 3 1 7 0 0 0",
                "1979 1979 9 1 7 0 0 1 S",
                "1980 1980 4 1 7 0 0 0",
                "1987 1987 11 14 7 0 0 1 S",
                "1988 1988 2 14 7 0 0 0",
                "1988 1988 11 11 7 0 0 1 S",
                "1989 1989 2 12 7 0 0 0",
                "1989 1989 9 29 7 0 0 1 S",
                "1990 1992 2 1 0 0 0 0",
                "1990 1991 9 21 0 0 0 1 S",
                "1992 1992 9 18 7 0 0 1 S",
                "1993 1993 1 28 7 0 0 0",
                "2004 2004 8 19 7 0 0 1 S",
                "2005 2005 2 27 7 2 0 0",
                "2005 2005 9 9 7 2 0 1 S",
                "2006 2006 2 12 7 2 0 0",
                "2006 9999 9 1 0 2 0 1 S",
                "2007 9999 2 8 0 2 0 0"
            ],
            "Vanc": [
                "1918 1918 3 14 7 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 30 7 2 0 0 S",
                "1946 1986 3 0 8 2 0 1 D",
                "1946 1946 9 13 7 2 0 0 S",
                "1947 1961 8 0 8 2 0 0 S",
                "1962 2006 9 0 8 2 0 0 S"
            ],
            "Vanuatu": [
                "1983 1983 8 25 7 0 0 1 S",
                "1984 1991 2 23 0 0 0 0",
                "1984 1984 9 23 7 0 0 1 S",
                "1985 1991 8 23 0 0 0 1 S",
                "1992 1993 0 23 0 0 0 0",
                "1992 1992 9 23 0 0 0 1 S"
            ],
            "Vincennes": [
                "1946 1946 3 0 8 2 0 1 D",
                "1946 1946 8 0 8 2 0 0 S",
                "1953 1954 3 0 8 2 0 1 D",
                "1953 1959 8 0 8 2 0 0 S",
                "1955 1955 4 1 7 0 0 1 D",
                "1956 1963 3 0 8 2 0 1 D",
                "1960 1960 9 0 8 2 0 0 S",
                "1961 1961 8 0 8 2 0 0 S",
                "1962 1963 9 0 8 2 0 0 S"
            ],
            "W-Eur": [
                "1977 1980 3 1 0 1 2 1 S",
                "1977 1977 8 0 8 1 2 0",
                "1978 1978 9 1 7 1 2 0",
                "1979 1995 8 0 8 1 2 0",
                "1981 9999 2 0 8 1 2 1 S",
                "1996 9999 9 0 8 1 2 0"
            ],
            "WS": [
                "2012 9999 8 0 8 3 0 1 D",
                "2012 9999 3 1 0 4 0 0"
            ],
            "Winn": [
                "1916 1916 3 23 7 0 0 1 D",
                "1916 1916 8 17 7 0 0 0 S",
                "1918 1918 3 14 7 2 0 1 D",
                "1918 1918 9 27 7 2 0 0 S",
                "1937 1937 4 16 7 2 0 1 D",
                "1937 1937 8 26 7 2 0 0 S",
                "1942 1942 1 9 7 2 0 1 W",
                "1945 1945 7 14 7 23 1 1 P",
                "1945 1945 8 0 8 2 0 0 S",
                "1946 1946 4 12 7 2 0 1 D",
                "1946 1946 9 13 7 2 0 0 S",
                "1947 1949 3 0 8 2 0 1 D",
                "1947 1949 8 0 8 2 0 0 S",
                "1950 1950 4 1 7 2 0 1 D",
                "1950 1950 8 30 7 2 0 0 S",
                "1951 1960 3 0 8 2 0 1 D",
                "1951 1958 8 0 8 2 0 0 S",
                "1959 1959 9 0 8 2 0 0 S",
                "1960 1960 8 0 8 2 0 0 S",
                "1963 1963 3 0 8 2 0 1 D",
                "1963 1963 8 22 7 2 0 0 S",
                "1966 1986 3 0 8 2 2 1 D",
                "1966 2005 9 0 8 2 2 0 S",
                "1987 2005 3 1 0 2 2 1 D"
            ],
            "Zion": [
                "1940 1940 5 1 7 0 0 1 D",
                "1942 1944 10 1 7 0 0 0 S",
                "1943 1943 3 1 7 2 0 1 D",
                "1944 1944 3 1 7 0 0 1 D",
                "1945 1945 3 16 7 0 0 1 D",
                "1945 1945 10 1 7 2 0 0 S",
                "1946 1946 3 16 7 2 0 1 D",
                "1946 1946 10 1 7 0 0 0 S",
                "1948 1948 4 23 7 0 0 2 DD",
                "1948 1948 8 1 7 0 0 1 D",
                "1948 1949 10 1 7 2 0 0 S",
                "1949 1949 4 1 7 0 0 1 D",
                "1950 1950 3 16 7 0 0 1 D",
                "1950 1950 8 15 7 3 0 0 S",
                "1951 1951 3 1 7 0 0 1 D",
                "1951 1951 10 11 7 3 0 0 S",
                "1952 1952 3 20 7 2 0 1 D",
                "1952 1952 9 19 7 3 0 0 S",
                "1953 1953 3 12 7 2 0 1 D",
                "1953 1953 8 13 7 3 0 0 S",
                "1954 1954 5 13 7 0 0 1 D",
                "1954 1954 8 12 7 0 0 0 S",
                "1955 1955 5 11 7 2 0 1 D",
                "1955 1955 8 11 7 0 0 0 S",
                "1956 1956 5 3 7 0 0 1 D",
                "1956 1956 8 30 7 3 0 0 S",
                "1957 1957 3 29 7 2 0 1 D",
                "1957 1957 8 22 7 0 0 0 S",
                "1974 1974 6 7 7 0 0 1 D",
                "1974 1974 9 13 7 0 0 0 S",
                "1975 1975 3 20 7 0 0 1 D",
                "1975 1975 7 31 7 0 0 0 S",
                "1985 1985 3 14 7 0 0 1 D",
                "1985 1985 8 15 7 0 0 0 S",
                "1986 1986 4 18 7 0 0 1 D",
                "1986 1986 8 7 7 0 0 0 S",
                "1987 1987 3 15 7 0 0 1 D",
                "1987 1987 8 13 7 0 0 0 S",
                "1988 1988 3 9 7 0 0 1 D",
                "1988 1988 8 3 7 0 0 0 S",
                "1989 1989 3 30 7 0 0 1 D",
                "1989 1989 8 3 7 0 0 0 S",
                "1990 1990 2 25 7 0 0 1 D",
                "1990 1990 7 26 7 0 0 0 S",
                "1991 1991 2 24 7 0 0 1 D",
                "1991 1991 8 1 7 0 0 0 S",
                "1992 1992 2 29 7 0 0 1 D",
                "1992 1992 8 6 7 0 0 0 S",
                "1993 1993 3 2 7 0 0 1 D",
                "1993 1993 8 5 7 0 0 0 S",
                "1994 1994 3 1 7 0 0 1 D",
                "1994 1994 7 28 7 0 0 0 S",
                "1995 1995 2 31 7 0 0 1 D",
                "1995 1995 8 3 7 0 0 0 S",
                "1996 1996 2 15 7 0 0 1 D",
                "1996 1996 8 16 7 0 0 0 S",
                "1997 1997 2 21 7 0 0 1 D",
                "1997 1997 8 14 7 0 0 0 S",
                "1998 1998 2 20 7 0 0 1 D",
                "1998 1998 8 6 7 0 0 0 S",
                "1999 1999 3 2 7 2 0 1 D",
                "1999 1999 8 3 7 2 0 0 S",
                "2000 2000 3 14 7 2 0 1 D",
                "2000 2000 9 6 7 1 0 0 S",
                "2001 2001 3 9 7 1 0 1 D",
                "2001 2001 8 24 7 1 0 0 S",
                "2002 2002 2 29 7 1 0 1 D",
                "2002 2002 9 7 7 1 0 0 S",
                "2003 2003 2 28 7 1 0 1 D",
                "2003 2003 9 3 7 1 0 0 S",
                "2004 2004 3 7 7 1 0 1 D",
                "2004 2004 8 22 7 1 0 0 S",
                "2005 2005 3 1 7 2 0 1 D",
                "2005 2005 9 9 7 2 0 0 S",
                "2006 2010 2 26 5 2 0 1 D",
                "2006 2006 9 1 7 2 0 0 S",
                "2007 2007 8 16 7 2 0 0 S",
                "2008 2008 9 5 7 2 0 0 S",
                "2009 2009 8 27 7 2 0 0 S",
                "2010 2010 8 12 7 2 0 0 S",
                "2011 2011 3 1 7 2 0 1 D",
                "2011 2011 9 2 7 2 0 0 S",
                "2012 2012 2 26 5 2 0 1 D",
                "2012 2012 8 23 7 2 0 0 S",
                "2013 9999 2 23 5 2 0 1 D",
                "2013 2026 9 2 0 2 0 0 S",
                "2027 2027 9 3 1 2 0 0 S",
                "2028 9999 9 2 0 2 0 0 S"
            ]
        },
        "zones": {
            "Africa/Abidjan": [
                "-0:16:8 - LMT 1912 -0:16:8",
                "0 - GMT"
            ],
            "Africa/Accra": [
                "-0:0:52 - LMT 1918 -0:0:52",
                "0 Ghana %s"
            ],
            "Africa/Addis_Ababa": [
                "2:34:48 - LMT 1870 2:34:48",
                "2:35:20 - ADMT 1936_4_5 2:35:20",
                "3 - EAT"
            ],
            "Africa/Algiers": [
                "0:12:12 - LMT 1891_2_15_0_1 0:12:12",
                "0:9:21 - PMT 1911_2_11 0:9:21",
                "0 Algeria WE%sT 1940_1_25_2",
                "1 Algeria CE%sT 1946_9_7 1",
                "0 - WET 1956_0_29",
                "1 - CET 1963_3_14 1",
                "0 Algeria WE%sT 1977_9_21 1",
                "1 Algeria CE%sT 1979_9_26 1",
                "0 Algeria WE%sT 1981_4",
                "1 - CET"
            ],
            "Africa/Asmara": [
                "2:35:32 - LMT 1870 2:35:32",
                "2:35:32 - AMT 1890 2:35:32",
                "2:35:20 - ADMT 1936_4_5 2:35:20",
                "3 - EAT"
            ],
            "Africa/Bamako": [
                "-0:32 - LMT 1912 -0:32",
                "0 - GMT 1934_1_26",
                "-1 - WAT 1960_5_20 -1",
                "0 - GMT"
            ],
            "Africa/Bangui": [
                "1:14:20 - LMT 1912 1:14:20",
                "1 - WAT"
            ],
            "Africa/Banjul": [
                "-1:6:36 - LMT 1912 -1:6:36",
                "-1:6:36 - BMT 1935 -1:6:36",
                "-1 - WAT 1964 -1",
                "0 - GMT"
            ],
            "Africa/Bissau": [
                "-1:2:20 - LMT 1911_4_26 -1:2:20",
                "-1 - WAT 1975 -1",
                "0 - GMT"
            ],
            "Africa/Blantyre": [
                "2:20 - LMT 1903_2 2:20",
                "2 - CAT"
            ],
            "Africa/Brazzaville": [
                "1:1:8 - LMT 1912 1:1:8",
                "1 - WAT"
            ],
            "Africa/Bujumbura": [
                "1:57:28 - LMT 1890 1:57:28",
                "2 - CAT"
            ],
            "Africa/Cairo": [
                "2:5:9 - LMT 1900_9 2:5:9",
                "2 Egypt EE%sT"
            ],
            "Africa/Casablanca": [
                "-0:30:20 - LMT 1913_9_26 -0:30:20",
                "0 Morocco WE%sT 1984_2_16",
                "1 - CET 1986 1",
                "0 Morocco WE%sT"
            ],
            "Africa/Ceuta": [
                "-0:21:16 - LMT 1901 -0:21:16",
                "0 - WET 1918_4_6_23",
                "1 - WEST 1918_9_7_23 1",
                "0 - WET 1924",
                "0 Spain WE%sT 1929",
                "0 SpainAfrica WE%sT 1984_2_16",
                "1 - CET 1986 1",
                "1 EU CE%sT"
            ],
            "Africa/Conakry": [
                "-0:54:52 - LMT 1912 -0:54:52",
                "0 - GMT 1934_1_26",
                "-1 - WAT 1960 -1",
                "0 - GMT"
            ],
            "Africa/Dakar": [
                "-1:9:44 - LMT 1912 -1:9:44",
                "-1 - WAT 1941_5 -1",
                "0 - GMT"
            ],
            "Africa/Dar_es_Salaam": [
                "2:37:8 - LMT 1931 2:37:8",
                "3 - EAT 1948 3",
                "2:45 - BEAUT 1961 2:45",
                "3 - EAT"
            ],
            "Africa/Djibouti": [
                "2:52:36 - LMT 1911_6 2:52:36",
                "3 - EAT"
            ],
            "Africa/Douala": [
                "0:38:48 - LMT 1912 0:38:48",
                "1 - WAT"
            ],
            "Africa/El_Aaiun": [
                "-0:52:48 - LMT 1934_0 -0:52:48",
                "-1 - WAT 1976_3_14 -1",
                "0 - WET"
            ],
            "Africa/Freetown": [
                "-0:53 - LMT 1882 -0:53",
                "-0:53 - FMT 1913_5 -0:53",
                "-1 SL %s 1957 -1",
                "0 SL %s"
            ],
            "Africa/Gaborone": [
                "1:43:40 - LMT 1885 1:43:40",
                "1:30 - SAST 1903_2 1:30",
                "2 - CAT 1943_8_19_2 2",
                "3 - CAST 1944_2_19_2 3",
                "2 - CAT"
            ],
            "Africa/Harare": [
                "2:4:12 - LMT 1903_2 2:4:12",
                "2 - CAT"
            ],
            "Africa/Johannesburg": [
                "1:52 - LMT 1892_1_8 1:52",
                "1:30 - SAST 1903_2 1:30",
                "2 SA SAST"
            ],
            "Africa/Juba": [
                "2:6:24 - LMT 1931 2:6:24",
                "2 Sudan CA%sT 2000_0_15_12 2",
                "3 - EAT"
            ],
            "Africa/Kampala": [
                "2:9:40 - LMT 1928_6 2:9:40",
                "3 - EAT 1930 3",
                "2:30 - BEAT 1948 2:30",
                "2:45 - BEAUT 1957 2:45",
                "3 - EAT"
            ],
            "Africa/Khartoum": [
                "2:10:8 - LMT 1931 2:10:8",
                "2 Sudan CA%sT 2000_0_15_12 2",
                "3 - EAT"
            ],
            "Africa/Kigali": [
                "2:0:16 - LMT 1935_5 2:0:16",
                "2 - CAT"
            ],
            "Africa/Kinshasa": [
                "1:1:12 - LMT 1897_10_9 1:1:12",
                "1 - WAT"
            ],
            "Africa/Lagos": [
                "0:13:36 - LMT 1919_8 0:13:36",
                "1 - WAT"
            ],
            "Africa/Libreville": [
                "0:37:48 - LMT 1912 0:37:48",
                "1 - WAT"
            ],
            "Africa/Lome": [
                "0:4:52 - LMT 1893 0:4:52",
                "0 - GMT"
            ],
            "Africa/Luanda": [
                "0:52:56 - LMT 1892 0:52:56",
                "0:52:4 - AOT 1911_4_26 0:52:4",
                "1 - WAT"
            ],
            "Africa/Lubumbashi": [
                "1:49:52 - LMT 1897_10_9 1:49:52",
                "2 - CAT"
            ],
            "Africa/Lusaka": [
                "1:53:8 - LMT 1903_2 1:53:8",
                "2 - CAT"
            ],
            "Africa/Malabo": [
                "0:35:8 - LMT 1912 0:35:8",
                "0 - GMT 1963_11_15",
                "1 - WAT"
            ],
            "Africa/Maputo": [
                "2:10:20 - LMT 1903_2 2:10:20",
                "2 - CAT"
            ],
            "Africa/Maseru": [
                "1:50 - LMT 1903_2 1:50",
                "2 - SAST 1943_8_19_2 2",
                "3 - SAST 1944_2_19_2 3",
                "2 - SAST"
            ],
            "Africa/Mbabane": [
                "2:4:24 - LMT 1903_2 2:4:24",
                "2 - SAST"
            ],
            "Africa/Mogadishu": [
                "3:1:28 - LMT 1893_10 3:1:28",
                "3 - EAT 1931 3",
                "2:30 - BEAT 1957 2:30",
                "3 - EAT"
            ],
            "Africa/Monrovia": [
                "-0:43:8 - LMT 1882 -0:43:8",
                "-0:43:8 - MMT 1919_2 -0:43:8",
                "-0:44:30 - LRT 1972_4 -0:44:30",
                "0 - GMT"
            ],
            "Africa/Nairobi": [
                "2:27:16 - LMT 1928_6 2:27:16",
                "3 - EAT 1930 3",
                "2:30 - BEAT 1940 2:30",
                "2:45 - BEAUT 1960 2:45",
                "3 - EAT"
            ],
            "Africa/Ndjamena": [
                "1:0:12 - LMT 1912 1:0:12",
                "1 - WAT 1979_9_14 1",
                "2 - WAST 1980_2_8 2",
                "1 - WAT"
            ],
            "Africa/Niamey": [
                "0:8:28 - LMT 1912 0:8:28",
                "-1 - WAT 1934_1_26 -1",
                "0 - GMT 1960",
                "1 - WAT"
            ],
            "Africa/Nouakchott": [
                "-1:3:48 - LMT 1912 -1:3:48",
                "0 - GMT 1934_1_26",
                "-1 - WAT 1960_10_28 -1",
                "0 - GMT"
            ],
            "Africa/Ouagadougou": [
                "-0:6:4 - LMT 1912 -0:6:4",
                "0 - GMT"
            ],
            "Africa/Porto-Novo": [
                "0:10:28 - LMT 1912 0:10:28",
                "0 - GMT 1934_1_26",
                "1 - WAT"
            ],
            "Africa/Sao_Tome": [
                "0:26:56 - LMT 1884 0:26:56",
                "-0:36:32 - LMT 1912 -0:36:32",
                "0 - GMT"
            ],
            "Africa/Tripoli": [
                "0:52:44 - LMT 1920 0:52:44",
                "1 Libya CE%sT 1959 1",
                "2 - EET 1982 2",
                "1 Libya CE%sT 1990_4_4 1",
                "2 - EET 1996_8_30 2",
                "1 Libya CE%sT 1997_9_4 2",
                "2 - EET 2012_10_10_2 2",
                "1 Libya CE%sT"
            ],
            "Africa/Tunis": [
                "0:40:44 - LMT 1881_4_12 0:40:44",
                "0:9:21 - PMT 1911_2_11 0:9:21",
                "1 Tunisia CE%sT"
            ],
            "Africa/Windhoek": [
                "1:8:24 - LMT 1892_1_8 1:8:24",
                "1:30 - SWAT 1903_2 1:30",
                "2 - SAST 1942_8_20_2 2",
                "3 - SAST 1943_2_21_2 3",
                "2 - SAST 1990_2_21 2",
                "2 - CAT 1994_3_3 2",
                "1 Namibia WA%sT"
            ],
            "America/Adak": [
                "12:13:21 - LMT 1867_9_18 12:13:21",
                "-11:46:38 - LMT 1900_7_20_12 -11:46:38",
                "-11 - NST 1942 -11",
                "-11 US N%sT 1946 -11",
                "-11 - NST 1967_3 -11",
                "-11 - BST 1969 -11",
                "-11 US B%sT 1983_9_30_2 -10",
                "-10 US AH%sT 1983_10_30 -10",
                "-10 US HA%sT"
            ],
            "America/Anchorage": [
                "14:0:24 - LMT 1867_9_18 14:0:24",
                "-9:59:36 - LMT 1900_7_20_12 -9:59:36",
                "-10 - CAT 1942 -10",
                "-10 US CAT/CAWT 1945_7_14_23",
                "-10 US CAT/CAPT 1946 -10",
                "-10 - CAT 1967_3 -10",
                "-10 - AHST 1969 -10",
                "-10 US AH%sT 1983_9_30_2 -9",
                "-9 US Y%sT 1983_10_30 -9",
                "-9 US AK%sT"
            ],
            "America/Anguilla": [
                "-4:12:16 - LMT 1912_2_2 -4:12:16",
                "-4 - AST"
            ],
            "America/Antigua": [
                "-4:7:12 - LMT 1912_2_2 -4:7:12",
                "-5 - EST 1951 -5",
                "-4 - AST"
            ],
            "America/Araguaina": [
                "-3:12:48 - LMT 1914 -3:12:48",
                "-3 Brazil BR%sT 1990_8_17 -3",
                "-3 - BRT 1995_8_14 -3",
                "-3 Brazil BR%sT 2003_8_24 -3",
                "-3 - BRT 2012_9_21 -3",
                "-3 Brazil BR%sT"
            ],
            "America/Argentina/Buenos_Aires": [
                "-3:53:48 - LMT 1894_9_31 -3:53:48",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 Arg AR%sT"
            ],
            "America/Argentina/Catamarca": [
                "-4:23:8 - LMT 1894_9_31 -4:23:8",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_3 -2",
                "-4 - WART 1991_9_20 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_5_1 -3",
                "-4 - WART 2004_5_20 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/Cordoba": [
                "-4:16:48 - LMT 1894_9_31 -4:16:48",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_3 -2",
                "-4 - WART 1991_9_20 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 Arg AR%sT"
            ],
            "America/Argentina/Jujuy": [
                "-4:21:12 - LMT 1894_9_31 -4:21:12",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1990_2_4 -2",
                "-4 - WART 1990_9_28 -4",
                "-3 - WARST 1991_2_17 -3",
                "-4 - WART 1991_9_6 -4",
                "-2 - ARST 1992 -2",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/La_Rioja": [
                "-4:27:24 - LMT 1894_9_31 -4:27:24",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_1 -2",
                "-4 - WART 1991_4_7 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_5_1 -3",
                "-4 - WART 2004_5_20 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/Mendoza": [
                "-4:35:16 - LMT 1894_9_31 -4:35:16",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1990_2_4 -2",
                "-4 - WART 1990_9_15 -4",
                "-3 - WARST 1991_2_1 -3",
                "-4 - WART 1991_9_15 -4",
                "-3 - WARST 1992_2_1 -3",
                "-4 - WART 1992_9_18 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_4_23 -3",
                "-4 - WART 2004_8_26 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/Rio_Gallegos": [
                "-4:36:52 - LMT 1894_9_31 -4:36:52",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_5_1 -3",
                "-4 - WART 2004_5_20 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/Salta": [
                "-4:21:40 - LMT 1894_9_31 -4:21:40",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_3 -2",
                "-4 - WART 1991_9_20 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/San_Juan": [
                "-4:34:4 - LMT 1894_9_31 -4:34:4",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_1 -2",
                "-4 - WART 1991_4_7 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_4_31 -3",
                "-4 - WART 2004_6_25 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Argentina/San_Luis": [
                "-4:25:24 - LMT 1894_9_31 -4:25:24",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1990 -2",
                "-2 - ARST 1990_2_14 -2",
                "-4 - WART 1990_9_15 -4",
                "-3 - WARST 1991_2_1 -3",
                "-4 - WART 1991_5_1 -4",
                "-3 - ART 1999_9_3 -3",
                "-3 - WARST 2000_2_3 -3",
                "-3 - ART 2004_4_31 -3",
                "-4 - WART 2004_6_25 -4",
                "-3 Arg AR%sT 2008_0_21 -2",
                "-4 SanLuis WAR%sT"
            ],
            "America/Argentina/Tucuman": [
                "-4:20:52 - LMT 1894_9_31 -4:20:52",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1991_2_3 -2",
                "-4 - WART 1991_9_20 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_5_1 -3",
                "-4 - WART 2004_5_13 -4",
                "-3 Arg AR%sT"
            ],
            "America/Argentina/Ushuaia": [
                "-4:33:12 - LMT 1894_9_31 -4:33:12",
                "-4:16:48 - CMT 1920_4 -4:16:48",
                "-4 - ART 1930_11 -4",
                "-4 Arg AR%sT 1969_9_5 -4",
                "-3 Arg AR%sT 1999_9_3 -3",
                "-4 Arg AR%sT 2000_2_3 -3",
                "-3 - ART 2004_4_30 -3",
                "-4 - WART 2004_5_20 -4",
                "-3 Arg AR%sT 2008_9_18 -3",
                "-3 - ART"
            ],
            "America/Aruba": [
                "-4:40:24 - LMT 1912_1_12 -4:40:24",
                "-4:30 - ANT 1965 -4:30",
                "-4 - AST"
            ],
            "America/Asuncion": [
                "-3:50:40 - LMT 1890 -3:50:40",
                "-3:50:40 - AMT 1931_9_10 -3:50:40",
                "-4 - PYT 1972_9 -4",
                "-3 - PYT 1974_3 -3",
                "-4 Para PY%sT"
            ],
            "America/Atikokan": [
                "-6:6:28 - LMT 1895 -6:6:28",
                "-6 Canada C%sT 1940_8_29 -6",
                "-5 - CDT 1942_1_9_2 -6",
                "-6 Canada C%sT 1945_8_30_2 -5",
                "-5 - EST"
            ],
            "America/Bahia": [
                "-2:34:4 - LMT 1914 -2:34:4",
                "-3 Brazil BR%sT 2003_8_24 -3",
                "-3 - BRT 2011_9_16 -3",
                "-3 Brazil BR%sT 2012_9_21 -3",
                "-3 - BRT"
            ],
            "America/Bahia_Banderas": [
                "-7:1 - LMT 1921_11_31_23_59 -7:1",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 - CST 1942_3_24 -6",
                "-7 - MST 1949_0_14 -7",
                "-8 - PST 1970 -8",
                "-7 Mexico M%sT 2010_3_4_2 -7",
                "-6 Mexico C%sT"
            ],
            "America/Barbados": [
                "-3:58:29 - LMT 1924 -3:58:29",
                "-3:58:29 - BMT 1932 -3:58:29",
                "-4 Barb A%sT"
            ],
            "America/Belem": [
                "-3:13:56 - LMT 1914 -3:13:56",
                "-3 Brazil BR%sT 1988_8_12 -3",
                "-3 - BRT"
            ],
            "America/Belize": [
                "-5:52:48 - LMT 1912_3 -5:52:48",
                "-6 Belize C%sT"
            ],
            "America/Blanc-Sablon": [
                "-3:48:28 - LMT 1884 -3:48:28",
                "-4 Canada A%sT 1970 -4",
                "-4 - AST"
            ],
            "America/Boa_Vista": [
                "-4:2:40 - LMT 1914 -4:2:40",
                "-4 Brazil AM%sT 1988_8_12 -4",
                "-4 - AMT 1999_8_30 -4",
                "-4 Brazil AM%sT 2000_9_15 -3",
                "-4 - AMT"
            ],
            "America/Bogota": [
                "-4:56:16 - LMT 1884_2_13 -4:56:16",
                "-4:56:16 - BMT 1914_10_23 -4:56:16",
                "-5 CO CO%sT"
            ],
            "America/Boise": [
                "-7:44:49 - LMT 1883_10_18_12_15_11 -7:44:49",
                "-8 US P%sT 1923_4_13_2 -8",
                "-7 US M%sT 1974 -7",
                "-7 - MST 1974_1_3_2 -7",
                "-7 US M%sT"
            ],
            "America/Cambridge_Bay": [
                "0 - zzz 1920",
                "-7 NT_YK M%sT 1999_9_31_2 -6",
                "-6 Canada C%sT 2000_9_29_2 -5",
                "-5 - EST 2000_10_5_0 -5",
                "-6 - CST 2001_3_1_3 -6",
                "-7 Canada M%sT"
            ],
            "America/Campo_Grande": [
                "-3:38:28 - LMT 1914 -3:38:28",
                "-4 Brazil AM%sT"
            ],
            "America/Cancun": [
                "-5:47:4 - LMT 1922_0_1_0_12_56 -5:47:4",
                "-6 - CST 1981_11_23 -6",
                "-5 Mexico E%sT 1998_7_2_2 -4",
                "-6 Mexico C%sT"
            ],
            "America/Caracas": [
                "-4:27:44 - LMT 1890 -4:27:44",
                "-4:27:40 - CMT 1912_1_12 -4:27:40",
                "-4:30 - VET 1965 -4:30",
                "-4 - VET 2007_11_9_03 -4",
                "-4:30 - VET"
            ],
            "America/Cayenne": [
                "-3:29:20 - LMT 1911_6 -3:29:20",
                "-4 - GFT 1967_9 -4",
                "-3 - GFT"
            ],
            "America/Cayman": [
                "-5:25:32 - LMT 1890 -5:25:32",
                "-5:7:12 - KMT 1912_1 -5:7:12",
                "-5 - EST"
            ],
            "America/Chicago": [
                "-5:50:36 - LMT 1883_10_18_12_9_24 -5:50:36",
                "-6 US C%sT 1920 -6",
                "-6 Chicago C%sT 1936_2_1_2 -6",
                "-5 - EST 1936_10_15_2 -5",
                "-6 Chicago C%sT 1942 -6",
                "-6 US C%sT 1946 -6",
                "-6 Chicago C%sT 1967 -6",
                "-6 US C%sT"
            ],
            "America/Chihuahua": [
                "-7:4:20 - LMT 1921_11_31_23_55_40 -7:4:20",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 - CST 1996 -6",
                "-6 Mexico C%sT 1998 -6",
                "-6 - CST 1998_3_5_3 -6",
                "-7 Mexico M%sT"
            ],
            "America/Costa_Rica": [
                "-5:36:13 - LMT 1890 -5:36:13",
                "-5:36:13 - SJMT 1921_0_15 -5:36:13",
                "-6 CR C%sT"
            ],
            "America/Creston": [
                "-7:46:4 - LMT 1884 -7:46:4",
                "-7 - MST 1916_9_1 -7",
                "-8 - PST 1918_5_2 -8",
                "-7 - MST"
            ],
            "America/Cuiaba": [
                "-3:44:20 - LMT 1914 -3:44:20",
                "-4 Brazil AM%sT 2003_8_24 -4",
                "-4 - AMT 2004_9_1 -4",
                "-4 Brazil AM%sT"
            ],
            "America/Curacao": [
                "-4:35:47 - LMT 1912_1_12 -4:35:47",
                "-4:30 - ANT 1965 -4:30",
                "-4 - AST"
            ],
            "America/Danmarkshavn": [
                "-1:14:40 - LMT 1916_6_28 -1:14:40",
                "-3 - WGT 1980_3_6_2 -3",
                "-3 EU WG%sT 1996 -3",
                "0 - GMT"
            ],
            "America/Dawson": [
                "-9:17:40 - LMT 1900_7_20 -9:17:40",
                "-9 NT_YK Y%sT 1973_9_28_0 -9",
                "-8 NT_YK P%sT 1980 -8",
                "-8 Canada P%sT"
            ],
            "America/Dawson_Creek": [
                "-8:0:56 - LMT 1884 -8:0:56",
                "-8 Canada P%sT 1947 -8",
                "-8 Vanc P%sT 1972_7_30_2 -7",
                "-7 - MST"
            ],
            "America/Denver": [
                "-6:59:56 - LMT 1883_10_18_12_0_4 -6:59:56",
                "-7 US M%sT 1920 -7",
                "-7 Denver M%sT 1942 -7",
                "-7 US M%sT 1946 -7",
                "-7 Denver M%sT 1967 -7",
                "-7 US M%sT"
            ],
            "America/Detroit": [
                "-5:32:11 - LMT 1905 -5:32:11",
                "-6 - CST 1915_4_15_2 -6",
                "-5 - EST 1942 -5",
                "-5 US E%sT 1946 -5",
                "-5 Detroit E%sT 1973 -5",
                "-5 US E%sT 1975 -5",
                "-5 - EST 1975_3_27_2 -5",
                "-5 US E%sT"
            ],
            "America/Dominica": [
                "-4:5:36 - LMT 1911_6_1_0_1 -4:5:36",
                "-4 - AST"
            ],
            "America/Edmonton": [
                "-7:33:52 - LMT 1906_8 -7:33:52",
                "-7 Edm M%sT 1987 -7",
                "-7 Canada M%sT"
            ],
            "America/Eirunepe": [
                "-4:39:28 - LMT 1914 -4:39:28",
                "-5 Brazil AC%sT 1988_8_12 -5",
                "-5 - ACT 1993_8_28 -5",
                "-5 Brazil AC%sT 1994_8_22 -5",
                "-5 - ACT 2008_5_24_00 -5",
                "-4 - AMT"
            ],
            "America/El_Salvador": [
                "-5:56:48 - LMT 1921 -5:56:48",
                "-6 Salv C%sT"
            ],
            "America/Fortaleza": [
                "-2:34 - LMT 1914 -2:34",
                "-3 Brazil BR%sT 1990_8_17 -3",
                "-3 - BRT 1999_8_30 -3",
                "-3 Brazil BR%sT 2000_9_22 -2",
                "-3 - BRT 2001_8_13 -3",
                "-3 Brazil BR%sT 2002_9_1 -3",
                "-3 - BRT"
            ],
            "America/Glace_Bay": [
                "-3:59:48 - LMT 1902_5_15 -3:59:48",
                "-4 Canada A%sT 1953 -4",
                "-4 Halifax A%sT 1954 -4",
                "-4 - AST 1972 -4",
                "-4 Halifax A%sT 1974 -4",
                "-4 Canada A%sT"
            ],
            "America/Godthab": [
                "-3:26:56 - LMT 1916_6_28 -3:26:56",
                "-3 - WGT 1980_3_6_2 -3",
                "-3 EU WG%sT"
            ],
            "America/Goose_Bay": [
                "-4:1:40 - LMT 1884 -4:1:40",
                "-3:30:52 - NST 1918 -3:30:52",
                "-3:30:52 Canada N%sT 1919 -3:30:52",
                "-3:30:52 - NST 1935_2_30 -3:30:52",
                "-3:30 - NST 1936 -3:30",
                "-3:30 StJohns N%sT 1942_4_11 -3:30",
                "-3:30 Canada N%sT 1946 -3:30",
                "-3:30 StJohns N%sT 1966_2_15_2 -3:30",
                "-4 StJohns A%sT 2011_10 -3",
                "-4 Canada A%sT"
            ],
            "America/Grand_Turk": [
                "-4:44:32 - LMT 1890 -4:44:32",
                "-5:7:12 - KMT 1912_1 -5:7:12",
                "-5 TC E%sT"
            ],
            "America/Grenada": [
                "-4:7 - LMT 1911_6 -4:7",
                "-4 - AST"
            ],
            "America/Guadeloupe": [
                "-4:6:8 - LMT 1911_5_8 -4:6:8",
                "-4 - AST"
            ],
            "America/Guatemala": [
                "-6:2:4 - LMT 1918_9_5 -6:2:4",
                "-6 Guat C%sT"
            ],
            "America/Guayaquil": [
                "-5:19:20 - LMT 1890 -5:19:20",
                "-5:14 - QMT 1931 -5:14",
                "-5 - ECT"
            ],
            "America/Guyana": [
                "-3:52:40 - LMT 1915_2 -3:52:40",
                "-3:45 - GBGT 1966_4_26 -3:45",
                "-3:45 - GYT 1975_6_31 -3:45",
                "-3 - GYT 1991 -3",
                "-4 - GYT"
            ],
            "America/Halifax": [
                "-4:14:24 - LMT 1902_5_15 -4:14:24",
                "-4 Halifax A%sT 1918 -4",
                "-4 Canada A%sT 1919 -4",
                "-4 Halifax A%sT 1942_1_9_2 -4",
                "-4 Canada A%sT 1946 -4",
                "-4 Halifax A%sT 1974 -4",
                "-4 Canada A%sT"
            ],
            "America/Havana": [
                "-5:29:28 - LMT 1890 -5:29:28",
                "-5:29:36 - HMT 1925_6_19_12 -5:29:36",
                "-5 Cuba C%sT"
            ],
            "America/Hermosillo": [
                "-7:23:52 - LMT 1921_11_31_23_36_8 -7:23:52",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 - CST 1942_3_24 -6",
                "-7 - MST 1949_0_14 -7",
                "-8 - PST 1970 -8",
                "-7 Mexico M%sT 1999 -7",
                "-7 - MST"
            ],
            "America/Indiana/Indianapolis": [
                "-5:44:38 - LMT 1883_10_18_12_15_22 -5:44:38",
                "-6 US C%sT 1920 -6",
                "-6 Indianapolis C%sT 1942 -6",
                "-6 US C%sT 1946 -6",
                "-6 Indianapolis C%sT 1955_3_24_2 -6",
                "-5 - EST 1957_8_29_2 -5",
                "-6 - CST 1958_3_27_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1971 -5",
                "-5 - EST 2006 -5",
                "-5 US E%sT"
            ],
            "America/Indiana/Knox": [
                "-5:46:30 - LMT 1883_10_18_12_13_30 -5:46:30",
                "-6 US C%sT 1947 -6",
                "-6 Starke C%sT 1962_3_29_2 -6",
                "-5 - EST 1963_9_27_2 -5",
                "-6 US C%sT 1991_9_27_2 -5",
                "-5 - EST 2006_3_2_2 -5",
                "-6 US C%sT"
            ],
            "America/Indiana/Marengo": [
                "-5:45:23 - LMT 1883_10_18_12_14_37 -5:45:23",
                "-6 US C%sT 1951 -6",
                "-6 Marengo C%sT 1961_3_30_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1974_0_6_2 -5",
                "-5 - CDT 1974_9_27_2 -5",
                "-5 US E%sT 1976 -5",
                "-5 - EST 2006 -5",
                "-5 US E%sT"
            ],
            "America/Indiana/Petersburg": [
                "-5:49:7 - LMT 1883_10_18_12_10_53 -5:49:7",
                "-6 US C%sT 1955 -6",
                "-6 Pike C%sT 1965_3_25_2 -6",
                "-5 - EST 1966_9_30_2 -5",
                "-6 US C%sT 1977_9_30_2 -5",
                "-5 - EST 2006_3_2_2 -5",
                "-6 US C%sT 2007_10_4_2 -5",
                "-5 US E%sT"
            ],
            "America/Indiana/Tell_City": [
                "-5:47:3 - LMT 1883_10_18_12_12_57 -5:47:3",
                "-6 US C%sT 1946 -6",
                "-6 Perry C%sT 1964_3_26_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1971 -5",
                "-5 - EST 2006_3_2_2 -5",
                "-6 US C%sT"
            ],
            "America/Indiana/Vevay": [
                "-5:40:16 - LMT 1883_10_18_12_19_44 -5:40:16",
                "-6 US C%sT 1954_3_25_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1973 -5",
                "-5 - EST 2006 -5",
                "-5 US E%sT"
            ],
            "America/Indiana/Vincennes": [
                "-5:50:7 - LMT 1883_10_18_12_9_53 -5:50:7",
                "-6 US C%sT 1946 -6",
                "-6 Vincennes C%sT 1964_3_26_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1971 -5",
                "-5 - EST 2006_3_2_2 -5",
                "-6 US C%sT 2007_10_4_2 -5",
                "-5 US E%sT"
            ],
            "America/Indiana/Winamac": [
                "-5:46:25 - LMT 1883_10_18_12_13_35 -5:46:25",
                "-6 US C%sT 1946 -6",
                "-6 Pulaski C%sT 1961_3_30_2 -6",
                "-5 - EST 1969 -5",
                "-5 US E%sT 1971 -5",
                "-5 - EST 2006_3_2_2 -5",
                "-6 US C%sT 2007_2_11_2 -6",
                "-5 US E%sT"
            ],
            "America/Inuvik": [
                "0 - zzz 1953",
                "-8 NT_YK P%sT 1979_3_29_2 -8",
                "-7 NT_YK M%sT 1980 -7",
                "-7 Canada M%sT"
            ],
            "America/Iqaluit": [
                "0 - zzz 1942_7",
                "-5 NT_YK E%sT 1999_9_31_2 -4",
                "-6 Canada C%sT 2000_9_29_2 -5",
                "-5 Canada E%sT"
            ],
            "America/Jamaica": [
                "-5:7:12 - LMT 1890 -5:7:12",
                "-5:7:12 - KMT 1912_1 -5:7:12",
                "-5 - EST 1974_3_28_2 -5",
                "-5 US E%sT 1984 -5",
                "-5 - EST"
            ],
            "America/Juneau": [
                "15:2:19 - LMT 1867_9_18 15:2:19",
                "-8:57:41 - LMT 1900_7_20_12 -8:57:41",
                "-8 - PST 1942 -8",
                "-8 US P%sT 1946 -8",
                "-8 - PST 1969 -8",
                "-8 US P%sT 1980_3_27_2 -8",
                "-9 US Y%sT 1980_9_26_2 -8",
                "-8 US P%sT 1983_9_30_2 -7",
                "-9 US Y%sT 1983_10_30 -9",
                "-9 US AK%sT"
            ],
            "America/Kentucky/Louisville": [
                "-5:43:2 - LMT 1883_10_18_12_16_58 -5:43:2",
                "-6 US C%sT 1921 -6",
                "-6 Louisville C%sT 1942 -6",
                "-6 US C%sT 1946 -6",
                "-6 Louisville C%sT 1961_6_23_2 -5",
                "-5 - EST 1968 -5",
                "-5 US E%sT 1974_0_6_2 -5",
                "-5 - CDT 1974_9_27_2 -5",
                "-5 US E%sT"
            ],
            "America/Kentucky/Monticello": [
                "-5:39:24 - LMT 1883_10_18_12_20_36 -5:39:24",
                "-6 US C%sT 1946 -6",
                "-6 - CST 1968 -6",
                "-6 US C%sT 2000_9_29_2 -5",
                "-5 US E%sT"
            ],
            "America/La_Paz": [
                "-4:32:36 - LMT 1890 -4:32:36",
                "-4:32:36 - CMT 1931_9_15 -4:32:36",
                "-3:32:36 - BOST 1932_2_21 -3:32:36",
                "-4 - BOT"
            ],
            "America/Lima": [
                "-5:8:12 - LMT 1890 -5:8:12",
                "-5:8:36 - LMT 1908_6_28 -5:8:36",
                "-5 Peru PE%sT"
            ],
            "America/Los_Angeles": [
                "-7:52:58 - LMT 1883_10_18_12_7_2 -7:52:58",
                "-8 US P%sT 1946 -8",
                "-8 CA P%sT 1967 -8",
                "-8 US P%sT"
            ],
            "America/Maceio": [
                "-2:22:52 - LMT 1914 -2:22:52",
                "-3 Brazil BR%sT 1990_8_17 -3",
                "-3 - BRT 1995_9_13 -3",
                "-3 Brazil BR%sT 1996_8_4 -3",
                "-3 - BRT 1999_8_30 -3",
                "-3 Brazil BR%sT 2000_9_22 -2",
                "-3 - BRT 2001_8_13 -3",
                "-3 Brazil BR%sT 2002_9_1 -3",
                "-3 - BRT"
            ],
            "America/Managua": [
                "-5:45:8 - LMT 1890 -5:45:8",
                "-5:45:12 - MMT 1934_5_23 -5:45:12",
                "-6 - CST 1973_4 -6",
                "-5 - EST 1975_1_16 -5",
                "-6 Nic C%sT 1992_0_1_4 -6",
                "-5 - EST 1992_8_24 -5",
                "-6 - CST 1993 -6",
                "-5 - EST 1997 -5",
                "-6 Nic C%sT"
            ],
            "America/Manaus": [
                "-4:0:4 - LMT 1914 -4:0:4",
                "-4 Brazil AM%sT 1988_8_12 -4",
                "-4 - AMT 1993_8_28 -4",
                "-4 Brazil AM%sT 1994_8_22 -4",
                "-4 - AMT"
            ],
            "America/Martinique": [
                "-4:4:20 - LMT 1890 -4:4:20",
                "-4:4:20 - FFMT 1911_4 -4:4:20",
                "-4 - AST 1980_3_6 -4",
                "-3 - ADT 1980_8_28 -3",
                "-4 - AST"
            ],
            "America/Matamoros": [
                "-6:40 - LMT 1921_11_31_23_20 -6:40",
                "-6 - CST 1988 -6",
                "-6 US C%sT 1989 -6",
                "-6 Mexico C%sT 2010 -6",
                "-6 US C%sT"
            ],
            "America/Mazatlan": [
                "-7:5:40 - LMT 1921_11_31_23_54_20 -7:5:40",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 - CST 1942_3_24 -6",
                "-7 - MST 1949_0_14 -7",
                "-8 - PST 1970 -8",
                "-7 Mexico M%sT"
            ],
            "America/Menominee": [
                "-5:50:27 - LMT 1885_8_18_12 -5:50:27",
                "-6 US C%sT 1946 -6",
                "-6 Menominee C%sT 1969_3_27_2 -6",
                "-5 - EST 1973_3_29_2 -5",
                "-6 US C%sT"
            ],
            "America/Merida": [
                "-5:58:28 - LMT 1922_0_1_0_1_32 -5:58:28",
                "-6 - CST 1981_11_23 -6",
                "-5 - EST 1982_11_2 -5",
                "-6 Mexico C%sT"
            ],
            "America/Metlakatla": [
                "15:13:42 - LMT 1867_9_18 15:13:42",
                "-8:46:18 - LMT 1900_7_20_12 -8:46:18",
                "-8 - PST 1942 -8",
                "-8 US P%sT 1946 -8",
                "-8 - PST 1969 -8",
                "-8 US P%sT 1983_9_30_2 -7",
                "-8 - MeST"
            ],
            "America/Mexico_City": [
                "-6:36:36 - LMT 1922_0_1_0_23_24 -6:36:36",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 Mexico C%sT 2001_8_30_02 -5",
                "-6 - CST 2002_1_20 -6",
                "-6 Mexico C%sT"
            ],
            "America/Miquelon": [
                "-3:44:40 - LMT 1911_4_15 -3:44:40",
                "-4 - AST 1980_4 -4",
                "-3 - PMST 1987 -3",
                "-3 Canada PM%sT"
            ],
            "America/Moncton": [
                "-4:19:8 - LMT 1883_11_9 -4:19:8",
                "-5 - EST 1902_5_15 -5",
                "-4 Canada A%sT 1933 -4",
                "-4 Moncton A%sT 1942 -4",
                "-4 Canada A%sT 1946 -4",
                "-4 Moncton A%sT 1973 -4",
                "-4 Canada A%sT 1993 -4",
                "-4 Moncton A%sT 2007 -4",
                "-4 Canada A%sT"
            ],
            "America/Monterrey": [
                "-6:41:16 - LMT 1921_11_31_23_18_44 -6:41:16",
                "-6 - CST 1988 -6",
                "-6 US C%sT 1989 -6",
                "-6 Mexico C%sT"
            ],
            "America/Montevideo": [
                "-3:44:44 - LMT 1898_5_28 -3:44:44",
                "-3:44:44 - MMT 1920_4_1 -3:44:44",
                "-3:30 Uruguay UY%sT 1942_11_14 -3:30",
                "-3 Uruguay UY%sT"
            ],
            "America/Montreal": [
                "-4:54:16 - LMT 1884 -4:54:16",
                "-5 Mont E%sT 1918 -5",
                "-5 Canada E%sT 1919 -5",
                "-5 Mont E%sT 1942_1_9_2 -5",
                "-5 Canada E%sT 1946 -5",
                "-5 Mont E%sT 1974 -5",
                "-5 Canada E%sT"
            ],
            "America/Montserrat": [
                "-4:8:52 - LMT 1911_6_1_0_1 -4:8:52",
                "-4 - AST"
            ],
            "America/Nassau": [
                "-5:9:30 - LMT 1912_2_2 -5:9:30",
                "-5 Bahamas E%sT 1976 -5",
                "-5 US E%sT"
            ],
            "America/New_York": [
                "-4:56:2 - LMT 1883_10_18_12_3_58 -4:56:2",
                "-5 US E%sT 1920 -5",
                "-5 NYC E%sT 1942 -5",
                "-5 US E%sT 1946 -5",
                "-5 NYC E%sT 1967 -5",
                "-5 US E%sT"
            ],
            "America/Nipigon": [
                "-5:53:4 - LMT 1895 -5:53:4",
                "-5 Canada E%sT 1940_8_29 -5",
                "-4 - EDT 1942_1_9_2 -5",
                "-5 Canada E%sT"
            ],
            "America/Nome": [
                "12:58:21 - LMT 1867_9_18 12:58:21",
                "-11:1:38 - LMT 1900_7_20_12 -11:1:38",
                "-11 - NST 1942 -11",
                "-11 US N%sT 1946 -11",
                "-11 - NST 1967_3 -11",
                "-11 - BST 1969 -11",
                "-11 US B%sT 1983_9_30_2 -10",
                "-9 US Y%sT 1983_10_30 -9",
                "-9 US AK%sT"
            ],
            "America/Noronha": [
                "-2:9:40 - LMT 1914 -2:9:40",
                "-2 Brazil FN%sT 1990_8_17 -2",
                "-2 - FNT 1999_8_30 -2",
                "-2 Brazil FN%sT 2000_9_15 -1",
                "-2 - FNT 2001_8_13 -2",
                "-2 Brazil FN%sT 2002_9_1 -2",
                "-2 - FNT"
            ],
            "America/North_Dakota/Beulah": [
                "-6:47:7 - LMT 1883_10_18_12_12_53 -6:47:7",
                "-7 US M%sT 2010_10_7_2 -6",
                "-6 US C%sT"
            ],
            "America/North_Dakota/Center": [
                "-6:45:12 - LMT 1883_10_18_12_14_48 -6:45:12",
                "-7 US M%sT 1992_9_25_02 -6",
                "-6 US C%sT"
            ],
            "America/North_Dakota/New_Salem": [
                "-6:45:39 - LMT 1883_10_18_12_14_21 -6:45:39",
                "-7 US M%sT 2003_9_26_02 -6",
                "-6 US C%sT"
            ],
            "America/Ojinaga": [
                "-6:57:40 - LMT 1922_0_1_0_2_20 -6:57:40",
                "-7 - MST 1927_5_10_23 -7",
                "-6 - CST 1930_10_15 -6",
                "-7 - MST 1931_4_1_23 -7",
                "-6 - CST 1931_9 -6",
                "-7 - MST 1932_3_1 -7",
                "-6 - CST 1996 -6",
                "-6 Mexico C%sT 1998 -6",
                "-6 - CST 1998_3_5_3 -6",
                "-7 Mexico M%sT 2010 -7",
                "-7 US M%sT"
            ],
            "America/Panama": [
                "-5:18:8 - LMT 1890 -5:18:8",
                "-5:19:36 - CMT 1908_3_22 -5:19:36",
                "-5 - EST"
            ],
            "America/Pangnirtung": [
                "0 - zzz 1921",
                "-4 NT_YK A%sT 1995_3_2_2 -4",
                "-5 Canada E%sT 1999_9_31_2 -4",
                "-6 Canada C%sT 2000_9_29_2 -5",
                "-5 Canada E%sT"
            ],
            "America/Paramaribo": [
                "-3:40:40 - LMT 1911 -3:40:40",
                "-3:40:52 - PMT 1935 -3:40:52",
                "-3:40:36 - PMT 1945_9 -3:40:36",
                "-3:30 - NEGT 1975_10_20 -3:30",
                "-3:30 - SRT 1984_9 -3:30",
                "-3 - SRT"
            ],
            "America/Phoenix": [
                "-7:28:18 - LMT 1883_10_18_11_31_42 -7:28:18",
                "-7 US M%sT 1944_0_1_00_1 -6",
                "-7 - MST 1944_3_1_00_1 -7",
                "-7 US M%sT 1944_9_1_00_1 -6",
                "-7 - MST 1967 -7",
                "-7 US M%sT 1968_2_21 -7",
                "-7 - MST"
            ],
            "America/Port-au-Prince": [
                "-4:49:20 - LMT 1890 -4:49:20",
                "-4:49 - PPMT 1917_0_24_12 -4:49",
                "-5 Haiti E%sT"
            ],
            "America/Port_of_Spain": [
                "-4:6:4 - LMT 1912_2_2 -4:6:4",
                "-4 - AST"
            ],
            "America/Porto_Velho": [
                "-4:15:36 - LMT 1914 -4:15:36",
                "-4 Brazil AM%sT 1988_8_12 -4",
                "-4 - AMT"
            ],
            "America/Puerto_Rico": [
                "-4:24:25 - LMT 1899_2_28_12 -4:24:25",
                "-4 - AST 1942_4_3 -4",
                "-4 US A%sT 1946 -4",
                "-4 - AST"
            ],
            "America/Rainy_River": [
                "-6:18:16 - LMT 1895 -6:18:16",
                "-6 Canada C%sT 1940_8_29 -6",
                "-5 - CDT 1942_1_9_2 -6",
                "-6 Canada C%sT"
            ],
            "America/Rankin_Inlet": [
                "0 - zzz 1957",
                "-6 NT_YK C%sT 2000_9_29_2 -5",
                "-5 - EST 2001_3_1_3 -5",
                "-6 Canada C%sT"
            ],
            "America/Recife": [
                "-2:19:36 - LMT 1914 -2:19:36",
                "-3 Brazil BR%sT 1990_8_17 -3",
                "-3 - BRT 1999_8_30 -3",
                "-3 Brazil BR%sT 2000_9_15 -2",
                "-3 - BRT 2001_8_13 -3",
                "-3 Brazil BR%sT 2002_9_1 -3",
                "-3 - BRT"
            ],
            "America/Regina": [
                "-6:58:36 - LMT 1905_8 -6:58:36",
                "-7 Regina M%sT 1960_3_24_2 -7",
                "-6 - CST"
            ],
            "America/Resolute": [
                "0 - zzz 1947_7_31",
                "-6 NT_YK C%sT 2000_9_29_2 -5",
                "-5 - EST 2001_3_1_3 -5",
                "-6 Canada C%sT 2006_9_29_2 -5",
                "-5 - EST 2007_2_11_3 -5",
                "-6 Canada C%sT"
            ],
            "America/Rio_Branco": [
                "-4:31:12 - LMT 1914 -4:31:12",
                "-5 Brazil AC%sT 1988_8_12 -5",
                "-5 - ACT 2008_5_24_00 -5",
                "-4 - AMT"
            ],
            "America/Santa_Isabel": [
                "-7:39:28 - LMT 1922_0_1_0_20_32 -7:39:28",
                "-7 - MST 1924 -7",
                "-8 - PST 1927_5_10_23 -8",
                "-7 - MST 1930_10_15 -7",
                "-8 - PST 1931_3_1 -8",
                "-7 - PDT 1931_8_30 -7",
                "-8 - PST 1942_3_24 -8",
                "-7 - PWT 1945_7_14_23",
                "-7 - PPT 1945_10_12 -7",
                "-8 - PST 1948_3_5 -8",
                "-7 - PDT 1949_0_14 -7",
                "-8 - PST 1954 -8",
                "-8 CA P%sT 1961 -8",
                "-8 - PST 1976 -8",
                "-8 US P%sT 1996 -8",
                "-8 Mexico P%sT 2001 -8",
                "-8 US P%sT 2002_1_20 -8",
                "-8 Mexico P%sT"
            ],
            "America/Santarem": [
                "-3:38:48 - LMT 1914 -3:38:48",
                "-4 Brazil AM%sT 1988_8_12 -4",
                "-4 - AMT 2008_5_24_00 -4",
                "-3 - BRT"
            ],
            "America/Santiago": [
                "-4:42:46 - LMT 1890 -4:42:46",
                "-4:42:46 - SMT 1910 -4:42:46",
                "-5 - CLT 1916_6_1 -5",
                "-4:42:46 - SMT 1918_8_1 -4:42:46",
                "-4 - CLT 1919_6_1 -4",
                "-4:42:46 - SMT 1927_8_1 -4:42:46",
                "-5 Chile CL%sT 1947_4_22 -5",
                "-4 Chile CL%sT"
            ],
            "America/Santo_Domingo": [
                "-4:39:36 - LMT 1890 -4:39:36",
                "-4:40 - SDMT 1933_3_1_12 -4:40",
                "-5 DR E%sT 1974_9_27 -5",
                "-4 - AST 2000_9_29_02 -4",
                "-5 US E%sT 2000_11_3_01 -5",
                "-4 - AST"
            ],
            "America/Sao_Paulo": [
                "-3:6:28 - LMT 1914 -3:6:28",
                "-3 Brazil BR%sT 1963_9_23_00 -3",
                "-2 - BRST 1964 -2",
                "-3 Brazil BR%sT"
            ],
            "America/Scoresbysund": [
                "-1:27:52 - LMT 1916_6_28 -1:27:52",
                "-2 - CGT 1980_3_6_2 -2",
                "-2 C-Eur CG%sT 1981_2_29 -2",
                "-1 EU EG%sT"
            ],
            "America/Sitka": [
                "14:58:47 - LMT 1867_9_18 14:58:47",
                "-9:1:13 - LMT 1900_7_20_12 -9:1:13",
                "-8 - PST 1942 -8",
                "-8 US P%sT 1946 -8",
                "-8 - PST 1969 -8",
                "-8 US P%sT 1983_9_30_2 -7",
                "-9 US Y%sT 1983_10_30 -9",
                "-9 US AK%sT"
            ],
            "America/St_Johns": [
                "-3:30:52 - LMT 1884 -3:30:52",
                "-3:30:52 StJohns N%sT 1918 -3:30:52",
                "-3:30:52 Canada N%sT 1919 -3:30:52",
                "-3:30:52 StJohns N%sT 1935_2_30 -3:30:52",
                "-3:30 StJohns N%sT 1942_4_11 -3:30",
                "-3:30 Canada N%sT 1946 -3:30",
                "-3:30 StJohns N%sT 2011_10 -2:30",
                "-3:30 Canada N%sT"
            ],
            "America/St_Kitts": [
                "-4:10:52 - LMT 1912_2_2 -4:10:52",
                "-4 - AST"
            ],
            "America/St_Lucia": [
                "-4:4 - LMT 1890 -4:4",
                "-4:4 - CMT 1912 -4:4",
                "-4 - AST"
            ],
            "America/St_Thomas": [
                "-4:19:44 - LMT 1911_6 -4:19:44",
                "-4 - AST"
            ],
            "America/St_Vincent": [
                "-4:4:56 - LMT 1890 -4:4:56",
                "-4:4:56 - KMT 1912 -4:4:56",
                "-4 - AST"
            ],
            "America/Swift_Current": [
                "-7:11:20 - LMT 1905_8 -7:11:20",
                "-7 Canada M%sT 1946_3_28_2 -7",
                "-7 Regina M%sT 1950 -7",
                "-7 Swift M%sT 1972_3_30_2 -7",
                "-6 - CST"
            ],
            "America/Tegucigalpa": [
                "-5:48:52 - LMT 1921_3 -5:48:52",
                "-6 Hond C%sT"
            ],
            "America/Thule": [
                "-4:35:8 - LMT 1916_6_28 -4:35:8",
                "-4 Thule A%sT"
            ],
            "America/Thunder_Bay": [
                "-5:57 - LMT 1895 -5:57",
                "-6 - CST 1910 -6",
                "-5 - EST 1942 -5",
                "-5 Canada E%sT 1970 -5",
                "-5 Mont E%sT 1973 -5",
                "-5 - EST 1974 -5",
                "-5 Canada E%sT"
            ],
            "America/Tijuana": [
                "-7:48:4 - LMT 1922_0_1_0_11_56 -7:48:4",
                "-7 - MST 1924 -7",
                "-8 - PST 1927_5_10_23 -8",
                "-7 - MST 1930_10_15 -7",
                "-8 - PST 1931_3_1 -8",
                "-7 - PDT 1931_8_30 -7",
                "-8 - PST 1942_3_24 -8",
                "-7 - PWT 1945_7_14_23",
                "-7 - PPT 1945_10_12 -7",
                "-8 - PST 1948_3_5 -8",
                "-7 - PDT 1949_0_14 -7",
                "-8 - PST 1954 -8",
                "-8 CA P%sT 1961 -8",
                "-8 - PST 1976 -8",
                "-8 US P%sT 1996 -8",
                "-8 Mexico P%sT 2001 -8",
                "-8 US P%sT 2002_1_20 -8",
                "-8 Mexico P%sT 2010 -8",
                "-8 US P%sT"
            ],
            "America/Toronto": [
                "-5:17:32 - LMT 1895 -5:17:32",
                "-5 Canada E%sT 1919 -5",
                "-5 Toronto E%sT 1942_1_9_2 -5",
                "-5 Canada E%sT 1946 -5",
                "-5 Toronto E%sT 1974 -5",
                "-5 Canada E%sT"
            ],
            "America/Tortola": [
                "-4:18:28 - LMT 1911_6 -4:18:28",
                "-4 - AST"
            ],
            "America/Vancouver": [
                "-8:12:28 - LMT 1884 -8:12:28",
                "-8 Vanc P%sT 1987 -8",
                "-8 Canada P%sT"
            ],
            "America/Whitehorse": [
                "-9:0:12 - LMT 1900_7_20 -9:0:12",
                "-9 NT_YK Y%sT 1966_6_1_2 -9",
                "-8 NT_YK P%sT 1980 -8",
                "-8 Canada P%sT"
            ],
            "America/Winnipeg": [
                "-6:28:36 - LMT 1887_6_16 -6:28:36",
                "-6 Winn C%sT 2006 -6",
                "-6 Canada C%sT"
            ],
            "America/Yakutat": [
                "14:41:5 - LMT 1867_9_18 14:41:5",
                "-9:18:55 - LMT 1900_7_20_12 -9:18:55",
                "-9 - YST 1942 -9",
                "-9 US Y%sT 1946 -9",
                "-9 - YST 1969 -9",
                "-9 US Y%sT 1983_10_30 -9",
                "-9 US AK%sT"
            ],
            "America/Yellowknife": [
                "0 - zzz 1935",
                "-7 NT_YK M%sT 1980 -7",
                "-7 Canada M%sT"
            ],
            "Antarctica/Casey": [
                "0 - zzz 1969",
                "8 - WST 2009_9_18_2 8",
                "11 - CAST 2010_2_5_2 11",
                "8 - WST 2011_9_28_2 8",
                "11 - CAST 2012_1_21_17",
                "8 - WST"
            ],
            "Antarctica/Davis": [
                "0 - zzz 1957_0_13",
                "7 - DAVT 1964_10 7",
                "0 - zzz 1969_1",
                "7 - DAVT 2009_9_18_2 7",
                "5 - DAVT 2010_2_10_20",
                "7 - DAVT 2011_9_28_2 7",
                "5 - DAVT 2012_1_21_20",
                "7 - DAVT"
            ],
            "Antarctica/DumontDUrville": [
                "0 - zzz 1947",
                "10 - PMT 1952_0_14 10",
                "0 - zzz 1956_10",
                "10 - DDUT"
            ],
            "Antarctica/Macquarie": [
                "0 - zzz 1899_10",
                "10 - EST 1916_9_1_2 10",
                "11 - EST 1917_1 11",
                "10 Aus EST 1919_3 10",
                "0 - zzz 1948_2_25",
                "10 Aus EST 1967 10",
                "10 AT EST 2010_3_4_3 11",
                "11 - MIST"
            ],
            "Antarctica/Mawson": [
                "0 - zzz 1954_1_13",
                "6 - MAWT 2009_9_18_2 6",
                "5 - MAWT"
            ],
            "Antarctica/McMurdo": [
                "0 - zzz 1956",
                "12 NZAQ NZ%sT"
            ],
            "Antarctica/Palmer": [
                "0 - zzz 1965",
                "-4 ArgAQ AR%sT 1969_9_5 -4",
                "-3 ArgAQ AR%sT 1982_4 -3",
                "-4 ChileAQ CL%sT"
            ],
            "Antarctica/Rothera": [
                "0 - zzz 1976_11_1",
                "-3 - ROTT"
            ],
            "Antarctica/Syowa": [
                "0 - zzz 1957_0_29",
                "3 - SYOT"
            ],
            "Antarctica/Vostok": [
                "0 - zzz 1957_11_16",
                "6 - VOST"
            ],
            "Asia/Aden": [
                "2:59:54 - LMT 1950 2:59:54",
                "3 - AST"
            ],
            "Asia/Almaty": [
                "5:7:48 - LMT 1924_4_2 5:7:48",
                "5 - ALMT 1930_5_21 5",
                "6 RussiaAsia ALM%sT 1991 6",
                "6 - ALMT 1992 6",
                "6 RussiaAsia ALM%sT 2005_2_15 6",
                "6 - ALMT"
            ],
            "Asia/Amman": [
                "2:23:44 - LMT 1931 2:23:44",
                "2 Jordan EE%sT"
            ],
            "Asia/Anadyr": [
                "11:49:56 - LMT 1924_4_2 11:49:56",
                "12 - ANAT 1930_5_21 12",
                "13 Russia ANA%sT 1982_3_1_0 13",
                "12 Russia ANA%sT 1991_2_31_2 12",
                "11 Russia ANA%sT 1992_0_19_2 11",
                "12 Russia ANA%sT 2010_2_28_2 12",
                "11 Russia ANA%sT 2011_2_27_2 11",
                "12 - ANAT"
            ],
            "Asia/Aqtau": [
                "3:21:4 - LMT 1924_4_2 3:21:4",
                "4 - FORT 1930_5_21 4",
                "5 - FORT 1963 5",
                "5 - SHET 1981_9_1 5",
                "6 - SHET 1982_3_1 6",
                "5 RussiaAsia SHE%sT 1991 5",
                "5 - SHET 1991_11_16 5",
                "5 RussiaAsia AQT%sT 1995_2_26_2 5",
                "4 RussiaAsia AQT%sT 2005_2_15 4",
                "5 - AQTT"
            ],
            "Asia/Aqtobe": [
                "3:48:40 - LMT 1924_4_2 3:48:40",
                "4 - AKTT 1930_5_21 4",
                "5 - AKTT 1981_3_1 5",
                "6 - AKTST 1981_9_1 6",
                "6 - AKTT 1982_3_1 6",
                "5 RussiaAsia AKT%sT 1991 5",
                "5 - AKTT 1991_11_16 5",
                "5 RussiaAsia AQT%sT 2005_2_15 5",
                "5 - AQTT"
            ],
            "Asia/Ashgabat": [
                "3:53:32 - LMT 1924_4_2 3:53:32",
                "4 - ASHT 1930_5_21 4",
                "5 RussiaAsia ASH%sT 1991_2_31_2 5",
                "4 RussiaAsia ASH%sT 1991_9_27 4",
                "4 RussiaAsia TM%sT 1992_0_19_2 4",
                "5 - TMT"
            ],
            "Asia/Baghdad": [
                "2:57:40 - LMT 1890 2:57:40",
                "2:57:36 - BMT 1918 2:57:36",
                "3 - AST 1982_4 3",
                "3 Iraq A%sT"
            ],
            "Asia/Bahrain": [
                "3:22:20 - LMT 1920 3:22:20",
                "4 - GST 1972_5 4",
                "3 - AST"
            ],
            "Asia/Baku": [
                "3:19:24 - LMT 1924_4_2 3:19:24",
                "3 - BAKT 1957_2 3",
                "4 RussiaAsia BAK%sT 1991_2_31_2 4",
                "4 - BAKST 1991_7_30 4",
                "3 RussiaAsia AZ%sT 1992_8_26_23 4",
                "4 - AZT 1996 4",
                "4 EUAsia AZ%sT 1997 4",
                "4 Azer AZ%sT"
            ],
            "Asia/Bangkok": [
                "6:42:4 - LMT 1880 6:42:4",
                "6:42:4 - BMT 1920_3 6:42:4",
                "7 - ICT"
            ],
            "Asia/Beirut": [
                "2:22 - LMT 1880 2:22",
                "2 Lebanon EE%sT"
            ],
            "Asia/Bishkek": [
                "4:58:24 - LMT 1924_4_2 4:58:24",
                "5 - FRUT 1930_5_21 5",
                "6 RussiaAsia FRU%sT 1991_2_31_2 6",
                "6 - FRUST 1991_7_31_2 6",
                "5 Kyrgyz KG%sT 2005_7_12 6",
                "6 - KGT"
            ],
            "Asia/Brunei": [
                "7:39:40 - LMT 1926_2 7:39:40",
                "7:30 - BNT 1933 7:30",
                "8 - BNT"
            ],
            "Asia/Choibalsan": [
                "7:38 - LMT 1905_7 7:38",
                "7 - ULAT 1978 7",
                "8 - ULAT 1983_3 8",
                "9 Mongol CHO%sT 2008_2_31 9",
                "8 Mongol CHO%sT"
            ],
            "Asia/Chongqing": [
                "7:6:20 - LMT 1928 7:6:20",
                "7 - LONT 1980_4 7",
                "8 PRC C%sT"
            ],
            "Asia/Colombo": [
                "5:19:24 - LMT 1880 5:19:24",
                "5:19:32 - MMT 1906 5:19:32",
                "5:30 - IST 1942_0_5 5:30",
                "6 - IHST 1942_8 6",
                "6:30 - IST 1945_9_16_2 6:30",
                "5:30 - IST 1996_4_25_0 5:30",
                "6:30 - LKT 1996_9_26_0_30 6:30",
                "6 - LKT 2006_3_15_0_30 6",
                "5:30 - IST"
            ],
            "Asia/Damascus": [
                "2:25:12 - LMT 1920 2:25:12",
                "2 Syria EE%sT"
            ],
            "Asia/Dhaka": [
                "6:1:40 - LMT 1890 6:1:40",
                "5:53:20 - HMT 1941_9 5:53:20",
                "6:30 - BURT 1942_4_15 6:30",
                "5:30 - IST 1942_8 5:30",
                "6:30 - BURT 1951_8_30 6:30",
                "6 - DACT 1971_2_26 6",
                "6 - BDT 2009 6",
                "6 Dhaka BD%sT"
            ],
            "Asia/Dili": [
                "8:22:20 - LMT 1912 8:22:20",
                "8 - TLT 1942_1_21_23 8",
                "9 - JST 1945_8_23 9",
                "9 - TLT 1976_4_3 9",
                "8 - CIT 2000_8_17_00 8",
                "9 - TLT"
            ],
            "Asia/Dubai": [
                "3:41:12 - LMT 1920 3:41:12",
                "4 - GST"
            ],
            "Asia/Dushanbe": [
                "4:35:12 - LMT 1924_4_2 4:35:12",
                "5 - DUST 1930_5_21 5",
                "6 RussiaAsia DUS%sT 1991_2_31_2 6",
                "6 - DUSST 1991_8_9_2 5",
                "5 - TJT"
            ],
            "Asia/Gaza": [
                "2:17:52 - LMT 1900_9 2:17:52",
                "2 Zion EET 1948_4_15 2",
                "2 EgyptAsia EE%sT 1967_5_5 3",
                "2 Zion I%sT 1996 2",
                "2 Jordan EE%sT 1999 2",
                "2 Palestine EE%sT 2008_7_29_0 3",
                "2 - EET 2008_8 2",
                "2 Palestine EE%sT 2010 2",
                "2 - EET 2010_2_27_0_1 2",
                "2 Palestine EE%sT 2011_7_1 3",
                "2 - EET 2012 2",
                "2 Palestine EE%sT"
            ],
            "Asia/Harbin": [
                "8:26:44 - LMT 1928 8:26:44",
                "8:30 - CHAT 1932_2 8:30",
                "8 - CST 1940 8",
                "9 - CHAT 1966_4 9",
                "8:30 - CHAT 1980_4 8:30",
                "8 PRC C%sT"
            ],
            "Asia/Hebron": [
                "2:20:23 - LMT 1900_9 2:20:23",
                "2 Zion EET 1948_4_15 2",
                "2 EgyptAsia EE%sT 1967_5_5 3",
                "2 Zion I%sT 1996 2",
                "2 Jordan EE%sT 1999 2",
                "2 Palestine EE%sT"
            ],
            "Asia/Ho_Chi_Minh": [
                "7:6:40 - LMT 1906_5_9 7:6:40",
                "7:6:20 - SMT 1911_2_11_0_1 7:6:20",
                "7 - ICT 1912_4 7",
                "8 - ICT 1931_4 8",
                "7 - ICT"
            ],
            "Asia/Hong_Kong": [
                "7:36:42 - LMT 1904_9_30 7:36:42",
                "8 HK HK%sT 1941_11_25 8",
                "9 - JST 1945_8_15 9",
                "8 HK HK%sT"
            ],
            "Asia/Hovd": [
                "6:6:36 - LMT 1905_7 6:6:36",
                "6 - HOVT 1978 6",
                "7 Mongol HOV%sT"
            ],
            "Asia/Irkutsk": [
                "6:57:20 - LMT 1880 6:57:20",
                "6:57:20 - IMT 1920_0_25 6:57:20",
                "7 - IRKT 1930_5_21 7",
                "8 Russia IRK%sT 1991_2_31_2 8",
                "7 Russia IRK%sT 1992_0_19_2 7",
                "8 Russia IRK%sT 2011_2_27_2 8",
                "9 - IRKT"
            ],
            "Asia/Jakarta": [
                "7:7:12 - LMT 1867_7_10 7:7:12",
                "7:7:12 - JMT 1923_11_31_23_47_12 7:7:12",
                "7:20 - JAVT 1932_10 7:20",
                "7:30 - WIT 1942_2_23 7:30",
                "9 - JST 1945_8_23 9",
                "7:30 - WIT 1948_4 7:30",
                "8 - WIT 1950_4 8",
                "7:30 - WIT 1964 7:30",
                "7 - WIT"
            ],
            "Asia/Jayapura": [
                "9:22:48 - LMT 1932_10 9:22:48",
                "9 - EIT 1944_8_1 9",
                "9:30 - CST 1964 9:30",
                "9 - EIT"
            ],
            "Asia/Jerusalem": [
                "2:20:56 - LMT 1880 2:20:56",
                "2:20:40 - JMT 1918 2:20:40",
                "2 Zion I%sT"
            ],
            "Asia/Kabul": [
                "4:36:48 - LMT 1890 4:36:48",
                "4 - AFT 1945 4",
                "4:30 - AFT"
            ],
            "Asia/Kamchatka": [
                "10:34:36 - LMT 1922_10_10 10:34:36",
                "11 - PETT 1930_5_21 11",
                "12 Russia PET%sT 1991_2_31_2 12",
                "11 Russia PET%sT 1992_0_19_2 11",
                "12 Russia PET%sT 2010_2_28_2 12",
                "11 Russia PET%sT 2011_2_27_2 11",
                "12 - PETT"
            ],
            "Asia/Karachi": [
                "4:28:12 - LMT 1907 4:28:12",
                "5:30 - IST 1942_8 5:30",
                "6:30 - IST 1945_9_15 6:30",
                "5:30 - IST 1951_8_30 5:30",
                "5 - KART 1971_2_26 5",
                "5 Pakistan PK%sT"
            ],
            "Asia/Kashgar": [
                "5:3:56 - LMT 1928 5:3:56",
                "5:30 - KAST 1940 5:30",
                "5 - KAST 1980_4 5",
                "8 PRC C%sT"
            ],
            "Asia/Kathmandu": [
                "5:41:16 - LMT 1920 5:41:16",
                "5:30 - IST 1986 5:30",
                "5:45 - NPT"
            ],
            "Asia/Khandyga": [
                "9:2:13 - LMT 1919_11_15 9:2:13",
                "8 - YAKT 1930_5_21 8",
                "9 Russia YAK%sT 1991_2_31_2 9",
                "8 Russia YAK%sT 1992_0_19_2 8",
                "9 Russia YAK%sT 2004 9",
                "10 Russia VLA%sT 2011_2_27_2 10",
                "11 - VLAT 2011_8_13_0 11",
                "10 - YAKT"
            ],
            "Asia/Kolkata": [
                "5:53:28 - LMT 1880 5:53:28",
                "5:53:20 - HMT 1941_9 5:53:20",
                "6:30 - BURT 1942_4_15 6:30",
                "5:30 - IST 1942_8 5:30",
                "6:30 - IST 1945_9_15 6:30",
                "5:30 - IST"
            ],
            "Asia/Krasnoyarsk": [
                "6:11:20 - LMT 1920_0_6 6:11:20",
                "6 - KRAT 1930_5_21 6",
                "7 Russia KRA%sT 1991_2_31_2 7",
                "6 Russia KRA%sT 1992_0_19_2 6",
                "7 Russia KRA%sT 2011_2_27_2 7",
                "8 - KRAT"
            ],
            "Asia/Kuala_Lumpur": [
                "6:46:46 - LMT 1901_0_1 6:46:46",
                "6:55:25 - SMT 1905_5_1 6:55:25",
                "7 - MALT 1933_0_1 7",
                "7:20 - MALST 1936_0_1 7:20",
                "7:20 - MALT 1941_8_1 7:20",
                "7:30 - MALT 1942_1_16 7:30",
                "9 - JST 1945_8_12 9",
                "7:30 - MALT 1982_0_1 7:30",
                "8 - MYT"
            ],
            "Asia/Kuching": [
                "7:21:20 - LMT 1926_2 7:21:20",
                "7:30 - BORT 1933 7:30",
                "8 NBorneo BOR%sT 1942_1_16 8",
                "9 - JST 1945_8_12 9",
                "8 - BORT 1982_0_1 8",
                "8 - MYT"
            ],
            "Asia/Kuwait": [
                "3:11:56 - LMT 1950 3:11:56",
                "3 - AST"
            ],
            "Asia/Macau": [
                "7:34:20 - LMT 1912 7:34:20",
                "8 Macau MO%sT 1999_11_20 8",
                "8 PRC C%sT"
            ],
            "Asia/Magadan": [
                "10:3:12 - LMT 1924_4_2 10:3:12",
                "10 - MAGT 1930_5_21 10",
                "11 Russia MAG%sT 1991_2_31_2 11",
                "10 Russia MAG%sT 1992_0_19_2 10",
                "11 Russia MAG%sT 2011_2_27_2 11",
                "12 - MAGT"
            ],
            "Asia/Makassar": [
                "7:57:36 - LMT 1920 7:57:36",
                "7:57:36 - MMT 1932_10 7:57:36",
                "8 - CIT 1942_1_9 8",
                "9 - JST 1945_8_23 9",
                "8 - CIT"
            ],
            "Asia/Manila": [
                "-15:56 - LMT 1844_11_31 -15:56",
                "8:4 - LMT 1899_4_11 8:4",
                "8 Phil PH%sT 1942_4 8",
                "9 - JST 1944_10 9",
                "8 Phil PH%sT"
            ],
            "Asia/Muscat": [
                "3:54:24 - LMT 1920 3:54:24",
                "4 - GST"
            ],
            "Asia/Nicosia": [
                "2:13:28 - LMT 1921_10_14 2:13:28",
                "2 Cyprus EE%sT 1998_8 3",
                "2 EUAsia EE%sT"
            ],
            "Asia/Novokuznetsk": [
                "5:48:48 - NMT 1920_0_6 5:48:48",
                "6 - KRAT 1930_5_21 6",
                "7 Russia KRA%sT 1991_2_31_2 7",
                "6 Russia KRA%sT 1992_0_19_2 6",
                "7 Russia KRA%sT 2010_2_28_2 7",
                "6 Russia NOV%sT 2011_2_27_2 6",
                "7 - NOVT"
            ],
            "Asia/Novosibirsk": [
                "5:31:40 - LMT 1919_11_14_6 5:31:40",
                "6 - NOVT 1930_5_21 6",
                "7 Russia NOV%sT 1991_2_31_2 7",
                "6 Russia NOV%sT 1992_0_19_2 6",
                "7 Russia NOV%sT 1993_4_23 8",
                "6 Russia NOV%sT 2011_2_27_2 6",
                "7 - NOVT"
            ],
            "Asia/Omsk": [
                "4:53:36 - LMT 1919_10_14 4:53:36",
                "5 - OMST 1930_5_21 5",
                "6 Russia OMS%sT 1991_2_31_2 6",
                "5 Russia OMS%sT 1992_0_19_2 5",
                "6 Russia OMS%sT 2011_2_27_2 6",
                "7 - OMST"
            ],
            "Asia/Oral": [
                "3:25:24 - LMT 1924_4_2 3:25:24",
                "4 - URAT 1930_5_21 4",
                "5 - URAT 1981_3_1 5",
                "6 - URAST 1981_9_1 6",
                "6 - URAT 1982_3_1 6",
                "5 RussiaAsia URA%sT 1989_2_26_2 5",
                "4 RussiaAsia URA%sT 1991 4",
                "4 - URAT 1991_11_16 4",
                "4 RussiaAsia ORA%sT 2005_2_15 4",
                "5 - ORAT"
            ],
            "Asia/Phnom_Penh": [
                "6:59:40 - LMT 1906_5_9 6:59:40",
                "7:6:20 - SMT 1911_2_11_0_1 7:6:20",
                "7 - ICT 1912_4 7",
                "8 - ICT 1931_4 8",
                "7 - ICT"
            ],
            "Asia/Pontianak": [
                "7:17:20 - LMT 1908_4 7:17:20",
                "7:17:20 - PMT 1932_10 7:17:20",
                "7:30 - WIT 1942_0_29 7:30",
                "9 - JST 1945_8_23 9",
                "7:30 - WIT 1948_4 7:30",
                "8 - WIT 1950_4 8",
                "7:30 - WIT 1964 7:30",
                "8 - CIT 1988_0_1 8",
                "7 - WIT"
            ],
            "Asia/Pyongyang": [
                "8:23 - LMT 1890 8:23",
                "8:30 - KST 1904_11 8:30",
                "9 - KST 1928 9",
                "8:30 - KST 1932 8:30",
                "9 - KST 1954_2_21 9",
                "8 - KST 1961_7_10 8",
                "9 - KST"
            ],
            "Asia/Qatar": [
                "3:26:8 - LMT 1920 3:26:8",
                "4 - GST 1972_5 4",
                "3 - AST"
            ],
            "Asia/Qyzylorda": [
                "4:21:52 - LMT 1924_4_2 4:21:52",
                "4 - KIZT 1930_5_21 4",
                "5 - KIZT 1981_3_1 5",
                "6 - KIZST 1981_9_1 6",
                "6 - KIZT 1982_3_1 6",
                "5 RussiaAsia KIZ%sT 1991 5",
                "5 - KIZT 1991_11_16 5",
                "5 - QYZT 1992_0_19_2 5",
                "6 RussiaAsia QYZ%sT 2005_2_15 6",
                "6 - QYZT"
            ],
            "Asia/Rangoon": [
                "6:24:40 - LMT 1880 6:24:40",
                "6:24:40 - RMT 1920 6:24:40",
                "6:30 - BURT 1942_4 6:30",
                "9 - JST 1945_4_3 9",
                "6:30 - MMT"
            ],
            "Asia/Riyadh": [
                "3:6:52 - LMT 1950 3:6:52",
                "3 - AST"
            ],
            "Asia/Sakhalin": [
                "9:30:48 - LMT 1905_7_23 9:30:48",
                "9 - CJT 1938 9",
                "9 - JST 1945_7_25 9",
                "11 Russia SAK%sT 1991_2_31_2 11",
                "10 Russia SAK%sT 1992_0_19_2 10",
                "11 Russia SAK%sT 1997_2_30_2 11",
                "10 Russia SAK%sT 2011_2_27_2 10",
                "11 - SAKT"
            ],
            "Asia/Samarkand": [
                "4:27:12 - LMT 1924_4_2 4:27:12",
                "4 - SAMT 1930_5_21 4",
                "5 - SAMT 1981_3_1 5",
                "6 - SAMST 1981_9_1 6",
                "6 - TAST 1982_3_1 6",
                "5 RussiaAsia SAM%sT 1991_8_1 6",
                "5 RussiaAsia UZ%sT 1992 5",
                "5 - UZT"
            ],
            "Asia/Seoul": [
                "8:27:52 - LMT 1890 8:27:52",
                "8:30 - KST 1904_11 8:30",
                "9 - KST 1928 9",
                "8:30 - KST 1932 8:30",
                "9 - KST 1954_2_21 9",
                "8 ROK K%sT 1961_7_10 8",
                "8:30 - KST 1968_9 8:30",
                "9 ROK K%sT"
            ],
            "Asia/Shanghai": [
                "8:5:57 - LMT 1928 8:5:57",
                "8 Shang C%sT 1949 8",
                "8 PRC C%sT"
            ],
            "Asia/Singapore": [
                "6:55:25 - LMT 1901_0_1 6:55:25",
                "6:55:25 - SMT 1905_5_1 6:55:25",
                "7 - MALT 1933_0_1 7",
                "7:20 - MALST 1936_0_1 7:20",
                "7:20 - MALT 1941_8_1 7:20",
                "7:30 - MALT 1942_1_16 7:30",
                "9 - JST 1945_8_12 9",
                "7:30 - MALT 1965_7_9 7:30",
                "7:30 - SGT 1982_0_1 7:30",
                "8 - SGT"
            ],
            "Asia/Taipei": [
                "8:6 - LMT 1896 8:6",
                "8 Taiwan C%sT"
            ],
            "Asia/Tashkent": [
                "4:37:12 - LMT 1924_4_2 4:37:12",
                "5 - TAST 1930_5_21 5",
                "6 RussiaAsia TAS%sT 1991_2_31_2 6",
                "5 RussiaAsia TAS%sT 1991_8_1 6",
                "5 RussiaAsia UZ%sT 1992 5",
                "5 - UZT"
            ],
            "Asia/Tbilisi": [
                "2:59:16 - LMT 1880 2:59:16",
                "2:59:16 - TBMT 1924_4_2 2:59:16",
                "3 - TBIT 1957_2 3",
                "4 RussiaAsia TBI%sT 1991_2_31_2 4",
                "4 - TBIST 1991_3_9 4",
                "3 RussiaAsia GE%sT 1992 3",
                "3 E-EurAsia GE%sT 1994_8_25 4",
                "4 E-EurAsia GE%sT 1996_9_27 5",
                "5 - GEST 1997_2_30 5",
                "4 E-EurAsia GE%sT 2004_5_27 5",
                "3 RussiaAsia GE%sT 2005_2_27_2 3",
                "4 - GET"
            ],
            "Asia/Tehran": [
                "3:25:44 - LMT 1916 3:25:44",
                "3:25:44 - TMT 1946 3:25:44",
                "3:30 - IRST 1977_10 3:30",
                "4 Iran IR%sT 1979 4",
                "3:30 Iran IR%sT"
            ],
            "Asia/Thimphu": [
                "5:58:36 - LMT 1947_7_15 5:58:36",
                "5:30 - IST 1987_9 5:30",
                "6 - BTT"
            ],
            "Asia/Tokyo": [
                "9:18:59 - LMT 1887_11_31_15",
                "9 - JST 1896 9",
                "9 - CJT 1938 9",
                "9 Japan J%sT"
            ],
            "Asia/Ulaanbaatar": [
                "7:7:32 - LMT 1905_7 7:7:32",
                "7 - ULAT 1978 7",
                "8 Mongol ULA%sT"
            ],
            "Asia/Urumqi": [
                "5:50:20 - LMT 1928 5:50:20",
                "6 - URUT 1980_4 6",
                "8 PRC C%sT"
            ],
            "Asia/Ust-Nera": [
                "9:32:54 - LMT 1919_11_15 9:32:54",
                "8 - YAKT 1930_5_21 8",
                "9 Russia YAKT 1981_3_1 9",
                "11 Russia MAG%sT 1991_2_31_2 11",
                "10 Russia MAG%sT 1992_0_19_2 10",
                "11 Russia MAG%sT 2011_2_27_2 11",
                "12 - MAGT 2011_8_13_0 12",
                "11 - VLAT"
            ],
            "Asia/Vientiane": [
                "6:50:24 - LMT 1906_5_9 6:50:24",
                "7:6:20 - SMT 1911_2_11_0_1 7:6:20",
                "7 - ICT 1912_4 7",
                "8 - ICT 1931_4 8",
                "7 - ICT"
            ],
            "Asia/Vladivostok": [
                "8:47:44 - LMT 1922_10_15 8:47:44",
                "9 - VLAT 1930_5_21 9",
                "10 Russia VLA%sT 1991_2_31_2 10",
                "9 Russia VLA%sST 1992_0_19_2 9",
                "10 Russia VLA%sT 2011_2_27_2 10",
                "11 - VLAT"
            ],
            "Asia/Yakutsk": [
                "8:38:40 - LMT 1919_11_15 8:38:40",
                "8 - YAKT 1930_5_21 8",
                "9 Russia YAK%sT 1991_2_31_2 9",
                "8 Russia YAK%sT 1992_0_19_2 8",
                "9 Russia YAK%sT 2011_2_27_2 9",
                "10 - YAKT"
            ],
            "Asia/Yekaterinburg": [
                "4:2:24 - LMT 1919_6_15_4 4:2:24",
                "4 - SVET 1930_5_21 4",
                "5 Russia SVE%sT 1991_2_31_2 5",
                "4 Russia SVE%sT 1992_0_19_2 4",
                "5 Russia YEK%sT 2011_2_27_2 5",
                "6 - YEKT"
            ],
            "Asia/Yerevan": [
                "2:58 - LMT 1924_4_2 2:58",
                "3 - YERT 1957_2 3",
                "4 RussiaAsia YER%sT 1991_2_31_2 4",
                "4 - YERST 1991_8_23 4",
                "3 RussiaAsia AM%sT 1995_8_24_2 3",
                "4 - AMT 1997 4",
                "4 RussiaAsia AM%sT 2012_2_25_2 4",
                "4 - AMT"
            ],
            "Atlantic/Azores": [
                "-1:42:40 - LMT 1884 -1:42:40",
                "-1:54:32 - HMT 1911_4_24 -1:54:32",
                "-2 Port AZO%sT 1966_3_3_2 -2",
                "-1 Port AZO%sT 1983_8_25_1 -1",
                "-1 W-Eur AZO%sT 1992_8_27_1 -1",
                "0 EU WE%sT 1993_2_28_1",
                "-1 EU AZO%sT"
            ],
            "Atlantic/Bermuda": [
                "-4:19:18 - LMT 1930_0_1_2 -4:19:18",
                "-4 - AST 1974_3_28_2 -4",
                "-4 Bahamas A%sT 1976 -4",
                "-4 US A%sT"
            ],
            "Atlantic/Canary": [
                "-1:1:36 - LMT 1922_2 -1:1:36",
                "-1 - CANT 1946_8_30_1 -1",
                "0 - WET 1980_3_6_0",
                "1 - WEST 1980_8_28_0",
                "0 EU WE%sT"
            ],
            "Atlantic/Cape_Verde": [
                "-1:34:4 - LMT 1907 -1:34:4",
                "-2 - CVT 1942_8 -2",
                "-1 - CVST 1945_9_15 -1",
                "-2 - CVT 1975_10_25_2 -2",
                "-1 - CVT"
            ],
            "Atlantic/Faroe": [
                "-0:27:4 - LMT 1908_0_11 -0:27:4",
                "0 - WET 1981",
                "0 EU WE%sT"
            ],
            "Atlantic/Madeira": [
                "-1:7:36 - LMT 1884 -1:7:36",
                "-1:7:36 - FMT 1911_4_24 -1:7:36",
                "-1 Port MAD%sT 1966_3_3_2 -1",
                "0 Port WE%sT 1983_8_25_1",
                "0 EU WE%sT"
            ],
            "Atlantic/Reykjavik": [
                "-1:27:24 - LMT 1837 -1:27:24",
                "-1:27:48 - RMT 1908 -1:27:48",
                "-1 Iceland IS%sT 1968_3_7_1 -1",
                "0 - GMT"
            ],
            "Atlantic/South_Georgia": [
                "-2:26:8 - LMT 1890 -2:26:8",
                "-2 - GST"
            ],
            "Atlantic/St_Helena": [
                "-0:22:48 - LMT 1890 -0:22:48",
                "-0:22:48 - JMT 1951 -0:22:48",
                "0 - GMT"
            ],
            "Atlantic/Stanley": [
                "-3:51:24 - LMT 1890 -3:51:24",
                "-3:51:24 - SMT 1912_2_12 -3:51:24",
                "-4 Falk FK%sT 1983_4 -4",
                "-3 Falk FK%sT 1985_8_15 -3",
                "-4 Falk FK%sT 2010_8_5_02 -4",
                "-3 - FKST"
            ],
            "Australia/Adelaide": [
                "9:14:20 - LMT 1895_1 9:14:20",
                "9 - CST 1899_4 9",
                "9:30 Aus CST 1971 9:30",
                "9:30 AS CST"
            ],
            "Australia/Brisbane": [
                "10:12:8 - LMT 1895 10:12:8",
                "10 Aus EST 1971 10",
                "10 AQ EST"
            ],
            "Australia/Broken_Hill": [
                "9:25:48 - LMT 1895_1 9:25:48",
                "10 - EST 1896_7_23 10",
                "9 - CST 1899_4 9",
                "9:30 Aus CST 1971 9:30",
                "9:30 AN CST 2000 10:30",
                "9:30 AS CST"
            ],
            "Australia/Currie": [
                "9:35:28 - LMT 1895_8 9:35:28",
                "10 - EST 1916_9_1_2 10",
                "11 - EST 1917_1 11",
                "10 Aus EST 1971_6 10",
                "10 AT EST"
            ],
            "Australia/Darwin": [
                "8:43:20 - LMT 1895_1 8:43:20",
                "9 - CST 1899_4 9",
                "9:30 Aus CST"
            ],
            "Australia/Eucla": [
                "8:35:28 - LMT 1895_11 8:35:28",
                "8:45 Aus CWST 1943_6 8:45",
                "8:45 AW CWST"
            ],
            "Australia/Hobart": [
                "9:49:16 - LMT 1895_8 9:49:16",
                "10 - EST 1916_9_1_2 10",
                "11 - EST 1917_1 11",
                "10 Aus EST 1967 10",
                "10 AT EST"
            ],
            "Australia/Lindeman": [
                "9:55:56 - LMT 1895 9:55:56",
                "10 Aus EST 1971 10",
                "10 AQ EST 1992_6 10",
                "10 Holiday EST"
            ],
            "Australia/Lord_Howe": [
                "10:36:20 - LMT 1895_1 10:36:20",
                "10 - EST 1981_2 10",
                "10:30 LH LHST"
            ],
            "Australia/Melbourne": [
                "9:39:52 - LMT 1895_1 9:39:52",
                "10 Aus EST 1971 10",
                "10 AV EST"
            ],
            "Australia/Perth": [
                "7:43:24 - LMT 1895_11 7:43:24",
                "8 Aus WST 1943_6 8",
                "8 AW WST"
            ],
            "Australia/Sydney": [
                "10:4:52 - LMT 1895_1 10:4:52",
                "10 Aus EST 1971 10",
                "10 AN EST"
            ],
            "CET": [
                "1 C-Eur CE%sT"
            ],
            "CST6CDT": [
                "-6 US C%sT"
            ],
            "EET": [
                "2 EU EE%sT"
            ],
            "EST": [
                "-5 - EST"
            ],
            "EST5EDT": [
                "-5 US E%sT"
            ],
            "Europe/Amsterdam": [
                "0:19:32 - LMT 1835 0:19:32",
                "0:19:32 Neth %s 1937_6_1 1:19:32",
                "0:20 Neth NE%sT 1940_4_16_0 0:20",
                "1 C-Eur CE%sT 1945_3_2_2 1",
                "1 Neth CE%sT 1977 1",
                "1 EU CE%sT"
            ],
            "Europe/Andorra": [
                "0:6:4 - LMT 1901 0:6:4",
                "0 - WET 1946_8_30",
                "1 - CET 1985_2_31_2 1",
                "1 EU CE%sT"
            ],
            "Europe/Athens": [
                "1:34:52 - LMT 1895_8_14 1:34:52",
                "1:34:52 - AMT 1916_6_28_0_1 1:34:52",
                "2 Greece EE%sT 1941_3_30 3",
                "1 Greece CE%sT 1944_3_4 1",
                "2 Greece EE%sT 1981 2",
                "2 EU EE%sT"
            ],
            "Europe/Belgrade": [
                "1:22 - LMT 1884 1:22",
                "1 - CET 1941_3_18_23 1",
                "1 C-Eur CE%sT 1945 1",
                "1 - CET 1945_4_8_2 1",
                "2 - CEST 1945_8_16_2 1",
                "1 - CET 1982_10_27 1",
                "1 EU CE%sT"
            ],
            "Europe/Berlin": [
                "0:53:28 - LMT 1893_3 0:53:28",
                "1 C-Eur CE%sT 1945_4_24_2 2",
                "1 SovietZone CE%sT 1946 1",
                "1 Germany CE%sT 1980 1",
                "1 EU CE%sT"
            ],
            "Europe/Brussels": [
                "0:17:30 - LMT 1880 0:17:30",
                "0:17:30 - BMT 1892_4_1_12 0:17:30",
                "0 - WET 1914_10_8",
                "1 - CET 1916_4_1_0 1",
                "1 C-Eur CE%sT 1918_10_11_11",
                "0 Belgium WE%sT 1940_4_20_2",
                "1 C-Eur CE%sT 1944_8_3 2",
                "1 Belgium CE%sT 1977 1",
                "1 EU CE%sT"
            ],
            "Europe/Bucharest": [
                "1:44:24 - LMT 1891_9 1:44:24",
                "1:44:24 - BMT 1931_6_24 1:44:24",
                "2 Romania EE%sT 1981_2_29_2 2",
                "2 C-Eur EE%sT 1991 2",
                "2 Romania EE%sT 1994 2",
                "2 E-Eur EE%sT 1997 2",
                "2 EU EE%sT"
            ],
            "Europe/Budapest": [
                "1:16:20 - LMT 1890_9 1:16:20",
                "1 C-Eur CE%sT 1918 1",
                "1 Hungary CE%sT 1941_3_6_2 1",
                "1 C-Eur CE%sT 1945 1",
                "1 Hungary CE%sT 1980_8_28_2 1",
                "1 EU CE%sT"
            ],
            "Europe/Chisinau": [
                "1:55:20 - LMT 1880 1:55:20",
                "1:55 - CMT 1918_1_15 1:55",
                "1:44:24 - BMT 1931_6_24 1:44:24",
                "2 Romania EE%sT 1940_7_15 2",
                "3 - EEST 1941_6_17 3",
                "1 C-Eur CE%sT 1944_7_24 2",
                "3 Russia MSK/MSD 1990 3",
                "3 - MSK 1990_4_6 3",
                "2 - EET 1991 2",
                "2 Russia EE%sT 1992 2",
                "2 E-Eur EE%sT 1997 2",
                "2 EU EE%sT"
            ],
            "Europe/Copenhagen": [
                "0:50:20 - LMT 1890 0:50:20",
                "0:50:20 - CMT 1894_0_1 0:50:20",
                "1 Denmark CE%sT 1942_10_2_2 1",
                "1 C-Eur CE%sT 1945_3_2_2 1",
                "1 Denmark CE%sT 1980 1",
                "1 EU CE%sT"
            ],
            "Europe/Dublin": [
                "-0:25 - LMT 1880_7_2 -0:25",
                "-0:25:21 - DMT 1916_4_21_2 -0:25:21",
                "0:34:39 - IST 1916_9_1_2 -0:25:21",
                "0 GB-Eire %s 1921_11_6",
                "0 GB-Eire GMT/IST 1940_1_25_2",
                "1 - IST 1946_9_6_2 1",
                "0 - GMT 1947_2_16_2",
                "1 - IST 1947_10_2_2 1",
                "0 - GMT 1948_3_18_2",
                "0 GB-Eire GMT/IST 1968_9_27 1",
                "1 - IST 1971_9_31_2",
                "0 GB-Eire GMT/IST 1996",
                "0 EU GMT/IST"
            ],
            "Europe/Gibraltar": [
                "-0:21:24 - LMT 1880_7_2_0 -0:21:24",
                "0 GB-Eire %s 1957_3_14_2",
                "1 - CET 1982 1",
                "1 EU CE%sT"
            ],
            "Europe/Helsinki": [
                "1:39:52 - LMT 1878_4_31 1:39:52",
                "1:39:52 - HMT 1921_4 1:39:52",
                "2 Finland EE%sT 1983 2",
                "2 EU EE%sT"
            ],
            "Europe/Istanbul": [
                "1:55:52 - LMT 1880 1:55:52",
                "1:56:56 - IMT 1910_9 1:56:56",
                "2 Turkey EE%sT 1978_9_15 3",
                "3 Turkey TR%sT 1985_3_20 3",
                "2 Turkey EE%sT 2007 2",
                "2 EU EE%sT 2011_2_27_1",
                "2 - EET 2011_2_28_1",
                "2 EU EE%sT"
            ],
            "Europe/Kaliningrad": [
                "1:22 - LMT 1893_3 1:22",
                "1 C-Eur CE%sT 1945 1",
                "2 Poland CE%sT 1946 2",
                "3 Russia MSK/MSD 1991_2_31_2 3",
                "2 Russia EE%sT 2011_2_27_2 2",
                "3 - FET"
            ],
            "Europe/Kiev": [
                "2:2:4 - LMT 1880 2:2:4",
                "2:2:4 - KMT 1924_4_2 2:2:4",
                "2 - EET 1930_5_21 2",
                "3 - MSK 1941_8_20 3",
                "1 C-Eur CE%sT 1943_10_6 1",
                "3 Russia MSK/MSD 1990 3",
                "3 - MSK 1990_6_1_2 3",
                "2 - EET 1992 2",
                "2 E-Eur EE%sT 1995 2",
                "2 EU EE%sT"
            ],
            "Europe/Lisbon": [
                "-0:36:32 - LMT 1884 -0:36:32",
                "-0:36:32 - LMT 1912_0_1 -0:36:32",
                "0 Port WE%sT 1966_3_3_2",
                "1 - CET 1976_8_26_1 1",
                "0 Port WE%sT 1983_8_25_1",
                "0 W-Eur WE%sT 1992_8_27_1",
                "1 EU CE%sT 1996_2_31_1",
                "0 EU WE%sT"
            ],
            "Europe/London": [
                "-0:1:15 - LMT 1847_11_1_0 -0:1:15",
                "0 GB-Eire %s 1968_9_27 1",
                "1 - BST 1971_9_31_2",
                "0 GB-Eire %s 1996",
                "0 EU GMT/BST"
            ],
            "Europe/Luxembourg": [
                "0:24:36 - LMT 1904_5 0:24:36",
                "1 Lux CE%sT 1918_10_25 1",
                "0 Lux WE%sT 1929_9_6_2",
                "0 Belgium WE%sT 1940_4_14_3 1",
                "1 C-Eur WE%sT 1944_8_18_3 2",
                "1 Belgium CE%sT 1977 1",
                "1 EU CE%sT"
            ],
            "Europe/Madrid": [
                "-0:14:44 - LMT 1901_0_1_0 -0:14:44",
                "0 Spain WE%sT 1946_8_30 2",
                "1 Spain CE%sT 1979 1",
                "1 EU CE%sT"
            ],
            "Europe/Malta": [
                "0:58:4 - LMT 1893_10_2_0 0:58:4",
                "1 Italy CE%sT 1942_10_2_2 1",
                "1 C-Eur CE%sT 1945_3_2_2 1",
                "1 Italy CE%sT 1973_2_31 1",
                "1 Malta CE%sT 1981 1",
                "1 EU CE%sT"
            ],
            "Europe/Minsk": [
                "1:50:16 - LMT 1880 1:50:16",
                "1:50 - MMT 1924_4_2 1:50",
                "2 - EET 1930_5_21 2",
                "3 - MSK 1941_5_28 3",
                "1 C-Eur CE%sT 1944_6_3 2",
                "3 Russia MSK/MSD 1990 3",
                "3 - MSK 1991_2_31_2 3",
                "3 - EEST 1991_8_29_2 2",
                "2 - EET 1992_2_29_0 2",
                "3 - EEST 1992_8_27_0 2",
                "2 Russia EE%sT 2011_2_27_2 2",
                "3 - FET"
            ],
            "Europe/Monaco": [
                "0:29:32 - LMT 1891_2_15 0:29:32",
                "0:9:21 - PMT 1911_2_11 0:9:21",
                "0 France WE%sT 1945_8_16_3 2",
                "1 France CE%sT 1977 1",
                "1 EU CE%sT"
            ],
            "Europe/Moscow": [
                "2:30:20 - LMT 1880 2:30:20",
                "2:30 - MMT 1916_6_3 2:30",
                "2:30:48 Russia %s 1919_6_1_2 4:30:48",
                "3 Russia MSK/MSD 1922_9 3",
                "2 - EET 1930_5_21 2",
                "3 Russia MSK/MSD 1991_2_31_2 3",
                "2 Russia EE%sT 1992_0_19_2 2",
                "3 Russia MSK/MSD 2011_2_27_2 3",
                "4 - MSK"
            ],
            "Europe/Oslo": [
                "0:43 - LMT 1895_0_1 0:43",
                "1 Norway CE%sT 1940_7_10_23 1",
                "1 C-Eur CE%sT 1945_3_2_2 1",
                "1 Norway CE%sT 1980 1",
                "1 EU CE%sT"
            ],
            "Europe/Paris": [
                "0:9:21 - LMT 1891_2_15_0_1 0:9:21",
                "0:9:21 - PMT 1911_2_11_0_1 0:9:21",
                "0 France WE%sT 1940_5_14_23 1",
                "1 C-Eur CE%sT 1944_7_25 2",
                "0 France WE%sT 1945_8_16_3 2",
                "1 France CE%sT 1977 1",
                "1 EU CE%sT"
            ],
            "Europe/Prague": [
                "0:57:44 - LMT 1850 0:57:44",
                "0:57:44 - PMT 1891_9 0:57:44",
                "1 C-Eur CE%sT 1944_8_17_2 1",
                "1 Czech CE%sT 1979 1",
                "1 EU CE%sT"
            ],
            "Europe/Riga": [
                "1:36:24 - LMT 1880 1:36:24",
                "1:36:24 - RMT 1918_3_15_2 1:36:24",
                "2:36:24 - LST 1918_8_16_3 2:36:24",
                "1:36:24 - RMT 1919_3_1_2 1:36:24",
                "2:36:24 - LST 1919_4_22_3 2:36:24",
                "1:36:24 - RMT 1926_4_11 1:36:24",
                "2 - EET 1940_7_5 2",
                "3 - MSK 1941_6 3",
                "1 C-Eur CE%sT 1944_9_13 1",
                "3 Russia MSK/MSD 1989_2_26_2 3",
                "3 - EEST 1989_8_24_2 2",
                "2 Latvia EE%sT 1997_0_21 2",
                "2 EU EE%sT 2000_1_29 2",
                "2 - EET 2001_0_2 2",
                "2 EU EE%sT"
            ],
            "Europe/Rome": [
                "0:49:56 - LMT 1866_8_22 0:49:56",
                "0:49:56 - RMT 1893_10_1_0 0:49:56",
                "1 Italy CE%sT 1942_10_2_2 1",
                "1 C-Eur CE%sT 1944_6 2",
                "1 Italy CE%sT 1980 1",
                "1 EU CE%sT"
            ],
            "Europe/Samara": [
                "3:20:36 - LMT 1919_6_1_2 3:20:36",
                "3 - SAMT 1930_5_21 3",
                "4 - SAMT 1935_0_27 4",
                "4 Russia KUY%sT 1989_2_26_2 4",
                "3 Russia KUY%sT 1991_2_31_2 3",
                "2 Russia KUY%sT 1991_8_29_2 2",
                "3 - KUYT 1991_9_20_3 3",
                "4 Russia SAM%sT 2010_2_28_2 4",
                "3 Russia SAM%sT 2011_2_27_2 3",
                "4 - SAMT"
            ],
            "Europe/Simferopol": [
                "2:16:24 - LMT 1880 2:16:24",
                "2:16 - SMT 1924_4_2 2:16",
                "2 - EET 1930_5_21 2",
                "3 - MSK 1941_10 3",
                "1 C-Eur CE%sT 1944_3_13 2",
                "3 Russia MSK/MSD 1990 3",
                "3 - MSK 1990_6_1_2 3",
                "2 - EET 1992 2",
                "2 E-Eur EE%sT 1994_4 3",
                "3 E-Eur MSK/MSD 1996_2_31_3 3",
                "4 - MSD 1996_9_27_3 3",
                "3 Russia MSK/MSD 1997 3",
                "3 - MSK 1997_2_30_1",
                "2 EU EE%sT"
            ],
            "Europe/Sofia": [
                "1:33:16 - LMT 1880 1:33:16",
                "1:56:56 - IMT 1894_10_30 1:56:56",
                "2 - EET 1942_10_2_3 2",
                "1 C-Eur CE%sT 1945 1",
                "1 - CET 1945_3_2_3 1",
                "2 - EET 1979_2_31_23 2",
                "2 Bulg EE%sT 1982_8_26_2 3",
                "2 C-Eur EE%sT 1991 2",
                "2 E-Eur EE%sT 1997 2",
                "2 EU EE%sT"
            ],
            "Europe/Stockholm": [
                "1:12:12 - LMT 1879_0_1 1:12:12",
                "1:0:14 - SET 1900_0_1 1:0:14",
                "1 - CET 1916_4_14_23 1",
                "2 - CEST 1916_9_1_01 2",
                "1 - CET 1980 1",
                "1 EU CE%sT"
            ],
            "Europe/Tallinn": [
                "1:39 - LMT 1880 1:39",
                "1:39 - TMT 1918_1 1:39",
                "1 C-Eur CE%sT 1919_6 1",
                "1:39 - TMT 1921_4 1:39",
                "2 - EET 1940_7_6 2",
                "3 - MSK 1941_8_15 3",
                "1 C-Eur CE%sT 1944_8_22 2",
                "3 Russia MSK/MSD 1989_2_26_2 3",
                "3 - EEST 1989_8_24_2 2",
                "2 C-Eur EE%sT 1998_8_22 3",
                "2 EU EE%sT 1999_10_1 3",
                "2 - EET 2002_1_21 2",
                "2 EU EE%sT"
            ],
            "Europe/Tirane": [
                "1:19:20 - LMT 1914 1:19:20",
                "1 - CET 1940_5_16 1",
                "1 Albania CE%sT 1984_6 2",
                "1 EU CE%sT"
            ],
            "Europe/Uzhgorod": [
                "1:29:12 - LMT 1890_9 1:29:12",
                "1 - CET 1940 1",
                "1 C-Eur CE%sT 1944_9 2",
                "2 - CEST 1944_9_26 2",
                "1 - CET 1945_5_29 1",
                "3 Russia MSK/MSD 1990 3",
                "3 - MSK 1990_6_1_2 3",
                "1 - CET 1991_2_31_3 1",
                "2 - EET 1992 2",
                "2 E-Eur EE%sT 1995 2",
                "2 EU EE%sT"
            ],
            "Europe/Vaduz": [
                "0:38:4 - LMT 1894_5 0:38:4",
                "1 - CET 1981 1",
                "1 EU CE%sT"
            ],
            "Europe/Vienna": [
                "1:5:21 - LMT 1893_3 1:5:21",
                "1 C-Eur CE%sT 1920 1",
                "1 Austria CE%sT 1940_3_1_2 1",
                "1 C-Eur CE%sT 1945_3_2_2 1",
                "2 - CEST 1945_3_12_2 1",
                "1 - CET 1946 1",
                "1 Austria CE%sT 1981 1",
                "1 EU CE%sT"
            ],
            "Europe/Vilnius": [
                "1:41:16 - LMT 1880 1:41:16",
                "1:24 - WMT 1917 1:24",
                "1:35:36 - KMT 1919_9_10 1:35:36",
                "1 - CET 1920_6_12 1",
                "2 - EET 1920_9_9 2",
                "1 - CET 1940_7_3 1",
                "3 - MSK 1941_5_24 3",
                "1 C-Eur CE%sT 1944_7 2",
                "3 Russia MSK/MSD 1991_2_31_2 3",
                "3 - EEST 1991_8_29_2 2",
                "2 C-Eur EE%sT 1998 2",
                "2 - EET 1998_2_29_1",
                "1 EU CE%sT 1999_9_31_1",
                "2 - EET 2003_0_1 2",
                "2 EU EE%sT"
            ],
            "Europe/Volgograd": [
                "2:57:40 - LMT 1920_0_3 2:57:40",
                "3 - TSAT 1925_3_6 3",
                "3 - STAT 1930_5_21 3",
                "4 - STAT 1961_10_11 4",
                "4 Russia VOL%sT 1989_2_26_2 4",
                "3 Russia VOL%sT 1991_2_31_2 3",
                "4 - VOLT 1992_2_29_2 4",
                "3 Russia VOL%sT 2011_2_27_2 3",
                "4 - VOLT"
            ],
            "Europe/Warsaw": [
                "1:24 - LMT 1880 1:24",
                "1:24 - WMT 1915_7_5 1:24",
                "1 C-Eur CE%sT 1918_8_16_3 2",
                "2 Poland EE%sT 1922_5 2",
                "1 Poland CE%sT 1940_5_23_2 1",
                "1 C-Eur CE%sT 1944_9 2",
                "1 Poland CE%sT 1977 1",
                "1 W-Eur CE%sT 1988 1",
                "1 EU CE%sT"
            ],
            "Europe/Zaporozhye": [
                "2:20:40 - LMT 1880 2:20:40",
                "2:20 - CUT 1924_4_2 2:20",
                "2 - EET 1930_5_21 2",
                "3 - MSK 1941_7_25 3",
                "1 C-Eur CE%sT 1943_9_25 1",
                "3 Russia MSK/MSD 1991_2_31_2 3",
                "2 E-Eur EE%sT 1995 2",
                "2 EU EE%sT"
            ],
            "Europe/Zurich": [
                "0:34:8 - LMT 1848_8_12 0:34:8",
                "0:29:44 - BMT 1894_5 0:29:44",
                "1 Swiss CE%sT 1981 1",
                "1 EU CE%sT"
            ],
            "HST": [
                "-10 - HST"
            ],
            "Indian/Antananarivo": [
                "3:10:4 - LMT 1911_6 3:10:4",
                "3 - EAT 1954_1_27_23 3",
                "4 - EAST 1954_4_29_23 3",
                "3 - EAT"
            ],
            "Indian/Chagos": [
                "4:49:40 - LMT 1907 4:49:40",
                "5 - IOT 1996 5",
                "6 - IOT"
            ],
            "Indian/Christmas": [
                "7:2:52 - LMT 1895_1 7:2:52",
                "7 - CXT"
            ],
            "Indian/Cocos": [
                "6:27:40 - LMT 1900 6:27:40",
                "6:30 - CCT"
            ],
            "Indian/Comoro": [
                "2:53:4 - LMT 1911_6 2:53:4",
                "3 - EAT"
            ],
            "Indian/Kerguelen": [
                "0 - zzz 1950",
                "5 - TFT"
            ],
            "Indian/Mahe": [
                "3:41:48 - LMT 1906_5 3:41:48",
                "4 - SCT"
            ],
            "Indian/Maldives": [
                "4:54 - LMT 1880 4:54",
                "4:54 - MMT 1960 4:54",
                "5 - MVT"
            ],
            "Indian/Mauritius": [
                "3:50 - LMT 1907 3:50",
                "4 Mauritius MU%sT"
            ],
            "Indian/Mayotte": [
                "3:0:56 - LMT 1911_6 3:0:56",
                "3 - EAT"
            ],
            "Indian/Reunion": [
                "3:41:52 - LMT 1911_5 3:41:52",
                "4 - RET"
            ],
            "MET": [
                "1 C-Eur ME%sT"
            ],
            "MST": [
                "-7 - MST"
            ],
            "MST7MDT": [
                "-7 US M%sT"
            ],
            "PST8PDT": [
                "-8 US P%sT"
            ],
            "Pacific/Apia": [
                "12:33:4 - LMT 1879_6_5 12:33:4",
                "-11:26:56 - LMT 1911 -11:26:56",
                "-11:30 - SAMT 1950 -11:30",
                "-11 - WST 2010_8_26 -11",
                "-10 - WSDT 2011_3_2_4 -10",
                "-11 - WST 2011_8_24_3 -11",
                "-10 - WSDT 2011_11_30 -10",
                "14 - WSDT 2012_3_1_4 14",
                "13 WS WS%sT"
            ],
            "Pacific/Auckland": [
                "11:39:4 - LMT 1868_10_2 11:39:4",
                "11:30 NZ NZ%sT 1946_0_1 12",
                "12 NZ NZ%sT"
            ],
            "Pacific/Chatham": [
                "12:13:48 - LMT 1957_0_1 12:13:48",
                "12:45 Chatham CHA%sT"
            ],
            "Pacific/Chuuk": [
                "10:7:8 - LMT 1901 10:7:8",
                "10 - CHUT"
            ],
            "Pacific/Easter": [
                "-7:17:44 - LMT 1890 -7:17:44",
                "-7:17:28 - EMT 1932_8 -7:17:28",
                "-7 Chile EAS%sT 1982_2_13_21 -6",
                "-6 Chile EAS%sT"
            ],
            "Pacific/Efate": [
                "11:13:16 - LMT 1912_0_13 11:13:16",
                "11 Vanuatu VU%sT"
            ],
            "Pacific/Enderbury": [
                "-11:24:20 - LMT 1901 -11:24:20",
                "-12 - PHOT 1979_9 -12",
                "-11 - PHOT 1995 -11",
                "13 - PHOT"
            ],
            "Pacific/Fakaofo": [
                "-11:24:56 - LMT 1901 -11:24:56",
                "-11 - TKT 2011_11_30 -11",
                "13 - TKT"
            ],
            "Pacific/Fiji": [
                "11:55:44 - LMT 1915_9_26 11:55:44",
                "12 Fiji FJ%sT"
            ],
            "Pacific/Funafuti": [
                "11:56:52 - LMT 1901 11:56:52",
                "12 - TVT"
            ],
            "Pacific/Galapagos": [
                "-5:58:24 - LMT 1931 -5:58:24",
                "-5 - ECT 1986 -5",
                "-6 - GALT"
            ],
            "Pacific/Gambier": [
                "-8:59:48 - LMT 1912_9 -8:59:48",
                "-9 - GAMT"
            ],
            "Pacific/Guadalcanal": [
                "10:39:48 - LMT 1912_9 10:39:48",
                "11 - SBT"
            ],
            "Pacific/Guam": [
                "-14:21 - LMT 1844_11_31 -14:21",
                "9:39 - LMT 1901 9:39",
                "10 - GST 2000_11_23 10",
                "10 - ChST"
            ],
            "Pacific/Honolulu": [
                "-10:31:26 - LMT 1896_0_13_12 -10:31:26",
                "-10:30 - HST 1933_3_30_2 -10:30",
                "-9:30 - HDT 1933_4_21_12 -9:30",
                "-10:30 - HST 1942_1_09_2 -10:30",
                "-9:30 - HDT 1945_8_30_2 -9:30",
                "-10:30 - HST 1947_5_8_2 -10:30",
                "-10 - HST"
            ],
            "Pacific/Johnston": [
                "-10 - HST"
            ],
            "Pacific/Kiritimati": [
                "-10:29:20 - LMT 1901 -10:29:20",
                "-10:40 - LINT 1979_9 -10:40",
                "-10 - LINT 1995 -10",
                "14 - LINT"
            ],
            "Pacific/Kosrae": [
                "10:51:56 - LMT 1901 10:51:56",
                "11 - KOST 1969_9 11",
                "12 - KOST 1999 12",
                "11 - KOST"
            ],
            "Pacific/Kwajalein": [
                "11:9:20 - LMT 1901 11:9:20",
                "11 - MHT 1969_9 11",
                "-12 - KWAT 1993_7_20 -12",
                "12 - MHT"
            ],
            "Pacific/Majuro": [
                "11:24:48 - LMT 1901 11:24:48",
                "11 - MHT 1969_9 11",
                "12 - MHT"
            ],
            "Pacific/Marquesas": [
                "-9:18 - LMT 1912_9 -9:18",
                "-9:30 - MART"
            ],
            "Pacific/Midway": [
                "-11:49:28 - LMT 1901 -11:49:28",
                "-11 - NST 1956_5_3 -11",
                "-10 - NDT 1956_8_2 -10",
                "-11 - NST 1967_3 -11",
                "-11 - BST 1983_10_30 -11",
                "-11 - SST"
            ],
            "Pacific/Nauru": [
                "11:7:40 - LMT 1921_0_15 11:7:40",
                "11:30 - NRT 1942_2_15 11:30",
                "9 - JST 1944_7_15 9",
                "11:30 - NRT 1979_4 11:30",
                "12 - NRT"
            ],
            "Pacific/Niue": [
                "-11:19:40 - LMT 1901 -11:19:40",
                "-11:20 - NUT 1951 -11:20",
                "-11:30 - NUT 1978_9_1 -11:30",
                "-11 - NUT"
            ],
            "Pacific/Norfolk": [
                "11:11:52 - LMT 1901 11:11:52",
                "11:12 - NMT 1951 11:12",
                "11:30 - NFT"
            ],
            "Pacific/Noumea": [
                "11:5:48 - LMT 1912_0_13 11:5:48",
                "11 NC NC%sT"
            ],
            "Pacific/Pago_Pago": [
                "12:37:12 - LMT 1879_6_5 12:37:12",
                "-11:22:48 - LMT 1911 -11:22:48",
                "-11:30 - SAMT 1950 -11:30",
                "-11 - NST 1967_3 -11",
                "-11 - BST 1983_10_30 -11",
                "-11 - SST"
            ],
            "Pacific/Palau": [
                "8:57:56 - LMT 1901 8:57:56",
                "9 - PWT"
            ],
            "Pacific/Pitcairn": [
                "-8:40:20 - LMT 1901 -8:40:20",
                "-8:30 - PNT 1998_3_27_00 -8:30",
                "-8 - PST"
            ],
            "Pacific/Pohnpei": [
                "10:32:52 - LMT 1901 10:32:52",
                "11 - PONT"
            ],
            "Pacific/Port_Moresby": [
                "9:48:40 - LMT 1880 9:48:40",
                "9:48:32 - PMMT 1895 9:48:32",
                "10 - PGT"
            ],
            "Pacific/Rarotonga": [
                "-10:39:4 - LMT 1901 -10:39:4",
                "-10:30 - CKT 1978_10_12 -10:30",
                "-10 Cook CK%sT"
            ],
            "Pacific/Saipan": [
                "-14:17 - LMT 1844_11_31 -14:17",
                "9:43 - LMT 1901 9:43",
                "9 - MPT 1969_9 9",
                "10 - MPT 2000_11_23 10",
                "10 - ChST"
            ],
            "Pacific/Tahiti": [
                "-9:58:16 - LMT 1912_9 -9:58:16",
                "-10 - TAHT"
            ],
            "Pacific/Tarawa": [
                "11:32:4 - LMT 1901 11:32:4",
                "12 - GILT"
            ],
            "Pacific/Tongatapu": [
                "12:19:20 - LMT 1901 12:19:20",
                "12:20 - TOT 1941 12:20",
                "13 - TOT 1999 13",
                "13 Tonga TO%sT"
            ],
            "Pacific/Wake": [
                "11:6:28 - LMT 1901 11:6:28",
                "12 - WAKT"
            ],
            "Pacific/Wallis": [
                "12:15:20 - LMT 1901 12:15:20",
                "12 - WFT"
            ],
            "WET": [
                "0 EU WE%sT"
            ]
        }
    }
    moment.tz.add(window.momentTZData);
}());
