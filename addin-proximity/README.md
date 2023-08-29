# addin-proximity

This add-in demonstrates a visual report for determining whether a vehicle has been to or near a particular location in a given date range.

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Proximity",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-proximity/dist/proximity.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Proximity"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-proximity/dist/images/icon.svg"
  }]
}
```