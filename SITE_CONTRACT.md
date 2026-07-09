# SITE CONTRACT — Uzcarsale (Chevrolet в Узбекистане)

Обязателен для всех агентов. Дизайн-система: `../DESIGN.md` (стиль Lamborghini.com).
Сайт статический: HTML + CSS + vanilla JS, открывается с file:// без сборки.
Язык интерфейса: РУССКИЙ. Все заголовки и кнопки — UPPERCASE (это делает CSS, в HTML пишем обычным текстом).

## Файлы и владельцы
| Файл | Владелец |
|---|---|
| `css/styles.css` | агент design-system |
| `js/data.js` | агент data |
| `index.html` | агент home |
| `catalog.html`, `car.html`, `js/app.js` | агент catalog |

Никто не трогает чужие файлы.

## Подключения (одинаково во всех html)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<!-- перед </body>: -->
<script src="js/data.js"></script>
<script src="js/app.js"></script>
```
(index.html тоже подключает оба скрипта — app.js рендерит блоки на главной, если находит их контейнеры.)

## Шрифт
Barlow Condensed 400 (substitute LamboType из DESIGN.md). Один вес. Иерархия только размером.
`letter-spacing: 0.023em` и `text-transform: uppercase` на всех заголовках, кнопках, лейблах.

## Ключевые CSS-классы (design-system обязан их реализовать, страницы — использовать)
Layout: `.container` (max-width 1440px, padding 0 40px), `.section` (padding 80px 0),
`.section--dark` (#202020, белый текст), `.section--marble` (#f5f5f5), `.section--black` (#000).
Nav: `.nav` (fixed, 64px, #181818), `.nav__logo`, `.nav__links a`, `.nav__cta`.
Hero: `.hero` (100vh, #000, flex, выравнивание контента влево-вниз), `.hero__eyebrow` (12px, #969696),
`.hero__title` (clamp(54px,9vw,120px), line-height 0.92, белый), `.hero__actions`.
Кнопки: `.btn-giallo` (#ffc000, белый текст, 0 радиус, padding 16px 24px, стрелка → через ::after),
`.btn-ghost` (без фона/бордера, стрелка →), `.btn-outline` (1px #7d7d7d).
Hover .btn-giallo → фон #917300.
Секции: `.section-head` (flex row, space-between: слева h2 54px, справа .btn-ghost),
`.grid-3` (3 колонки, gap 24px; 1024px→2, 640px→1), `.grid-4` (4 колонки → 2 → 1).
Карточки: `.card` (без фона/бордера/тени/радиуса), `.card__date` (10px #7d7d7d), `.card__title` (18px),
`.listing-card`, `.listing-card__price` (27px), `.listing-card__meta` (12px #7d7d7d),
`.badge` (10px, 1px бордер #969696, padding 4px 8px), `.badge--giallo` (фон #ffc000 — max 1 на экран).
Плейсхолдеры фото: `.ph` (aspect-ratio 16/10, фон-градиент #181818→#313131, внутри название модели
белым 27px uppercase по центру, 0 радиус) и `.ph--tall` (aspect-ratio 4/3). НИКАКИХ внешних картинок.
Формы/фильтры: `.field` (label 10px #7d7d7d + input/select: фон прозрачный, 1px бордер #494949,
белый/тёмный текст по поверхности, 0 радиус, padding 12px 16px, uppercase).
Footer: `.footer` (#181818, белый, padding 80px 0 40px), `.footer__cols` (grid 4 колонки), `.footer__bottom`.
Таблица характеристик: `.spec-table` (строки с 1px нижним бордером #494949/#e0e0e0, td по 16px).

Правила из DESIGN.md жёсткие: радиус 0 везде, теней нет, жёлтый #ffc000 — только ОДИН элемент на экран.

## Шапка (вставлять verbatim в каждую страницу, менять только class="active")
```html
<header class="nav">
  <div class="container nav__inner">
    <a class="nav__logo" href="index.html">UZCARSALE</a>
    <nav class="nav__links">
      <a href="index.html">Главная</a>
      <a href="catalog.html">Каталог</a>
      <a href="catalog.html?condition=new">Новые</a>
      <a href="catalog.html?condition=used">С пробегом</a>
    </nav>
    <a class="nav__cta btn-outline" href="catalog.html">Найти авто</a>
  </div>
</header>
```
Body каждой страницы имеет `padding-top: 64px` (кроме index, где hero тёмный и идёт под nav).

## Подвал (verbatim на каждой странице)
```html
<footer class="footer">
  <div class="container">
    <div class="footer__cols">
      <div><h4>Uzcarsale</h4><p>Платформа №1 для покупки и продажи автомобилей Chevrolet в Узбекистане.</p></div>
      <div><h4>Каталог</h4><a href="catalog.html?condition=new">Новые авто</a><a href="catalog.html?condition=used">С пробегом</a><a href="catalog.html">Все модели</a></div>
      <div><h4>Сервисы</h4><a href="#">VIN-проверка</a><a href="#">Автокредит</a><a href="#">Страхование</a></div>
      <div><h4>Контакты</h4><a href="#">Ташкент, Узбекистан</a><a href="#">+998 71 200-00-00</a><a href="#">info@uzcarsale.uz</a></div>
    </div>
    <div class="footer__bottom"><span>© 2026 Uzcarsale</span><span>Chevrolet — торговая марка General Motors</span></div>
  </div>
