class ToggleHandler{
    /**
     * Toggles the development addin
     * allows user to see any processes that take place when the addin is blurred/focused
     */
    constructor(){
        this.focus = true;
        let displayToggle = document.getElementById('toggleBtn');
        displayToggle.addEventListener('click', () => {
            if(this.focus){
                displayToggle.innerHTML = 'Focus add-in';
                global.geotab.addin.storageApiSample.blur();
            } else {
                displayToggle.innerHTML = 'Blur add-in';
                global.geotab.addin.storageApiSample.focus(global.api, global.state);
            }
            this.focus = !this.focus;
        });
    }

}

new ToggleHandler();