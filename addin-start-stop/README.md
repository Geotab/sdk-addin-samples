# addin-start-stop

This add-in demonstrates an informational display add-in which provides an estimate of fuel savings for vehicles which have stop-start systems. The number of stop/starts, idling time and estimated fuel saved are provided for the previous month and year for the selected vehicle.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `> `npm install -g gulp-cli bower``
* Clone the samples repository `> git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `> cd sdk-addin-samples/addin-start-stop`
* Run the sample `> gulp serve`

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Start Stop",
  "supportEmail": "support@geotab.com",
  "version": "0.0.1",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-start-stop/dist/startStop.html",
    "path": "EngineMaintenanceLink/",
    "menuName": {
      "en": "Start-Stop Savings"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-start-stop/dist/images/icon.svg"
  }]
}
```