</footer>
```

## Схема данных (js/data.js)
```js
// Модельный ряд Chevrolet (UzAuto Motors) — 8-10 моделей
window.UZ_MODELS = [{
  id: "cobalt",            // slug
  name: "Chevrolet Cobalt",
  tagline: "Народный седан Узбекистана",
  body: "Седан",           // Седан|Хэтчбек|Кроссовер|Внедорожник|Минивэн|Пикап
  priceFromUZS: 165000000, // сум
  priceFromUSD: 13100,
  engine: "1.5 л, 106 л.с.",
  transmission: "6АТ / 5МТ",
  fuel: "Бензин/газ",
  description: "1-2 предложения."
}, ...];

// Объявления — 18-24 шт, реалистичные для рынка РУз
window.UZ_LISTINGS = [{
  id: 1,
  modelId: "cobalt",           // ссылка на UZ_MODELS.id
  title: "Chevrolet Cobalt 2-позиция",
  year: 2023,
  priceUSD: 11800,
  priceUZS: 148700000,
  mileageKm: 32000,            // 0 для новых
  condition: "used",           // "new" | "used"
  region: "Ташкент",           // Ташкент|Самарканд|Бухара|Фергана|Андижан|Наманган|Нукус|Карши
  transmission: "Автомат",     // Автомат|Механика
  fuel: "Бензин/газ",
  color: "Белый",
  sellerType: "Частное лицо",  // Частное лицо|Дилер
  posted: "2026-07-05",        // даты в пределах июня-июля 2026
  vinChecked: true,
  premium: false,              // true максимум у 3-4
  description: "2-3 предложения по-русски.",
  specs: { "Двигатель": "1.5 л", "Мощность": "106 л.с.", "Привод": "Передний", "Кузов": "Седан", "Владельцев": "1" }
}, ...];

window.UZ_HELPERS = {
  fmtUZS(n) { return n.toLocaleString("ru-RU") + " сум"; },
  fmtUSD(n) { return "$" + n.toLocaleString("en-US"); },
  fmtKm(n) { return n === 0 ? "Новый" : n.toLocaleString("ru-RU") + " км"; }
};
```

## Бэкенд (фаза 2) — API-контракт

Сервер: Node.js + Express, порт 3000, `npm start`. Раздаёт статику из корня репозитория,
API под `/api`. Хранение: `server/data/listings.json` (в .gitignore), при первом запуске
автоматически сидируется из `js/data.js` (подключать через шим: `global.window = {}; require(...)`).

Эндпоинты (формы объектов — ровно как UZ_MODELS / UZ_LISTINGS выше):
- `GET /api/models` → массив моделей
- `GET /api/listings` → массив ВСЕХ объявлений (фильтрация остаётся на клиенте)
- `GET /api/listings/:id` → объявление или 404 `{error}`
- `POST /api/listings` (JSON body: modelId, title, year, priceUSD, mileageKm, condition,
  region, transmission, fuel, color, sellerType, description; phone опционально) →
  сервер валидирует обязательные поля (400 при ошибке), сам вычисляет: id (max+1),
  priceUZS (priceUSD × 12600, округление до 100 000), posted (сегодня, YYYY-MM-DD),
  vinChecked: false, premium: false, specs из полей модели. Ответ 201 с созданным объектом.

Фронтенд-правило (fallback ОБЯЗАТЕЛЕН): app.js при старте пробует `fetch('/api/listings')`
и `fetch('/api/models')`; если оба ок — работает с данными API, если нет (статический
хостинг GitHub Pages) — молча использует window.UZ_LISTINGS / window.UZ_MODELS из data.js.
Сайт должен полностью работать в обоих режимах.

Страница `sell.html`: форма «Продать авто» (модель — селект из моделей, название, год,
цена $, пробег, состояние, регион, КПП, топливо, цвет, тип продавца, описание, телефон),
POST на `/api/listings`; при успехе — redirect на `car.html?id=N`; при недоступном API —
сообщение «Размещение работает при запущенном сервере (npm start)». Кнопки «Продать авто»
(hero) и «Разместить объявление» (баннер) ведут на sell.html.

## app.js (агент catalog)
- `catalog.html`: контейнер `#catalog-grid`, фильтры `#filters` (модель, состояние, регион, КПП, цена от/до, сортировка). Читает query-параметры (`condition`, `model`). Рендер карточек: `.listing-card` внутри `.grid-3`; карточка = ссылка на `car.html?id=N`; внутри `.ph` с названием модели, бейджи (PREMIUM — `.badge--giallo`, VIN ✓, регион), title, `.listing-card__price` ($ + сум), meta (год · пробег · КПП).
- `car.html`: по `?id=` рендерит в `#car-root`: хлебная крошка, `.ph--tall` галерея-плейсхолдер, заголовок, цена, `.spec-table`, описание, блок продавца с кнопкой `.btn-giallo` «Показать номер» (по клику подставляет телефон), блок «Похожие объявления» (та же модель, 3 шт).
- `index.html` хуки (рендерит app.js, если контейнер существует): `#home-models` (карточки моделей из UZ_MODELS, `.grid-4`), `#home-listings` (6 свежих объявлений, `.grid-3`).
- Всё без внешних библиотек. Если `#catalog-grid`/`#car-root` нет на странице — молча пропустить.
