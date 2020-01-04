const fs = require('fs');
const path = require('path')
const CsvReadableStream = require('csv-reader');


function readerCsv(fpath, rowCallBack, endCallBack) {
    const fileName = path.join(__dirname, 'db', fpath)
    const inputStream = fs.createReadStream(fileName, 'utf8');

    inputStream
        .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
        .on('data', function (row) {
            console.log('A row arrived: ', row);
            rowCallBack && rowCallBack(row)
        })
        .on('end', function () {
            console.log('No more rows!');
            endCallBack && endCallBack()
        });
}

module.exports = {
    readerCsv
}