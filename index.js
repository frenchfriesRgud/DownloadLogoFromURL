const fs = require('fs');
const fsPromises = require("fs").promises;
const util = require('util');
const mkdirSync = util.promisify(fs.mkdirSync)
const request = require('request');
var http = require('http');
let DEBUGMODE = false;
let GROCERIES;
if(DEBUGMODE){
    GROCERIES = require('./data/groceries_testing.json');
} else {
    GROCERIES = require('./data/groceries.json');
}
const NOTFOUND = [];

function timeDiffCalc(dateFuture, dateNow) {
    let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;

    // calculate days
    const days = Math.floor(diffInMilliSeconds / 86400);
    diffInMilliSeconds -= days * 86400;

    // calculate hours
    const hours = Math.floor(diffInMilliSeconds / 3600) % 24;
    diffInMilliSeconds -= hours * 3600;

    // calculate minutes
    const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
    diffInMilliSeconds -= minutes * 60;

    let difference = '';
    if (days > 0) {
      difference += (days === 1) ? `${days} day, ` : `${days} days, `;
    }

    difference += (hours === 0 || hours === 1) ? `${hours} hour, ` : `${hours} hours, `;

    difference += (minutes === 0 || hours === 1) ? `${minutes} minute` : `${minutes} minutes`; 
    return difference;
  }

// end logging
// ----------------------------------------------------
// DOWNLOAD STOCK MARKET LOGOS
// download stock market logos from foolcdn
var rDownload = function (urlArray, i) {
    if (i < urlArray.length) {
        request.get(`https://g.foolcdn.com/art/companylogos/square/${urlArray[i].symbol.toLowerCase()}.png`)                                                                                  
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
            .pipe(fs.createWriteStream(`download/foolcdnmark/${urlArray[i].symbol}.jpg`))                                                                 
            .on('close', function () { 
                console.log(`${urlArray[i].symbol} - saved`);
                rDownload(urlArray, i+1); }) 
            .on('error', function(err){
                console.log('error thrown')
            })
    }
}
// run the logo downloader
//rDownload(SYMBOL, 0);

// ----------------------------------------------------
// DOWNLOAD GROCERY PRODUCT IMAGES

console.clear();
let downloadableItemArray = [];

for(let item of GROCERIES){
    // get the item id and save it
    let id = item.id;
    // search each image
    for(let [index, image] of item.imageSource.entries()){
        // create an object with id, image, and it's index
        // size testing:
        // original - 2.000mb @750x
        // 200x     - 0.235mb
        // 250x     - 0.338mb
        let obj = {
            // url: image.replace('cloudfront.net/750x/', 'cloudfront.net/250x/'),
            url: image,
            id: id,
            i: index
        }
        // add the array
        downloadableItemArray.push(obj);
    }
}

let maxItems = downloadableItemArray.length;
let startTime = new Date();
let failedURLS = [];
const failedDownloadLog = () => {
    console.log(failedURLS);
    console.log(`Counter failed at image ${counter}`);
};
const itemDownload = async function (obj) {
    //increment the counter
    counter++;
    let percentFinished = ((counter / maxItems) * 100).toFixed(2) + ' %';

    if(counter === (maxItems + 1 )){
        console.log(`[${counter}/${maxItems}] ${percentFinished} - maxItems: ${maxItems} - Process finished.`);
        return
    }

    //store the image details
    const imageSource = obj.url;
    const i = obj.i;
    const id = obj.id;

    // prepare the directory
    let dir = `download/groceries/image/${id}`;
    if (i < imageSource.length || true) {
        // create the directory
        try {
            await fsPromises.access(dir, fs.constants.F_OK);
            console.log(`[${counter}/${maxItems}] ${percentFinished} - ${dir} Time: ${timeDiffCalc(new Date(), startTime)} - Exists`);
        } catch (e) {
            await fsPromises.mkdir(dir);
            console.log(`[${counter}/${maxItems}] ${percentFinished} - ${dir} Time: ${timeDiffCalc(new Date(), startTime)} - Created!`);
        }
        // download the image
        request.get(`${imageSource}`)                                                                                  
            .on('error', function(err) {
                console.log(`[${counter}/${maxItems}] ${percentFinished} - ${dir} Time: ${timeDiffCalc(new Date(), startTime)} - img ${i+1} - not found`);
                failedURLS.push(imageSource);
                itemDownload(downloadableItemArray[counter]);// - recursive download
            })
            .on('response', async function(response) {
                if(response.statusCode != 200){
                    itemDownload(downloadableItemArray[counter]);// - recursive download
                    throw new Error('not found');
                    return
                    console.log(`${id} img ${i+1} - not found`)
                }
            })                                                   
            .pipe(fs.createWriteStream(`${dir}/${id}_${i+1}.jpg`))                                                                 
            .on('close', function () { 
                console.log(`[${counter}/${maxItems}] ${percentFinished} - ${dir} Time: ${timeDiffCalc(new Date(), startTime)} - img ${i+1} - saved`);
                
                itemDownload(downloadableItemArray[counter]);// - recursive download
            })
            .on('error', function(err){
                console.log(`[${counter}/${maxItems}] ${percentFinished} - ${dir} Time: ${timeDiffCalc(new Date(), startTime)} - img ${i+1} - ERROR DETECTED! SEE ERROR BELOW. IMG added to fails array.`);
                failedURLS.push(imageSource);
                failedDownloadLog();
                console.log(err)
                itemDownload(downloadableItemArray[counter]);// - recursive download
            })
    }
}
console.log(downloadableItemArray.length);
// run the grocery downloader
let counter = 32182; // what do you want to start at;
itemDownload(downloadableItemArray[counter]);

