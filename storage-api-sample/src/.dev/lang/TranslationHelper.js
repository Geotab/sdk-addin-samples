class TranslationHelper {

    constructor(){
        this.json;
        this.excludes = ['html', 'head', 'style', 'title', 'link', 'meta', 'script', 'svg'];
        this.attributesForTranslation = ['placeholder', 'title', 'aria-label']
        this.excludeLookInside = ['iframe'];
        this.whitespace = /^\s*$/;
        this.matchingTags = /\<.*?\>.*?\<\/{1}.*?\>/;
        this.anyTag = /\<.*?\>/;
    }

    shouldTranslate(node){
        let excluded = this._isExcluded(node);
        let noTranslate;
        if(!excluded){
            noTranslate = this._markedAsIgnore(node);
        }
        return !excluded && !noTranslate;
    }

    _markedAsIgnore(node){
        return node.className.includes('noTranslate');
    }

    /**
     * Determines if the tag is excluded in our predefined tag lists
     */
    _isExcluded(node){
        return (this.excludes.includes(node.tagName) || this.excludeLookInside.includes(node.tagName));
    }

    /**
     * Cleans inbound text - replaces spaces, html char codes
     * 
     * @param {HTMLNode} node 
     */
    cleanText(node){
        let spaces = /\s{2,}/g,
            quotes = /(&quot;)|(&#035;)|(&#35;)/g,
            singleQuotes = /(&#039;)|(&#39;)/g;
        node.textContent = node.textContent.replace(spaces, ' ');
        node.textContent = node.textContent.replace(quotes, '"');
        node.textContent = node.textContent.replace(singleQuotes, "'");
    }

    /**
     * Determines if node has text at it's base (Not within children) using regex
     */
    textAtBaseLevel(node){
        let response = false;
        if(node.nodeType === 3){
            response = true;
        }
        return response;
    }

    /**
     * ensures no large clumps of whitespace (our regex breaks tags into whitespace).
     * Helper to determine if there is text at the base level
     */
    whitespaceCheck(node){
        return this.whitespace.test(node.textContent);
    }

    /**
     * 
     * @param {string} sentence english text
     */
    getTranslationText(sentence){
        let response
        if(this.json){
            response = (this.json[sentence] ? this.json[sentence] : sentence);
        } else {
            // Calling translate function when language is english means json dict wont exist
            response = sentence;
        }
        return response;
    }
    
    /**
     * Checks to see if there are valid attributes to be translated
     */
    hasValidAttributes(node){
        let response = [];
        // Checking against each of the pre-defined translation attributes
        this.attributesForTranslation.forEach( attribute => {
            // Grabbing a reference
            let attr = node.attributes.getNamedItem(attribute);
            if(attr){
                // pulling the text out of the attribute
                let textVal = node.getAttribute(attr.name);
                // Creating the Translation element
                response.push({
                    attribute: attr.name,
                    enText: textVal.trim(),
                    translationText: ''
                });                
            }
        });
        return response;
    }

    updateJSON(language){
        try {
            this.json = require(`../../app/translations/${language}.json`);
        } catch (e) {
            throw new Error(`${language}.json is not defined`);
        }
    }

}

module.exports = TranslationHelper;