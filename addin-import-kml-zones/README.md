# addin-import-kml-zones
This example demonstrates an add-in which parses a [KML file](https://developers.google.com/kml/documentation/) and imports to MyGeotab as Zones.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: npm install -g yo gulp-cli bower
* Clone the samples repository 'git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples
* Naviagte to the working directory `cd sdk-addin-samples/addin-import-kml-zones`
* Run the sample `> gulp serve`

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Import KML Zones",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-import-kml-zones/dist/importKmlZones.html",
    "path": "ZoneAndMessagesLink/",
    "menuName": {
      "en": "Import KML Zones"
    },
    "icon": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-import-kml-zones/dist/images/icon.svg"
  }]
}
```