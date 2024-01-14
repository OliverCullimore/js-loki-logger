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
 * });
 */
(function (window, undefined) {
    window.LokiLogger = function (options) {
        // Set defaults
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
        const log = function (line) {
            // Add to entries
            entries.push([((new Date()).getTime() * 1000000).toString(), line]);
        }

        // Listen for window.onerror events
        window.onerror = function (msg, url, lineNo, columnNo, error) {
            log(`ERROR: ${msg} ${url} ${lineNo}:${columnNo} ${error}`);
            return false;
        }

        // Flush logs on interval
        if (!window.lokibatchInterval) {
            window.lokibatchInterval = setInterval(async () => await _flush(), options.batchInterval);
        }
    };
})(window);