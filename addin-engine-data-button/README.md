# addin-engine-data-button

This example demonstrates an add-in button on the vehicle page which pulls the currently selected vehicle ID from state. The ID to redirect to the engine data profile page to examine the recorded engine speed, voltage and fuel used.

## Getting Started

This add-in was developed using [generator-addin](https://github.com/Geotab/generator-addin) to allow local developmented and testing.

* Install [nodejs](https://nodejs.org/en/) latest LTS
* Install dependencies: `npm install -g gulp-cli bower`
* Clone the samples repository `git clone https://github.com/Geotab/sdk-addin-samples.git sdk-addin-samples`
* Naviagte to the working directory `cd sdk-addin-samples/addin-engine-data-button`
* Run the sample `> gulp serve`

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Engine Data Button",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "page": "device",
    "click": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-engine-data-button/dist/scripts/engineDataButton.js",
    "buttonName": {
      "en": "Engine Data Profile",
      "fr": "Profil des données-moteur",
      "es": "Perfil de datos de motor",
      "ja": "エンジンデータプロフィール"
    },
    "icon": "https://cdn.rawgit.com/Geotab/sdk-addin-samples/master/addin-engine-data-button/dist/images/icon.svg"
  }]
}
```
