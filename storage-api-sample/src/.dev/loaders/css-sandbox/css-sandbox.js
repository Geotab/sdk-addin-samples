const css = require('css');

function prefixRules(rules, prefix){
    for(let i = 0; i< rules.length; i++){
        // If there are nested rules, we want to prefix those as well
        if(rules[i].rules){
            prefixRules(rules[i].rules, prefix);
        }

        // If there are no selectors in the rules, we leave it alone
        if(!rules[i].selectors){
            continue;
        }

        // Iterating all the selectors present and appending the given prefix to them
        rules[i].selectors = rules[i].selectors.map( selector => prefix + ' ' + selector);
    }
}

module.exports = function(content){
    let prefix = this.query.prefix;
    let cssObj;
    if(!prefix){
        this.emitError(Error('Prefix not provided in options. CSS not prefixed'));
    } else {
        cssObj = css.parse(content);
        if(cssObj.type === 'stylesheet'){
            if(cssObj.stylesheet && cssObj.stylesheet.rules){
                let rules = cssObj.stylesheet.rules;
                prefixRules(rules, prefix);
            }
        }
    }

    return css.stringify(cssObj);
}