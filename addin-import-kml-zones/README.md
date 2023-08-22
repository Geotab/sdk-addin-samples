# addin-import-kml-zones

This example demonstrates an add-in which parses a [KML file](https://developers.google.com/kml/documentation/) and imports to MyGeotab as Zones.

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Import KML Zones",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-import-kml-zones/dist/importKmlZones.html",
    "path": "ZoneAndMessagesLink/",
    "menuName": {
      "en": "Import KML Zones"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-import-kml-zones/dist/images/icon.svg"
  }]
}
```
