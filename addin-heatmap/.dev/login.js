document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var api;
  var state;

  var elLoginDialog = document.querySelector('#loginDialog');
  var elEmail = elLoginDialog.querySelector('#email');
  var elPassword = elLoginDialog.querySelector('#password');
  var elServer = elLoginDialog.querySelector('#server');
  var elDatabase = elLoginDialog.querySelector('#database');
  var elLoginError = elLoginDialog.querySelector('#loginError');
  var elLoginBtn = elLoginDialog.querySelector('#loginBtn');
  var elDeviceDialog = document.querySelector('#deviceDialog');
  var elDevices = elDeviceDialog.querySelector('#devices');
  var elDevicesOkBtn = elDeviceDialog.querySelector('#okBtn');
  var elLogoutBtn = document.querySelector('#logoutBtn');
  var elAddinButton = document.querySelector('.customButton');

  var injectStyles = function () {
    var styleSheets = ['../bower_components/dialog-polyfill/dialog-polyfill.css'];
    styleSheets.forEach(function (href) {
      var styleSheet = document.createElement('link');
      styleSheet.setAttribute('rel', 'stylesheet');
      styleSheet.setAttribute('type', 'text/css');
      styleSheet.setAttribute('href', href);
      document.head.appendChild(styleSheet);
    });
  };

  injectStyles();

  if (!elLoginDialog.showModal) {
    dialogPolyfill.registerDialog(elLoginDialog);
    dialogPolyfill.registerDialog(elDeviceDialog);
  }

  if (elAddinButton) {
    elAddinButton.addEventListener('click', function (e) {
      Object.keys(geotab.customButtons).forEach(function (name) {
        geotab.customButtons[name](e, api, state);
      });
    });
  }

  var GeotabLogin = (function () {
    var authenticationCallback,
      device = JSON.parse(localStorage.getItem('_device'));

    function initializeGeotabApi() {
      api = new GeotabApi(function (detailsCallback) {
        authenticationCallback = detailsCallback;
        if (!elLoginDialog.open) {
          elLoginDialog.showModal();
        }
      }, {
        rememberMe: true
      });
    }

    function initalizeAddin() {
      Object.keys(geotab.addin).forEach(function (name) {
        var addin = geotab.addin[name];

        if (addin.isInitialize) {
          addin.focus(api, state);
        } else {
          addin = typeof addin === 'function' ? geotab.addin[name] = addin(api, state) : addin;
          addin.initialize(api, state, function () {
            addin.isInitialize = true;
            addin.focus(api, state);
          });
        }
      });
    }

    function initializeDevice() {
      // Mock device for drive addin
      api.call('Get', {
        typeName: 'Device',
        resultsLimit: 1000,
        search: {
          fromDate: new Date()
        }
      }, function (devices) {
        var options = devices.sort(function (d1, d2) {
          var name1 = d1.name.toLowerCase();
          var name2 = d2.name.toLowerCase();
          if (name1 < name2) {
            return -1;
          } else if (name1 > name2) {
            return 1;
          } else {
            return 0;
          }
        }).map(function (d) {
          return '<option value="' + d.id + '">' + d.name + '</option>';
        });
        elDevices.innerHTML = '<option>Select Device</option>' + options.join('');
        elDeviceDialog.showModal();
      }, function (e) {
        console.error(`Could not get vehicles: ${e.message}`);
      });
    }

    function intializeInterface(isDriveAddin) {
      elLoginBtn.addEventListener('click', function (event) {
        var server = elServer.value || 'my.geotab.com',
          database = elDatabase.value,
          email = elEmail.value,
          password = elPassword.value;

        event.preventDefault();

        localStorage.setItem('_user', JSON.stringify(email));
        api.user = email;

        elLoginError.style.display = 'none';

        authenticationCallback(server, database, email, password, function (err) {
          elLoginDialog.showModal();
          if (err) {
            elLoginError.textContent = err;
          }
          elLoginError.style.display = 'block';
        });

        if (!isDriveAddin) {
          initalizeAddin();
        }

        elLoginDialog.close();
      });

      elLogoutBtn.addEventListener('click', function (event) {
        event.preventDefault();

        if (api !== undefined) {
          api.forget();
        }

        Object.keys(geotab.addin).forEach(function (name) {
          geotab.addin[name].isInitialize = false;
        });
        device = null;
        state.device = device;
        localStorage.setItem('_device', JSON.stringify(device));
        if (isDriveAddin) {
          initializeDevice();
        }
        Object.keys(geotab.addin).forEach(function (name) {
          geotab.addin[name].blur(api, state);
        });
      });

      elDevices.addEventListener('change', function (event) {
        var id = event.target.value;

        event.preventDefault();

        if (id) {
          device = {
            id: id
          };
          state.device = device;
          localStorage.setItem('_device', JSON.stringify(device));
        }
      });

      elDevicesOkBtn.addEventListener('click', function (event) {
        event.preventDefault();

        if (device) {
          initalizeAddin();

          // in this order becasue zombiejs errors out on close
          elDeviceDialog.close();
        }
      });

      // mock state
      state = {
        getState: function () {
          var hash = location.hash,
            hashLength = hash.length;
          return !hashLength ? {} : rison.decode(location.hash.substring(1, location.hash.length));
        },
        setState: function (s) {
          location.hash = Object.keys(s).length ? '#' + rison.encode(s) : '';
        },
        gotoPage: function (page, args) {
          var getUrl = function (targetClass, targetState) {
            var lcClassHtml = location.pathname.replace(/\./g, '/').toLowerCase(),
              url = document.URL,
              pos = url.toLowerCase().indexOf(lcClassHtml),
              encodedState = targetState ? '#' + rison.encode(targetState) : '';

            if (targetClass.indexOf('.') === -1) {
              targetClass = 'geotab.checkmate.ui.' + targetClass;
            }

            // This is the default scheme for standalone pages.
            targetClass = targetClass.replace(/\./g, '/');
            if (targetClass.toLowerCase() === lcClassHtml) {
              //staying on the same page - just replace hash component
              return url.replace(/\.html.*$/i, '.html' + encodedState);
            }
            return url.slice(0, pos) + targetClass + '.html' + encodedState;
          };

          window.location = getUrl(page, args);
        },
        hasAccessToPage: function (page) {
          return !!page;
        },
        getGroupFilter: function () {
          return [{
            id: 'GroupCompanyId'
          }];
        }
      };

      if (!isDriveAddin) {
        initalizeAddin();
        return;
      }
      // mock Drive properties
      api.mobile = {
        exists: function () {
          return true;
        },
        getVersion: function () {
          return '1.1.1';
        },
        speak: function (message) {
          if (!('SpeechSynthesisUtterance' in window)) {
            console.log('This browser does not supports speech synthesis');
          } else {
            var utterThis = new SpeechSynthesisUtterance(message);
            utterThis.lang = 'en-US';
            window.speechSynthesis.speak(utterThis);
          }
        },
        notify: function (message, title, id, jsonData, permanent) {
          var notification,
            options = {
              tag: id,
              body: message,
              data: jsonData
            };

          if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
          } else if (Notification.permission === 'granted') {
            notification = new Notification(title, options);
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
              if (permission === 'granted') {
                notification = new Notification(title, options);
              }
            });
          }
        },
        geolocation: navigator.geolocation
      };

      api.user = JSON.parse(localStorage.getItem('_user'));

      // Drive properties
      state.device = device;
      state.driving = true;
      state.charging = true;
      state.background = false;
      state.online = true;
      state.deviceCommunicating = true;

      if (!device) {
        initializeDevice();
      } else {
        initalizeAddin();
      }
    }

    return function () {
      this.initialize = function (isDriveAddin) {
        initializeGeotabApi();
        intializeInterface(isDriveAddin);
      };
    };

  })();

  new GeotabLogin().initialize(window.geotab.isDriveAddin);
});
