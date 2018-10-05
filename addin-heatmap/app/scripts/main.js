/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.heatmap = () => {
  'use strict';

  let api;

  let map;
  let heatMapLayer;

  let elVehicleSelect;
  let elDateFromInput;
  let elDateToInput;
  let elError;
  let elLoading;

  /**
   * Display error message
   * @param {string} message - The error message.
   */
  let errorHandler = message => {
    elError.innerHTML = message;
  };

  /**
   * Toggle loading spinner
   * @param {boolean} show - [true] to display the spinner, otherwise [false].
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
   * Displays the heatmap of a vehicle location history
   */
  let displayHeatMap = () => {
    let deviceId = elVehicleSelect.value;
    let fromValue = elDateFromInput.value;
    let toValue = elDateToInput.value;

    errorHandler('');

    if ((deviceId === null) || (fromValue === '') || (toValue === '')) {
      return;
    }

    toggleLoading(true);

    let dateFrom = new Date(fromValue).toISOString();
    let dateTo = new Date(toValue).toISOString();

    api.call('Get', {
      typeName: 'LogRecord',
      resultsLimit: 10000,
      search: {
        deviceSearch: {
          id: deviceId
        },
        fromDate: dateFrom,
        toDate: dateTo
      }
    }, logRecords => {
      let coordinates = [];
      let bounds = [];

      for (let i = 0; i < logRecords.length; i++) {
        if (logRecords[i].latitude !== 0 || logRecords[i].longitude !== 0) {
          coordinates.push({
            lat: logRecords[i].latitude,
            lon: logRecords[i].longitude,
            value: 1
          });
          bounds.push(new L.LatLng(logRecords[i].latitude, logRecords[i].longitude));
        }
      }

      if (coordinates.length > 0) {
        map.fitBounds(bounds);
        heatMapLayer.setLatLngs(coordinates);
      } else {
        errorHandler('Not enough data to display');
      }

      toggleLoading(false);
    }, error => {
      errorHandler(error);
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

    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2VvdGFiIiwiYSI6ImNpd2NlaW02MjAxc28yeW9idTR3dmRxdTMifQ.ZH0koA2g2YMMBOcx6EYbwQ').addTo(map);

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

    // find reused elements
    elVehicleSelect = document.getElementById('vehicles');
    elDateFromInput = document.getElementById('from');
    elDateToInput = document.getElementById('to');
    elError = document.getElementById('error');
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

    // events
    document.getElementById('vehicles').addEventListener('change', event => {
      event.preventDefault();
      displayHeatMap();
    });

    document.getElementById('from').addEventListener('change', event => {
      event.preventDefault();
      displayHeatMap();
    });

    document.getElementById('to').addEventListener('change', event => {
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

      while (elVehicleSelect.firstChild) {
        elVehicleSelect.removeChild(elVehicleSelect.firstChild);
      }

      api.call('Get', {
        typeName: 'Device',
        resultsLimit: 1000,
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
          elVehicleSelect.add(option);
        });
      }, errorHandler);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  };
};
