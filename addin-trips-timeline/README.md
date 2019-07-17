# addin-trips-timeline

This add-in demonstrates a compact visualization of the times vehicles made their trips throughout the day using [vis.js](http://visjs.org/). Scroll through the trips taken by the vehicles over time in a grid format which shows the start and stop of the trip. Selection can be narrowed down based on groups. The user can then select a particular trip and view the trip history of that vehicle for the day selected.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `> `npm install -g gulp-cli bower``
* Clone the samples repository `> git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `> cd sdk-addin-samples/addin-trips-timelinw`
* Run the sample `> gulp serve`

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Trips Timeline",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-trips-timeline/dist/tripsTimeline.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Trips Timeline"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-trips-timeline/dist/images/icon.svg"
  }]
}
```