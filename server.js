const puppeteer = require('puppeteer');
const fs = require('fs');
const csvReader = require('fast-csv');
const path = require('path');

const loginUrl = 'https://login.i.ezproxy.nypl.org/login?qurl=http://library.morningstar.com%2fMembership%2fEndSession.html';
const fundsUrl = 'http://library.morningstar.com.i.ezproxy.nypl.org/Selectors/Fund/Selector.html';
const username = 'hankmoody789';
const password = '1111';

/**
 * Read CSV file
 */
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
		await page.setDefaultNavigationTimeout(0);		// Configure the navigation timeout

		const fileData = await read_file();
		let data = [];

		await page.goto(loginUrl);
		await page.type('[name="user"]', username);
		await page.type('[name="pass"]', password);
		
		const form = await page.$('#access-databases');
		await form.evaluate(form => form.submit());
		await page.waitForSelector('a[href^="/Selectors/Fund/Selector.html"]');
		await page.goto(fundsUrl);
		// await page.waitForNavigation();
		await page.waitForSelector('input#AutoCompleteBox');

		if (fileData.length) {
			console.log(fileData.length);
			// let row = fileData[0];
			for(let i = 0; i < Object.keys(fileData).length; i++) {
			// for (const row of fileData) {
				let row = fileData[i];
				// await page.waitForNavigation();
				await page.evaluate(() => document.querySelector('input#AutoCompleteBox').click()); 

				await page.evaluate(() => {
					document.querySelector('input#AutoCompleteBox').value = ''
				});
				await page.type('input#AutoCompleteBox', row.Symbol);
				await page.waitFor(2000);
				await page.keyboard.press("Enter");
				await page.waitForNavigation();
				await page.waitForSelector('span.security-info-name');

				const nameHandle = await page.$('span.security-info-name');
				const stockName = await page.evaluate(span => span.innerHTML, nameHandle);
				console.log(stockName)
				await page.waitForSelector('span.legend-label');

				let legends = await page.evaluate(() => {
					let labels = [...document.querySelectorAll(".legend-items > .legend-item > span.legend-label")];
					return labels.map(label => {
						let labelText = label.textContent.replace(/\n/g, "");
						labelText = labelText.trim();

						let valueText = label.nextElementSibling.textContent.replace(/\n/g, "");
						valueText = valueText.trim();
						return { 
							label: labelText,
							value: valueText
						};
					});
				});
				// console.log(legends);
				let fairValue = 0;
				legends.forEach(legend => {
					if (legend.label.toLowerCase() === 'fair value') {
						fairValue = legend.value;
					}
				});
				// console.log(stockName);
				let rowData = {
					userId: username,
					stockSymbol: row.Symbol,
					stockName,
					fairValue
				};
				console.log(rowData);
				data.push(rowData);
				await page.waitFor(1000);
			}
			// console.log(data);
			// console.log(data.length);
			
			/* let locInputs = await page.evaluate(() => {
				let divs = [...document.querySelectorAll("ul#locationchecklist > li > label > input")];
				return divs.map(div => div.id)	  
			}); */
			
			/* const data = await page.evaluate(async () => {
				// let nameElement = await this.page.$$('span.security-info-name');
				let nameElement = document.querySelectorAll('span.security-info-name');
				console.log(nameElement);
				nameElement = await nameElement.getProperty('innerText');
  				nameElement = await nameElement.jsonValue();
				return nameElement;
				// nameElement[i].innerText.trim()
				// return { name };
			});
			console.log(data) */


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
		} else {
			console.log("NO RECORDS FOUND IN CSV");
			await browser.close();
		}	
		// await browser.close();
	} catch (error) {
		await browser.close();
		console.log(error);
	}
})();