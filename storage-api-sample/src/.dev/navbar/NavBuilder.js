
require('./navbar'); // Lay out the base to the main page;

let NavFactory = require('./NavFactory');
let NavHandler = require('./NavHandler');
let props = require('./props');
let language = localStorage.language ? localStorage.language : 'en';

let factory = new NavFactory(language);
let handler = new NavHandler(factory, props);

handler.updateMenuItem();
handler.generateContent();


handler.enableDisplayToggle();
