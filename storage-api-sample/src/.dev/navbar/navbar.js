let body = document.getElementsByTagName('body')[0];
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

body.innerHTML = navbar + body.innerHTML;