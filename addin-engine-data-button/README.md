# addin-engine-data-button

This example demonstrates an add-in button on the vehicle page which pulls the currently selected vehicle ID from state. The ID to redirect to the engine data profile page to examine the recorded engine speed, voltage and fuel used.

## Installation

Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Engine Data Button",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "page": "device",
    "click": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-engine-data-button/dist/scripts/engineDataButton.js",
    "buttonName": {
      "en": "Engine Data Profile",
      "fr": "Profil des données-moteur",
      "es": "Perfil de datos de motor",
      "ja": "エンジンデータプロフィール"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-engine-data-button/dist/images/icon.svg"
  }]
}
```