# addin-iox-output

This example demonstrates how to send a message to a device, turning the IOX on or off.

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "IOX Output",
  "supportEmail": "support@geotab.com",
  "version": "1.1.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-iox-output/dist/ioxOutput.html",
    "path": "AdministrationLink/",
    "menuName": {
      "en": "IOX Output"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-iox-output/dist/images/icon.svg"
  }]
}
```
