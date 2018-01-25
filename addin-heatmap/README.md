# addin-heatmap
This add-in is visualizes the location history of a vehicle by displaying areas of "heat" on a map corresponding to the frequency in which they were at a certain location using [leaflet](http://leafletjs.com/) and [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat).

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `npm install -g gulp-cli bower`
* Clone the samples repository `git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `cd sdk-addin-samples/addin-heatmap`
* Restore packages using `npm install` and `bower install`
* Run the sample `gulp serve`

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
