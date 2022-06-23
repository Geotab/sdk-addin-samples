'use strict';
const config = require('../../app/config.json');


/**
 * Geotab login class
 * 
 * Grabs the login screen, appends listeners, and creates the global
 * api object
 */
class GeotabLogin {

    /**
     * Constructor class -> Replaces the self firing function used with Gulp
     * @param {bool} isDriveAddin whether or not the addin is a drive addin
     * @param {Class} GeotabApi uninstantiated GeotabApi class
     */
    constructor(isDriveAddin, GeotabApi){
        global.api;
        global.state;
        this.elLoginDialog = document.querySelector('#loginDialog');
        this.elEmail = this.elLoginDialog.querySelector('#email');
        this.elPassword = this.elLoginDialog.querySelector('#password');
        this.elServer = this.elLoginDialog.querySelector('#server');
        this.elDatabase = this.elLoginDialog.querySelector('#database');
        this.elLoginError = this.elLoginDialog.querySelector('#loginError');
        this.elLoginBtn = this.elLoginDialog.querySelector('#loginBtn');
        this.elDeviceDialog = document.querySelector('#deviceDialog');
        this.elDevices = this.elDeviceDialog.querySelector('#devices');
        this.elDevicesOkBtn = this.elDeviceDialog.querySelector('#okBtn');
        this.elLogoutBtn = document.querySelector('#logoutBtn');
        this.elAddinButton = document.querySelector('.customButton');
        this.elNightModeToggle = document.querySelector('#nightMode');
        this.elStartStopToggle = document.querySelector('#startStopBtn');
        this.elSendNotification = document.querySelector('#sendNotificationBtn');
        this.elCancelNotification = document.querySelector('#cancelNotificationBtn');
        this.elUpdateNotification = document.querySelector('#updateNotificationBtn');
        this.elPermissionNotification = document.querySelector('#permissionNotificationBtn');
    
        if (this.elAddinButton) {
            this.elAddinButton.addEventListener('click', function (e) {
                Object.keys(global.geotab.customButtons).forEach(function (name) {
                    global.geotab.customButtons[name](e, global.api, global.state);
                });
            });
        }

        this.authenticationCallback;
        this.device = JSON.parse(localStorage.getItem('_device'));

        this.initializeGeotabApi(GeotabApi);
        this.intializeInterface(isDriveAddin);
    }

    initializeGeotabApi(GeotabApi) {
        global.api = new GeotabApi((detailsCallback) => {
            this.authenticationCallback = detailsCallback;

            if (!this.elLoginDialog.open) {
                this.elLoginDialog.showModal();
            }
        }, {
            rememberMe: true
        });
    }

    initializeAddin(isDriveAddin) {
        Object.keys(global.geotab.addin).forEach(function (name) {
            var addin = global.geotab.addin[name];

            if (addin.isInitialize) {
                addin.focus(global.api, global.state);
            } else {
                addin = typeof addin === 'function' ? global.geotab.addin[name] = addin(global.api, global.state) : addin;
                if(config.onStartup && isDriveAddin){
                    addin.startup(global.api, global.state, function () {
                        //call initialize after startup
                        addin.initialize(global.api, global.state, function () {
                            addin.isInitialize = true;
                            addin.focus(global.api, global.state);
                        });
                    });
                }
                else{
                    addin.initialize(global.api, global.state, function () {
                        addin.isInitialize = true;
                        addin.focus(global.api, global.state);
                    });
                }
            }
        });
    }

    initializeDevice() {
        // Mock device for drive addin
        global.api.call('Get', {
            typeName: 'Device',
            resultsLimit: 1000,
            search: {
                fromDate: new Date()
            }
        }, (devices) => {
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
            this.elDevices.innerHTML = '<option>Select Device</option>' + options.join('');
            this.elDeviceDialog.showModal();
        }, (e) => {
            console.error(`Could not get vehicles: ${e.message}`);
        });
    }

