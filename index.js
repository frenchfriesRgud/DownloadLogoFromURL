const fs = require('fs')
const request = require('request');
const SYMBOL = [
    'VZ'
]


// IMAGE DOWNLOAD FUNCTION
const download = function(uri, sym, filename, callback){
    request.head(uri, function(err, res, body){
        if(res.headers['content-type'] != 'image/png'){
            return console.log(`${sym} - not found`)
        }

        console.log(`${sym}.png - ${(res.headers['content-length'] / 1024).toFixed(2)} Kb`, );

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};


for(let sym of SYMBOL){
    download(`https://g.foolcdn.com/art/companylogos/square/${sym.toLowerCase()}.png`, sym, `download/foolcdn/${sym}.jpg`, function(){
        console.log(`${sym}.jpg - saved to disk.`);
    });
}