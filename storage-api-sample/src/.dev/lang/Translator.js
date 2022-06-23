const TranslationHelper = require('./TranslationHelper');
const helper = new TranslationHelper('en');

class Translator {

    constructor(root, language){
        try{
            helper.updateJSON(language);
        } catch(err){
            console.log(err.message);
        }
        this.domTree = new TreeNode(document.querySelector(root));
    }

    translateSentence(sentence){
        let response = helper.getTranslationText(sentence);
        return response;
    }

    getDomTree(){
        return this.domTree.showChildren();
    }
}

class TreeNode {

    constructor(node){
        this.element = node;
        this.translate = false;
        this.enText = [];
        this.translatedText;
        this.attributes;
        this.type;
        this.children = this.getChildren();
    }

    /**
     * Scrapes child nodes from the html using the helper method for checks
     */
    getChildren(){
        let children = [];
        let childNodes = this.element.childNodes;
        if(childNodes){
            this.element.childNodes.forEach( node => {
                // Finding text nodes to translate at current level
                if(helper.shouldTranslate(this.element)){        
                    if(helper.textAtBaseLevel(node)){
                        helper.cleanText(node);
                        if(!helper.whitespaceCheck(node)){
                            this.translate = true;
                            this.enText.push(node.textContent.trim())
                        }
                    // nodeType 1 is a nested element. We recurse for those
                    } else if(node.nodeType === 1){
                        let childNode = new TreeNode(node);
                        children.push(childNode);
                    }
                    // Translating the node text
                    if(this.translate){
                        this.enText.forEach( sentence => {
                            let translation = helper.getTranslationText(sentence.trim())
                            if(translation){
                                this.element.innerHTML = this.element.innerHTML.replace(sentence, translation.trim());
                            }
                        });
                    }
                    // Translating attributes if available
                    let attributes = helper.hasValidAttributes(this.element);
                    if(attributes.length > 0){
                        this.attributes = attributes;
                        this.translate = true;
                        let len = this.attributes.length;
                        for(let i=0;i<len;i++){
                            let enText = this.attributes[i].enText;
                            let helperVal = helper.getTranslationText(enText);
                            // If a translation exists, replacing the value with the translation
                            if(helperVal){
                                this.attributes[i].translationText = helperVal;
                                let attRef = this.element.attributes.getNamedItem(this.attributes[i].attribute);
                                attRef.value = this.attributes[i].translationText;
                            }
                        }
                    }
                }
            });
        }
        return children;
    }

    /**
     * logs the translate-able children to the console. Used in template generation
     */
    showChildren(){
        let response = [];
        this.children.forEach( child => {
            if(child.translate){
                response.push(child);
            }
            response = response.concat(child.showChildren());
        });
        return response;
    }
}

module.exports = Translator;