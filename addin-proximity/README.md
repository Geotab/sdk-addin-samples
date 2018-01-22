# addin-proximity

This add-in demonstrates a visual report for determining whether a vehicle has been to or near a particular location in a given date range.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `> `npm install -g gulp-cli bower``
* Clone the samples repository `> git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `> cd sdk-addin-samples/addin-proximity`
* Run the sample `> gulp serve`

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Proximity",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-proximity/dist/proximity.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Proximity"
    },
    "icon": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-proximity/dist/images/icon.svg"
  }]
}
```