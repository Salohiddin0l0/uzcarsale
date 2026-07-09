/* Uzcarsale — app.js
   Рендер каталога, карточки объявления, блоков главной страницы и формы
   «Продать авто». Vanilla JS, без внешних библиотек.
   Данные: сначала пробуем API (api/models, api/listings); если сервер
   недоступен (статический хостинг) — молча берём window.UZ_MODELS /
   window.UZ_LISTINGS из js/data.js. Все значения из данных вставляются
   через textContent — никакого сырого HTML. */
(function () {
  'use strict';

  var MODELS = [];
  var LISTINGS = [];
  var H = window.UZ_HELPERS || {
    fmtUZS: function (n) { return n.toLocaleString('ru-RU') + ' сум'; },
    fmtUSD: function (n) { return '$' + n.toLocaleString('en-US'); },
    fmtKm: function (n) { return n === 0 ? 'Новый' : n.toLocaleString('ru-RU') + ' км'; }
  };

  /* ---------- Загрузка данных: API с fallback на js/data.js ---------- */

  var API_TIMEOUT_MS = 1500;

  function fetchJson(url, signal) {
    return fetch(url, { signal: signal }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  // Возвращает Promise<{models, listings}>. Пробует API (относительные пути,
  // таймаут ~1.5 c через AbortController); при любой ошибке молча отдаёт
  // статические данные из data.js (максимум один console.info, без ошибок).
  function loadData() {
    var fallback = {
      models: window.UZ_MODELS || [],
      listings: window.UZ_LISTINGS || []
    };

    if (typeof window.fetch !== 'function' || typeof window.AbortController !== 'function') {
      return Promise.resolve(fallback);
    }

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT_MS);

    return Promise.all([
      fetchJson('api/models', controller.signal),
      fetchJson('api/listings', controller.signal)
    ]).then(function (results) {
      clearTimeout(timer);
      if (!Array.isArray(results[0]) || !Array.isArray(results[1])) {
        return fallback;
      }
      return { models: results[0], listings: results[1] };
    }).catch(function () {
      clearTimeout(timer);
      console.info('Uzcarsale: API недоступен, используются данные из js/data.js');
      return fallback;
    });
  }

  /* ---------- Общие хелперы ---------- */

  // el('div', 'card', 'текст') — создание узла без innerHTML
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null && text !== '') node.textContent = text;
    return node;
  }

  function findModel(modelId) {
    for (var i = 0; i < MODELS.length; i++) {
      if (MODELS[i].id === modelId) return MODELS[i];
    }
    return null;
  }

  var MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  // "2026-07-05" → "5 июля"
  function fmtDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (!m || !d || !MONTHS_RU[m - 1]) return iso;
    return d + ' ' + MONTHS_RU[m - 1];
  }

  function modelNameOf(listing) {
    var model = findModel(listing.modelId);
    return model ? model.name : (listing.title || 'Chevrolet');
  }

  // Плейсхолдер фото: .ph / .ph--tall с названием модели внутри
  function makePh(label, tall, modelId, crop) {
    var ph = el('div', tall ? 'ph ph--tall' : 'ph');
    ph.appendChild(el('span', null, label));
    if (modelId) {
      var img = document.createElement('img');
      img.src = 'images/' + encodeURIComponent(modelId) + '.jpg';
      img.alt = label;
      img.loading = 'lazy';
      if (crop) img.style.objectPosition = crop;
      // Нет файла — картинка убирается, остаётся текстовый плейсхолдер
      img.onerror = function () { ph.removeChild(img); };
      ph.appendChild(img);
    }
    return ph;
  }

  /* Карточка объявления — общая для каталога, главной и «похожих».
     opts.premiumGiallo === false → бейдж Premium рисуется обычным .badge
     (на странице объявления жёлтой может быть только кнопка телефона). */
  function renderListingCard(listing, opts) {
    opts = opts || {};
    var premiumGiallo = opts.premiumGiallo !== false;

    var card = el('a', 'listing-card');
    card.href = 'car.html?id=' + encodeURIComponent(listing.id);

    card.appendChild(makePh(modelNameOf(listing), false, listing.modelId));

    var badges = el('div', 'listing-card__badges');
    if (listing.premium) {
      badges.appendChild(el('span', premiumGiallo ? 'badge badge--giallo' : 'badge', 'Premium'));
    }
    if (listing.vinChecked) {
      badges.appendChild(el('span', 'badge', 'VIN ✓'));
    }
    if (listing.region) {
      badges.appendChild(el('span', 'badge', listing.region));
    }
    card.appendChild(badges);

    card.appendChild(el('h3', 'card__title', listing.title));

    var price = el('div', 'listing-card__price');
    price.appendChild(el('span', null, H.fmtUSD(listing.priceUSD)));
    price.appendChild(document.createTextNode(' '));
    var uzs = el('small', null, H.fmtUZS(listing.priceUZS));
    price.appendChild(uzs);
    card.appendChild(price);

    var metaParts = [
      String(listing.year),
      H.fmtKm(listing.mileageKm),
      listing.transmission,
      fmtDate(listing.posted)
    ];
    card.appendChild(el('div', 'listing-card__meta', metaParts.join(' · ')));

    return card;
  }

  /* ---------- Главная страница ---------- */

  function initHomeModels() {
    var root = document.getElementById('home-models');
    if (!root) return;

    MODELS.forEach(function (model) {
      var card = el('a', 'card');
      card.href = 'catalog.html?model=' + encodeURIComponent(model.id);

      card.appendChild(makePh(model.name, false, model.id));
      card.appendChild(el('h3', 'card__title', model.name));
      card.appendChild(el('p', 'card__date', model.tagline));
      card.appendChild(el('div', 'listing-card__price',
        'от ' + H.fmtUSD(model.priceFromUSD) + ' / от ' + H.fmtUZS(model.priceFromUZS)));
      card.appendChild(el('span', 'badge', model.body));

      root.appendChild(card);
    });
  }

  function initHomeListings() {
    var root = document.getElementById('home-listings');
    if (!root) return;

    var sorted = LISTINGS.slice().sort(function (a, b) {
      if (!!b.premium !== !!a.premium) return b.premium ? 1 : -1;
      if (a.posted !== b.posted) return a.posted < b.posted ? 1 : -1;
      return b.id - a.id;
    });

    sorted.slice(0, 6).forEach(function (listing) {
      root.appendChild(renderListingCard(listing));
    });
  }

  /* ---------- Каталог ---------- */

  function initCatalog() {
    var grid = document.getElementById('catalog-grid');
    if (!grid) return;

    var form = document.getElementById('filters');
    var countNode = document.getElementById('catalog-count');

    var selModel = document.getElementById('filter-model');
    var selCondition = document.getElementById('filter-condition');
    var selRegion = document.getElementById('filter-region');
    var selTransmission = document.getElementById('filter-transmission');
    var selPrice = document.getElementById('filter-price');
    var selSort = document.getElementById('filter-sort');

    // Заполняем селект моделей
    if (selModel) {
      MODELS.forEach(function (model) {
        var opt = document.createElement('option');
        opt.value = model.id;
        opt.textContent = model.name;
        selModel.appendChild(opt);
      });
    }

    // Заполняем селект регионов уникальными значениями из данных
    if (selRegion) {
      var seen = {};
      LISTINGS.forEach(function (listing) {
        if (listing.region && !seen[listing.region]) {
          seen[listing.region] = true;
        }
      });
      Object.keys(seen).sort(function (a, b) {
        return a.localeCompare(b, 'ru');
      }).forEach(function (region) {
        var opt = document.createElement('option');
        opt.value = region;
        opt.textContent = region;
        selRegion.appendChild(opt);
      });
    }

    // Стартовые значения из query-параметров
    var params = new URLSearchParams(window.location.search);
    var qModel = params.get('model');
    var qCondition = params.get('condition');
    if (qModel && selModel) selModel.value = qModel;
    if (qCondition && selCondition) selCondition.value = qCondition;

    function getFilters() {
      return {
        model: selModel ? selModel.value : '',
        condition: selCondition ? selCondition.value : '',
        region: selRegion ? selRegion.value : '',
        transmission: selTransmission ? selTransmission.value : '',
        priceMax: selPrice && selPrice.value ? parseInt(selPrice.value, 10) : 0,
        sort: selSort ? selSort.value : 'posted'
      };
    }

    function applyFilters(f) {
      var result = LISTINGS.filter(function (l) {
        if (f.model && l.modelId !== f.model) return false;
        if (f.condition && l.condition !== f.condition) return false;
        if (f.region && l.region !== f.region) return false;
        if (f.transmission && l.transmission !== f.transmission) return false;
        if (f.priceMax && l.priceUSD > f.priceMax) return false;
        return true;
      });

      result.sort(function (a, b) {
        switch (f.sort) {
          case 'price-asc': return a.priceUSD - b.priceUSD;
          case 'price-desc': return b.priceUSD - a.priceUSD;
          case 'mileage-asc': return a.mileageKm - b.mileageKm;
          default: // posted — сначала новые объявления
            if (a.posted !== b.posted) return a.posted < b.posted ? 1 : -1;
            return b.id - a.id;
        }
      });

      return result;
    }

    function resetFilters() {
      if (selModel) selModel.value = '';
      if (selCondition) selCondition.value = '';
      if (selRegion) selRegion.value = '';
      if (selTransmission) selTransmission.value = '';
      if (selPrice) selPrice.value = '';
      if (selSort) selSort.value = 'posted';
      render();
    }

    function render() {
      var items = applyFilters(getFilters());

      grid.textContent = '';
      if (countNode) countNode.textContent = 'Найдено: ' + items.length;

      if (items.length === 0) {
        var empty = el('div', 'catalog-empty');
        empty.appendChild(el('p', 'card__title', 'Ничего не найдено'));
        empty.appendChild(el('p', 'listing-card__meta', 'Попробуйте изменить параметры поиска.'));
        var resetBtn = el('button', 'btn-ghost', 'Сбросить фильтры');
        resetBtn.type = 'button';
        resetBtn.addEventListener('click', resetFilters);
        empty.appendChild(resetBtn);
        grid.appendChild(empty);
        return;
      }

      items.forEach(function (listing) {
        grid.appendChild(renderListingCard(listing));
      });
    }

    if (form) {
      form.addEventListener('change', render);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        render();
      });
    }

    var resetControl = document.getElementById('filters-reset');
    if (resetControl) resetControl.addEventListener('click', resetFilters);

    render();
  }

  /* ---------- Страница объявления ---------- */

  function initCarPage() {
    var root = document.getElementById('car-root');
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var id = parseInt(params.get('id'), 10);
    var listing = null;
    for (var i = 0; i < LISTINGS.length; i++) {
      if (LISTINGS[i].id === id) { listing = LISTINGS[i]; break; }
    }

    if (!listing) {
      var notFound = el('section', 'section');
      notFound.appendChild(el('h1', null, 'Объявление не найдено'));
      notFound.appendChild(el('p', null, 'Возможно, оно было снято с продажи.'));
      var backLink = el('a', 'btn-ghost', 'Перейти в каталог');
      backLink.href = 'catalog.html';
      notFound.appendChild(backLink);
      root.appendChild(notFound);
      return;
    }

    document.title = listing.title + ' — Uzcarsale';

    var modelName = modelNameOf(listing);
    var page = el('article', 'section');

    // Хлебная крошка
    var crumb = el('nav', 'card__date');
    var crumbLink = el('a', null, 'Каталог');
    crumbLink.href = 'catalog.html';
    crumb.appendChild(crumbLink);
    crumb.appendChild(document.createTextNode(' / ' + listing.title));
    page.appendChild(crumb);

    // Галерея: общий план + три «деталь-кадра» (зум разных частей того же фото).
    // Клик по миниатюре переносит её ракурс на главное фото, клик по главному — сброс.
    var mainPh = makePh(modelName, true, listing.modelId);
    mainPh.classList.add('car-gallery__main');
    page.appendChild(mainPh);

    function applyCrop(ph, crop) {
      var img = ph.querySelector('img');
      if (!img) return;
      if (crop) {
        img.style.transformOrigin = crop.pos;
        img.style.transform = 'scale(' + crop.zoom + ')';
        img.style.objectPosition = crop.pos;
      } else {
        img.style.transform = '';
        img.style.objectPosition = '';
      }
    }

    var thumbs = el('div', 'grid-3 car-gallery');
    var crops = [
      { pos: 'left center', zoom: 1.6 },
      { pos: 'center bottom', zoom: 1.9 },
      { pos: 'right center', zoom: 1.6 }
    ];
    crops.forEach(function (crop) {
      var thumb = makePh(modelName, false, listing.modelId);
      applyCrop(thumb, crop);
      thumb.addEventListener('click', function () { applyCrop(mainPh, crop); });
      thumbs.appendChild(thumb);
    });
    mainPh.addEventListener('click', function () { applyCrop(mainPh, null); });
    page.appendChild(thumbs);

    // Заголовок и бейджи
    page.appendChild(el('h1', null, listing.title));
    var badges = el('div', 'listing-card__badges');
    if (listing.premium) badges.appendChild(el('span', 'badge', 'Premium'));
    if (listing.vinChecked) badges.appendChild(el('span', 'badge', 'VIN ✓'));
    if (listing.region) badges.appendChild(el('span', 'badge', listing.region));
    badges.appendChild(el('span', 'badge', listing.condition === 'new' ? 'Новый' : 'С пробегом'));
    page.appendChild(badges);

    // Цена
    var price = el('div', 'listing-card__price');
    price.appendChild(el('span', null, H.fmtUSD(listing.priceUSD)));
    price.appendChild(document.createTextNode(' '));
    price.appendChild(el('small', null, H.fmtUZS(listing.priceUZS)));
    page.appendChild(price);

    // Характеристики
    page.appendChild(el('h2', null, 'Характеристики'));
    var table = el('table', 'spec-table');
    var tbody = document.createElement('tbody');

    function addSpecRow(name, value) {
      if (value === undefined || value === null || value === '') return;
      var tr = document.createElement('tr');
      tr.appendChild(el('td', null, name));
      tr.appendChild(el('td', null, String(value)));
      tbody.appendChild(tr);
    }

    addSpecRow('Год выпуска', listing.year);
    addSpecRow('Пробег', H.fmtKm(listing.mileageKm));
    addSpecRow('Коробка передач', listing.transmission);
    addSpecRow('Топливо', listing.fuel);
    addSpecRow('Цвет', listing.color);
    addSpecRow('Регион', listing.region);
    if (listing.specs) {
      Object.keys(listing.specs).forEach(function (key) {
        addSpecRow(key, listing.specs[key]);
      });
    }
    table.appendChild(tbody);
    page.appendChild(table);

    // Описание
    if (listing.description) {
      page.appendChild(el('h2', null, 'Описание'));
      page.appendChild(el('p', null, listing.description));
    }

    // Блок продавца
    var seller = el('div', 'section--dark');
    seller.style.padding = '32px';
    seller.style.marginTop = '48px';
    seller.appendChild(el('h2', null, 'Продавец'));
    seller.appendChild(el('p', null,
      (listing.sellerType || 'Частное лицо') + ' · ' + (listing.region || 'Узбекистан')));
    seller.appendChild(el('p', 'card__date', 'Размещено: ' + fmtDate(listing.posted)));

    var phoneBtn = el('button', 'btn-giallo', 'Показать номер');
    phoneBtn.type = 'button';
    phoneBtn.addEventListener('click', function () {
      var tel = el('a', null, '+998 71 200-00-00');
      tel.href = 'tel:+998712000000';
      phoneBtn.parentNode.replaceChild(tel, phoneBtn);
    });
    seller.appendChild(phoneBtn);
    page.appendChild(seller);

    root.appendChild(page);

    // Похожие объявления — та же модель, до 3 шт
    var similar = LISTINGS.filter(function (l) {
      return l.modelId === listing.modelId && l.id !== listing.id;
    }).slice(0, 3);

    if (similar.length > 0) {
      var simSection = el('section', 'section');
      var head = el('div', 'section-head');
      head.appendChild(el('h2', null, 'Похожие объявления'));
      var allLink = el('a', 'btn-ghost', 'Все объявления');
      allLink.href = 'catalog.html?model=' + encodeURIComponent(listing.modelId);
      head.appendChild(allLink);
      simSection.appendChild(head);

      var simGrid = el('div', 'grid-3');
      similar.forEach(function (l) {
        // premiumGiallo:false — единственный жёлтый элемент страницы: кнопка телефона
        simGrid.appendChild(renderListingCard(l, { premiumGiallo: false }));
      });
      simSection.appendChild(simGrid);
      root.appendChild(simSection);
    }
  }

  /* ---------- Страница «Продать авто» (sell.html) ---------- */

  function initSellPage() {
    var form = document.getElementById('sell-form');
    if (!form) return;

    var modelSelect = document.getElementById('sell-model');
    if (modelSelect) {
      MODELS.forEach(function (model) {
        var opt = document.createElement('option');
        opt.value = model.id;
        opt.textContent = model.name;
        modelSelect.appendChild(opt);
      });
    }

    var errorNode = document.getElementById('sell-error');
    function showError(text) {
      if (errorNode) errorNode.textContent = text;
    }

    var submitting = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;
      showError('');

      function val(name) {
        var field = form.elements.namedItem(name);
        return field ? String(field.value).trim() : '';
      }

      var payload = {
        modelId: val('modelId'),
        title: val('title'),
        year: parseInt(val('year'), 10),
        priceUSD: parseInt(val('priceUSD'), 10),
        mileageKm: parseInt(val('mileageKm'), 10) || 0,
        condition: val('condition'),
        region: val('region'),
        transmission: val('transmission'),
        fuel: val('fuel'),
        color: val('color'),
        sellerType: val('sellerType'),
        description: val('description')
      };
      var phone = val('phone');
      if (phone) payload.phone = phone;

      submitting = true;

      fetch('api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (res.status === 201 && body && body.id !== undefined) {
            window.location.href = 'car.html?id=' + encodeURIComponent(body.id);
            return;
          }
          submitting = false;
          // API всегда шлёт {error} при неудаче; его отсутствие значит, что бэкенда нет (статический хостинг)
          showError(body && body.error
            ? String(body.error)
            : 'Размещение объявлений работает при запущенном сервере: npm install && npm start');
        });
      }).catch(function () {
        submitting = false;
        showError('Размещение объявлений работает при запущенном сервере: npm install && npm start');
      });
    });
  }

  /* ---------- Инициализация ---------- */

  function init() {
    loadData().then(function (data) {
      MODELS = data.models;
      LISTINGS = data.listings;
      initHomeModels();
      initHomeListings();
      initCatalog();
      initCarPage();
      initSellPage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
