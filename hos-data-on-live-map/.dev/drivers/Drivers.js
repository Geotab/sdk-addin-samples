const _driverHelper = require('./_DriverHelper.js');

/**
 * Handles most of the HTML modification and Api calls for tasks relating to the
 * driver filter functionality. Will make first call to the api to gather drivers when
 * the user first clicks on the drivers dropdown to save on requests to the database
 * when making small changes to the addins.
 * 
 * Relies on the _driverHelper class to do most of the html generation/sorting.
 */
class drivers {
    
    constructor(api, state, target){
        this.api = api;
        this.state = state;
        this.baseNode;
        this.driversDictionary;
        this.root = document.getElementById(target);
        this.activeLabel = document.getElementById('active-driver');
        this.deleteAllBtn = document.getElementById('driver-remove-all');
        this.previousdriverStack = [];
        this.activedrivers = [];
        this.previousSearchTerm;
    }

    /**
     * Once the initial call for drivers has been made, we want to re-reference the already
     * collected drivers and use this method to just re-generate the base html.
     */
    generateRootHtml(){
        let html = _driverHelper.generateNodeHtml(driversFilter.driversDictionary, this.baseNode);
        driversFilter.root.innerHTML = html;
    }

    /**
     * Creates a request to the database the user is currently logged in to, and grabs all
     * the registered drivers from there.
     * 
     * @param {int} resultsLimit how many results to limit the response to.
     * @returns {Promise} Once the call completes, the call resolves.
     */
    getAlldriversInDatabase(resultsLimit = 2000){
        let callPromise = new Promise( (resolve, reject) => {
            this.api.call('Get', {
                'typeName': 'driver',
                'resultsLimit': resultsLimit
            }, 
            (result) => this._driverSuccessCallback(result, resolve), 
            (error) => this._driverErrorCallback(error, reject));
        });

        return callPromise;
    }

    /**
     * Removes all driver names from the 'Active drivers' header.
     * Removes all drivers from the state.
     * Unselects any previously selected drivers in the driversDictionary.
     * Resets the HTML to remove any checked attributes.
     */
    resetActivedrivers(){
        this.state._activedrivers.forEach( driver => {
            this.driversDictionary[driver.id].selected = false;
        });

        this.state._activedrivers = [];

        this.writeActivedrivers();

        let html = _driverHelper.generateNodeHtml(this.driversDictionary, this.baseNode);
        this.root.innerHTML = html;

        geotab.addin.request.focus(this.api, this.state);
    }

    /**
     * Toggles the status of the selected node to be 'active'. Updates this on the driversDictionary
     * to maintain the highlighting style when the HTML is reloaded (folder change, search, etc.)
     * 
     * @param {string} id id of the node that is to be added to the 'Active drivers' filter
     */
    toggledriverFilter(id){
        let idIndex;

        for (let i = 0; i < this.state._activedrivers.length; i++) {
            if(this.state._activedrivers[i].id === id){
                idIndex = i;
            }            
        }

        if(idIndex !== undefined){
            this.state._activedrivers.splice(idIndex, 1);
            this.driversDictionary[id].selected = false;
        } else {
            this.driversDictionary[id].selected = true;
            this.state._activedrivers.push({id});
        }

        this.writeActivedrivers();

        geotab.addin.request.focus(this.api, this.state);
    }

    /**
     * Writes the currently selected driver's to the top bar, and injects 'OR' if there are multiple
     * filters selected.
     */
    writeActivedrivers(){
        let text = `Active drivers:`;
        let stateLength = this.state._activedrivers.length;
        
        if(stateLength > 0){
            text += _driverHelper.generateActiveHeaderText(this.state, stateLength, this.driversDictionary);
            this.deleteAllBtn.style.display = 'inline';
        } else {
            text += ` All`;
            this.deleteAllBtn.style.display = 'none';
        }

        this.activeLabel.innerHTML = text;
    }

    /**
     * Creates regex out of a provided search term and re-generates the driver list html based on
     * the inclusion of the keyword. Should be run whenever the query input changes.
     * 
     * @param {string} query keyword for searching the drivers
     */
    driverSearch(query){
        let regex = this._createRegex(query.toLowerCase());
        let html = _driverHelper.generateSearchHtml(this.driversDictionary, regex);
        this.root.innerHTML = html;
    }

    _createRegex(input){
        let regex = new RegExp(`.*${input}.*`);
        return regex;
    }

    /**
     * Handles navigation into a subfolder. Stores information about where the user is going
     * and where the user is coming from to allow us to go 'one level up' from the new driver list.
     * 
     * @param {string} previous the id of the folder/level that the user is leaving.
     * @param {string} current the id of the folder/level the user is navigating into.
     */
    changeFocus(previous, current){
        this.previousdriverStack.push(previous);
        let html = _driverHelper.generateNodeHtml(this.driversDictionary, current, this.baseNode);
        this.root.innerHTML = html;
    }

    /**
     * Returns to the previous folder that was in view for the user when selecting 'Go up one level' 
     * option.
     */
    goToPreviousFolder(){
        let previousFolder = this.previousdriverStack.pop();
        let html = _driverHelper.generateNodeHtml(this.driversDictionary, previousFolder, this.baseNode);
        this.root.innerHTML = html;
    }

    /**
     * Callback used for collecting the driver list from the authenticated database.
     * 
     * @param {object} result Response from the server - should contain a list of all the drivers on the DB.
     */
    _driverSuccessCallback(result, resolve){
        let driverInput = document.getElementById('driver-input');
        this.baseNode = result[0].id;
        this.driversDictionary = _driverHelper.convertdriversListToDictionary(result);
        let html = _driverHelper.generateNodeHtml(this.driversDictionary, this.baseNode);
        this.root.innerHTML = html;

        // If we had any errors, we want to reset the placeholder text.
        driverInput.placeholder = 'Search for drivers';
        resolve();
    }    

    /**
     * Notifies the user that there has been an error in creating the driver list. Will retry 
     * every 60 seconds.
     * 
     * @param {string} error Error message from failed api call/driver object instantiation.
     */
    _driverErrorCallback(error){
        let driverInput = document.getElementById('driver-input');
        driverInput.placeholder = "Unable to retrieve drivers";
        console.log(error);

        setTimeout(() => {
            driverInput.placeholder = "Retrying...";
            driversFilter.getAlldriversInDatabase();
        }, 60000);
    }
}

module.exports = drivers;
