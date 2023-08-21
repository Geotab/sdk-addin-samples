
import mainPage from './MainPage/mainPage';

/**
 * @returns {{initialize: Function, focus: Function, blur: Function, startup; Function, shutdown: Function}}
 */
geotab.addin.storageApiSample = function () {
  'use strict';


  // the root container
  var elAddin = document.getElementById('storageApiSample');
  const addinId = 'aWZlYTE3ZWMtYjJmYy0zNTR';

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
      // Loading translations if available
      if (freshState.translate) {
        freshState.translate(elAddin || '');
      }
      // MUST call initializeCallback when done any setup
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
    focus: function (freshApi) {
      const appName = 'storageApiSample';

      freshApi.getSession(({ userName }) => {
        freshApi.call('Get', {
          typeName: 'AddInData',
          search: {
            addinId,
            whereClause: `username = \"${userName}\"`
          }
        }, addInConfigs => {
          const configsMapping = {};
          const sortedConfigs = addInConfigs.sort((a, b) => {
            const { details: { addedDateTime: firstDateTime } } = a;
            const { details: { addedDateTime: secondDateTime } } = b;
            console.log(`${firstDateTime} vs ${secondDateTime}`);
            if (firstDateTime < secondDateTime) return -1;
            return 1;
          })

          console.log('configsMapping', configsMapping);
          console.log('Loaded add-in configurations', sortedConfigs);
          elAddin.className = '';
          mainPage(freshApi, addinId, sortedConfigs, userName);
        }, error => console.error('Failed to retrieve addin configs', error));
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
      elAddin.className += ' hidden';
    }
  };
};
