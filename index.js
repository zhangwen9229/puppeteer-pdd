const utils = require('./utils')
const puppeteer = require('puppeteer');
const { cookies } = require('./cookies')

let csvWriter = null
const promiseArray = []
// let browser = null
// let page = null
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1";

function rowCallBack(row) {
    let len = promiseArray.push({
        row,
        promise: new Promise(resolve => {
            (async () => {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await Promise.all([
                    page.setUserAgent(UA),
                    // 允许运行js
                    page.setJavaScriptEnabled(true),
                    // 设置页面视口的大小
                    page.setViewport({ width: 1100, height: 1080 }),
                ]);
                await page.setCookie(...cookies)
                await page.goto(row[0]);
                await page.waitFor(500)
                // const res = await page.$eval('.goods-container-v2', el => el.firstChild.children[1].innerText);
                await page.waitForSelector('.goods-container-v2');
                const el = await page.$('.goods-container-v2')
                const res = await page.$eval('.goods-container-v2', el => {
                    const text = el.firstChild.children[1].innerText
                    if (el.firstChild && el.firstChild.children[1]) {
                        if (text.indexOf('已下架') > -1) {
                            return text
                        }
                    }
                    return ''
                });
                await browser.close();
                console.log(`已读取${len}条...`)
                len = null
                resolve(res)
            })();
        })
    })

}

async function endCallBack() {
    console.log('完成数据读取，开始抓取网页数据...')
    // 每次只取10个promise并行执行
    let tmpPromiseArray = []
    let rows = []
    while (promiseArray.length > 0) {
        const promiseItem = promiseArray.shift()
        tmpPromiseArray.push(promiseItem.promise)
        rows.push(promiseItem.row)
        if (tmpPromiseArray.length === 10) {
            const results = await Promise.all(tmpPromiseArray)
            await generateCsvData(rows, results)
            tmpPromiseArray = []
            rows = []
        }
    }
    const results = await Promise.all(tmpPromiseArray)
    console.log('网页数据抓取完成,开始写入本地数据...')
    await generateCsvData(rows, results)
    console.log('本地写入完成...')
    process.exit(0)
}

async function generateCsvData(rows, results) {
    const records = [];
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const newRow = [...row, results[index]]
        records.push({ link: newRow[0], des: newRow[1] })
    }
    // console.log(records)
    await csvWriter.writeRecords(records)
}

(async () => {
    console.log('启动...')
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    csvWriter = createCsvWriter({
        path: './newData.csv',
        header: [
            { id: 'link', title: '链接' },
            { id: 'des', title: '描述' }
        ],
        encoding: 'UTF-8',
        alwaysQuote: true,
        append: true
    });
    console.log('开始读取数据...')
    utils.readerCsv('data.csv', rowCallBack, endCallBack)
})();

// (async () => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.setCookie(...cookies)
//     await page.goto('https://mobile.yangkeduo.com/goods.html?goods_id=72324361012&is_spike=0&refer_page_name=goods_detail&refer_page_id=10014_1578142026278_59wjwuw5dj&refer_page_sn=10014&_x_share_id=a0d48870aa3b49fba81667c67fdae277');
//     await page.screenshot({ path: 'example.png' });

//     await browser.close();
// })();