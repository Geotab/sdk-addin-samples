/**
 * Entry point for serving the app on localhost
 * Allows several UI features to be displayed to improve
 * development without adding them in to the final
 * build sent to production
 * 
 * ******************** NOTE ********************
 * 
 *  Any features built into this file will not be included in
 * the addin build. Any changes you want included should be in
 * app/index.js instead.
 * 
 * **********************************************
 */

// Global object is used to simulate the api, state, and geotab objects


global.events = require('./events');
global.api
global.state = require('./state');
global.geotab = {
    addin: {}, 
    customButtons: {}, 
    isDriveAddin: false
}
// Importing the app rules -> Where addin will be described


require('../src/scripts/index.js');

require('./addin');

// Importing dev-specific packages
import './rison';
import './login/loginTemplate.js';
import GeotabLogin from './login/loginLogic';
import GeotabApi from './api';
import "./styles/mapAddinStyles.css";

/* Translations */
import Translator from './lang/Translator';
let language = localStorage.language ? localStorage.language : 'en';
global.translator = new Translator('#app', language);

// Global Translate function
global.state.translate = function(target, language) {
    
    // First translation from initialize doesn't pass a language in. Will cause problems is language is undefined
    if (typeof language !== 'undefined'){
        localStorage.language = language;
        location.reload();
    }

    // Primary behaviour passes HTMLElement, but function needs to support string translation as well
    if (typeof target === 'string'){
        // Do translation
        let translation = global.translator.translateSentence(target);
        // return translated string
        return translation;
    }
}

/* Logic */
const loginLogic = new GeotabLogin(global.geotab.isDriveAddin, GeotabApi);


// Building translation hierarchy
require('./lang/languages');

// Handling the blur toggle
require('./ToggleHandler');
// Setup complete
/* Addin Logic */
require('../src/scripts/index');
