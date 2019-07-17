# addin-iox-output

This example demonstrates how to send a message to a device, turning the IOX on or off.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `npm install -g gulp-cli bower`
* Clone the samples repository `git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `cd sdk-addin-samples/addin-iox-output`
* Run the sample `> gulp serve`

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "IOX Output",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
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
