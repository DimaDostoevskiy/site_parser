import puppeteer from "puppeteer";
import { Product } from "./Models.js";
import { dbProduct } from "./dbModels.js";
import sequelize from "./sequelizeConfig.js";
import fs from "fs";

// функция прокрутки страницы
const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

// опции браузера
const LAUNCH_PUPPETEER_OPTS = {
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
    "--window-size=1920x1080",
  ],
};

// опции страницы
const PAGE_PUPPETEER_OPTS = {
  networkIdle2Timeout: 5000,
  waitUntil: "networkidle2",
  timeout: 30000,
};

// адрес страницы
const URL = "https://www.chay.info/catalog/kofe/";

// селекторы данных
const titleSelector = ".catalog-item__title > a";
const priceSelector = ".catalog-item__price-value";
const imageSelector = ".catalog-item__image > picture > img";
const descSelector = ".catalog-item__desc";
const categorySelector = ".catalog-item__category";

// для записи в файл
const stream = fs.createWriteStream("./test.txt");

// создаём браузер и страницу (см. документацию puppeteer)
const browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
const page = await browser.newPage();

const start = async () => {
  try {
    await page.goto(URL, PAGE_PUPPETEER_OPTS);

    // автопрокрутка если на странице не все данные
    // await autoScroll(page);

    // массивы по селекторам
    const titles = await page.$$eval(titleSelector, (elements) =>
      elements.map((elem) => elem.innerText)
    );
    const prices = await page.$$eval(priceSelector, (elements) =>
      elements.map((elem) => elem.innerText)
    );
    const images = await page.$$eval(imageSelector, (elements) =>
      elements.map((elem) => elem.src)
    );
    const descriptions = await page.$$eval(descSelector, (elements) =>
      elements.map((elem) => elem.innerText)
    );
    const category = await page.$$eval(categorySelector, (elements) =>
      elements.map((elem) => elem.innerText)
    );

    // очищаем title от мусора
    const normalTitle = titles.map((title) => {
      return title.includes(",") ? title.slice(0, title.indexOf(",")) : title;
    });

    // итоговый массив
    const productList = [];
    normalTitle.forEach((title, i) =>
      productList.push(
        new Product(title, prices[i], descriptions[i], images[i], category[i])
      )
    );

    // пишим в базу
    // productList.forEach(async (item) => {
    //   await sequelize
    //     .sync()
    //     .then(() => {
    //       return dbProduct.create({
    //         title: item.title,
    //         price: parseInt(item.price) || 0,
    //         desc: item.desc,
    //         image: item.image,
    //         quantity: 0,
    //         category: item.category,
    //       });
    //     })
    //     .then((newProduct) => {
    //       console.log(`Продукт ${newProduct.id} создан`);
    //     });
    // });

    // пишим в тестовый файл
    productList.forEach((item, i) => {
      stream.write(
        `${i} | ${item.title} | ${item.price} | ${item.desc} | ${item.image} | ${item.category} \n`
      );
    });
    // закрываем поток записи
    stream.end();

    // закрываем браузер
    await browser.close();
  } catch (err) {
    console.log(err);
    stream.end();
    await browser.close();
  }
};

await start();
