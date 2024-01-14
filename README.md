[![License](https://img.shields.io/github/license/OliverCullimore/js-loki-logger?style=for-the-badge)](https://github.com/OliverCullimore/js-loki-logger/blob/main/LICENSE)

# JS Loki Logger

Pure Javascript standalone logger for Loki.

## Quick Start
```html
<script src="js-loki-logger.js"></script>
<script>
    // Init Loki Logger using default options
    LokiLogger({
        url: 'http://LOKI_HOSTNAME/loki/api/v1/push', // Loki push URL (required)
    });
</script>
```

## Example Usage
Refer to the [example](/example) folder

## Credits

https://github.com/nwehr/prompush

https://stackoverflow.com/questions/19846078/how-to-read-from-chromes-console-in-javascript