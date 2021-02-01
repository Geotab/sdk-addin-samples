/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.proximity = () => {
    'use strict';

    let api;
    let state;

    let map;
    let markers;
    let circles;

    let vehicleMultiselect;
    let elAddressInput;
    let elProximitySize;
    let elProximitySelectAll;
    let elProximityDeselectAll;
    let elVehicleSelect;
    let elVehicleMultiSelectContainer;
    let elDateFromInput;
    let elDateToInput;
    let elError;
    let elLoading;
    let elExport;
    let elRun;
    let elUserInput;

    let radiusFactor = 250;
    let deviceLookup = {};
    let selected = [];
    let isUserMetric = true;
    let isCancelled = false;
    let loadingTimeout;
    let blobData = ['DeviceID, Date, Time, Latitude, Longitude\n'];

    // User can enter any date range, limit how much data we will pull in a request
    const maxLogRecordResults = 50000;

    /**
     *  Logs messages to the UI
     *  @param {string} message The message to display
     */
    let logger = message => {
        elError.innerHTML = message;
    };

    /**
     *  Toggles loading "spinner"
     *  @param {boolean} show [true] to show loading, otherwise [false]
     */
    let toggleLoading = show => {
        clearTimeout(loadingTimeout);
        if (show) {
            elExport.disabled = true;
            elLoading.style.display = 'block';
            elRun.textContent = 'Cancel'
            vehicleMultiselect.disable();
            elAddressInput.disabled = true;
            elProximitySize.disabled = true;
            elProximitySelectAll.disabled = true;
            elProximityDeselectAll.disabled = true;
            elVehicleSelect.disabled = true;
            elDateFromInput.disabled = true;
            elDateToInput.disabled = true;
            elUserInput.hidden = true;
        } else {
            loadingTimeout = setTimeout(() => {
                elLoading.style.display = 'none';
                elRun.textContent = 'Run'
                vehicleMultiselect.enable();
                elAddressInput.disabled = false;
                elProximitySize.disabled = false;
                elProximitySelectAll.disabled = false;
                elProximityDeselectAll.disabled = false;
                elVehicleSelect.disabled = false;
                elDateFromInput.disabled = false;
                elDateToInput.disabled = false;
                elUserInput.hidden = false;
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
        circles.clearLayers();
    };

    /**
     *  Splits date/time from the log. Expects ISO formatted string
     *  eg.      2020-03-12T13:15:32.063Z
     * 
     * @param {String} dateTime 
     */
    let parseTime = (dateTime) => {
        let split = dateTime.split('T');
        let date = split[0];
        let time = split[1].split('.')[0];
        return [date, time];
    }

    /**
     * Downloads a provided file with a provided filename
     * 
     * @param {Blob} file Contents of the file we send for download
     * @param {String} filename name of the downloaded file - must include extension
     */
    let downloadFile = (file, filename) => {
        // IE 10 compatibility
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(file, filename);
        } else { // Others
            let downloadLink = document.createElement('a');
            let url = URL.createObjectURL(file);

            downloadLink.href = url;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            setTimeout(function () {
                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

    /**
     *  Read input coordinates
     *  @param {String} addressInput 
     */
    let parseCoordinates = addressInput => {
        var addressInputArr = addressInput.split(',');
        if (addressInputArr.length === 2 && parseFloat(addressInputArr[0]) && parseFloat(addressInputArr[1])) {
            return [{ x: parseFloat(addressInputArr[1]), y: parseFloat(addressInputArr[0]) }];
        } else {
            return [];
        }
    }

    /**
     *  Calculates and renders proximity from inputs
     */
    let displayProximity = () => {
        isCancelled = false;
        blobData = ['DeviceID, Date, Time, Latitude, Longitude\n'];
        clearMap();

        let dateFrom = new Date(elDateFromInput.value + ':00Z');
        let utcFrom = new Date(dateFrom.setMinutes(dateFrom.getMinutes() + new Date().getTimezoneOffset())).toISOString();
        let dateTo = new Date(elDateToInput.value + ':00Z');
        let utcTo = new Date(dateTo.setMinutes(dateTo.getMinutes() + new Date().getTimezoneOffset())).toISOString();

        toggleLoading(true);

        let calculateAndRender = async (result) => {
            if (!result || result.length < 1 || !result[0]) {
                toggleLoading(false);
                logger('Could not find the address');               
                return;
            }

            let render = logs => {
                logs.forEach(log => {
                    addMarker(log);
                    // Adding Data for export
                    let [date, time] = parseTime(log.dateTime);
                    blobData.push(`${deviceLookup[log.device.id].name}, ${date}, ${time}, ${log.latitude}, ${log.longitude}\n`);
                });
                return logs.length;
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
                    },
                    resultsLimit: maxLogRecordResults
                }];
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

            circles.addLayer(boundary1);
            circles.addLayer(boundary2);
            circles.addLayer(boundary3);
            circles.addLayer(boundary4);
            circles.addLayer(boundary5);

            let devicesToQuery = selected.map(id => {
                return deviceLookup[id];
            });

            let limitedDevices = [];

            let getLogRecord = results => new Promise((resolve) => {         
                // if results have been limited, let the user know they may need to narrow search
                if (results.length === maxLogRecordResults) {
                    limitedDevices.push(encodeHTML(device.name));
                }

                let params = {
                    array: results,
                    center,
                    radiusFactor,
                    aggregate: true,
                    maxThreads: navigator.hardwareConcurrency || 1
                };

                // do CPU intense calculation off the UI thread
                hamsters.promise(params, () => {
                    const arr = params.array;
                    const centerPoint = params.center;
                    const maxRadius = 5 * params.radiusFactor;
                    const toRadians = d => {
                        return d * (Math.PI / 180.0);
                    };
                    arr.forEach(logRecord => {
                        if (!logRecord.id) {
                            return;
                        }
                        let dLat = toRadians(centerPoint.latitude - logRecord.latitude);
                        let dLon = toRadians(centerPoint.longitude - logRecord.longitude);
                        let a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) + Math.cos(toRadians(logRecord.latitude)) * Math.cos(toRadians(centerPoint.latitude)) * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
                        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        logRecord.distance = 6371000.0 * c;
                        if (logRecord.distance < maxRadius) {
                            rtn.data.push(logRecord);
                        }
                    });                  
                })
                    .then(rtn => rtn.data[0])
                    .then(render)
                    .then(resolve);
            });
            
            let LogRecordMultiCall = calls => new Promise((resolve, reject) => {
                if(isCancelled){
                    resolve();
                }
                else{
                    api.multiCall(calls, async function(results){
                        var foundPoints = 0;
                        for(var k=0;k<results.length;k++){             
                            foundPoints += await getLogRecord(results[k]);
                        }
                        resolve(foundPoints);
                    },  error => {
                        toggleLoading(false);
                        logger(error);               
                        reject(error);
                    })
                }
            })

            let getDeviceLogs = device => new Promise(async (resolve) => {
                var request = [];  
                var temp = [];
                var totalPoints = 0;

                for(var j=0;j<device.length;j++){
                    temp.push(buildGetRequest(device[j].id, utcFrom, utcTo));
                    if(temp.length == 400){
                        request.push(temp);
                        temp = [];
                    }
                }
                request.push(temp);
                for(var i=0;i<request.length;i++){
                    totalPoints += await LogRecordMultiCall(request[i]);
                }             
                resolve(totalPoints); 
            });

            var totalFound = 0;
            let found = await getDeviceLogs(devicesToQuery);

            totalFound = found;

            if(isNaN(found)){
                clearMap();
                totalFound = -1;
            }

            let limitedMessage = limitedDevices.length === 0 ? '' : `<p>* ${limitedDevices.join(',')} was limited to ${maxLogRecordResults} GPS positions, try narrowing date range to see all positions.</p>`;
            if (totalFound > 0) {
                logger(`<p>There were ${totalFound} locations recorded nearby to ${elAddressInput.value}.</p>${limitedMessage}`);
            } 
            else if (totalFound == 0){
                logger(`<p>There was no one near this area during this time frame.</p>${limitedMessage}`);
            } 
            else {
                logger(`<p>The operation was cancelled.</p>${limitedMessage}`);
            }
            elExport.disabled = false;
            toggleLoading(false);
        }

        let inputCoordinates = parseCoordinates(elAddressInput.value);
        if (inputCoordinates.length) {
            calculateAndRender(inputCoordinates);
        } else {
            api.call('GetCoordinates', {
                addresses: [elAddressInput.value]
            }, async (result) => {
                calculateAndRender(result);
            }, error => {
                logger(error);
                toggleLoading(false);
            });
        }
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

        markers = L.markerClusterGroup({
            spiderfyOnMaxZoom: false,
            disableClusteringAtZoom: 18
        }).addTo(map);
        circles = L.layerGroup().addTo(map);

        // DOM elements used more than once
        elAddressInput = document.getElementById('proximity-address');
        elProximitySize = document.getElementById('proximity-size');
        elProximitySelectAll = document.getElementById('proximity-select-all');
        elProximityDeselectAll = document.getElementById('proximity-deselect-all');
        elVehicleSelect = document.getElementById('proximity-vehicles');
        elDateFromInput = document.getElementById('proximity-from');
        elDateToInput = document.getElementById('proximity-to');
        elError = document.getElementById('proximity-error');
        elLoading = document.getElementById('proximity-loading');
        elVehicleMultiSelectContainer = document.getElementById('proximity-div-vehicles');
        elExport = document.getElementById('proximity-run-report');
        elRun = document.getElementById('proximity-run-cancel');
        elUserInput = document.getElementById('proximity-userInput');

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
        vehicleMultiselect = new Choices(elVehicleSelect, { removeItemButton: true, duplicateItemsAllowed: false, searchResultLimit: 50, noChoicesText: 'Start typing to search for vehicles'});

        // events
        elVehicleMultiSelectContainer.addEventListener('keyup', debounce(e => {
            let manualSearch = '%%';
            let deviceList = [];
            manualSearch = '%' + e.target.value + '%';

            api.call('Get', {
                typeName: 'Device',
                search: {
                    fromDate: new Date().toISOString(),
                    groups: state.getGroupFilter(),
                    name: manualSearch,
                }
            }, newDevices => {
                if (!newDevices || newDevices.length < 1) {
                    return;
                };

                for(var i=0;i<newDevices.length;i++){
                    if(selected.includes(newDevices[i].id)){
                        continue;
                    }
                    else{
                        deviceList.push(newDevices[i])
                    }
                }  

                let deviceChoices = deviceList.map(device => {
                    deviceLookup[device.id] = device;
                    return { 'value': device.id, 'label': encodeHTML(device.name) };
                });

                vehicleMultiselect = vehicleMultiselect.setChoices(deviceChoices, 'value', 'label', true);

                toggleLoading(false);

            }, error => {
                logger(error);
                toggleLoading(false);
            });
        },1000))

        function debounce(fn, d) {
            let timer;
            return function() {
                let context = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fn.apply(context, args);
                },d);
            }
        }

        let currentDevicesInUserScope = calls => new Promise((resolve) => {
            api.call('Get', {
                typeName: 'Device',
                search: {
                    fromDate: new Date().toISOString(),
                    groups: state.getGroupFilter()
                }
            }, result => {
                resolve(result);
            });
        })

        let totalDevicesinUserScope = calls => new Promise((resolve) => {
            api.call('GetCountOf', {
                typeName: 'Device',
            }, result => {
                resolve(result);
            });
        })

        elProximitySelectAll.addEventListener('click', async () => {           
            let alldeviceList = [];
            logger('');
            let totalScope = await totalDevicesinUserScope();

            if(Object.keys(deviceLookup).length === 0 && totalScope <= 1000){  
                toggleLoading(true);       
                let currentScope = await currentDevicesInUserScope();

                for (var i = 0; i < currentScope.length; i++) {
                    alldeviceList.push(currentScope[i])
                    selected.push(currentScope[i].id);
                }

                let allChoices = alldeviceList.map(device => {
                    deviceLookup[device.id] = device;
                    return { 'value': device.id, 'label': encodeHTML(device.name) };
                });
                vehicleMultiselect.setValue(allChoices);
                toggleLoading(false);
            }

            else if(Object.keys(deviceLookup).length===0 && totalScope > 1000){
                if(state.getGroupFilter()[0].id === 'GroupCompanyId'){
                    logger('User has scope to more than 1000 devices. Please use the search bar to filter the search.');
                }
                else{
                    let currentScope = await currentDevicesInUserScope();
                    if(currentScope.length > 1000){
                        logger('User has scope to more than 1000 devices. Please use the search bar to filter the search.');
                    }
                    else{
                        toggleLoading(true);       
                        let currentScope = await currentDevicesInUserScope();
                        for (var i = 0; i < currentScope.length; i++) {
                            alldeviceList.push(currentScope[i])
                            selected.push(currentScope[i].id);
                        }

                        let allChoices = alldeviceList.map(device => {
                            deviceLookup[device.id] = device;
                            return { 'value': device.id, 'label': encodeHTML(device.name) };
                        });
                        vehicleMultiselect.setValue(allChoices);
                        toggleLoading(false);
                    }
                }
            }
            else{
                toggleLoading(true);
                var temp = [];

                for (let vehicle in deviceLookup) {   

                    if (selected.includes(vehicle)) {
                        continue;
                    }
                    else {
                        selected.push(vehicle);       
                        temp.push({ 'value': vehicle, 'label': deviceLookup[vehicle].name })
                    }       
                }

                vehicleMultiselect.setValue(temp); 
                vehicleMultiselect.clearInput(); 
                vehicleMultiselect.clearChoices(); 
                toggleLoading(false);
            }        
        });

        elProximityDeselectAll.addEventListener('click', () => {
            vehicleMultiselect.clearStore();
            selected = [];
            deviceLookup = {};
        });

        vehicleMultiselect.passedElement.element.addEventListener('change', () => {
            selected = vehicleMultiselect.getValue().map(value => {
                return value.value;
            });
        });

        elRun.addEventListener('click', () => {
            if(elRun.innerText == 'Run'){            
                if (checkInputs()) {
                    displayProximity();
                }
            }
            else{
                elRun.textContent = 'Canceling...'
                isCancelled = true;
            }           
        });

        function checkInputs() {
            var warning = '';
            var flag = 1;
            logger('');

            if (elAddressInput.value === '') {
                warning += 'Please input an address <br>';
                flag = 0;
            }

            if (selected.length === 0) {
                warning += 'Select at least one vehicle to display <br>';
                flag = 0;
            }

            let dateFrom = new Date(elDateFromInput.value + ':00Z');
            let dateTo = new Date(elDateToInput.value + ':00Z');

            if (dateFrom > dateTo) {
                warning += 'From date cannot be more than To date <br>';
                flag = 0;
            }

            logger(warning);
            return (flag)
        }

        elExport.addEventListener('click', () => {
            let [date, time] = parseTime(new Date().toISOString());
            // Checking if blobData is already a blob - blobs have size attribute
            blobData = blobData.size ? blobData : new Blob(blobData);
            downloadFile(blobData, `ProximityReport-${date}-${time.replace(/\:/g, '.')}.csv`);
        });

        elProximitySize.addEventListener('change', event => {
            sizeChanged(event.target.value);
        });

        elDateFromInput.addEventListener('change', event => {
            event.preventDefault();
        });

        elDateToInput.addEventListener('change', event => {
            event.preventDefault();
        });
       
    };

    /**
     *  Retrieves if the current user is metric or not
     *  @param {Function} callback The function to call when complete
     */
    let getUserIsMetric = callback => {
        if (!callback) {
            throw new Error('"callback" is null or undefined');
        }

        api.getSession(token => {
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
        }, false);
    };

    let encodeHTML = s => {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
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
            state = freshState;

            if (hamsters.init) {
                hamsters.init({
                    debug: 'verbose'
                });
            }

            getUserIsMetric(isMetric => {
                const defaultMapView = { longitude: -79.709441, latitude: 43.434497 };

                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(position => {
                        initializeInterface(isMetric, position.coords);
                        callback();
                    }, _ => {
                        initializeInterface(isMetric, defaultMapView);
                        callback();
                    }, {
                        timeout: 5000
                    });
                } else {
                    initializeInterface(isMetric, defaultMapView);
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
            api = freshApi;
            state = freshState;

            // focus is called anytime filter changes.
            isCancelled = true;
            deviceLookup = {};
            toggleLoading(false);
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
            isCancelled = true;
        }
    };
};
