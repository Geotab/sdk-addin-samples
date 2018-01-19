/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.proximity = () => {
    'use strict';

    let api;

    let map;

    let markers;

    let vehicleMultiselect;
    let elAddressInput;
    let elVehicleSelect;
    let elVehicleMultiSelectContainer;
    let elDateFromInput;
    let elDateToInput;
    let elError;
    let elLoading;

    let radiusFactor = 250;
    let deviceLookup = {};
    let selected = [];
    let isUserMetric = true;
    let selectAll = false;

    /**
     *  Logs messages to the UI
     *  @param {string} message The message to display
     */
    let logger = message => {
        elError.innerHTML = message;
    };

    /**
     *  Toggles loading "spinner"
     *  @param {booleab} show [true] to show loading, otherwiase [false]
     */
    let toggleLoading = show => {
        if (show) {
            elLoading.style.display = 'block';
        } else {
            setTimeout(() => {
                elLoading.style.display = 'none';
            }, 600);
        }
    };

    /**
     *  Get localized measurment for user
     *  @param {number} metres The the distance in meters
     */
    let getLocalMetreEquivalent = metres => {
        return metres * (isUserMetric ? 1 : 1.09361);
    };

    /**
     *  Creates a marker for the map
     *  @param {object} coordinate The coords of the marker
     */
    let buildMarker = coordinate => {
        return new L.Marker(coordinate, {
            icon: new L.DivIcon({
                className: 'map-icon',
                iconSize: [16, 16]
            })
        });
    };

    /**
     *  Add a marker to the map
     *  @param {object} logRecord The logrecord with coords and distance
     */
    let addMarker = logRecord => {
        let coordinate = new L.LatLng(logRecord.latitude, logRecord.longitude);
        let distance = logRecord.distance;
        let marker = buildMarker(coordinate);
        let d = new Date(logRecord.dateTime);

        marker.bindTooltip(`${deviceLookup[logRecord.device.id].name} was ${Math.floor(getLocalMetreEquivalent(distance))} ${(isUserMetric ? ' m' : ' yd')} away on ${d.toDateString()} at ${d.toTimeString()}`);
        markers.addLayer(marker);
    };

    /**
     *  Clear the map
     */
    let clearMap = () => {
        markers.clearLayers();
    };

    /**
     *  Calculates and renders proximity from inputs
     */
    let displayProximity = () => {
        logger('');

        if (elAddressInput.value === '') {
            return;
        }

        if (!selectAll && selected.length === 0) {
            logger('Select at least one vehicle to display');
            return;
        }

        let dateFrom = new Date(elDateFromInput.value + ':00Z');
        let utcFrom = new Date(dateFrom.setMinutes(dateFrom.getMinutes() + new Date().getTimezoneOffset())).toISOString();
        let dateTo = new Date(elDateToInput.value + ':00Z');
        let utcTo = new Date(dateTo.setMinutes(dateTo.getMinutes() + new Date().getTimezoneOffset())).toISOString();

        clearMap();
        toggleLoading(true);

        api.call('GetCoordinates', {
            addresses: [elAddressInput.value]
        }, result => {
            if (!result || result.length < 1 || !result[0]) {
                logger('Could not find the address');
                toggleLoading(false);
                return;
            }

            let filterLogsByDistance = logs => {
                const maxRadius = 5 * radiusFactor;

                return logs.filter(log => {
                    return log.distance < maxRadius;
                });
            };

            let render = logs => {
                if (logs.length > 0) {
                    logger(`There were ${logs.length} locations recorded nearby to ${elAddressInput.value}.`);
                } else {
                    logger('There was no one near this area during this time frame.');
                }

                logs.forEach(addMarker);

                toggleLoading(false);
            };

            let buildGetRequest = (id, fromDate, toDate) => {
                return ['Get', {
                    typeName: 'LogRecord',
                    search: {
                        deviceSearch: {
                            id: id
                        },
                        fromDate: fromDate,
                        toDate: toDate
                    }
                }];
            };

            let flattenArrays = arrayOfArrays => {
                return arrayOfArrays.reduce((combinedArray, currentArray) => {
                    return combinedArray.concat(currentArray);
                }, []);
            };

            let createCircle = (longitude, latitude, radius, color, opacity) => {
                return new L.Circle([latitude, longitude], radius, {
                    stroke: false,
                    fillColor: color,
                    fillOpacity: opacity
                });
            };

            let boundary1 = createCircle(result[0].x, result[0].y, 1 * radiusFactor, '#ff4444', 0.3),
                boundary2 = createCircle(result[0].x, result[0].y, 2 * radiusFactor, '#ff8800', 0.3),
                boundary3 = createCircle(result[0].x, result[0].y, 3 * radiusFactor, '#ff8800', 0.3),
                boundary4 = createCircle(result[0].x, result[0].y, 4 * radiusFactor, '#99cc00', 0.3),
                boundary5 = createCircle(result[0].x, result[0].y, 5 * radiusFactor, '#33b5e5', 0.3);

            let center = { latitude: result[0].y, longitude: result[0].x };
            // hack for ie9, global is missing
            window.geotabHeatMap = window.geotabHeatMap || {};
            window.geotabHeatMap.center = center;

            // setup map
            map.setView(new L.LatLng(center.latitude, center.longitude), 14);

            boundary5.addTo(map);
            boundary4.addTo(map);
            boundary3.addTo(map);
            boundary2.addTo(map);
            boundary1.addTo(map);

            // compile selected devices devices
            let devicesToQuery = selectAll ? Object.keys(deviceLookup).map(device => {
                return deviceLookup[device];
            }) : selected.map(id => {
                return { id: id };
            });

            let calls = devicesToQuery.map(device => {
                return buildGetRequest(device.id, utcFrom, utcTo);
            });

            api.multiCall(calls, results => {
                let parallel = new Parallel(flattenArrays(results), {
                    env: {
                        center: center
                    }
                });
                let getDistance = logRecord => {
                    // hack for ie9, global is missing
                    let centerPoint = typeof window !== 'undefined' ? window.geotabHeatMap.center : global.env.center;
                    let toRadians = d => {
                        return d * (Math.PI / 180.0);
                    };
                    let dLat = toRadians(centerPoint.latitude - logRecord.latitude);
                    let dLon = toRadians(centerPoint.longitude - logRecord.longitude);
                    let a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) + Math.cos(toRadians(logRecord.latitude)) * Math.cos(toRadians(centerPoint.latitude)) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
                    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    logRecord.distance = 6371000.0 * c;
                    return logRecord;
                };

                parallel
                    .map(getDistance)
                    .then(filterLogsByDistance)
                    .then(render);

            }, error => {
                logger(error);
                toggleLoading(false);
            });
        }, error => {
            logger(error);
            toggleLoading(false);
        });
    };

    /**
     *  Initializes the add-in (first load only)
     *  @param {boolean} isMetric The user's unit of measure
     *  @param {object} coords The coordinates to center the map on
     */
    let initializeInterface = (isMetric, coords) => {
        let sizeChanged = rawRadius => {
            let localizedRadius = getLocalMetreEquivalent(rawRadius * 5);
            let roundedRadius;
            let unit;

            radiusFactor = rawRadius;
            if (isMetric && localizedRadius >= 1000) {
                roundedRadius = Number(Math.round((localizedRadius / 1000.0) + 'e1') + 'e-1');
                unit = 'km';
            } else if (!isMetric && localizedRadius >= 1760) {
                // http://www.jacklmoore.com/notes/rounding-in-javascript/
                roundedRadius = Number(Math.round((localizedRadius / 1760.0) + 'e1') + 'e-1');
                unit = 'mi';
            } else {
                roundedRadius = Math.round(localizedRadius);
                unit = isMetric ? ' m' : ' yd';
            }
            document.getElementById('proximity-size-label').innerHTML = '(' + roundedRadius + ' ' + unit + ')';
        };

        isUserMetric = isMetric;

        // setup the map
        map = new L.Map('proximity-map', {
            center: new L.LatLng(coords.latitude, coords.longitude),
            zoom: 9
        });

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2VvdGFiIiwiYSI6ImNpd2NlaW02MjAxc28yeW9idTR3dmRxdTMifQ.ZH0koA2g2YMMBOcx6EYbwQ').addTo(map);

        markers = L.layerGroup().addTo(map);

        // DOM elements used more than once
        elAddressInput = document.getElementById('proximity-address');
        elVehicleSelect = document.getElementById('proximity-vehicles');
        elDateFromInput = document.getElementById('proximity-from');
        elDateToInput = document.getElementById('proximity-to');
        elError = document.getElementById('proximity-error');
        elLoading = document.getElementById('proximity-loading');
        elVehicleMultiSelectContainer = document.getElementById('proximity-div-vehicles');

        // date inputs
        let now = new Date();
        let dd = now.getDate();
        let mm = now.getMonth() + 1;
        let yy = now.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }

        elDateFromInput.value = yy + '-' + mm + '-' + dd + 'T' + '00:00';
        elDateToInput.value = yy + '-' + mm + '-' + dd + 'T' + '23:59';

        // initalize range
        sizeChanged(300);

        // initialize multiselect/autocomplte
        vehicleMultiselect = new Choices(elVehicleSelect, { removeItemButton: true });

        // events
        vehicleMultiselect.passedElement.addEventListener('change', () => {
            selected = vehicleMultiselect.getValue().map(value => {
                return value.value;
            });
            displayProximity();
        });

        elAddressInput.addEventListener('keydown', event => {
            if (event.keyCode === 13) {
                displayProximity();
            }
        });

        document.getElementById('proximity-size').addEventListener('change', event => {
            sizeChanged(event.target.value);
            displayProximity();
        });

        document.getElementById('proximity-select-all').addEventListener('change', event => {
            event.preventDefault();

            selectAll = !selectAll;

            elVehicleMultiSelectContainer.style.display = selectAll ? 'none' : 'block';

            displayProximity();
        });

        elDateFromInput.addEventListener('change', event => {
            event.preventDefault();

            displayProximity();
        });

        elDateToInput.addEventListener('change', event => {
            event.preventDefault();

            displayProximity();
        });
    };

    /**
     *  Retrieves if the current user is metric or not
     *  @param {Function} callback The function to call when complete
     */
    let getUserIsMetric = callback => {
        if (!callback) {
            throw new Error(`'callback' is null or undefined`);
        }

        api.getSession(token => {
            if (token && token.userName) {
                api.call('Get', {
                    typeName: 'User',
                    search: {
                        name: token.userName
                    }
                }, result => {
                    callback(result.length > 0 && !!result[0].isMetric);
                }, () => {
                    callback(false);
                });
            }
        }, false);
    };

    return {
        /**
         * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
         * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
         * is ready for the user.
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         * @param {function} callback - Call this when your initialize route is complete. Since your initialize routine
         *        might be doing asynchronous operations, you must call this method when the Add-In is ready
         *        for display to the user.
         */
        initialize(freshApi, freshState, callback) {
            api = freshApi;

            getUserIsMetric(isMetric => {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(position => {
                        initializeInterface(isMetric, position.coords);
                        callback();
                    });
                } else {
                    initializeInterface(isMetric, { longitude: -79.709441, latitude: 43.434497 });
                    callback();
                }
            });
        },

        /**
         * focus() is called whenever the Add-In receives focus.
         *
         * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
         * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
         * the global state of the MyGeotab application changes, for example, if the user changes the global group
         * filter in the UI.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        focus(freshApi, freshState) {
            toggleLoading(true);

            api = freshApi;

            api.call('Get', {
                typeName: 'Device',
                resultsLimit: 1000,
                search: {
                    fromDate: new Date().toISOString(),
                    groups: freshState.getGroupFilter()
                }
            }, devices => {
                if (!devices || devices.length < 1) {
                    return;
                }

                let deviceChoices = devices.map(device => {
                    deviceLookup[device.id] = device;
                    return { 'value': device.id, 'label': device.name };
                });

                vehicleMultiselect = vehicleMultiselect.setChoices(deviceChoices, 'value', 'label', true);

                toggleLoading(false);
            }, error => {
                logger(error);
                toggleLoading(false);
            });

            setTimeout(() => {
                map.invalidateSize();
            }, 800);
        },

        /**
         * blur() is called whenever the user navigates away from the Add-In.
         *
         * Use this function to save the page state or commit changes to a data store or release memory.
         */
        blur() {
            if (deviceLookup) {
                deviceLookup = {};
            }
        }
    };
};
