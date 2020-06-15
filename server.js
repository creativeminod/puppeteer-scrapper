const puppeteer = require('puppeteer');
const fs = require('fs');
const csvReader = require('fast-csv');
const path = require('path');

const url = 'https://login.i.ezproxy.nypl.org/login?qurl=http://library.morningstar.com%2fMembership%2fEndSession.html';

const read_file = async () =>{
	return new Promise( async (resolve, reject) => {
		let fileRows = [];
		fs.createReadStream(path.resolve(__dirname, 'assets', 'companylist.csv'))
		.pipe(csvReader.parse({ headers: true }))
		.on('error', error => reject(error))
		.on('data', row => fileRows.push(row))
		.on('end', (rowCount) => {
			console.log(`Parsed ${rowCount} rows`);
			resolve(fileRows);
		});
	});

};


(async () => {
	try {
		
		var browser = await puppeteer.launch({ headless: false });

		const page = await browser.newPage();
		const fileData = await read_file();
		// console.log(fileData);
		console.log(fileData.length);
		await page.goto(url);

		/* await page.goto(`https://news.ycombinator.com/`);
		await page.waitForSelector("a.storylink");

		var news = await page.evaluate(() => {
		var titleNodeList = document.querySelectorAll(`a.storylink`);
		var ageList = document.querySelectorAll(`span.age`);
		var scoreList = document.querySelectorAll(`span.score`);
		var titleLinkArray = [];
		for (var i = 0; i < titleNodeList.length; i++) {
			titleLinkArray[i] = {
				title: titleNodeList[i].innerText.trim(),
				link: titleNodeList[i].getAttribute("href"),
				age: ageList[i].innerText.trim(),
				score: scoreList[i].innerText.trim()
			};
		}
		return titleLinkArray;
		});
		// console.log(news);
		await browser.close();
		// Writing the news inside a json file
		fs.writeFile("hackernews.json", JSON.stringify(news), function(err) {
		if (err) throw err;
			console.log("Saved!");
		});
		console.log("Browser Closed"); */
		await browser.close();
	} catch (error) {
		await browser.close();
		console.log(error);
	}
})();