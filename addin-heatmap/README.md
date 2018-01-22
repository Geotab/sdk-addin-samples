# addin-heatmap
This example demonstrates an add-in to visualize location history using a heat map.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `npm install -g gulp-cli bower`
* Clone the samples repository `git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `cd sdk-addin-samples/addin-heatmap`
* Run the sample `> gulp serve`

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Heat Map",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-heatmap/dist/heatmap.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Heat Map"
    },
    "icon": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-heatmap/dist/images/icon.svg"
  }]
}
```
