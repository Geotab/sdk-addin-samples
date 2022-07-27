/**
 * Factory Build for the nav bar
 * 
 * Returns components of the navbar list
 */
class NavFactory {
   
    constructor(language){
        this.language = language;
    }

    /**
     * Assembles the beginning of a header tag that can contain a sub menu
     * @param {object} props item in the props list 
     */
    openMainHeader(props){
        let mainHead = new OpenMainHeader(props, this.language);
        return mainHead.returnHTML();
    }

    closeMainHeader(){
        return `</li>`;
    }

    /**
     *  Assembles the beginning of a sub menu that is hidden until the header option is clicked
     * @param {object} props item in the props list 
     */
    openSubMenu(props){
        let subMenu = new OpenSubMenu(props);
        return subMenu.returnHTML();
    }

    closeSubMenu(){
        return `</ul></div>`;
    }

    /**
     * Creates a complete subheader block
     * @param {object} props subheader object in the props list 
     */
    subHeader(props){
        let subHead = new SubHeader(props, this.language);
        return subHead.returnHTML();
    }
}

class OpenMainHeader {
    constructor(props, language){
        let title = props.labelText[language] ? props.labelText[language] : props.labelText["en"];
        // Buttons don't change the title ref -> What is used to base the blur() functions on
        this.html = `
        <li class="mainMenuHeader">
            ${props.hasSubmenu ? 
            `<button id="btn-${props.name}" class="mainMenuHeaderLink mainMenuLink ellipsis popupWindowTrigger">
                <span class="icon geotabIcons_${props.name}"></span>
                <span class="itemText">${title}</span>
            </button>`
                :
            `<a href="#${props.name}" id="btn-${props.name}" class="mainMenuHeaderLink mainMenuLink ellipsis popupWindowTrigger">
                <span class="icon geotabIcons_${props.name}"></span>
                <span class="itemText">${title}</span>
            </a>`
            }
        `.trim();
    }

    returnHTML(){
        return this.html;
    }
}

class OpenSubMenu {
    constructor(props){
        this.html =`
        <div id="submenu-${props.id}" class="mainMenuHeaderSubMenu">
            <ul id="${props.id}" class="mainMenuSubMenu">
        `.trim();
    }

    returnHTML(){
        return this.html;
    }
}

class SubHeader {
    constructor(props, language){
        let title = props.labelText[language] ? props.labelText[language] : props.labelText["en"];
        this.html = `
        <li class="mainMenuOption">
            <a class="mainMenuLink" title="The Product Guide provides an introduction to the application and its features." href="#${props.name}">
                <span class="icon geotabIcons_${props.name}"></span>
                <div class="ellipsis">${title}</div>
            </a>
        </li>`.trim();
    }

    returnHTML(){
        return this.html;
    }
}

module.exports = NavFactory;