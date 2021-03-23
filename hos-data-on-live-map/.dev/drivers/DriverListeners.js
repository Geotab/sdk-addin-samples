const drivers = require('./Drivers.js');
let xIconSvg = require('../images/close-round.svg').default;
let chevron = require('../images/Font_Awesome_5_solid_chevron-left.svg').default;
const regeneratorRuntime = require('regenerator-runtime');

class DriverListeners {

    constructor(api, state, target){
        console.log("test");
        this.driverBox = new drivers(api, state, target);
        window.driversFilter = this.driverBox;
        this.displayBox = document.getElementById(target);
        this.inputBox = document.getElementById('driver-input');
        this.driverToggle = document.getElementById('driver-toggle-button');
        this.deleteAllBtn = document.getElementById('driver-remove-all');
        this.firstOpen = true;
        this.open = false;
        this.closeListener;
        this.changeSearchTimeout;
    }

    assignEventListeners(){
        // Hide dropdown when clicking outside of list.
        document.addEventListener('click', (event) => this._hidedriversOnOffClickListener(event));

        // driver dropdown box toggle.
        this.driverToggle.addEventListener('click', () => this._driverToggleListener(this.displayBox));

        // Open dropdown on input box click.
        this.inputBox.addEventListener('click', () => {
            if(!this.open){
                this._driverToggleListener(this.displayBox);
            }
        });

        // Inputbox listener for change - ie. enter presses.
        this.inputBox.addEventListener('change', (event) => this._driverSearchListener(event));

        // Inputbox listener for input timeout - ie. typing then stopping.
        this.inputBox.addEventListener('input', (event) => this._inputTimeoutdriverSearchListener(event));

    }

    _inputTimeoutdriverSearchListener(event){

        // Cancelling any previous search timeouts.
        clearTimeout(this.changeSearchTimeout);

        // Making a new one.
        this.changeSearchTimeout = setTimeout( async () => {
            await this._driverSearchListener(event);
        }, 500);
    }

    _hidedriversOnOffClickListener(event){
        if(!event.target.closest('#driver-wrapper, #driver-dropdown-ul')){
            if(this.open){
                this._driverToggleListener(this.displayBox);
            }
        }
    }

    _driverResetAllFilters(){
        this.driverBox.resetActivedrivers();
        this.inputBox.value = '';
        this.driverBox.previousSearchTerm = '';
    }

    async _driverSearchListener(event){
        let keyword = event.target.value;

        if(!this.open){
            await this._driverToggleListener(this.displayBox);
        }

        /**
         * Because this listener can be called on input and on change, there's a chance for it to be 
         * called twice. This is because the change event fires when focus on the input box is lost.
         * i.e. - you type, rely on the input listener, then go to click the item, the event re-fires
         *      and nothing happens in the UI until you click again.
         */
        if(keyword !== '' && keyword !== this.driverBox.previousSearchTerm){
            this.driverBox.driverSearch(keyword);
        } else if(keyword === '' && keyword !== this.driverBox.previousSearchTerm) {
            this.driverBox.generateRootHtml();
        }

        this.driverBox.previousSearchTerm = keyword;
    }

    async _driverToggleListener(display){
        if(!this.open){
            display.style.display = 'block';
            
            if(this.firstOpen){
                await this.driverBox.getAlldriversInDatabase();
                this.firstOpen = false;
            } else {
                this.driverBox.generateRootHtml();
            }

            this.open = true;
        } else {
            this.inputBox.value = '';
            this.driverBox.previousSearchTerm = '';
            display.style.display = 'none';
            this.open = false;
        }

        this._rotateToggleButton();
    }

    _rotateToggleButton(){
        if(this.open){
            this.driverToggle.children[0].style['mask-image'] = `url(${xIconSvg})`;
            this.driverToggle.children[0].style['-webkit-mask-image'] = `url(${xIconSvg})`;
            this.driverToggle.children[0].style['transform'] = 'none';
        } else {
            this.driverToggle.children[0].style['mask-image'] = `url(${chevron})`;
            this.driverToggle.children[0].style['-webkit-mask-image'] = `url(${chevron})`;
            this.driverToggle.children[0].style['transform'] = 'rotate(-90deg)';
        }
    }

    _driverHiddenListener(){
        // Hide the div.
        this.displayBox.style.display = none;
    }
}

module.exports = DriverListeners;
