const fs = require('fs')
const request = require('request');
var http = require('http');
const SYMBOL = require('./data/SYMBOL.json');

const NOTFOUND = [];

// IMAGE DOWNLOAD FUNCTION
// const download = function(uri, sym, filename, callback){
//     request.head(uri, function(err, res, body){
//         if(res.headers['content-type'] != 'image/png'){
//             NOTFOUND.push(sym);
//             return console.log(`${sym} - not found`)
//         }

//         console.log(`${sym}.png - ${(res.headers['content-length'] / 1024).toFixed(2)} Kb`, );

//         request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//     });
// };

// const start = () => {
//     for(let sym of SYMBOL){
//         download(`https://g.foolcdn.com/art/companylogos/square/${sym.symbol.toLowerCase()}.png`, sym.symbol, `download/foolcdn/${sym.symbol}.jpg`, function(){
//             console.log(`${sym.symbol}.jpg - saved to disk.`);
//         });
//     }
// }

var rDownload = function (urlArray, i) {
    if (i < urlArray.length) {
        request.get(`https://g.foolcdn.com/art/companylogos/mark/${urlArray[i].symbol.toLowerCase()}.png`)                                                                                  
            .on('error', function(err) {
                console.log(`${urlArray[i].symbol} - not found`);
                //rDownload(urlArray, i+1);
            })
            .on('response', function(response) {
                if(response.statusCode != 200){
                    //throw new Error('not found');
                    console.log(`${urlArray[i].symbol} - not found`)
                    //return rDownload(urlArray, i+1);
                }
            })                                                   
            .pipe(fs.createWriteStream(`download/foolcdn_mark/${urlArray[i].symbol}.jpg`))                                                                 
            .on('close', function () { 
                console.log(`${urlArray[i].symbol} - saved`);
                rDownload(urlArray, i+1); })
            .on('error', function(err){
                console.log('error thrown')
            })
    }
}

// let SYMBOL = [
//     {
//     symbol: 'AAPL'
//     },
//     {
//         symbol: 'alklkdsfklsd'
//     },
//     {
//     symbol: 'AMD'
//     },
// ]

rDownload(SYMBOL, 0);