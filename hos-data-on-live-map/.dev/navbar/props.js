const config = require('../../src/configuration/configuration.json');
/**
 * Props item - Houses all the navbar items and submenu items
 */
const props = [
     
     {
        name: 'test',
        labelText: config.items[0].menuName,
        hasSubmenu: false,
        submenuItems: []
     }
     
];

module.exports = props;