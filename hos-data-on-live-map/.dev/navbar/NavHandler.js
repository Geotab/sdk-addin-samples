class NavHandler {
    
    /**
    * Params handed in from login.js. Allows use of focus and blur from navbar
    * interactions
    * 
    * @param {object} api - GeotabAPI object
    * @param {object} state - mock addin state - Contains addin controls (blur, etc.)
    */
    constructor(navFact, props){
        this.navFact = navFact;
        this.props = props;
        this.focus = true;
    }

    /**
    * Assigns and handles behaviour of the navbar when clicked
    * 
    * @param {event} event click event for the click
    * @param {object} self DOM Element making the click
    * @param {HTMLCollection} menuHeaders The headers of the nav bar
    * @param {object} floatingMenu DOM Element for the floating menu bar - appears when navbar is collapsed
    * @param {bool} navigationBarExtended
    * @param {bool} submenu if the item being clicked has a submenu or not -> Changes the way the headers behave
    */
    clickHandler(event, self, menuHeaders, floatingMenu, navigationBarExtended, submenu=false){
        // Add active state to clicked nav button if not already selected
        if(!self.className.includes('activeStateButton')){
            self.className = self.className += ' activeStateButton';
        }
    
        let parent = self.parentElement;
        // Handling submenu expansion
        if(navigationBarExtended){ 
            if(parent.className.includes(' mainMenuHeaderExpanded')){
                parent.className = parent.className.replace(' mainMenuHeaderExpanded', '');
            } else {
                parent.className = parent.className += ' mainMenuHeaderExpanded';
            }
        } else {// Showing the floating bar if it is not visible
            // Ensuring the header has a submenu -> parent.children[1] is an associated submenu
            if(parent.children[1] !== undefined){
                // Making the floating menu a duplicate of the submenu associated with the header
                floatingMenu.innerHTML = parent.children[1].innerHTML;
                if(floatingMenu.style.display == 'block'){
                    floatingMenu.style.display = 'none';
                } else {
                    floatingMenu.style.display = 'block';
                    floatingMenu.style.top = `${event.y - 50}px`; // Rough approximation
                }
    
                // Adding listeners to each floating menu item to close the floating menu when selected
                let floatingListElements = floatingMenu.children[0].children;
                for (let j = 0; j < floatingListElements.length; j++) {
                    floatingListElements[j].children[0].addEventListener('click', function(){
                        floatingMenu.style.display = 'none';
                    });
                }
            } else {
                floatingMenu.style.display = 'none';
            }
        }

        // Iterating the clicked header's siblings
        for(let i=0; i<menuHeaders.length; i++){
            let sibling = menuHeaders[i].children[0];
            // Will remove the highlighting of main menu provided the selection isn't in a submenu
            if(sibling !== self && !submenu){
                sibling.className = sibling.className.replace(' activeStateButton', '');
            }

            // Closing other open submenus
            if(menuHeaders[i] !== parent && !submenu){
                if(menuHeaders[i].className.includes('mainMenuHeaderExpanded')){
                    menuHeaders[i].className = menuHeaders[i].className.replace('mainMenuHeaderExpanded', '');
                }
            }
        }
    }

    /**
     Generates HTML based on the props.js file using NavFactory to
    * scaffold out the components
    * 
    * Grabs references and adds event listeners
    */
    generateContent(){
        // Self defined for referencing clickHandler
        let self = this;
        this.createNavBar();

        // Referencing the new navbar
        let navigationBar         = document.getElementById('menuId');
        let toggleButton          = document.getElementById('menuToggle');
        let chevronIcon           = toggleButton.children.item(0);
        let menuHeaders           = document.getElementsByClassName('mainMenuHeader');
        let floatingMenu          = document.getElementById('hiddenMenu');
        let navigationBarExtended = true;

        // Handling Navbar pop in/out
        toggleButton.addEventListener('click', ()=>{
            if(!navigationBarExtended){
                navigationBar.className = navigationBar.className.replace('menuCollapsed', '');
                chevronIcon.style.transform = 'rotate(0deg)';
            } else {
                navigationBar.className += ' menuCollapsed';
                chevronIcon.style.transform = 'rotate(180deg)';
            }
             // Closing the floating menu
             floatingMenu.style.display = 'none';

             // Closing any open menu headers
             for(let i=0; i<menuHeaders.length; i++){
                 menuHeaders[i].className = menuHeaders[i].className.replace(' mainMenuHeaderExpanded', '');
             }
 
             // Inverting extended status
            navigationBarExtended = !navigationBarExtended
        });
        
        // Handling Button click (Highlighting)
        for(let i=0; i<menuHeaders.length; i++){
            let submenu = menuHeaders[i].children[1];
            if(submenu){
                let menuItems = submenu.children[0].children;
                // Adding in the selection and menu handlers for submenu items
                if(navigationBarExtended){
                    for (let j = 0; j < menuItems.length; j++) {
                        menuItems[j].children[0].addEventListener('click', function(event){
                            self.clickHandler(event, this, menuHeaders, floatingMenu, navigationBarExtended, true);
                        });
                    }
                } 
            } 
            // All menu headers require the functionality
            menuHeaders[i].children[0].addEventListener('click', function(event){
                self.clickHandler(event, this, menuHeaders, floatingMenu, navigationBarExtended);
            });
        }   
    }

    createNavBar(){
        // Generating Navbar
        let navHTML = ``;
        let navBase = document.getElementById('navBase');
        let headerCount = 0;

        // Reading the JSON props file and building out the navbar
        this.props.forEach(prop => {
            prop.id = headerCount;
            // Main header
            navHTML += this.navFact.openMainHeader(prop);
            if(prop.hasSubmenu){
                // Sub Menu
                navHTML += this.navFact.openSubMenu(prop);
                prop.submenuItems.forEach( item => {
                    // Sub header
                    navHTML += this.navFact.subHeader(item);
                })
                navHTML += this.navFact.closeSubMenu();
            }
            navHTML += this.navFact.closeMainHeader();
            headerCount++;
        });
        navBase.innerHTML = navHTML;
    }

    updateMenuItem(){
        this.createNavBar();
    }

} 

module.exports = NavHandler;