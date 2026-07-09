/* Uzcarsale — хранилище объявлений (агент backend).
   Модели держим в памяти (не меняются), объявления — в server/data/listings.json.
   При первом обращении файл сидируется данными из ../js/data.js через шим window. */

const fs = require("fs");
const path = require("path");

// Шим: data.js писался для браузера и вешает всё на window
global.window = {};
require(path.join(__dirname, "..", "js", "data.js"));

const MODELS = global.window.UZ_MODELS;
const SEED_LISTINGS = global.window.UZ_LISTINGS;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "listings.json");

let listings = null; // кэш в памяти

function save(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function load() {
  if (listings) return listings;
  if (!fs.existsSync(DATA_FILE)) {
    save(SEED_LISTINGS);
    listings = SEED_LISTINGS.slice();
  } else {
    listings = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
  return listings;
}

function getModels() {
  return MODELS;
}

function getListings() {
  return load();
}

function getListing(id) {
  const n = Number(id);
  return load().find(function (l) { return l.id === n; });
}

function addListing(obj) {
  const list = load();
  list.push(obj);
  save(list);
  return obj;
}

module.exports = { getModels, getListings, getListing, addListing };
