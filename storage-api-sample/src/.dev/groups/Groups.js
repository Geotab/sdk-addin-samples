const _GroupHelper = require('./_GroupHelper.js');

/**
 * Handles most of the HTML modification and Api calls for tasks relating to the
 * group filter functionality. Will make first call to the api to gather groups when
 * the user first clicks on the groups dropdown to save on requests to the database
 * when making small changes to the addins.
 * 
 * Relies on the _GroupHelper class to do most of the html generation/sorting.
 */
class Groups {
    
    constructor(api, state, target){
        this.api = api;
        this.state = state;
        this.baseNode;
        this.groupsDictionary;
        this.root = document.getElementById(target);
        this.activeLabel = document.getElementById('active-group');
        this.deleteAllBtn = document.getElementById('group-remove-all');
        this.previousGroupStack = [];
        this.activeGroups = [];
        this.previousSearchTerm;
    }

    /**
     * Once the initial call for groups has been made, we want to re-reference the already
     * collected groups and use this method to just re-generate the base html.
     */
    generateRootHtml(){
        let html = _GroupHelper.generateNodeHtml(groupsFilter.groupsDictionary, this.baseNode);
        groupsFilter.root.innerHTML = html;
    }

    /**
     * Creates a request to the database the user is currently logged in to, and grabs all
     * the registered groups from there.
     * 
     * @param {int} resultsLimit how many results to limit the response to.
     * @returns {Promise} Once the call completes, the call resolves.
     */
    getAllGroupsInDatabase(resultsLimit = 2000){
        let callPromise = new Promise( (resolve, reject) => {
            this.api.call('Get', {
                'typeName': 'Group',
                'resultsLimit': resultsLimit
            }, 
            (result) => this._groupSuccessCallback(result, resolve), 
            (error) => this._groupErrorCallback(error, reject));
        });

        return callPromise;
    }

    /**
     * Removes all group names from the 'Active Groups' header.
     * Removes all groups from the state.
     * Unselects any previously selected groups in the groupsDictionary.
     * Resets the HTML to remove any checked attributes.
     */
    resetActiveGroups(){
        this.state._activeGroups.forEach( group => {
            this.groupsDictionary[group.id].selected = false;
        });

        this.state._activeGroups = [];

        this.writeActiveGroups();

        let html = _GroupHelper.generateNodeHtml(this.groupsDictionary, this.baseNode);
        this.root.innerHTML = html;

        geotab.addin.storageApiSample.focus(this.api, this.state);
    }

    /**
     * Toggles the status of the selected node to be 'active'. Updates this on the groupsDictionary
     * to maintain the highlighting style when the HTML is reloaded (folder change, search, etc.)
     * 
     * @param {string} id id of the node that is to be added to the 'Active Groups' filter
     */
    toggleGroupFilter(id){
        let idIndex;

        for (let i = 0; i < this.state._activeGroups.length; i++) {
            if(this.state._activeGroups[i].id === id){
                idIndex = i;
            }            
        }

        if(idIndex !== undefined){
            this.state._activeGroups.splice(idIndex, 1);
            this.groupsDictionary[id].selected = false;
        } else {
            this.groupsDictionary[id].selected = true;
            this.state._activeGroups.push({id});
        }

        this.writeActiveGroups();

        geotab.addin.storageApiSample.focus(this.api, this.state);
    }

    /**
     * Writes the currently selected group's to the top bar, and injects 'OR' if there are multiple
     * filters selected.
     */
    writeActiveGroups(){
        let text = `Active Groups:`;
        let stateLength = this.state._activeGroups.length;
        
        if(stateLength > 0){
            text += _GroupHelper.generateActiveHeaderText(this.state, stateLength, this.groupsDictionary);
            this.deleteAllBtn.style.display = 'inline';
        } else {
            text += ` All`;
            this.deleteAllBtn.style.display = 'none';
        }

        this.activeLabel.innerHTML = text;
    }

    /**
     * Creates regex out of a provided search term and re-generates the group list html based on
     * the inclusion of the keyword. Should be run whenever the query input changes.
     * 
     * @param {string} query keyword for searching the groups
     */
    groupSearch(query){
        let regex = this._createRegex(query.toLowerCase());
        let html = _GroupHelper.generateSearchHtml(this.groupsDictionary, regex);
        this.root.innerHTML = html;
    }

    _createRegex(input){
        let regex = new RegExp(`.*${input}.*`);
        return regex;
    }

    /**
     * Handles navigation into a subfolder. Stores information about where the user is going
     * and where the user is coming from to allow us to go 'one level up' from the new group list.
     * 
     * @param {string} previous the id of the folder/level that the user is leaving.
     * @param {string} current the id of the folder/level the user is navigating into.
     */
    changeFocus(previous, current){
        this.previousGroupStack.push(previous);
        let html = _GroupHelper.generateNodeHtml(this.groupsDictionary, current, this.baseNode);
        this.root.innerHTML = html;
    }

    /**
     * Returns to the previous folder that was in view for the user when selecting 'Go up one level' 
     * option.
     */
    goToPreviousFolder(){
        let previousFolder = this.previousGroupStack.pop();
        let html = _GroupHelper.generateNodeHtml(this.groupsDictionary, previousFolder, this.baseNode);
        this.root.innerHTML = html;
    }

    /**
     * Callback used for collecting the group list from the authenticated database.
     * 
     * @param {object} result Response from the server - should contain a list of all the groups on the DB.
     */
    _groupSuccessCallback(result, resolve){
        let groupInput = document.getElementById('group-input');
        this.baseNode = result[0].id;
        this.groupsDictionary = _GroupHelper.convertGroupsListToDictionary(result);
        let html = _GroupHelper.generateNodeHtml(this.groupsDictionary, this.baseNode);
        this.root.innerHTML = html;

        // If we had any errors, we want to reset the placeholder text.
        groupInput.placeholder = 'Search for Groups';
        resolve();
    }    

    /**
     * Notifies the user that there has been an error in creating the group list. Will retry 
     * every 60 seconds.
     * 
     * @param {string} error Error message from failed api call/Group object instantiation.
     */
    _groupErrorCallback(error){
        let groupInput = document.getElementById('group-input');
        groupInput.placeholder = "Unable to retrieve Groups";
        console.log(error);

        setTimeout(() => {
            groupInput.placeholder = "Retrying...";
            groupsFilter.getAllGroupsInDatabase();
        }, 60000);
    }
}

module.exports = Groups;
