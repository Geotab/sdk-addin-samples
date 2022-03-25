/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.ioxOutput = () => {
    let api;

    let elContainer;
    let elVehicleSelect;
    let elSendButton;
    let elSendHistory;
    let elError;
    let elStateSelect;

    let errorHandler = message => {
        elError.innerHTML = message;
    };

    let pollForResult = divId => {
        setTimeout(() => {
            api.call('Get', {
                typeName: 'TextMessage',
                search: {
                    id: divId.split('-')[0]
                }
            }, testMessages => {
                if (testMessages[0].delivered) {
                    let element = document.getElementById(divId);
                    element.innerHTML += ', Delivered: ' + new Date(testMessages[0].delivered);
                } else {
                    pollForResult(divId);
                }
            }, errorHandler);
        }, 1000);
    };

    let appendAndPoll = textMessageId => {
        let divId = textMessageId + '-' + Date.now(),
            headerElement = document.createElement('h4'),
            textElement = document.createTextNode('Sent: ' + new Date());

        headerElement.setAttribute('id', divId);
        headerElement.appendChild(textElement);
        elSendHistory.appendChild(headerElement);

        pollForResult(divId);
    };

    let sendTextMessage = () => {
        let deviceId = elVehicleSelect.value,
            state = elStateSelect.options[elStateSelect.selectedIndex].text;

        api.call('Add', {
            typeName: 'TextMessage',
            entity: {
                device: {
                    id: deviceId
                },
                messageContent: {
                    isRelayOn: state === 'On',
                    contentType: 'IoxOutput'
                },
                isDirectionToVehicle: true
            }
        }, appendAndPoll, errorHandler);
    };

    let sortNameEntities = (a, b) => {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();
        if (a === b) {
            return 0;
        } else if (a > b) {
            return 1;
        } else {
            return -1;
        }
    };

    return {
        initialize(geotabApi, pageState, initializeCallback) {
            api = geotabApi;

            elContainer = document.getElementById('ioxOutput');
            elVehicleSelect = document.getElementById('ioxoutput-vehicles');
            elSendButton = document.getElementById('ioxoutput-send');
            elSendHistory = document.getElementById('ioxoutput-history');
            elError = document.getElementById('ioxoutput-error');
            elStateSelect = document.getElementById('ioxoutput-state');

            elVehicleSelect.addEventListener('change', () => {
                elSendButton.disabled = false;
            });

            elSendButton.addEventListener('click', sendTextMessage);

            initializeCallback();
        },
        focus(geotabApi) {
            api = geotabApi;

            api.call('Get', {
                typeName: 'Device',
                resultsLimit: 1000,
                search: {
                    fromDate: new Date().toISOString()
                }
            }, devices => {
                if (!devices || devices.length < 1) {
                    return;
                }

                devices.sort(sortNameEntities);

                elVehicleSelect.innerHTML = '';

                for (let i = 0; i < devices.length; i++) {
                    let option = new Option();
                    option.text = devices[i].name;
                    option.value = devices[i].id;
                    elVehicleSelect.add(option);
                }

                elSendButton.disabled = false;
                elContainer.style.display = '';
            }, errorHandler);
        },
        blur() {
            elSendButton.disabled = true;
            elContainer.style.display = 'none';
        }
    };
};