    intializeInterface(isDriveAddin) {
        this.elLoginBtn.addEventListener('click', (event) => {
            var server = this.elServer.value || 'my.geotab.com',
                database = this.elDatabase.value,
                email = this.elEmail.value,
                password = this.elPassword.value;

            event.preventDefault();
            localStorage.setItem('_user', JSON.stringify(email));

            global.api.user = email;
            this.elLoginError.style.display = 'none';

            this.authenticationCallback(server, database, email, password, (err) => {
                this.elLoginDialog.showModal();

                if (err) {
                    this.elLoginError.textContent = err;
                }

                this.elLoginError.style.display = 'block';
            });

            if (!isDriveAddin) {
                this.initializeAddin(isDriveAddin);
            }

            this.elLoginDialog.close();
        });

        this.elLogoutBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if(config.onShutdown && isDriveAddin){
                Object.keys(global.geotab.addin).forEach(function (name) {
                    global.geotab.addin[name].shutdown(global.api, global.state, function(){});
                });
            }

            if (global.api !== undefined) {
                global.api.forget();
            }

            Object.keys(global.geotab.addin).forEach(function (name) {
                global.geotab.addin[name].isInitialize = false;
            });

            this.device = null;
            global.state.device = this.device;
            localStorage.setItem('_device', JSON.stringify(this.device));
            
            if (isDriveAddin) {
                this.initializeDevice();
            }

            Object.keys(global.geotab.addin).forEach(function (name) {
                global.geotab.addin[name].blur(global.api, global.state);
            });
        });

        this.elDevices.addEventListener('change', (event) => {
            var id = event.target.value;

            event.preventDefault();

            if (id) {
                this.device = {
                    id: id
                };
                global.state.device = this.device;
                localStorage.setItem('_device', JSON.stringify(this.device));
            }
        });

        this.elDevicesOkBtn.addEventListener('click', (event) => {
            event.preventDefault();

            if (this.device) {
                this.initializeAddin(isDriveAddin);

                // in this order becasue zombiejs errors out on close
                this.elDeviceDialog.close();
            }
        });

        if (isDriveAddin) {
            this.elNightModeToggle.addEventListener('click', evt => {
                const NightMode = 'nightMode';
                let app = document.querySelector('#app');
                let body = document.body;

                if (this.elNightModeToggle.checked) {
                    app.classList.add(NightMode);
                    body.classList.add(NightMode);
                } else {
                    app.classList.remove(NightMode);
                    body.classList.remove(NightMode);
                }
            });

            this.elStartStopToggle.addEventListener('click', evt => {                 
                if (this.elStartStopToggle.classList.contains('start')) {
                    this.elStartStopToggle.classList.remove('start');
                    this.elStartStopToggle.classList.add('stop');  
                    this.elStartStopToggle.innerHTML = 'Stop add-in';
                    Object.keys(global.geotab.addin).forEach(function (name) {
                        var addin = global.geotab.addin[name];
                        addin.isInitialize = false;
                    });
                    this.initializeAddin(isDriveAddin);
                } else {
                    this.elStartStopToggle.classList.remove('stop');
                    this.elStartStopToggle.classList.add('start');
                    this.elStartStopToggle.innerHTML = 'Start add-in';
                    Object.keys(global.geotab.addin).forEach(function (name) {
                        global.geotab.addin[name].shutdown(global.api, global.state, function(){});                
                    }); 
                }
            });
        }

        if (!isDriveAddin) {
            this.initializeAddin(isDriveAddin);
            return;
        }
        // mock Drive properties
        global.api.mobile = {
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
            notification: {
                hasPermission: function(){
                    var permission = false;
                    if(Notification.permission === 'granted')
                    {
                        permission = true;
                    }
                    return permission;
                },
                requestPermission: function(){
                    return Notification.requestPermission();
                },
                notify: function(message, title, tag){
                    var notification,
                        options = {
                            title: title,
                            body: message,
                            tag: tag
                        };

                    if (Notification.permission === 'granted') {
                        notification = new Notification(title, options);
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission(function (permission) {
                            if (permission === 'granted') {
                                notification = new Notification(title, options);
                            }
                        });
                    }
                    return notification;
                },
                //tag is used to identify a notification, if a notification with same tag
                // exists and has already been dispalyed, previous notification will be closed
                //and new one will be displayed
                update: function(message, title, tag){
                    var notification,
                        options = {
                            title: title,
                            body: message,
                            tag: tag
                        };
                    notification = new Notification(title, options);
                    return notification;
                },
                cancel: function(notification){
                    notification.close();
                },
            },
            camera: {
                takePicture: function() {
                    var imageOptions = new ImageOptions();
                    imageOptions.generateContent();
                    var submitButton = document.getElementById('submitImage');
                    var exitBtn = document.getElementById('exit');

                    return new Promise((resolve, reject) => {
                        exitBtn.onclick = () => {
                            // Making sure UI and recording stopped before returning
                            var removed = imageOptions.dialog.cleanUp();
                            if (removed) {
                                reject('Exited.');
                            }
                        }
                        submitButton.onclick = () => {
                            var canvas = document.getElementById('canvas');
                            var base64;
                            if (canvas) {
                                base64 = canvas.toDataURL('image/png');
                            }
                            // Making sure UI and recording stopped before returning
                            var removed = imageOptions.dialog.cleanUp();
                            if (removed) {
                                if (base64) {
                                    resolve(base64);
                                } else {
                                    reject('Image not loaded correctly.');
                                }
                            }
                        };
                    });
                },
            },
            geolocation: navigator.geolocation
        };

        global.api.user = JSON.parse(localStorage.getItem('_user'));

        // Drive properties
        global.state.device = this.device;
        global.state.driving = true;
        global.state.charging = true;
        global.state.background = false;
        global.state.online = true;
        global.state.deviceCommunicating = true;

        if (!this.device) {
            this.initializeDevice();
        } else {
            this.initializeAddin(isDriveAddin);
        }
    }
}

module.exports = GeotabLogin;
