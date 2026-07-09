/* Uzcarsale — HTTP-сервер: REST API + отдача статики (агент backend).
   Запуск: npm start. Порт: process.env.PORT || 3000. */

const express = require("express");
const path = require("path");
const store = require("./store");

const PORT = process.env.PORT || 3000;
const USD_RATE = 12600;

const app = express();
app.use(express.json({ limit: "1mb" }));

/* ---------------- API ---------------- */

app.get("/api/models", function (_req, res) {
  res.json(store.getModels());
});

app.get("/api/listings", function (_req, res) {
  res.json(store.getListings());
});

app.get("/api/listings/:id", function (req, res) {
  const listing = store.getListing(req.params.id);
  if (!listing) return res.status(404).json({ error: "Объявление не найдено" });
  res.json(listing);
});

app.post("/api/listings", function (req, res) {
  const body = req.body || {};

  // --- санитизация ---
  const str = function (v, max) {
    return String(v == null ? "" : v).trim().slice(0, max || 200);
  };
  const modelId = str(body.modelId, 50);
  const title = str(body.title, 200);
  const year = Number(body.year);
  const priceUSD = Number(body.priceUSD);
  const mileageKm = Number(body.mileageKm);
  const condition = str(body.condition, 10);
  const region = str(body.region, 200);
  const transmission = str(body.transmission, 200);
  const fuel = str(body.fuel, 200);
  const color = str(body.color, 200);
  const sellerType = str(body.sellerType, 200);
  const description = str(body.description, 1000);
  const phone = str(body.phone, 32);

  // --- валидация ---
  const model = store.getModels().find(function (m) { return m.id === modelId; });
  if (!model) return res.status(400).json({ error: "Неизвестная модель (modelId)" });
  if (!title) return res.status(400).json({ error: "Укажите название объявления" });
  if (!Number.isFinite(year) || year < 1990 || year > 2027) {
    return res.status(400).json({ error: "Год выпуска должен быть числом от 1990 до 2027" });
  }
  if (!Number.isFinite(priceUSD) || priceUSD <= 0) {
    return res.status(400).json({ error: "Цена в долларах должна быть положительным числом" });
  }
  if (!Number.isFinite(mileageKm) || mileageKm < 0) {
    return res.status(400).json({ error: "Пробег должен быть числом не меньше 0" });
  }
  if (condition !== "new" && condition !== "used") {
    return res.status(400).json({ error: "Состояние должно быть new или used" });
  }
  if (!region) return res.status(400).json({ error: "Укажите регион" });
  if (!transmission) return res.status(400).json({ error: "Укажите коробку передач" });
  if (!fuel) return res.status(400).json({ error: "Укажите тип топлива" });
  if (!color) return res.status(400).json({ error: "Укажите цвет" });
  if (!sellerType) return res.status(400).json({ error: "Укажите тип продавца" });
  if (!description) return res.status(400).json({ error: "Добавьте описание" });

  // --- вычисляемые поля ---
  const listings = store.getListings();
  const maxId = listings.reduce(function (max, l) { return Math.max(max, l.id); }, 0);
  const priceUZS = Math.round((priceUSD * USD_RATE) / 100000) * 100000;
  const posted = new Date().toISOString().slice(0, 10);

  const listing = {
    id: maxId + 1,
    modelId: modelId,
    title: title,
    year: year,
    priceUSD: priceUSD,
    priceUZS: priceUZS,
    mileageKm: mileageKm,
    condition: condition,
    region: region,
    transmission: transmission,
    fuel: fuel,
    color: color,
    sellerType: sellerType,
    posted: posted,
    vinChecked: false,
    premium: false,
    description: description,
    specs: {
      "Двигатель": model.engine,
      "КПП": model.transmission,
      "Топливо": model.fuel,
      "Кузов": model.body
    }
  };
  if (phone) listing.phone = phone;

  store.addListing(listing);
  res.status(201).json(listing);
});

/* ---------------- Статика ---------------- */
app.use(express.static(path.join(__dirname, "..")));

/* Некорректный JSON в теле запроса → 400 JSON, а не HTML-страница Express */
app.use(function (err, _req, res, next) {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Некорректный JSON в теле запроса" });
  }
  next(err);
});

app.listen(PORT, function () {
  console.log("Uzcarsale server: http://localhost:" + PORT);
});
