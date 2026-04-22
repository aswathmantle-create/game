const { chromium } = require('playwright');
const { textOrNull, toAbsoluteUrl, randomInt, sleep } = require('./utils');

const SELECTORS = {
  plpWrapper: '.ProductListDesktop-module-scss-module__okqu8G__layoutWrapper',
  overview: '.OverviewDescription-module-scss-module__VOioTG__overviewDescriptionWrapper',
  specs: '.SpecificationsTab-module-scss-module__xe5LJa__tableCtr',
  gallery: '.GalleryV2-module-scss-module__hlK6zG__thumbnailInnerCtr img',
  priceNow: '.PriceOfferV2-module-scss-module__dHtRPW__priceNowCtr.PriceOfferV2-module-scss-module__dHtRPW__isCurrencySymbol',
  priceWas: '.PriceOfferV2-module-scss-module__dHtRPW__priceWasCurrency',
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

async function collectPlpLinks(page, plpUrl) {
  await page.goto(plpUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.waitForSelector(SELECTORS.plpWrapper, { timeout: 45_000 });
  await sleep(randomInt(1000, 2500));

  const links = await page.evaluate((selector) => {
    const wrapper = document.querySelector(selector);
    if (!wrapper) return [];
    const anchors = Array.from(wrapper.querySelectorAll('a[href]'));
    return anchors
      .map((a) => a.getAttribute('href'))
      .filter(Boolean);
  }, SELECTORS.plpWrapper);

  const abs = links
    .map((href) => toAbsoluteUrl(href, plpUrl))
    .filter(Boolean);

  return [...new Set(abs)];
}

async function humanDelay(page, minDelayMs, maxDelayMs) {
  const width = 1000 + randomInt(0, 300);
  const height = 700 + randomInt(0, 200);
  await page.setViewportSize({ width, height });
  await page.mouse.move(randomInt(20, width - 20), randomInt(20, height - 20), {
    steps: randomInt(8, 25),
  });
  await sleep(randomInt(minDelayMs, maxDelayMs));
}

async function extractPdpData(context, url, config) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await humanDelay(page, config.minDelayMs, config.maxDelayMs);

    const data = await page.evaluate((selectors) => {
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || window.location.href;

      const textFrom = (sel) => {
        const node = document.querySelector(sel);
        return node?.innerText || null;
      };

      const imageUrls = Array.from(document.querySelectorAll(selectors.gallery))
        .map((img) => img.getAttribute('src') || img.getAttribute('data-src'))
        .filter(Boolean);

      return {
        canonical,
        overview: textFrom(selectors.overview),
        specs: textFrom(selectors.specs),
        priceNow: textFrom(selectors.priceNow),
        mrp: textFrom(selectors.priceWas),
        imageUrls,
      };
    }, SELECTORS);

    return {
      sourceUrl: url,
      canonicalUrl: toAbsoluteUrl(data.canonical, url) || url,
      overview: textOrNull(data.overview),
      specs: textOrNull(data.specs),
      noonPrice: textOrNull(data.priceNow),
      mrp: textOrNull(data.mrp),
      imageUrls: (data.imageUrls || []).map((img) => toAbsoluteUrl(img, url)).filter(Boolean),
      status: 'ok',
      error: null,
    };
  } catch (error) {
    return {
      sourceUrl: url,
      canonicalUrl: url,
      overview: null,
      specs: null,
      noonPrice: null,
      mrp: null,
      imageUrls: [],
      status: 'failed',
      error: error.message,
    };
  } finally {
    await page.close();
  }
}

async function runNoonScrape(options) {
  const config = {
    plpUrl: options.plpUrl,
    maxProducts: Number(options.maxProducts || 30),
    concurrency: Math.min(5, Math.max(1, Number(options.concurrency || 2))),
    minDelayMs: Math.max(400, Number(options.minDelayMs || 1000)),
    maxDelayMs: Math.max(900, Number(options.maxDelayMs || 2500)),
  };

  if (!config.plpUrl) {
    throw new Error('PLP URL is required');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)],
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Upgrade-Insecure-Requests': '1',
      DNT: '1',
    },
  });

  const page = await context.newPage();
  const results = [];
  const errors = [];

  try {
    const links = await collectPlpLinks(page, config.plpUrl);
    const targetLinks = links.slice(0, config.maxProducts);

    let index = 0;
    const workers = Array.from({ length: config.concurrency }).map(async () => {
      while (index < targetLinks.length) {
        const current = targetLinks[index];
        index += 1;
        const item = await extractPdpData(context, current, config);
        results.push(item);
        if (item.status !== 'ok') {
          errors.push({ url: current, error: item.error });
        }
      }
    });

    await Promise.all(workers);

    return {
      config,
      plpLinksFound: links.length,
      scrapedCount: results.length,
      results,
      errors,
      timestamp: new Date().toISOString(),
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

module.exports = {
  runNoonScrape,
};
