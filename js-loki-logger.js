/**
 * LokiLogger overrides the console and sends logs to Loki
 * @param {Object} options The configuration options to use
 *
 * @example
 * LokiLogger({
 *     url: 'http://LOKI_HOSTNAME/loki/api/v1/push', // required (Loki push URL)
 *     labels: {
 *         job: "browser-console-logs",
 *         host: window.location.host !== undefined ? window.location.host : '',
 *         url: window.location.href !== undefined ? window.location.href : '',
 *         referrer: document.referrer !== undefined ? document.referrer : '',
 *         user_agent: window.navigator.userAgent !== undefined ? window.navigator.userAgent : ''
 *     }, // optional
 *     batchInterval: 10000, // optional (milliseconds)
 *     logLevel: 'debug' // optional (debug/info/warn/error)
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
            url: 'http://LOKI_HOSTNAME/loki/api/v1/push', // Loki URL
            labels: {
                job: "browser-console-logs",
                host: window.location.host !== undefined ? window.location.host : '',
                url: window.location.href !== undefined ? window.location.href : '',
                referrer: document.referrer !== undefined ? document.referrer : '',
                user_agent: window.navigator.userAgent !== undefined ? window.navigator.userAgent : ''
            }, // Labels to send with all log entries
            batchInterval: 10000, // Batch interval (milliseconds)
            logLevel: 'info' // Log level (debug/info/warn/error)
        };
        let entries = [];
        let lokiReady = false;

        // Configure options
        options = {...defaultOptions, ...options};

        // Check Loki is ready to receive requests
        const _checkLokiReady = async () => {
            const {url} = options;

            let xhr = new XMLHttpRequest();

            xhr.open('GET', url.replace('/loki/api/v1/push', '/ready'));
            xhr.send();

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status !== 200) {
                        console.debug("Loki not ready: " + xhr.responseText);
                    } else {
                        lokiReady = true;
                    }
                }
            }
        }

        // Flush log entries to Loki
        const _flush = async () => {
            if (!entries.length) {
                return;
            }

            if (!lokiReady) {
                await _checkLokiReady();
            }

            const {url, labels} = options;

            const data = {
                streams: [
                    {
                        stream: labels,
                        values: [...entries]
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
                        console.error(xhr.responseText);
                    }
                }
            }
        }

        // Log to Loki
        const log = function (level, line) {
            // Add to entries if log level allows
            if (logLevel[options.logLevel] <= level) {
                entries.push([((new Date()).getTime() * 1000000).toString(), line]);
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
        if (!window.lokibatchInterval) {
            window.lokibatchInterval = setInterval(async () => await _flush(), options.batchInterval);
        }
    };
})(window);