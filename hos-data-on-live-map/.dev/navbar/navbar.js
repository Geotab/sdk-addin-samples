require('./navbar'); // Lay out the base to the main page;

let NavFactory = require('./NavFactory');
let NavHandler = require('./NavHandler');
let props = require('./props');
let language = localStorage.language ? localStorage.language : 'en';

let factory = new NavFactory(language);
let handler = new NavHandler(factory, props);

let init = () => {
    handler.updateMenuItem();
    handler.generateContent();
};

let navbar = `
<nav id="menuId" class="westPane shadowedRight animated" style="top: 40px;">
    <div class="mainMenuSearchBar">
        <div class="mainMenuSearch">
            <button id="menuToggle" class="mainMenuSearchButton">
                <svg class="svgIcon geotabIcons_chevron" style="height: 30px; width: 30px;"></svg>
            </button>
            <div class="mainMenuSearchLogo">
                <div class="mainMenuCompanyLogo"></div>
            </div>
        </div>
    </div>
    <div id="navigationContainer">
        <div id="navigationId" class="shadowedRight scrollHost touchScrollClass hardwareAccelerationClass" tabindex="-1">
            <ul id="navBase" class="mainMenu" role="menu">
            </ul>
        </div>
    </div>
    <div id="hiddenMenu" class="mainMenu mainMenuPopup">
        <ul class="mainMenuSubMenu">
            <li class="mainMenuOption">
                <a class ="mainMenuLink" href="#"></a>
            </li>
        </ul>
    </div>
</nav>`.trim();

module.exports = {
    init: init,
    handler: handler,
    navbar: navbar
}