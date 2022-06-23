const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// puppeteer options
const opts = {
    headless: true,
    slowMo: 0,
    timeout: 10000
};

let browser = puppeteer.launch(opts);
browser.then( async (brows) => {
    page = brows.newPage();
    await page.then( async (p) => {
        await p.goto('http://localhost:9000/');
        let tree = await p.evaluate( () => {
            return translator.getDomTree();
        });
        let templateText = '{\n';
        let templatePath = path.join(__dirname, '../src/app/translations/template.json');
        let len = tree.length;
        for(let i=0; i<len; i++){
            // Normal text
            if(tree[i].enText){
                let enLen = tree[i].enText.length;
                for(let j=0;j<enLen;j++){
                    templateText += `\t"${tree[i].enText[j]}": "${tree[i].enText[j]}"${i !== len-1 ? ",":""}\n`;
                }
            }
            // Attribute text
            if(tree[i].attributes){
                let attLen = tree[i].attributes.length
                for(let j=0;j<attLen;j++){
                    templateText += `\t"${tree[i].attributes[j].enText}": `
                    + `"${tree[i].attributes[j].enText}"${i !== len-1 ? ',':''}\n`;
                }
            }
        }
        templateText += '}'
        fs.writeFile(templatePath, templateText, 'utf8', (err) => {
            if(err){
                brows.close();
                throw err;
            } else {
                console.log('Template Created');
            }
        });
    });
    brows.close();
})
    .catch( err => console.log(err));