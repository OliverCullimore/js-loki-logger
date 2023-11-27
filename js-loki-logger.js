/**
 * LokiLogger overrides the console and sends logs to Loki
 * @param {Object} options The configuration options to use
 *
 * @example
 * LokiLogger({
 *     url: 'http://localhost:63342/api/prom/push',
 *     labels: {
 *         env: 'development',
 *         app: 'js-loki-logger-example'
 *     },
 *     flushInterval: 10000,
 *     logLevel: 'debug'
 * });
 */
(function (window, undefined) {
    window.LokiLogger = function (options) {
        // Set defaults
        const logLevel = {
            'debug': 0,
            'info': 1,
            'warn': 2,
            'error': 3
        };
        const defaultOptions = {
            url: 'http://loki/api/prom/push', // Loki URL
            labels: {
                env: 'development',
                app: 'js-loki-logger-example'
            },
            flushInterval: 10000, // Flush interval in milliseconds
            logLevel: 'debug' // One of debug, info, warn, error
        };
        let entries = [];

        // Configure options
        options = {...defaultOptions, ...options};

        // Flush log entries to Loki
        const _flush = async () => {
            if (!entries.length) {
                return;
            }

            const {url, labels} = options;

            const data = {
                streams: [
                    {
                        labels,
                        entries: [...entries]
                    }
                ]
            }

            entries = [];

            let xhr = new XMLHttpRequest();

            xhr.open('POST', url);
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.send(JSON.stringify(data));

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status !== 204) {
                        console.error(xhr.responseText)
                    }
                }
            }
        }

        // Log to Loki
        const log = function (level, line) {
            // Add to entries if log level allows
            if (logLevel[options.logLevel] <= level) {
                entries.push({line, ts: (new Date()).toISOString()});
            }
        }

        // Override console.log
        console.defaultLog = console.log.bind(console);
        console.log = function () {
            // Output to default console
            console.defaultLog.apply(console, arguments);
            // Then log to Loki
            log(logLevel.info, `INFO: ${Array.from(arguments)}`);
        }

        // Override console.error
        console.defaultError = console.error.bind(console);
        console.error = function () {
            // Output to default console
            console.defaultError.apply(console, arguments);
            // Then log to Loki
            log(logLevel.error, `ERROR: ${Array.from(arguments)}`);
        }

        // Override console.warn
        console.defaultWarn = console.warn.bind(console);
        console.warn = function () {
            // Output to default console
            console.defaultWarn.apply(console, arguments);
            // Then log to Loki
            log(logLevel.warn, `WARN: ${Array.from(arguments)}`);
        }

        // Override console.debug
        console.defaultDebug = console.debug.bind(console);
        console.debug = function () {
            // Output to default console
            console.defaultDebug.apply(console, arguments);
            // Then log to Loki
            log(logLevel.debug, `DEBUG: ${Array.from(arguments)}`);
        }

        // Flush logs on interval
        if (!window.lokiFlushInterval) {
            window.lokiFlushInterval = setInterval(async () => await _flush(), options.flushInterval);
        }
    };
})(window);