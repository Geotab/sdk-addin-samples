const config = require('../../app/config.json');
/**
 * Props item - Houses all the navbar items and submenu items
 */
const props = [
    
    
     {
         name: 'activity',
         labelText: {
             en: 'Activity'
            },
         hasSubmenu: true,
         submenuItems: [
                {
                    name: 'storageApiSample',
                    labelText: config.items[0].menuName,
                }
            ]
    },
    
    
    
    
    
     
];

module.exports = props;