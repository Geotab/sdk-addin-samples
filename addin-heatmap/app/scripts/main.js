/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.heatmap = () => {
  'use strict';

  let api;

  let map;
  let heatMapLayer;

  let elExceptionTypes;
  let elVehicles;
  let elDateFromInput;
  let elDateToInput;
  let elShowHeatMap;
  let elError;
  let elMessage;
  let elLoading;
  let selectedVehicleCount;
  let myGeotabGetResultsLimit = 50000;
  let startTime;

  /**
   * Display error message
   * @param {string} message - The error message.
   */
  let errorHandler = message => {
    elError.innerHTML = message;
  };  

  /**
   * Display error message
   * @param {string} message - The error message.
   */
  let messageHandler = message => {
    elMessage.innerHTML = message;
  }; 
  
  /**
   * Returns a boolean indicating whether all elements in the
   * supplied results array are empty.
   * @param {object} results - The results array to be evaluated.
   */
  function resultsEmpty(results) {
    if ((!results) || (results.length === 0)) {
      return true;
    }
    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      if (result.length > 0) {
        return false;
      }
    }
    return true;    
  }

  /**
   * Formats a number using the comma separator.
   * @param {number} num The number to be formatted.
   */
  function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }  

  /**
   * Calculates the elapsed time (in seconds) between the value of the 
   * startTime variable and the current time.
   */
  function getElapsedTimeSeconds() {
    return Math.round((new Date() - startTime) / 1000);
  }

  /**
   * Toggle loading spinner
   * @param {boolean} show - [true] to display the spinner, otherwise [false].
   */
  let toggleLoading = show => {
    if (show) {
      elShowHeatMap.disabled = true;
      elLoading.style.display = 'block';
    } else {
      setTimeout(() => {
        elLoading.style.display = 'none';
      }, 600);
      elShowHeatMap.disabled = false;
    }
  };

  /**
   * Remove the HeatMap layer and add a new empty one.
   */
  let resetHeatMapLayer = () => {
    if (heatMapLayer !== undefined) {
      map.removeLayer(heatMapLayer);
    }
    
    heatMapLayer = L.heatLayer({
      radius: {
        value: 24,
        absolute: false
      },
      opacity: 0.7,
      gradient: {
        0.45: 'rgb(0,0,255)',
        0.55: 'rgb(0,255,255)',
        0.65: 'rgb(0,255,0)',
        0.95: 'yellow',
        1.0: 'rgb(255,0,0)'
      }
    }).addTo(map);
  }

  /**
   * Call the appropriate heat map generation function based on the
   * selected visualization option.
   */
  let displayHeatMap = () => {
    resetHeatMapLayer();

    // Ensure at least one vehicle is selected.
    selectedVehicleCount = 0;
    for (var i = 0; i < elVehicles.options.length; i++) {
        if (elVehicles.options[i].selected) {
          selectedVehicleCount++;
        }
    }
    if (selectedVehicleCount === 0) {
      errorHandler('Please select at least one vehicle from the list and try again.');
      return;
    }

    startTime = new Date();

    if (elExceptionTypes.disabled === true) {

      displayHeatMapForLocationHistory();
    }
    else {
      displayHeatMapForExceptionHistory();
    }
  }

  /**
   * Displays the heatmap of vehicle(s) location history
   */
  let displayHeatMapForLocationHistory = () => {
    let deviceId = elVehicles.value;

    // Get selected device IDs.
    let deviceIds = [];
    var options = elVehicles.options;
    var opt;
    for (var i=0, iLen=options.length; i<iLen; i++) {
      opt = options[i];
  
      if (opt.selected) {
        deviceIds.push(opt.value || opt.text);
      }
    }
    
    let fromValue = elDateFromInput.value;
    let toValue = elDateToInput.value;

    errorHandler('');
    messageHandler('');

    if ((deviceIds === null) || (fromValue === '') || (toValue === '')) {
      return;
    }
    
    toggleLoading(true);

    let dateFrom = new Date(fromValue).toISOString();
    let dateTo = new Date(toValue).toISOString();

    // Build array of calls.
		let calls = [];
		for (let i = 0, len = deviceIds.length; i < len; i++) {
      calls.push([
        'Get', {
          typeName: 'LogRecord',
          resultsLimit: myGeotabGetResultsLimit,
          search: {
            deviceSearch: {
              id: deviceIds[i]
            },
            fromDate: dateFrom,
            toDate: dateTo
          }
        }    
      ]);
		}

    // Execute multicall.
    api.multiCall(calls, function (results) {
      if (resultsEmpty(results)) {
        errorHandler('No data to display');
        toggleLoading(false);
        return;
      }      
 
      let coordinates = [];
      let bounds = [];
      let logRecordCount = 0; 
      let exceededResultsLimitCount = 0;
      let logRecords = [];    
      // Build coordinates and bounds.
      for (let i = 0, len = results.length; i < len; i++) {
        logRecords = results[i];
        for (let j = 0; j < logRecords.length; j++) {
          if (logRecords[j].latitude !== 0 || logRecords[j].longitude !== 0) {
            coordinates.push({
              lat: logRecords[j].latitude,
              lon: logRecords[j].longitude,
              value: 1
            });
            bounds.push(new L.LatLng(logRecords[j].latitude, logRecords[j].longitude));
            logRecordCount++;
          }
        }
        if (logRecords.length >= myGeotabGetResultsLimit){
          exceededResultsLimitCount++;
        }                
      }

      // Update map.
      if (coordinates.length > 0) {
        map.fitBounds(bounds);
        heatMapLayer.setLatLngs(coordinates);
        messageHandler(`Displaying ${formatNumber(logRecordCount)} combined log records for the
        ${formatNumber(selectedVehicleCount)} selected vehicles. [${getElapsedTimeSeconds()} sec]`);
        if (exceededResultsLimitCount > 0) {
          errorHandler(`Note: Not all results are displayed because the result limit of 
          ${formatNumber(myGeotabGetResultsLimit)} was exceeded for 
          ${formatNumber(exceededResultsLimitCount)} of the selected vehicles.`);  
        }
      } else {
        errorHandler('No data to display');
      }      
      toggleLoading(false);
    }, function (errorString) {
      // eslint-disable-next-line no-alert
      alert(errorString);
      toggleLoading(false);
    });
  };

  let displayHeatMapForExceptionHistory = () => {
    let deviceId = elVehicles.value;
    let ruleId = elExceptionTypes.options[elExceptionTypes.selectedIndex].value;
    let ruleName = elExceptionTypes.options[elExceptionTypes.selectedIndex].text;

    // Get selected device IDs.
    let deviceIds = [];
    var options = elVehicles.options;
    var opt;
    for (var i=0, iLen=options.length; i<iLen; i++) {
      opt = options[i];
  
      if (opt.selected) {
        deviceIds.push(opt.value || opt.text);
      }
    }
    
    let fromValue = elDateFromInput.value;
    let toValue = elDateToInput.value;

    errorHandler('');
    messageHandler('');

    if ((deviceIds === null) || (ruleId === null) || (fromValue === '') || (toValue === '')) {
      return;
    }
    
    toggleLoading(true);

    let dateFrom = new Date(fromValue).toISOString();
    let dateTo = new Date(toValue).toISOString();
    
    // Build array of calls to get ExceptionEvents for the seletced rule during
    // the specified date/time range for each selected device.
    let calls = [];
		for (let i = 0, len = deviceIds.length; i < len; i++) {
      calls.push([
        'Get', {
          typeName: 'ExceptionEvent',
          resultsLimit: myGeotabGetResultsLimit,
          search: {
            deviceSearch: {
              id: deviceIds[i]
            },
            ruleSearch: {
              id: ruleId
            },
            fromDate: dateFrom,
            toDate: dateTo
          }
        }    
      ]);
		}

    // Execute multicall to get ExceptionEvents for the seletced rule during
    // the specified date/time range for each selected device.
    api.multiCall(calls, function (results) {
      if (resultsEmpty(results)) {
        errorHandler('No data to display');
        toggleLoading(false);
        return;
      }
      
      // Build array of calls to get LogRecords associated with the devices
      // associated with the returned ExceptionEvents during the timeframes
      // of the ExceptionEvents.
      let exceptionEventCount = 0;
      let exceededResultsLimitCountForExceptionEvents = 0;  
      let calls = [];
      for (let i = 0, len = results.length; i < len; i++) {
        let exceptionEvents = results[i];
        for (let j = 0; j < exceptionEvents.length; j++) {
          exceptionEventCount++;
          calls.push([
            'Get', {
              typeName: 'LogRecord',
              resultsLimit: myGeotabGetResultsLimit,
              search: {
                deviceSearch: {
                  id: exceptionEvents[j].device.id
                },
                fromDate: exceptionEvents[j].activeFrom,
                toDate: exceptionEvents[j].activeTo
              }
            }    
          ]);        
        } 
        if (exceptionEvents.length >= myGeotabGetResultsLimit){
          exceededResultsLimitCountForExceptionEvents++;
        }                
      }

      // Execute multicall to get LogRecords associated with the devices
      // associated with the returned ExceptionEvents during the timeframes
      // of the ExceptionEvents.
      api.multiCall(calls, function (results) {
        if (resultsEmpty(results)) {
          errorHandler('No data to display');
          toggleLoading(false);
          return;
        } 

        let coordinates = [];
        let bounds = [];
        let logRecordCount = 0;
        let exceededResultsLimitCountForLogRecords = 0;      
        // Build coordinates and bounds.
        for (let i = 0, len = results.length; i < len; i++) {
          let logRecords = results[i];
          for (let j = 0; j < logRecords.length; j++) {
            if (logRecords[j].latitude !== 0 || logRecords[j].longitude !== 0) {
              coordinates.push({
                lat: logRecords[j].latitude,
                lon: logRecords[j].longitude,
                value: 1
              });
              bounds.push(new L.LatLng(logRecords[j].latitude, logRecords[j].longitude));
              logRecordCount++;
            }
          }
          if (logRecords.length >= myGeotabGetResultsLimit){
            exceededResultsLimitCountForLogRecords++;
          }                   
        }

        // Update map.
        if (coordinates.length > 0) {
          map.fitBounds(bounds);
          heatMapLayer.setLatLngs(coordinates);

          messageHandler(`Displaying ${formatNumber(logRecordCount)} combined log records associated with the
          ${formatNumber(exceptionEventCount)} '${ruleName}' rule exceptions found for the 
          ${formatNumber(selectedVehicleCount)} selected vehicles. [${getElapsedTimeSeconds()} sec]`);
          
          // Build the error message if result limit(s) exceeded.
          if (exceededResultsLimitCountForExceptionEvents > 0 || exceededResultsLimitCountForLogRecords > 0) {
            let errorMessage = 'Note: Not all results are displayed because'; 
            
            if (exceededResultsLimitCountForExceptionEvents) {
              errorMessage += ` the result limit of 
              ${formatNumber(myGeotabGetResultsLimit)} was exceeded for '${ruleName}' rule exceptions`;
            }

            if (exceededResultsLimitCountForExceptionEvents > 0 && exceededResultsLimitCountForLogRecords > 0) {
              errorMessage += ' and';
            }

            if (exceededResultsLimitCountForLogRecords > 0) {
              errorMessage += ` the result limit of 
              ${formatNumber(myGeotabGetResultsLimit)} was exceeded for 
              ${formatNumber(exceededResultsLimitCount)} of the selected vehicles.`;
            }

            errorMessage += '.';
            errorHandler(errorMessage);
          }
          toggleLoading(false);
        } else {
          errorHandler('No data to display');
        }      
      }, function (errorString) {
        // eslint-disable-next-line no-alert
        alert(errorString);
        toggleLoading(false);
      });
    }, function (errorString) {
      // eslint-disable-next-line no-alert
      alert(errorString);
      toggleLoading(false);
    });
  };

  /**
   * Intialize the user interface
   * @param {object} coords - An object with the latitude and longitude to render on the map.
   */
  let initializeInterface = coords => {
    // setup the map
    map = new L.Map('heatmap-map', {
        center: new L.LatLng(coords.latitude, coords.longitude),
        zoom: 13
    });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a','b','c']
    }).addTo(map);

    // find reused elements
    elExceptionTypes = document.getElementById('exceptionTypes');
    elVehicles = document.getElementById('vehicles');
    elDateFromInput = document.getElementById('from');
    elDateToInput = document.getElementById('to');
    elShowHeatMap = document.getElementById('showHeatMap');
    elError = document.getElementById('error');
    elMessage = document.getElementById('message');
    elLoading = document.getElementById('loading');

    // set up dates
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

    document.getElementById('visualizeByLocationHistory').addEventListener('click', event => {
      elExceptionTypes.disabled = true;
    });

    document.getElementById('visualizeByExceptionHistory').addEventListener('click', event => {
      elExceptionTypes.disabled = false;
    });

    document.getElementById('exceptionTypes').addEventListener('change', event => {
      event.preventDefault();
    });

    document.getElementById('vehicles').addEventListener('change', event => {
      event.preventDefault();
    });

    document.getElementById('from').addEventListener('change', event => {
      event.preventDefault();
    });

    document.getElementById('to').addEventListener('change', event => {
      event.preventDefault();
    });

    document.getElementById('showHeatMap').addEventListener('click', event => {
      event.preventDefault();
      displayHeatMap();
    });    
  };

  /**
   * Sort named entities
   * @param {object} a - The left comparison named entity
   * @param {object} b - The right comparison named entity
   */
  let sortByName = (a, b) => {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if (a === b) {
      return 0;
    }

    if (a > b) {
      return 1;
    }

    return -1;
  };

  return {
    initialize(freshApi, state, callback) {
      api = freshApi;

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
          initializeInterface(position.coords);
          callback();
        });
      } else {
        initializeInterface({ longitude: -79.709441, latitude: 43.434497 });
        callback();
      }

    },
    focus(freshApi, freshState) {
      api = freshApi;
      
      // Populate vehicles list.
      api.call('Get', {
        typeName: 'Device',
        resultsLimit: 50000,
        search: {
          fromDate: new Date().toISOString(),
          groups: freshState.getGroupFilter()
        }
      }, vehicles => {
        if (!vehicles || vehicles.length < 0) {
          return;
        }

        vehicles.sort(sortByName);

        vehicles.forEach(vehicle => {
          let option = new Option();
          option.text = vehicle.name;
          option.value = vehicle.id;
          elVehicles.add(option);
        });
      }, errorHandler);

      // Populate exceptions list.
      api.call('Get', {
        typeName: 'Rule',
        resultsLimit: 50000
      }, rules => {
        if (!rules || rules.length < 0) {
          return;
        }

        rules.sort(sortByName);

        rules.forEach(rule => {
          let option = new Option();
          option.text = rule.name;
          option.value = rule.id;
          elExceptionTypes.add(option);
        });
      }, errorHandler);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);      
    }
  };

};
