/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.startStop = function () {
    'use strict';

    let api;
    let state;
    let times;
    let idling;
    let fuel;
    let volumeConversionFactor;
    let volumeLabel;
    let elAddin;

    // If the stop/start event is shorter than this - ignore it.
    const minimumStopStartDuration = 2000;

    const litersPerUKGallon = 4.54609;
    const litersPerUSGallon = 3.785411784;

    // If less than this amount of litres of fuel is used, don't use for average idling per minute calculation
    // Cleans up data from very small values that can cause issues.
    const minimumIdleFuelUsed = 0.1;

    let getVehicles = (function () {
        //For preventing race condition.
        //If some group in global filter is selected and page with Add-In is reloaded.
        //Focus method can be called (with GroupCompanyId) before the state of the global filter will be restored.
        let successCallback;

        return function (finishedCallback) {
            successCallback = finishedCallback;
            api.call('Get', {
                typeName: 'Device',
                search: {
                    groups: state.getGroupFilter(),
                    fromDate: new Date().toISOString()
                },
                resultsLimit: 1000
            }, function (results) {
                let vehicles = results
                    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                    .map(function (vehicle) {
                        return {
                            name: vehicle.name,
                            id: vehicle.id
                        };
                    });

                if (successCallback === finishedCallback) {
                    successCallback(vehicles);
                }
            }, function (errorString) {
                alert(errorString);
            });
        };
    })();

    function getTrips(deviceId, fromDate, toDate) {
        return new Promise((resolve, reject) => {
            api.call('Get', {
                'typeName': 'Trip',
                'search': {
                    'deviceSearch': {
                        'id': deviceId
                    },
                    'fromDate': fromDate,
                    'toDate': toDate
                },
                resultsLimit: 10000
            }, resolve, reject);
        });
    }

    function updateDashboard(timesValue, idlingValue, fuelUsedPerMinute, postFix) {
        let minutes = idlingValue / 1000 / 60,
            fuelValue = minutes * fuelUsedPerMinute;

        postFix = postFix || '';

        times = document.getElementById('stopStart-times' + postFix);
        idling = document.getElementById('stopStart-idling' + postFix);
        fuel = document.getElementById('stopStart-fuel' + postFix);

        if (timesValue === -1) {
            times.innerText = '-';
            idling.innerText = '-:--';
            fuel.innerText = '-';

        } else {
            times.innerText = Math.round(timesValue);
            idling.innerText = toHHMM(idlingValue / 1000);
            fuel.innerText = Math.round(fuelValue * volumeConversionFactor * 100) / 100;
        }
    }

    function updateAnnualDashboard(timesValue, idlingValue, fuelUsedPerMinute) {
        updateDashboard(timesValue, idlingValue, fuelUsedPerMinute, '-annual');
    }

    function vehicleSelectionChange() {
        updateDashboard(-1);
        updateAnnualDashboard(-1);
        if (this.value !== '') {
            analyzeStopStartEvents(this.value);
        }
    }

    function populateVehicles(callback) {

        let vehicleSelect = document.getElementById('stopStart-vehicleSelect');
        vehicleSelect.innerHTML = '';
        vehicleSelect.removeEventListener('change', vehicleSelectionChange);

        vehicleSelect.appendChild((function () {
            let defaultOption = document.createElement('option');
            defaultOption.default = true;
            defaultOption.selected = true;
            defaultOption.value = '';
            defaultOption.textContent = state.translate('Select a vehicle...');
            return defaultOption;
        })());

        getVehicles(function (vehicles) {
            vehicles.forEach(function (vehicle) {
                let opt = document.createElement('option');
                opt.value = vehicle.id;
                opt.textContent = vehicle.name;
                vehicleSelect.appendChild(opt);
            });
            vehicleSelect.addEventListener('change', vehicleSelectionChange);
            callback();
        });
    }

    function getUserConfiguration(callback) {
        // The api object exposes a method we can call to get the current user identity. This is useful for
        // determining user context, such as regional settings, language preference and name. Use the api
        // to retrieve the currently logged on user object.
        api.getSession(function (session) {
            let currentUser = session.userName;
            api.call('Get', {
                'typeName': 'User',
                'search': {
                    'name': currentUser
                }
            }, function (result) {
                if (result.length === 0) {
                    throw new Error('Unable to find currently logged on user.');
                }

                let user = result[0];

                // Setup our regional settings

                switch (user.fuelEconomyUnit) {
                    case 'LitersPer100Km':
                        volumeConversionFactor = 1;
                        volumeLabel = state.translate('Liters');
                        break;
                    case 'KmPerLiter':
                        volumeConversionFactor = 1;
                        volumeLabel = state.translate('Liters');
                        break;
                    case 'MPGUS':
                        volumeConversionFactor = 1 / litersPerUSGallon;
                        volumeLabel = state.translate('Gallons (US)');
                        break;
                    case 'MPGImperial':
                        volumeConversionFactor = 1 / litersPerUKGallon;
                        volumeLabel = state.translate('Gallons (UK)');
                        break;
                    default:
                        volumeConversionFactor = 1;
                        volumeLabel = state.translate('Liters');
                        break;
                }

                console.log(user.isMetric); // true/false (used for miles or kilometers)
                console.log(user.fuelEconomyUnit); // 'LitersPer100Km', 'KmPerLiter', 'MPGUS','MPGImperial'
                console.log(user.language);   // 'en', 'fr', 'es', 'de', 'ja'...
                console.log(user.dateFormat); //  d/MMM/y HH:mm:ss
                console.log(user.timeZoneId); // 'America/Toronto'

                // TODO: Get the user language preference

                callback();


            }, function (error) {
                throw 'Error while trying to load currently logged on user. ' + error;
            });
        });
    }

    function updateDashboardRegionalUnits() {
        document.getElementById('stopStart-volume-label').innerHTML = volumeLabel;
        document.getElementById('stopStart-volume-label-annual').innerHTML = volumeLabel;
    }

    function getStopStartEvents(deviceId, fromDate, toDate) {
        return new Promise((resolve, reject) => {
            api.multiCall([['Get', {
                'typeName': 'StatusData',
                'search': {
                    'deviceSearch': {
                        'id': deviceId
                    },
                    'fromDate': fromDate.toISOString(),
                    'toDate': toDate.toISOString()
                },
                'resultsLimit': 50000
            }], ['Get', {
                'typeName': 'LogRecord',
                'search': {
                    'deviceSearch': {
                        'id': deviceId
                    },
                    'fromDate': fromDate,
                    'toDate': toDate
                },
                'resultsLimit': 50000
            }]], function (result) {
                let statusDataResults = result[0],
                    gpsDataResults = result[1],
                    isActive = false,
                    isEngineRunning = false,
                    isMoving = false,
                    stopStartBegin = null,
                    stopStartEnd = null,
                    idlingBegin = null,
                    totalIdlingTime = 0,
                    totalTripIdleFuelUsed = 0,
                    fuelUsedPerMinuteIdling = 0,
                    dataRecord,
                    i,
                    isInStopStart,
                    stopStarts = [];

                let filteredResults = statusDataResults.filter(function (statusData) {
                    switch (statusData.diagnostic.id) {
                        case 'DiagnosticVehicleActiveId':
                        case 'DiagnosticEngineSpeedId':
                        case 'DiagnosticTotalTripIdleFuelUsedId':
                            return true;
                        default:
                            return false;
                    }
                });

                // Combine GPS and Engine data. We need to sort them together and then walk through it oldest to newest
                filteredResults = filteredResults.concat(gpsDataResults);

                // Convert all dates from ISO string values to actual date objects
                filteredResults = filteredResults.map(function (record) {
                    record.dateTime = new Date(record.dateTime);
                    return record;
                });

                // Sort oldest to newest
                filteredResults.sort(function (a, b) {
                    return a.dateTime - b.dateTime;
                });

                for (i = 0; i < filteredResults.length; i++) {
                    dataRecord = filteredResults[i];

                    if (dataRecord.diagnostic) {
                        // Engine record
                        switch (dataRecord.diagnostic.id) {
                            case 'DiagnosticVehicleActiveId':
                                if (dataRecord.data === 1) {
                                    isActive = true;
                                } else {
                                    isActive = false;
                                }
                                break;

                            case 'DiagnosticEngineSpeedId':
                                if (dataRecord.data > 0) {
                                    isEngineRunning = true;
                                } else {
                                    isEngineRunning = false;
                                }
                                break;

                            case 'DiagnosticTotalTripIdleFuelUsedId':
                                totalTripIdleFuelUsed = totalTripIdleFuelUsed + dataRecord.data;
                                break;
                        }
                    } else {
                        // GPS record
                        isMoving = dataRecord.speed === 0 ? false : true;
                    }

                    if (!isMoving && isEngineRunning && idlingBegin == null) {
                        // First time we see idling even start
                        idlingBegin = dataRecord.dateTime;
                    }

                    if ((idlingBegin !== null) && (isMoving || !isEngineRunning)) {
                        // Idling stopped. Add to our tally.
                        totalIdlingTime = totalIdlingTime + (dataRecord.dateTime - idlingBegin);
                        idlingBegin = null;
                    }

                    if (isActive && !isEngineRunning && !isInStopStart) {
                        isInStopStart = true;
                        stopStartBegin = dataRecord.dateTime;
                    } else if (isInStopStart && (!isActive || isEngineRunning)) {
                        stopStartEnd = dataRecord.dateTime;
                        let stopStartDuration = stopStartEnd - stopStartBegin;

                        if (stopStartDuration > minimumStopStartDuration) {
                            stopStarts.push({
                                fromDate: stopStartBegin,
                                duration: stopStartEnd - stopStartBegin
                            });
                        }
                        isInStopStart = false;
                    }
                }

                if (totalIdlingTime > 0 && (totalTripIdleFuelUsed > minimumIdleFuelUsed)) {
                    fuelUsedPerMinuteIdling = (totalTripIdleFuelUsed / (totalIdlingTime / 1000 / 60));
                } else {
                    fuelUsedPerMinuteIdling = 0;
                }

                resolve({
                    fuelUsedPerMinuteIdling: fuelUsedPerMinuteIdling,
                    stopStarts: stopStarts
                });
            }, reject);
        });
    }

    // http://stackoverflow.com/questions/4288759/asynchronous-for-cycle-in-javascript
    function asyncLoop(iterations, func, callback) {
        let index = 0;
        let done = false;
        let loop = {
            next: function () {
                if (done) {
                    return;
                }

                if (index < iterations) {
                    index++;
                    func(loop);

                } else {
                    done = true;
                    callback();
                }
            },

            iteration: function () {
                return index - 1;
            },

            break: function () {
                done = true;
                callback();
            }
        };
        loop.next();
        return loop;
    }

    function toHHMM(timeSpan) {
        let numberOfSeconds = parseInt(timeSpan, 10);
        let hours = Math.floor(numberOfSeconds / 3600);
        let minutes = Math.floor((numberOfSeconds - (hours * 3600)) / 60);

        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        return hours + ':' + minutes;
    }

    function analyzeStopStartEvents(deviceId) {

        document.getElementById('stopStart-vehicleSelect').disabled = true;

        let toDate = new Date();
        let fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 1);

        let totalStopStartTime = 0,
            totalStopStarts = 0,
            averageFuelUsedPerMinute = 0;

        asyncLoop(30, function (loop) {

            getStopStartEvents(deviceId, fromDate, toDate).then(function (result) {
                let stopStarts = result.stopStarts,
                    fuelUsedPerMinute = result.fuelUsedPerMinuteIdling;

                totalStopStarts = totalStopStarts + stopStarts.length;

                if (totalStopStarts > 0) {
                    stopStarts.forEach(function (stopStart) {
                        totalStopStartTime += stopStart.duration;
                    });

                    if (fuelUsedPerMinute > 0) {
                        if (averageFuelUsedPerMinute === 0) {
                            // The first time we see valid fuel used value, set it
                            averageFuelUsedPerMinute = fuelUsedPerMinute;
                        } else {
                            averageFuelUsedPerMinute = (averageFuelUsedPerMinute + fuelUsedPerMinute) / 2;
                        }
                    }
                    updateDashboard(totalStopStarts, totalStopStartTime, averageFuelUsedPerMinute);
                }

                fromDate.setDate(fromDate.getDate() - 1);
                toDate.setDate(toDate.getDate() - 1);
                loop.next();
            });
        }, function () {
            // Count how many trips were involved
            fromDate = new Date();
            toDate = new Date();
            fromDate.setDate(fromDate.getDate() - 30);

            getTrips(deviceId, fromDate, toDate).then(function (trips) {
                let totalTripDistance = 0,
                    stopsPerKm, stopStartTimePerKm;

                trips.forEach(function (trip) {
                    totalTripDistance = totalTripDistance + trip.distance;
                });

                if (totalTripDistance > 0) {
                    stopsPerKm = totalStopStarts / totalTripDistance;
                    stopStartTimePerKm = totalStopStartTime / totalTripDistance;
                    updateAnnualDashboard(stopsPerKm * totalTripDistance, stopStartTimePerKm * totalTripDistance, averageFuelUsedPerMinute);

                    // Now go back 11 more months or thereabout
                    asyncLoop(11, function (loop) {

                        getTrips(deviceId, fromDate, toDate).then(function (newTrips) {
                            newTrips.forEach(function (trip) {
                                totalTripDistance = totalTripDistance + trip.distance;
                            });

                            updateAnnualDashboard(stopsPerKm * totalTripDistance, stopStartTimePerKm * totalTripDistance, averageFuelUsedPerMinute);

                            fromDate.setDate(fromDate.getDate() - 30);
                            toDate.setDate(toDate.getDate() - 30);
                            loop.next();

                        });

                    }, function () {
                        document.getElementById('stopStart-vehicleSelect').disabled = false;
                    });
                } else {
                    document.getElementById('stopStart-vehicleSelect').disabled = false;
                }
            });
        });
    }

    return {
        /**
         * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
         * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
         * is ready for the user.
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
         *        might be doing asynchronous operations, you must call this method when the Add-In is ready
         *        for display to the user.
         */
        initialize: function (freshApi, freshState, initializeCallback) {
            api = freshApi;
            state = freshState;

            elAddin = document.getElementById('startStop');

            if (state.translate) {
                state.translate(elAddin || '');
            }
            initializeCallback();
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
        focus: function (freshApi, freshState) {
            api = freshApi;
            state = freshState;

            updateDashboard(-1);
            populateVehicles(() => {
                getUserConfiguration(() => {
                    updateDashboardRegionalUnits();
                    console.log('updateDashboardRegionalUnits');
                    // show main content
                    elAddin.style.display = 'block';
                });
            });
        },

        /**
         * blur() is called whenever the user navigates away from the Add-In.
         *
         * Use this function to save the page state or commit changes to a data store or release memory.
         *
         * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
         * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
         */
        blur: function () {
            // hide main content
            elAddin.style.display = 'none';
        }
    };
};
