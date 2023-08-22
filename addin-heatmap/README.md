# addin-heatmap
This add-in is visualizes the location history of a vehicle by displaying areas of "heat" on a map corresponding to the frequency in which they were at a certain location using [leaflet](http://leafletjs.com/) and [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat).

## Installation
Add the configuration below to the to the system setting -> add-ins section of the MyGeotab database

```json
{
  "name": "Heat Map",
  "supportEmail": "support@geotab.com",
  "version": "1.0.0",
  "items": [{
    "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/heatmap.html",
    "path": "ActivityLink/",
    "menuName": {
      "en": "Heat Map"
    },
    "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/images/icon.svg"
  }]
}
```