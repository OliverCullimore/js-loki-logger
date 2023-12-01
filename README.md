[![License](https://img.shields.io/github/license/OliverCullimore/js-loki-logger?style=for-the-badge)](https://github.com/OliverCullimore/js-loki-logger/blob/main/LICENSE)

# JS Loki Logger

Pure Javascript standalone logger for Loki.

## Example Usage
```html
<script src="js-loki-logger.js"></script>
<script>
    // Init Loki Logger
    LokiLogger({
        url: "http://LOKI_HOSTNAME/api/prom/push",
        labels: {
            env: "development",
            app: "js-loki-logger-example"
        },
        batchInterval: 10000, // Batch interval (milliseconds)
        logLevel: 'debug' // Log level (debug/info/warn/error)
    });
</script>
```

## Credits

https://github.com/nwehr/prompush

https://stackoverflow.com/questions/19846078/how-to-read-from-chromes-console-in-javascript