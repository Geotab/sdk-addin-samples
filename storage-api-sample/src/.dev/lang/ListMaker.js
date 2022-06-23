class ListMaker {

    constructor(){
        this.languagesTarget = document.querySelector("#languages-target");
        this.languages = {
            'en':'English',
            'de':'Deutsch',
            'es':'Español',
            'fr':'Français',
            'it':'Italiano',
            'nl':'Nederlands',
            'pl':'Polski',
            'pt-BR':'Português (Brasil)',
            'ja':'日本語',
            'zh-hans':'简体中文'
        };
    }

    addListToDOM(){
        this.languagesTarget.innerHTML = this.buildList();
        this.languagesTarget.className = 'noTranslate';
    }

    buildList(){
        let list = `<select id="devLangs" class="dev-button">`;
        Object.keys(this.languages).forEach( language => {
            list += `<option class="noTranslate" value="${language}" ${localStorage.language === language ? 'selected': ''}>${this.languages[language]}</option>`;
        });
        list += `</select>`;
        return list.trim();
    }

    addEventListeners(){
        let selector = document.querySelector('#devLangs');
        selector.addEventListener('input', function(){
            // TODO -> Is this really the best option?
            global.state.translate(null, selector.value);
        });
    }
}

module.exports = ListMaker;