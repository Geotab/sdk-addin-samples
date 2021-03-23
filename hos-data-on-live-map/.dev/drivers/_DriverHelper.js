// Helper class for drivers. Handles most HTML generation and heavy lifting.
class _driverHelper {
    
    /**
     * Converts the driver array into a dictionary where the key is the id of driver.
     * Prevents nested iteration to look for and sort through drivers.
     * 
     * @param {array} driverArray Raw driver array returned from the api.
     */
    static convertdriversListToDictionary(driverArray){
        let dict = driverArray.reduce((output, current) => {
            let id = current.id;
            
            // Clean the data.
            output[id] = {
                children: current.children,
                color: current.color,
                comments: current.comments,
                reference: current.reference,
                name: current.name || 'driverCompanyId',
                selected: false
            };

            return output;
        }, {});

        return dict;
    }

    static generateActiveHeaderText(state, stateLength, driverDictionary){
        let text = ``;

        for(let i=0; i<stateLength; i++){
            let id = state._activedrivers[i].id;
            let name = driverDictionary[id].name;

            if(i === state._activedrivers.length-1){
                text += ' ' + name;
            } else {
                text += ' ' + name + ` OR`;
            }
        }

        return text;
    }

    static generateFolderEventListener(previous, current){
        let listener = `driversFilter.changeFocus('${previous}', '${current}');`;
        return listener;
    }

    static generateFilterEventListener(filter){
        let listener = `driversFilter.toggledriverFilter('${filter}');`;
        return listener;
    }

    static generatePreviousFolderEventListener(){
        let listener = `driversFilter.goToPreviousFolder()`;
        return listener;
    }

    static generateFilterListElement(childId, childNode){
        let checked = childNode.selected ? 'checked' : '';
        return `<li id="driver-item-${childId}" onchange="${this.generateFilterEventListener(childId)}">
                    <input id="driver-use-${childId}" type="checkbox" class="geotabSwitchButton navButton" ${checked}>
                    <label for="driver-use-${childId}" class="geotabButton" style="width: 100%;">${childNode.name}</label>
                </li>`;
    }

    static generateFolderListElement(id, root, node){
        return `<li id="driver-folder-${node.id}" class="geotabButton navButton" onclick="${this.generateFolderEventListener(root, id)}">
                    <span class="icon geotabIcons_folder"></span>
                    ${node.name}
               </li>`;
    }

    /**
     * Iterates over entire dictionary object for search terms and returns html of matching folder/filter names.
     * 
     * @param {object} driversDictionary dictionary used in search.
     * @param {RegExp} regex Regex defining search term.
     */
    static generateSearchHtml(driversDictionary, regex = /^.*$/g){
        let html = `<ul id="driver-dropdown-ul" class="geotabPrimaryFill select-buttons">`;
        let resultCount = 0;
        
        // When we iterate over all the keys in the driversDictionary, we get all the drivers instead of top level children
        // of user's Root driver.
        Object.keys(driversDictionary).forEach(key => {
            let node = driversDictionary[key];
            if(regex.test(node.name.toLowerCase())){
                if(node.children.length > 0){
                    html += this.generateFolderListElement(key, 'driverCompanyId', node);
                    resultCount++;
                } else {
                    html += this.generateFilterListElement(key, node);
                    resultCount++;
                }
            }
        });

        if(resultCount === 0){
            html += `<p style="text-align: center;">No Results Found.</p>`;
        }

        html += `</ul>`;
        return html;
    }

    /**
     * Used to generate html for a folder. If the folder is not the top level folder (driverCompanyId),
     * navigational items (Use this Level and Go Up one Level) will be generated.
     * 
     * @param {object} driversDictionary the dictionary used to generate the folder.
     * @param {string} root the dictionary key we start the folder on.
     * @param {string} baseNode the user's highest driver permission. 
     */
    static generateNodeHtml(driversDictionary, root, baseNode = root){
        let html = `<ul id="driver-dropdown-ul" class="geotabPrimaryFill select-buttons">`
        let name = driversDictionary[root].name;
        let checked = driversDictionary[root].selected ? 'checked' : '';

        if(root !== baseNode){
            html += `<li onchange="${this.generateFilterEventListener(root)}">
                        <input id="driver-go-to-${root}" type="checkbox" class="geotabSwitchButton navButton" ${checked}>
                        <label for="driver-go-to-${root}" class="geotabButton" style="width:100%;">
                            <span class='icon geotabIcons_status'></span>
                            Everything in ${name}
                        </label>
                     </li>`;
            html += `<li onchange="${this.generatePreviousFolderEventListener()}">
                        <input id="driver-use-${root}" type="checkbox" class="geotabSwitchButton navButton">
                        <label for="driver-use-${root}" class="geotabButton" style="width:100%;">
                        <span class='icon geotabIcons_level_up'></span>
                            Up one level
                        </label>
                     </li>`;
        }
        
        html += this.generateFolderHtml(driversDictionary, root);
        html += `</ul>`;

        return html;
    }

    /**
     * Looks at the children of the provided root object and generates html for the child objects.
     * 
     * @param {object} driversDictionary 
     * @param {string} root Base level to use for html generation
     */
    static generateFolderHtml(driversDictionary, root){
        let html = ``;

        driversDictionary[root].children.forEach( child => {
            let childId = child.id
            let childNode = driversDictionary[childId];

            if(childNode.children.length > 0){
                html += this.generateFolderListElement(childId, root, childNode);
            } else {
                html += this.generateFilterListElement(childId, childNode);
            }
        });

        return html;
    }
}

module.exports = _driverHelper;
