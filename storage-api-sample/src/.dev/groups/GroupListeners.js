const Groups = require('./Groups.js');
let xIconSvg = require('../images/close-round.svg').default;
let chevron = require('../images/Font_Awesome_5_solid_chevron-left.svg').default;
const regeneratorRuntime = require('regenerator-runtime');

class GroupListeners {

    constructor(api, state, target){
        this.groupBox = new Groups(api, state, target);
        window.groupsFilter = this.groupBox;
        this.displayBox = document.getElementById(target);
        this.inputBox = document.getElementById('group-input');
        this.groupToggle = document.getElementById('group-toggle-button');
        this.deleteAllBtn = document.getElementById('group-remove-all');
        this.firstOpen = true;
        this.open = false;
        this.closeListener;
        this.changeSearchTimeout;
    }

    assignEventListeners(){
        // Hide dropdown when clicking outside of list.
        document.addEventListener('click', (event) => this._hideGroupsOnOffClickListener(event));

        // Group dropdown box toggle.
        this.groupToggle.addEventListener('click', () => this._groupToggleListener(this.displayBox));

        // Open dropdown on input box click.
        this.inputBox.addEventListener('click', () => {
            if(!this.open){
                this._groupToggleListener(this.displayBox);
            }
        });

        // Inputbox listener for change - ie. enter presses.
        this.inputBox.addEventListener('change', (event) => this._groupSearchListener(event));

        // Inputbox listener for input timeout - ie. typing then stopping.
        this.inputBox.addEventListener('input', (event) => this._inputTimeoutGroupSearchListener(event));

        // Listener to reset group filters.
        this.deleteAllBtn.addEventListener('click', () => this._groupResetAllFilters());
    }

    _inputTimeoutGroupSearchListener(event){

        // Cancelling any previous search timeouts.
        clearTimeout(this.changeSearchTimeout);

        // Making a new one.
        this.changeSearchTimeout = setTimeout( async () => {
            await this._groupSearchListener(event);
        }, 500);
    }

    _hideGroupsOnOffClickListener(event){
        if(!event.target.closest('#group-wrapper, #group-dropdown-ul')){
            if(this.open){
                this._groupToggleListener(this.displayBox);
            }
        }
    }

    _groupResetAllFilters(){
        this.groupBox.resetActiveGroups();
        this.inputBox.value = '';
        this.groupBox.previousSearchTerm = '';
    }

    async _groupSearchListener(event){
        let keyword = event.target.value;

        if(!this.open){
            await this._groupToggleListener(this.displayBox);
        }

        /**
         * Because this listener can be called on input and on change, there's a chance for it to be 
         * called twice. This is because the change event fires when focus on the input box is lost.
         * i.e. - you type, rely on the input listener, then go to click the item, the event re-fires
         *      and nothing happens in the UI until you click again.
         */
        if(keyword !== '' && keyword !== this.groupBox.previousSearchTerm){
            this.groupBox.groupSearch(keyword);
        } else if(keyword === '' && keyword !== this.groupBox.previousSearchTerm) {
            this.groupBox.generateRootHtml();
        }

        this.groupBox.previousSearchTerm = keyword;
    }

    async _groupToggleListener(display){
        if(!this.open){
            display.style.display = 'block';
            
            if(this.firstOpen){
                await this.groupBox.getAllGroupsInDatabase();
                this.firstOpen = false;
            } else {
                this.groupBox.generateRootHtml();
            }

            this.open = true;
        } else {
            this.inputBox.value = '';
            this.groupBox.previousSearchTerm = '';
            display.style.display = 'none';
            this.open = false;
        }

        this._rotateToggleButton();
    }

    _rotateToggleButton(){
        if(this.open){
            this.groupToggle.children[0].style['mask-image'] = `url(${xIconSvg})`;
            this.groupToggle.children[0].style['-webkit-mask-image'] = `url(${xIconSvg})`;
            this.groupToggle.children[0].style['transform'] = 'none';
        } else {
            this.groupToggle.children[0].style['mask-image'] = `url(${chevron})`;
            this.groupToggle.children[0].style['-webkit-mask-image'] = `url(${chevron})`;
            this.groupToggle.children[0].style['transform'] = 'rotate(-90deg)';
        }
    }

    _groupHiddenListener(){
        // Hide the div.
        this.displayBox.style.display = none;
    }
}

module.exports = GroupListeners;
