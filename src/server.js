const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const ExcelJS = require('exceljs');
const { runNoonScrape } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

async function writeExcel(scrapeResult) {
  const workbook = new ExcelJS.Workbook();

  const productSheet = workbook.addWorksheet('products');
  productSheet.columns = [
    { header: 'source_url', key: 'sourceUrl', width: 60 },
    { header: 'canonical_url', key: 'canonicalUrl', width: 60 },
    { header: 'overview', key: 'overview', width: 60 },
    { header: 'specs', key: 'specs', width: 60 },
    { header: 'noon_price', key: 'noonPrice', width: 20 },
    { header: 'mrp', key: 'mrp', width: 20 },
    { header: 'image_urls_csv', key: 'imagesCsv', width: 80 },
    { header: 'status', key: 'status', width: 12 },
    { header: 'error', key: 'error', width: 40 },
  ];

  for (const row of scrapeResult.results) {
    productSheet.addRow({
      ...row,
      imagesCsv: row.imageUrls.join(', '),
    });
  }

  const imageSheet = workbook.addWorksheet('images');
  imageSheet.columns = [
    { header: 'canonical_url', key: 'canonicalUrl', width: 60 },
    { header: 'image_url', key: 'imageUrl', width: 80 },
  ];

  for (const row of scrapeResult.results) {
    for (const imageUrl of row.imageUrls) {
      imageSheet.addRow({ canonicalUrl: row.canonicalUrl, imageUrl });
    }
  }

  const errorSheet = workbook.addWorksheet('errors');
  errorSheet.columns = [
    { header: 'url', key: 'url', width: 60 },
    { header: 'error', key: 'error', width: 90 },
  ];

  for (const error of scrapeResult.errors) {
    errorSheet.addRow(error);
  }

  await fs.mkdir(path.join(__dirname, '..', 'exports'), { recursive: true });
  const filename = `noon-scrape-${Date.now()}.xlsx`;
  const fullPath = path.join(__dirname, '..', 'exports', filename);
  await workbook.xlsx.writeFile(fullPath);
  return { filename, fullPath };
}

app.post('/api/scrape', async (req, res) => {
  try {
    const scrapeResult = await runNoonScrape(req.body || {});
    const file = await writeExcel(scrapeResult);
    res.json({
      ok: true,
      ...scrapeResult,
      downloadPath: `/exports/${file.filename}`,
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.use('/exports', express.static(path.join(__dirname, '..', 'exports')));

app.listen(PORT, () => {
  console.log(`Noon scraper running on http://localhost:${PORT}`);
});
