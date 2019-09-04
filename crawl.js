/**
 * HOW TO USE
 * 
 * Simply run 'node crawl.js' to run this app.
 * You will be prompted for a relative path. Make sure
 * crawl.js is in the correct directory. An output file,
 * 'result.txt' will be generated with a list of all
 * translated titles if any were found.
 * 
 */

const fs = require('fs');

const xml2js = require('xml2js');
const parser = xml2js.Parser({key: "ATTR"});

// Input
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

// This is where we need to start the search, first result with tag TEXT and TRANSLATION
// are what we are looking for.
const SECTION_LANDMARK = '<COURSEMAPPING><![CDATA[Title]]></COURSEMAPPING>';
const END_SECTION_LANDMARK = '</TYPE>';

readline.question('What relative path/directory do I read from?: ./', dir => {
    console.log(`Reading files in ./${dir}...`);

    const titles = translate(dir);

    fs.writeFileSync(__dirname + "/result.txt", JSON.stringify(titles));

    console.log(titles);

    console.log(`${titles.length - 1} translations extracted into result.txt`);

    readline.close();
})

// Function written separately for modularity and use in another app
const translate = dir => {

    // Get list of file names in directory
    const filenames = fs.readdirSync(`./${dir}`);

    const titles = [];

    // Iterate each file name
    filenames.forEach(filename => {
        try {
            let file = fs.readFileSync(`./${dir}/${filename}`, 'utf-8');
            const beginCulling = file.indexOf(SECTION_LANDMARK);
            const endCulling = file.indexOf(END_SECTION_LANDMARK, beginCulling);
            file = file.slice(beginCulling, endCulling + END_SECTION_LANDMARK.length);
            file = `<DATA>${file}</DATA>`;

           parser.parseString(file, (err, result) => {
                if(err) throw err;
                else {
                    titles.push({
                        text: cleanTitle(result.DATA.TEXT[0]),
                        translation: cleanTitle(result.DATA.TRANSLATION[0])
                    });

                    titles.sort((a, b) => {
                        const numA = a.text.split(' ')[0];
                        const numB = b.text.split(' ')[0];
                        return numA - numB;
                    })
                }
            })
        } catch (err) {
            console.log(`Failed to read ./${dir}/${filename}`);
        }
    })

    if(titles.length === 1) {
        console.log("No translations extracted");
        return [];
    } else {
        return titles;
    }
}

const cleanTitle = title => {
    let text = title;
    if (!text || typeof text !== 'string') {
        console.log('Recieved empty/invalid string');
        return '';
    } else {
        const start = text.indexOf('-') === -1 ? text.indexOf('-') : 0;
        const end = text.indexOf('(') === -1 ? text.indexOf('(') : text.length;
        text = text.slice(start, end);
        return title;
    }
}

module.exports = translate;