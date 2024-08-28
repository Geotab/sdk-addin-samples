# sdk-addin-samples [![Build Status](https://travis-ci.org/Geotab/sdk-addin-samples.svg?branch=master)](https://travis-ci.org/Geotab/sdk-addin-samples)

> A collection of samples demonstrating how to build MyGeotab and Geotab Drive add-ins.

## How to run the examples

In order to run these examples, you can clone this repo, go into each of the examples and follow the instructions in the README.md file.

Alternatively, you can install the add-ins on your production database individually using the install configuration as described in each subfolder README.md or to install all the examples under one navigation section in your demo database use the installation settings below.

```json
{
    "name": "SDK Add-In Samples",
    "supportEmail": "support@geotab.com",
    "version": "1.0.0",
    "items": [
        {
            "path": "/",
            "menuId": "sdkAddinsLink",
            "menuName": {
                "en": "Add-In Samples"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/icon.svg"
        },
        {
            "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/heatmap.html",
            "path": "sdkAddinsLink/",
            "menuName": {
                "en": "Heat Map"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-heatmap/dist/images/icon.svg"
        },
        {
            "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-trips-timeline/dist/tripsTimeline.html",
            "path": "sdkAddinsLink/",
            "menuName": {
                "en": "Trips Timeline"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-trips-timeline/dist/images/icon.svg"
        },
        {
            "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-import-kml-zones/dist/importKmlZones.html",
            "path": "sdkAddinsLink/",
            "menuName": {
                "en": "Import KML Zones"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-import-kml-zones/dist/images/icon.svg"
        },
        {
            "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-start-stop/dist/startStop.html",
            "path": "sdkAddinsLink/",
            "menuName": {
                "en": "Start-Stop Savings"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-start-stop/dist/images/icon.svg"
        },
        {
            "url": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-iox-output/dist/ioxOutput.html",
            "path": "sdkAddinsLink/",
            "menuName": {
                "en": "IOX Output"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-iox-output/dist/images/icon.svg"
        },
        {
            "page": "device",
            "click": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-engine-data-button/dist/scripts/engineDataButton.js",
            "buttonName": {
                "en": "Engine Data Profile",
                "fr": "Profil des données-moteur",
                "es": "Perfil de datos de motor",
                "ja": "エンジンデータプロフィール"
            },
            "icon": "https://cdn.jsdelivr.net/gh/Geotab/sdk-addin-samples@master/addin-engine-data-button/dist/images/icon.svg"
        }
    ],
    "isSigned": false
}

```

## MyGeotab Page Examples

### Heatmap

This add-in visualizes the location history of a vehicle by displaying areas of "heat" on a map corresponding to the frequency in which they were at a certain location using [leaflet](http://leafletjs.com/) and [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat).

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-heatmap)

### Storage API Sample Add-in

The purpose of this add-in is to show an example on how to use the AddInData API Calls. It features a to-do list that allows a user in MyGeotab to add new tasks and mark them as complete.

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/storage-api-sample)

## Trips Timeline

This add-in demonstrates a compact visualization of the times vehicles made their trips throughout the day using [vis.js](http://visjs.org/).

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-trips-timeline)

### Start Stop Savings

This add-in demonstrates an informational display add-in which provides an estimate of fuel savings for vehicles which have stop-start systems.

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-start-stop)

### Import KML Zones

This example demonstrates an add-in which parses a [KML file](https://developers.google.com/kml/documentation/) and imports to MyGeotab as Zones.

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-import-kml-zones)

### IOX Output

This example demonstrates how to send a message to a device, turning the IOX on or off.

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-iox-output)

## MyGeotab Button Examples

### Engine Data Button

This example demonstrates an add-in button on the vehicle page which pulls the currently selected vehicle Id from state. The Id is used to redirect to the engine data profile page to examine the vehicle's recorded engine speed, voltage and fuel used.

[Source](https://github.com/Geotab/sdk-addin-samples/tree/master/addin-engine-data-button)
