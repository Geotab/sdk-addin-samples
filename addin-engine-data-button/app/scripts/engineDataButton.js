/**
 * The function is called whenever the Add-In button is clicked.
 *
 * @param {object} event - The event dispatched from the button click.
 * @param {object} api - The GeotabApi object for making calls to MyGeotab.
 * @param {object} state - The page state object allows access to URL, page navigation and global group filter.
 */
geotab.customButtons.engineDataButton = (event, api, state) => {
  'use strict';

  const noVehiclesText = 'Select any vehicle first';
  const mutipleVehiclesText = 'Graph cannot be opened for multiple devices';

  event.preventDefault();

  // The diagnostic ids to display the data of
  let diagnostics = [
    'DiagnosticEngineSpeedId',
    'DiagnosticGoDeviceVoltageId',
    'DiagnosticDeviceTotalFuelId'
  ];

  // The currently selected device from state
  let device = (() => {
    let pageState = state.getState();
    return (pageState && pageState.id && pageState.id.length) ? pageState.id : null;
  })();

  let isMultipleDevices = device !== null && Array.isArray(device);

  // The date range which will be used on engine data profile
  let dateRange = (() => {
    let date = new Date(),
      interval = 60 * 60 * 24 * 1000,   // a day
      endDate = new Date(date.getTime() - interval);
    return {
      startDate: endDate.toISOString(),
      endDate: date.toISOString()
    };
  })();

  // Displays messages to the UI
  let messenger = (() => {

    let timer;
    let mainContainer;
    let textContainer;
    let closeIcon;

    let addAttributes = function (element, attrs) {
      for (let a in attrs) {
        if (attrs.hasOwnProperty(a)) {
          element.setAttribute(a, attrs[a]);
        }
      }
    };

    let addCss = function (element, styles) {
      for (let a in styles) {
        if (styles.hasOwnProperty(a)) {
          element.style[a] = styles[a];
        }
      }
    };

    let createElement = function (elemName, attrs, css, appendTo) {
      let elem = document.createElement(elemName);

      if (attrs) {
        addAttributes(elem, attrs);
      }

      if (css) {
        addCss(elem, css);
      }

      if (appendTo) {
        appendTo.appendChild(elem);
      }

      return elem;
    };

    let destroy = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }

      if (closeIcon) {
        closeIcon.removeEventListener('click', destroy, false);
      }

      if (mainContainer && mainContainer.parentNode) {
        mainContainer.parentNode.removeChild(mainContainer);
      }

      mainContainer = undefined;
      textContainer = undefined;
      closeIcon = undefined;
    };

    let getMainContent = () => {
      return document.querySelector('#engineDataButton-addin');
    };

    let createMainContent = () => {
      mainContainer = createElement('div', {
        id: 'engineDataButton-addin'
      }, {
          'border': '1px solid #ffeb94',
          'background-color': '#fffcdd',
          'color': '#222',
          'margin': '0 auto 0 auto',
          'position': 'relative',
          'width': '600px',
          'top': 0,
          'right': '0',
          'z-index': '10004',
          'table-layout': 'fixed',
          'opacity': 0.9,
          'text-align': 'center'
        }, document.body);

      mainContainer.destroy = destroy;

      textContainer = createElement('h2', null, {
        'display': 'inline-block',
        'margin': '5px 0',
        'word-wrap': 'break-word',
        'font-weight': 'normal',
        'font-size': '1.5em',
        'color': '#222',
        'text-align': 'center'
      }, mainContainer);

      closeIcon = createElement('span', null, {
        'float': 'right',
        'margin-top': '9px',
        'font-size': '20px',
        'width': '30px',
        'position': 'relative',
        'top': '-0.1em',
        'left': '-0.1em',
        'font-family': 'arial',
        'font-style': 'normal',
        'font-weight': 'bold',
        'cursor': 'pointer',
        'display': 'inline-block',
        'text-decoration': 'none',
        'text-align': 'center',
        'vertical-align': 'middle',
        'overflow': 'hidden',
        'font-variant': 'normal',
        'text-transform': 'none',
        'color': '#222'
      }, mainContainer);

      closeIcon.innerHTML = 'x';
      closeIcon.addEventListener('click', destroy, false);
    };

    return {
      /**
       * Shows a message to the UI
       */
      showMessage: (warningText) => {
        mainContainer = getMainContent();
        if (!mainContainer) {
          createMainContent();
          timer = setInterval(destroy, 5000);
        }
        textContainer.textContent = warningText;
      },
      /**
       * Destorys the current message
       */
      destroy: () => {
        mainContainer = mainContainer || getMainContent();
        if (mainContainer) {
          mainContainer.destroy();
        }
      }
    };
  })();

  if (device && device !== 'all' && !isMultipleDevices) {
    messenger.destroy();

    // redirect to the engine data profile page passing in arguments for device, date range and diagnostics to display
    state.gotoPage('engineDataProfile', {
      dateRange: dateRange,
      device: [device],
      diagnostic: diagnostics
    });
  } else {
    messenger.showMessage(isMultipleDevices ? mutipleVehiclesText : noVehiclesText);
  }
};
