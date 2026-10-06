// Safari (iOS included) lacks async iteration of ReadableStream, which PDF.js uses in
// getTextContent(); the legacy build does not polyfill it.
function polyfillReadableStreamIteration() {
  if (typeof ReadableStream === 'undefined' || ReadableStream.prototype[Symbol.asyncIterator]) return;
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

// PDF.js and its worker are bundled locally and loaded only when importing a PDF.
// The legacy build supports older Safari versions found on iOS devices.
async function loadPdfEngine() {
  polyfillReadableStreamIteration();
  const [engine, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
  ]);
  engine.GlobalWorkerOptions.workerSrc = worker.default;
  return engine;
}
    function normalizeText(str) {
      if (!str) return '';
      return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/['’`]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    }

    /* ==========================================================================
       CONVERSION ENGINE (Strict Progeo Rules)
       ========================================================================== */
    function parseSpoonCount(str) {
      if (!str) return null;
      const s = str.toLowerCase().replace(/½/g, ' 1/2').trim();

      if (/^(?:1\/2|mezzo|mezza)\b/.test(s)) return 0.5;

      // "2 cucchiai e 1/2", "2 1/2", "2 e 1/2"
      let match = s.match(/(\d+)\s*(?:cucchiai|cucchiaini|bicchieri)?\s*(?:e|\+)?\s*1\/2/);
      if (match) return parseFloat(match[1]) + 0.5;

      match = s.match(/(\d+)\s*(?:cucchiai|cucchiaini|bicchieri)?\s*e\s*mezzo/);
      if (match) return parseFloat(match[1]) + 0.5;

      if (s.includes("mezzo") || s.includes("1/2")) {
        if (!s.match(/\d+/)) return 0.5;
      }

      // Decimals like "2,5" or "2.5"
      match = s.match(/(\d+[,.]\d+)/);
      if (match) return parseFloat(match[1].replace(',', '.'));

      // Plain integer "5"
      match = s.match(/(\d+)/);
      if (match) return parseFloat(match[1]);

      return null;
    }

    function convertQuantityEngine(rawName, rawQty, sourceMeasure = {}) {
      const name = (rawName || '').trim();
      const qty = (rawQty || '').trim();
      const combined = (name + ' ' + qty).toLowerCase();

      let res = {
        name: name,
        qty: qty,
        converted: false,
        note: ''
      };

      if (!qty && !name) return res;

      // RULE 4: SPECIAL LEGUMES RULE (Secchi in cucchiai -> Cotti in scatola/sgocciolati)
      const isLegume = /ceci|lenticchie|fagioli|cicerchie|fave|rovezja/i.test(name);
      const isSecchiOrSpoons = /secch[ieao]/i.test(combined) || /cucchia/i.test(qty);

      if (isLegume && isSecchiOrSpoons) {
        const spoons = /cucchia(?:io|i)\b/i.test(qty) ? parseSpoonCount(qty) : null;
        if (spoons !== null && spoons > 0) {
          const dryGrams = Math.round(spoons * (sourceMeasure.spoonGrams || 20));
          const cookedGrams = Math.round(dryGrams * 2.5);

          let cleanName = name.replace(/\bsecch[iea]\b/gi, '').trim();
          cleanName = cleanName.replace(/\s+/g, ' ');
          cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

          res.name = cleanName + (/lenticchie|fave|cicerchie/i.test(name) ? " cotte in scatola" : " cotti in scatola");
          res.qty = cookedGrams + " g";
          res.converted = true;
          res.note = `pari a ${dryGrams} g secchi (${spoons} ${spoons === 1 ? 'cucchiaio' : 'cucchiai'})`;
          return res;
        } else {
          // Check if qty is dry grams (e.g. "50 g secchi")
          const gMatch = qty.match(/^(\d+(?:[,.]\d+)?)\s*(g|gr|kg)\b/i);
          if (gMatch && /secch/i.test(combined)) {
            const dryGrams = Number(gMatch[1].replace(',', '.')) * (gMatch[2].toLowerCase() === 'kg' ? 1000 : 1);
            const cookedGrams = Math.round(dryGrams * 2.5);
            let cleanName = name.replace(/\bsecch[iea]\b/gi, '').trim();
            res.name = cleanName + (/lenticchie|fave|cicerchie/i.test(name) ? " cotte in scatola" : " cotti in scatola");
            res.qty = cookedGrams + " g";
            res.converted = true;
            res.note = `pari a ${dryGrams} g secchi`;
            return res;
          }
        }
      }

      // A measure explicitly supplied by this PDF takes precedence over generic rules.
      const sourceUnit = /cucchiain/i.test(qty) ? 'teaspoonGrams' : /cucchia(?:io|i)\b/i.test(qty) ? 'spoonGrams' :
        /bicchier/i.test(qty) ? 'glassGrams' : /porzion/i.test(qty) ? 'portionGrams' : null;
      const sourceCount = sourceUnit ? parseSpoonCount(qty) : null;
      if (sourceUnit && sourceMeasure[sourceUnit] && sourceCount !== null) {
        res.qty = `${Math.round(sourceCount * sourceMeasure[sourceUnit])} g`;
        res.converted = true;
        res.note = `equivalenza indicativa dalla tabella del PDF (${qty})`;
        return res;
      }

      // RULE 1: Couscous in cucchiai -> 1 cucchiaio = 10 g
      if (/cous\s*cous/i.test(name) && /cucchia/i.test(qty)) {
        const spoons = parseSpoonCount(qty);
        if (spoons !== null) {
          const grams = Math.round(spoons * 10);
          res.qty = grams + " g";
          res.converted = true;
          res.note = `1 cucchiaio couscous = 10 g (${qty})`;
          return res;
        }
      }

      // RULE 1: Cereals & derivatives in cucchiai -> 1 cucchiaio = 20 g
      if (/riso|farro|orzo|quinoa|grano\s*saraceno|avena|cereali|miglio/i.test(name) && /cucchia/i.test(qty)) {
        const spoons = parseSpoonCount(qty);
        if (spoons !== null) {
          const grams = Math.round(spoons * 20);
          res.qty = grams + " g";
          res.converted = true;
          res.note = `1 cucchiaio da minestra = 20 g (${qty})`;
          return res;
        }
      }

      // RULE 5: Piselli freschi -> 1 cucchiaio = 20 g
      if (/piselli/i.test(name) && (/fresch/i.test(name) || /cucchia/i.test(qty))) {
        if (/cucchia/i.test(qty)) {
          const spoons = parseSpoonCount(qty);
          if (spoons !== null) {
            const grams = Math.round(spoons * 20);
            res.qty = grams + " g";
            res.converted = true;
            res.note = `1 cucchiaio piselli freschi = 20 g (${qty})`;
            return res;
          }
        }
      }

      // RULE 2: Extra virgin olive oil in cucchiaini -> 1 cucchiaino = 4 g
      if (/olio/i.test(name) && /cucchiain/i.test(qty)) {
        const spoons = parseSpoonCount(qty);
        if (spoons !== null) {
          const grams = Math.round(spoons * 4);
          res.qty = grams + " g";
          res.converted = true;
          res.note = `1 cucchiaino olio = 4 g (${qty})`;
          return res;
        }
      }

      // RULE 3: Glasses (bicchieri)
      if (/bicchier/i.test(qty)) {
        const count = parseSpoonCount(qty) || 1;
        if (/latte/i.test(name)) {
          const grams = Math.round(count * 200);
          res.qty = grams + " g";
          res.converted = true;
          res.note = `1 bicchiere latte = 200 ml (${qty})`;
          return res;
        } else if (/fiocchi|avena|frumento/i.test(name)) {
          const grams = Math.round(count * 40);
          res.qty = grams + " g";
          res.converted = true;
          res.note = `1 bicchiere fiocchi = 40 g (${qty})`;
          return res;
        } else if (/acqua/i.test(name)) {
          const ml = Math.round(count * 200);
          res.qty = ml + " ml";
          res.converted = true;
          res.note = `1 bicchiere acqua = 200 ml (${qty})`;
          return res;
        }
      }

      return res;
    }

    /* ==========================================================================
       SAMPLE PROGEO DIET GENERATOR (DEMO)
       ========================================================================== */
    // Alternatives remain explicit: no food substitutions are inferred.
    function parseFoodChoices(rawName, rawQty) {
      const separator = /\s+(?:oppure|o|in alternativa(?: a)?)\s+/i;
      const names = String(rawName || '').trim().split(separator);
      const quantities = String(rawQty || '').trim().split(separator);
      const choices = names.map((part, index) => {
        let name = part.replace(/^(?:alt(?:ernativa)?\s*[:.]|oppure\b)\s*/i, '').trim();
        let qty = quantities.length === names.length ? quantities[index] : quantities.length === 1 ? quantities[0] : '';
        const suffix = name.match(/\s+(\d+(?:[,.]\d+)?\s*(?:kg|gr|g|ml|l|cucchiai(?:ni)?|bicchieri|fette|pezzi|porzioni?)\b.*|q\.?b\.?)$/i);
        if (suffix) { qty = suffix[1]; name = name.slice(0, suffix.index).trim(); }
        qty = qty.replace(/^(g|gr|ml|kg)\.?\s*(\d+(?:[,.]\d+)?)$/i, (_, unit, count) => `${count} ${unit.toLowerCase() === 'gr' ? 'g' : unit.toLowerCase()}`);
        if (/^\d+(?:[,.]\d+)?$/.test(qty)) qty += ' g';
        const conversion = convertQuantityEngine(name, qty);
        return { rawName: name, rawQty: qty, name: conversion.name, qty: conversion.qty,
          isConverted: conversion.converted, conversionNote: conversion.note };
      }).filter(choice => choice.name);
      const main = choices[0] || { name: '', qty: '', rawName: '', rawQty: '' };
      if (choices.length > 1) main.alternatives = choices.slice(1);
      return main;
    }

    function getFoodChoices(item) {
      const main = { ...parseFoodChoices(item.name || item.rawName, item.qty || item.rawQty), recipeIngredients: item.recipeIngredients };
      const choices = [main, ...(main.alternatives || [])];
      function appendAlternative(alternative) {
        const parsed = { ...parseFoodChoices(alternative.name || alternative.rawName, alternative.qty || alternative.rawQty), recipeIngredients: alternative.recipeIngredients };
        choices.push(parsed, ...(parsed.alternatives || []));
        (Array.isArray(alternative.alternatives) ? alternative.alternatives : []).forEach(appendAlternative);
      }
      (Array.isArray(item.alternatives) ? item.alternatives : []).forEach(appendAlternative);
      if (typeof item.alt === 'string' && item.alt.trim()) {
        const legacy = parseFoodChoices(item.alt, '');
        choices.push(legacy, ...(legacy.alternatives || []));
      }

      return choices.filter(choice => choice.name);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    }

    function shoppingQuantity(qty) {
      const text = String(qty || '').trim();
      const match = text.match(/^(\d+(?:[,.]\d+)?)\s*(kg|gr|g|ml|l)$/i);
      if (!match) {
        const normalized = text.replace(/½/g, '0.5');
        const count = normalized.match(/^n[°º.]\s*(\d+(?:[,.]\d+)?)$/i) ||
          normalized.match(/^(\d+(?:[,.]\d+)?)\s*(pezzi?|fett[ae]|porzion[ei]|vasett[oi]|tazz[ae]|bicchier[ei]|cucchiain[oi]|cucchia[io])$/i);
        if (count) {
          const units = { pezzo: 'pezzi', pezzi: 'pezzi', fetta: 'fette', fette: 'fette', porzione: 'porzioni', porzioni: 'porzioni',
            vasetto: 'vasetti', vasetti: 'vasetti', tazza: 'tazze', tazze: 'tazze', bicchiere: 'bicchieri', bicchieri: 'bicchieri',
            cucchiaino: 'cucchiaini', cucchiaini: 'cucchiaini', cucchiaio: 'cucchiai', cucchiai: 'cucchiai' };
          return { text, unit: units[count[2]?.toLowerCase()] || 'pezzi', value: Number(count[1].replace(',', '.')) };
        }
        return { text: text || 'quantità non indicata', unit: null, value: null };
      }
      let unit = match[2].toLowerCase();
      let value = Number(match[1].replace(',', '.'));
      if (unit === 'kg') { unit = 'g'; value *= 1000; }
      if (unit === 'l') { unit = 'ml'; value *= 1000; }
      if (unit === 'gr') unit = 'g';
      return { text, unit, value };
    }

    function formatShoppingOption(option) {
      if (option.recipeIngredients?.length) {
        return `${option.name.replace(/\s+/g, ' ').trim()} (${option.recipeIngredients.map(ingredient => formatShoppingOption(ingredient.unit !== undefined ? ingredient : { name: ingredient.name, ...shoppingQuantity(ingredient.qty) })).join(' + ')})`;
      }
      const singularUnits = { pezzi: 'pezzo', fette: 'fetta', porzioni: 'porzione', vasetti: 'vasetto', tazze: 'tazza',
        bicchieri: 'bicchiere', cucchiaini: 'cucchiaino', cucchiai: 'cucchiaio' };
      const displayUnit = option.value === 1 ? singularUnits[option.unit] || option.unit : option.unit;
      let quantity = option.unit ? `${Number(option.value.toFixed(3)).toLocaleString('it-IT', { useGrouping: false, maximumFractionDigits: 3 })} ${displayUnit}` : option.text;
      if (!option.unit && option.repeats > 1 && /\d/.test(option.text)) quantity += ` × ${option.repeats}`;
      return `${option.name.replace(/\s+/g, ' ').trim()} — ${quantity.replace(/\s+/g, ' ')}`;
    }

    function shoppingOption(food) {
      return { name: food.name, repeats: 1, ...shoppingQuantity(food.qty), recipeIngredients: food.recipeIngredients?.map(shoppingOption) };
    }

    function shoppingOptionKey(option) {
      return [normalizeText(option.name), option.unit || option.text, option.recipeIngredients?.map(shoppingOptionKey)];
    }

    function sumShoppingOption(target, option) {
      if (option.unit) target.value += option.value;
      else target.repeats++;
      (option.recipeIngredients || []).forEach((ingredient, index) => sumShoppingOption(target.recipeIngredients[index], ingredient));
    }

    function buildShoppingList(data, selectedDays) {
      const groups = new Map();
      [...new Set(selectedDays)].forEach(dayKey => {
        (data?.days?.[dayKey]?.meals || []).forEach(meal => {
          (meal.items || []).forEach((item, index, items) => {
            const previousParent = item.isSubItem ? items.slice(0, index).findLast(candidate => !candidate.isSubItem) : null;
            if (previousParent?.recipeIngredients?.length && previousParent.alternatives?.length) return;
            const recipeChoice = item.recipeIngredients?.length && item.alternatives?.length;
            if (!recipeChoice && (item.isRecipe || (!item.isSubItem && items[index + 1]?.isSubItem))) return;
            const options = getFoodChoices(item).map(shoppingOption);
            if (!options.length) return;
            // Recipe choices are atomic, including their ingredients. Only like-for-like choices merge.
            const key = JSON.stringify(options.map(shoppingOptionKey));
            const existing = groups.get(key);
            if (!existing) groups.set(key, options);
            else options.forEach((option, i) => sumShoppingOption(existing[i], option));
          });
        });
      });
      return [...groups.values()].map(group => group.map(formatShoppingOption).join(' oppure '));
    }

    function getSampleProgeoDiet() {
      const rawData = {
        metadata: {
          parsedAt: new Date().toISOString(),
          source: "Piano Alimentare Progeo Medical (Demo)"
        },
        days: {
          lun: {
            dayName: "Lunedì",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Latte scremato", rawQty: "1 bicchiere" },
                  { rawName: "Fiocchi d'avena", rawQty: "1 bicchiere" }
                ]
              },
              {
                id: "m_mm", name: "Metà mattina", icon: "🍎",
                items: [
                  { rawName: "Mela", rawQty: "150 g" },
                  { rawName: "Noci sgusciate", rawQty: "15 g" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Risotto con riso integrale e legumi", rawQty: "1 porzione" },
                  { rawName: "Riso integrale", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Ceci secchi", rawQty: "2 cucchiai e 1/2", isSubItem: true },
                  { rawName: "Insalata verde mista", rawQty: "100 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "3 cucchiaini" }
                ]
              },
              {
                id: "m_mer", name: "Merenda", icon: "🍇",
                items: [
                  { rawName: "Yogurt greco 0%", rawQty: "150 g" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Petto di pollo ai ferri", rawQty: "150 g", alt: "Alt: Filetto di merluzzo 200g" },
                  { rawName: "Pane integrale", rawQty: "60 g" },
                  { rawName: "Zucchine grigliate", rawQty: "200 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              },
              {
                id: "m_arc", name: "Arco della giornata", icon: "💧",
                items: [
                  { rawName: "Acqua naturale", rawQty: "12 bicchieri" }
                ]
              }
            ]
          },
          mar: {
            dayName: "Martedì",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Latte parzialmente scremato", rawQty: "1 bicchiere" },
                  { rawName: "Pane di segale", rawQty: "50 g" },
                  { rawName: "Miele", rawQty: "1 cucchiaino" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Insalata fredda di couscous", rawQty: "1 piatto" },
                  { rawName: "Couscous", rawQty: "8 cucchiai", isSubItem: true },
                  { rawName: "Lenticchie secche", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Pomodorini", rawQty: "150 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "4 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Salmone al vapore", rawQty: "180 g" },
                  { rawName: "Fagioli secchi", rawQty: "6 cucchiai" },
                  { rawName: "Broccoli al vapore", rawQty: "200 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              }
            ]
          },
          mer: {
            dayName: "Mercoledì",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Yogurt bianco magro", rawQty: "125 g" },
                  { rawName: "Fiocchi di frumento", rawQty: "1 bicchiere" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Pasta di farro con piselli", rawQty: "1 piatto" },
                  { rawName: "Farro", rawQty: "4 cucchiai", isSubItem: true },
                  { rawName: "Piselli freschi", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "3 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Orata al cartoccio", rawQty: "200 g" },
                  { rawName: "Patate al vapore", rawQty: "200 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              }
            ]
          },
          gio: {
            dayName: "Giovedì",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Latte scremato", rawQty: "1 bicchiere" },
                  { rawName: "Fette biscottate integrali", rawQty: "3 fette" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Insalata di orzo e tonno", rawQty: "1 piatto" },
                  { rawName: "Orzo", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Tonno al naturale", rawQty: "112 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "3 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Frittata al forno", rawQty: "2 uova" },
                  { rawName: "Pane integrale", rawQty: "50 g" },
                  { rawName: "Spinaci al vapore", rawQty: "200 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              }
            ]
          },
          ven: {
            dayName: "Venerdì",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Latte scremato", rawQty: "1 bicchiere" },
                  { rawName: "Biscotti integrali", rawQty: "4 pezzi" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Riso basmati e ceci", rawQty: "1 piatto" },
                  { rawName: "Riso integrale", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Ceci secchi", rawQty: "5 cucchiai", isSubItem: true },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "3 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Filetto di merluzzo", rawQty: "200 g" },
                  { rawName: "Zucchine ai ferri", rawQty: "200 g" },
                  { rawName: "Pane integrale", rawQty: "50 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              }
            ]
          },
          sab: {
            dayName: "Sabato",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Yogurt greco", rawQty: "150 g" },
                  { rawName: "Noci", rawQty: "20 g" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Insalata mista con petto di tacchino", rawQty: "150 g" },
                  { rawName: "Pane di segale", rawQty: "60 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "3 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Pizza margherita integrale", rawQty: "1 pizza" }
                ]
              }
            ]
          },
          dom: {
            dayName: "Domenica",
            meals: [
              {
                id: "m_col", name: "Colazione", icon: "🌅",
                items: [
                  { rawName: "Pancakes d'avena", rawQty: "2 pezzi" },
                  { rawName: "Fiocchi d'avena", rawQty: "1 bicchiere", isSubItem: true },
                  { rawName: "Miele", rawQty: "10 g" }
                ]
              },
              {
                id: "m_pra", name: "Pranzo", icon: "🥗",
                items: [
                  { rawName: "Gnocchi di patate", rawQty: "150 g" },
                  { rawName: "Ragù magro di vitello", rawQty: "100 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              },
              {
                id: "m_cen", name: "Cena", icon: "🍲",
                items: [
                  { rawName: "Bresaola con rucola e grana", rawQty: "1 piatto" },
                  { rawName: "Bresaola", rawQty: "80 g", isSubItem: true },
                  { rawName: "Rucola", rawQty: "50 g", isSubItem: true },
                  { rawName: "Scaglie di parmigiano", rawQty: "20 g", isSubItem: true },
                  { rawName: "Pane integrale", rawQty: "50 g" },
                  { rawName: "Olio extra vergine d'oliva", rawQty: "2 cucchiaini" }
                ]
              }
            ]
          }
        }
      };

      // Run Conversion Engine over all raw items
      Object.keys(rawData.days).forEach(dayKey => {
        rawData.days[dayKey].meals.forEach(meal => {
          meal.items.forEach((item, idx) => {
            const conv = convertQuantityEngine(item.rawName, item.rawQty);
            item.id = `item_${dayKey}_${meal.id}_${idx}`;
            item.name = conv.name;
            item.qty = conv.qty;
            item.isConverted = conv.converted;
            item.conversionNote = conv.note;
          });
        });
      });

      return rawData;
    }

    /* ==========================================================================
       SUPER ROBUST PDF PARSER FOR PROGEO MEDICAL
       ========================================================================== */
    function pdfFoodRow(line) {
      const name = line.items.filter(item => item.x < 220).map(item => item.str).join(' ').replace(/^\s*-\s*/, '').trim();
      let qty = line.items.filter(item => item.x >= 220 && item.x < 450).map(item => item.str).join(' ').trim();
      if (/quantita bastante|a piacere|^q\.?b\.?$/i.test(normalizeText(qty))) qty = 'q.b.';
      return { ...parseFoodChoices(name, qty), isSubItem: /^\s*-/.test(line.items[0]?.str || '') };
    }

    function parsePdfAlternativePage(lines, groups, previousGroup) {
      let group = previousGroup;
      lines.forEach(line => {
        const text = line.items.map(item => item.str).join(' ').trim();
        const heading = text.match(/^(\d{2,5}):\s*(.+)$/);
        if (heading) {
          group = { code: heading[1], name: heading[2], choices: [] };
          groups.set(group.code, group);
          return;
        }
        if (!group || /^(?:alternative alimentari|alimento\b|quantita\b|elaborato da|powered by|\d+$)/i.test(normalizeText(text))) return;
        const food = pdfFoodRow(line);
        if (!food.name) return;
        if (food.isSubItem) {
          const parent = group.choices[group.choices.length - 1];
          if (parent) { parent.isRecipe = true; (parent.recipeIngredients ||= []).push(food); }
        } else {
          group.choices.push(food);
        }
      });
      return group;
    }

    function parsePdfUnitMeasures(items, measures) {
      let nameParts = [];
      let descriptions = [];
      function saveMeasure() {
        const name = normalizeText(nameParts.join(' '));
        const description = normalizeText(descriptions.join(' '));
        if (!name) return;
        const rules = {
          spoonGrams: /un cucchiaio\b[^.]*?contiene circa g\s*(\d+(?:[,.]\d+)?)/,
          teaspoonGrams: /un cucchiaino\b[^.]*?contiene circa g\s*(\d+(?:[,.]\d+)?)/,
          glassGrams: /un bicchiere\b[^.]*?contiene circa g\s*(\d+(?:[,.]\d+)?)/,
          portionGrams: /una porzione\b[^.]*?pesa circa g\s*(\d+(?:[,.]\d+)?)/
        };
        const values = {};
        Object.entries(rules).forEach(([unit, regex]) => {
          const match = description.match(regex);
          if (match) values[unit] = Number(match[1].replace(',', '.'));
        });
        if (Object.keys(values).length) measures[name] = values;
        const namedTeaspoon = description.match(/un cucchiaino\b[^.]*?contiene circa g\s*(\d+(?:[,.]\d+)?)\s+di\s+([^.;]+)/);
        if (namedTeaspoon) measures[normalizeText(namedTeaspoon[2])] = {
          ...(measures[normalizeText(namedTeaspoon[2])] || {}), teaspoonGrams: Number(namedTeaspoon[1].replace(',', '.'))
        };
      }
      // PDF text runs preserve each left-column label followed by its description.
      items.forEach(item => {
        const text = item.str?.trim();
        if (!text) return;
        if (/^(?:elaborato da|powered by|alimento$|unita di misura$|\d+$)/i.test(normalizeText(text))) return;
        if (item.transform[4] < 180) {
          if (descriptions.length) { saveMeasure(); nameParts = []; descriptions = []; }
          nameParts.push(text);
        } else if (nameParts.length) descriptions.push(text);
      });
      saveMeasure();
    }

    function applyPdfAlternatives(data, groups, measures) {
      function convertFood(food) {
        const sourceName = food.rawName || food.name;
        const converted = convertQuantityEngine(sourceName, food.rawQty || food.qty, measures[normalizeText(sourceName)] || {});
        food.name = converted.name; food.qty = converted.qty;
        food.isConverted = converted.converted; food.conversionNote = converted.note;
        (food.recipeIngredients || []).forEach(convertFood);
        (food.alternatives || []).forEach(convertFood);
      }
      Object.values(data.days).forEach(day => day.meals.forEach(meal => meal.items.forEach((item, index, items) => {
        const group = groups.get(item.alternativeCode);
        if (group?.choices.length > 1 && normalizeText(item.alternativeSourceName || item.rawName) === normalizeText(group.name)) {
          // The first appendix choice is the assigned food, not an additional purchase.
          const base = group.choices[0];
          const assigned = shoppingQuantity(item.rawQty);
          const reference = shoppingQuantity(base.rawQty);
          let ratio = 1;
          if (!base.recipeIngredients?.length && assigned.unit && assigned.unit === reference.unit && reference.value > 0) ratio = assigned.value / reference.value;
          item.alternatives = [...(base.alternatives || []), ...group.choices.slice(1)].map(choice => {
            const copy = JSON.parse(JSON.stringify(choice));
            function scale(food) {
              const quantity = shoppingQuantity(food.rawQty);
              if (ratio !== 1 && quantity.unit) food.rawQty = `${Number((quantity.value * ratio).toFixed(3))} ${quantity.unit}`;
              (food.recipeIngredients || []).forEach(scale);
              (food.alternatives || []).forEach(scale);
            }
            scale(copy);
            return copy;
          });
          if (item.isRecipe) {
            item.recipeIngredients = [];
            for (let next = index + 1; next < items.length && items[next].isSubItem; next++) item.recipeIngredients.push({ ...items[next] });
          }
        }
        convertFood(item);
      })));
      data.metadata.unitMeasures = measures;
      data.metadata.alternativesImported = groups.size > 0;
    }

    async function parseProgeoPdf(arrayBuffer, updateProgress, pdfEngine) {
      if (updateProgress) updateProgress("Caricamento PDF...", 15);

      const pdfjsLib = pdfEngine || await loadPdfEngine();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer), isEvalSupported: false });
      const pdf = await loadingTask.promise;

      const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
      const dayKeys = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

      const dayPatterns = [
        { key: 'lun', regex: /luned[ia]/i },
        { key: 'mar', regex: /marted[ia]/i },
        { key: 'mer', regex: /mercoled[ia]/i },
        { key: 'gio', regex: /gioved[ia]/i },
        { key: 'ven', regex: /venerd[ia]/i },
        { key: 'sab', regex: /sabat[o]/i },
        { key: 'dom', regex: /domenic[a]/i }
      ];

      const mealKeywords = [
        { id: 'colazione', name: 'Colazione', icon: '🌅', regex: /colazione/i },
        { id: 'meta_mattina', name: 'Metà mattina', icon: '🍎', regex: /meta['\s]*mattina|spuntino.*matt|spuntino.*1|mattina/i },
        { id: 'pranzo', name: 'Pranzo', icon: '🥗', regex: /pranzo/i },
        { id: 'merenda', name: 'Merenda', icon: '🍇', regex: /merenda|spuntino.*pomeri|spuntino.*2|pomeriggio/i },
        { id: 'cena', name: 'Cena', icon: '🍲', regex: /cena/i },
        { id: 'spuntino_serale', name: 'Spuntino serale', icon: '🌙', regex: /spuntino.*sera|dopocena|serale|notturno/i },
        { id: 'arco_giornata', name: 'Arco della giornata', icon: '💧', regex: /arco.*giornata|condimenti|nella.*giornata|extra/i }
      ];

      const metadataBlacklistRegex = /personalizzato|elaborato da|dott\.|dottor|biologo nutrizionista|ph\.d|indirizzo:|cellulare:|telefono:|email:|codice fiscale|fabbisogno|ripartizione|consigli generali|norme generali|avvertenze|pag\.\s*\d+|progeo medical|via\s+[a-z]|\b\d{5}\b|\b\d{9,10}\b/i;

      const dietPlan = {
        metadata: {
          parsedAt: new Date().toISOString(),
          source: "File PDF Progeo Medical"
        },
        days: {}
      };

      dayKeys.forEach(k => {
        dietPlan.days[k] = {
          dayName: dayNames[dayKeys.indexOf(k)],
          meals: []
        };
      });

      let totalParsedItems = 0;
      let matchedDayIndex = 0;
      const alternativeGroups = new Map();
      const unitMeasures = Object.create(null);
      let appendixGroup = null;
      let inAlternativeAppendix = false;
      let inUnitMeasures = false;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const pct = Math.round(20 + (pageNum / pdf.numPages) * 70);
        if (updateProgress) updateProgress(`Analisi pagina ${pageNum} di ${pdf.numPages}...`, pct);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items;
        if (!items || items.length === 0) continue;

        // Group items by Y position
        const lines = [];
        items.forEach(item => {
          if (!item.str || !item.str.trim()) return;
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);

          let line = lines.find(l => Math.abs(l.y - y) < 5);
          if (!line) {
            line = { y: y, items: [] };
            lines.push(line);
          }
          line.items.push({ x: x, str: item.str.trim() });
        });

        lines.sort((a, b) => b.y - a.y);
        lines.forEach(l => l.items.sort((a, b) => a.x - b.x));

        const fullPageRawText = lines.map(l => l.items.map(i => i.str).join(' ')).join('\n');
        const fullPageNormText = normalizeText(fullPageRawText);

        const hasDailyMeals = lines.some(line => /^(?:colazione|pranzo|cena|merenda)$/i.test(normalizeText(line.items.map(item => item.str).join(' '))));
        const hasUnitHeading = lines.some(line => /^unita di misura$/i.test(normalizeText(line.items.map(item => item.str).join(' '))));
        if (/lista alimenti|alimenti assegnati nella settimana/i.test(fullPageNormText) || hasDailyMeals) inUnitMeasures = false;
        if (hasUnitHeading) inUnitMeasures = true;
        if (inUnitMeasures) {
          inAlternativeAppendix = false;
          parsePdfUnitMeasures(items, unitMeasures);
          continue;
        }
        const hasAlternativeHeading = lines.some(line => /^\d{2,5}:\s*\S/.test(line.items.map(item => item.str).join(' ')));
        if (hasAlternativeHeading || /^alternative alimentari\b/i.test(fullPageNormText)) inAlternativeAppendix = true;
        if (inAlternativeAppendix && !hasDailyMeals && !/lista alimenti|alimenti assegnati/i.test(fullPageNormText)) {
          appendixGroup = parsePdfAlternativePage(lines, alternativeGroups, appendixGroup);
          continue;
        }
        inAlternativeAppendix = false;

        // Filter out Cover Page / Metadata pages
        const isCoverPage = /elaborato da|biologo nutrizionista|piano alimentare personalizzato|fabbisogno energetico|ripartizione nutrizionale/i.test(fullPageNormText) &&
                           !/colazione|pranzo|cena/i.test(fullPageNormText);

        if (isCoverPage) {
          continue; // Skip doctor/patient cover header page
        }

        // Identify day
        let currentDayKey = null;
        for (let dp of dayPatterns) {
          if (dp.regex.test(fullPageNormText)) {
            currentDayKey = dp.key;
            break;
          }
        }

        if (!currentDayKey) {
          // If page has meal headers, assign to next sequential day key
          if (/colazione|pranzo|cena|merenda/i.test(fullPageNormText)) {
            currentDayKey = dayKeys[matchedDayIndex % 7];
            matchedDayIndex++;
          } else {
            continue; // Ignore non-diet text pages
          }
        } else {
          matchedDayIndex = dayKeys.indexOf(currentDayKey) + 1;
        }

        let pageMeals = dietPlan.days[currentDayKey].meals || [];
        let currentMeal = null;
        let pendingAlternative = false;

        function getOrCreateMeal(mName, mIcon, mId) {
          let m = pageMeals.find(x => x.id === mId);
          if (!m) {
            m = { id: mId, name: mName, icon: mIcon, items: [] };
            pageMeals.push(m);
          }
          return m;
        }

        lines.forEach((line, lineIdx) => {
          const lineRaw = line.items.map(i => i.str).join(' ');
          const lineNorm = normalizeText(lineRaw);

          // Ignore header/footer lines and patient/doctor metadata
          if (metadataBlacklistRegex.test(lineNorm) || /piano alimentare/i.test(lineNorm) || /alimento.*quantita/i.test(lineNorm)) {
            return;
          }

          // Check meal match
          const matchedMeal = mealKeywords.find(mk => lineNorm.match(mk.regex)?.[0] === lineNorm);
          const additionalMeal = lineNorm.match(/^pasto aggiuntivo\s*(\d+)$/);

          if (additionalMeal) {
            currentMeal = getOrCreateMeal(`Pasto aggiuntivo ${additionalMeal[1]}`, '🍎', `pasto_aggiuntivo_${additionalMeal[1]}`);
            pendingAlternative = false;
            return;
          }

          if (matchedMeal) {
            currentMeal = getOrCreateMeal(matchedMeal.name, matchedMeal.icon, matchedMeal.id);
            pendingAlternative = false;
            return;
          }

          if (/^(?:oppure|o|in alternativa)\s*[:.]?$/i.test(lineRaw.trim())) {
            pendingAlternative = true;
            return;
          }

          // If no meal header yet, only create fallback if line actually looks like a food item
          if (!currentMeal) {
            if (/(\d+|cucchiai|cucchiaini|bicchier|porzion|g\b|gr\b|ml\b|q\.?b\.)/i.test(lineNorm)) {
              currentMeal = getOrCreateMeal("Menu del Giorno", "🥗", "menu_giorno");
            } else {
              return; // Skip metadata header lines at top of page
            }
          }

          let isSub = lineRaw.startsWith('-') || (line.items.length > 0 && line.items[0].str.startsWith('-'));

          // Check if this line is a main recipe title header (NOT a sub-item itself) followed by sub-ingredients starting with "-"
          const nextLine = (lineIdx + 1 < lines.length) ? lines[lineIdx + 1] : null;
          const isMainRecipeTitle = !isSub && nextLine && nextLine.items.some(it => it.str.trim().startsWith('-'));

          // Column-aware table parsing (Alimento | Quantità)
          let foodName = "";
          let foodQty = "";

          let nameParts = [];
          let qtyParts = [];

          line.items.forEach((it, idx) => {
            const x = it.x;
            const str = it.str.trim();
            if (!str) return;

            // The Alt. code is retained separately to join appendix tables after parsing.
            if (x >= 450) {
              return;
            } else if (x >= 220) {
              // Column 2: Quantità -> Keep all quantity text (e.g. "g", "100", "150", "1 porzione", "5 cucchiai")
              qtyParts.push(str);
            } else {
              // Column 1: Alimento
              nameParts.push(str);
            }
          });

          foodName = nameParts.join(' ').trim();
          foodQty = qtyParts.join(' ').trim();
          const alternativeCode = line.items.find(item => item.x >= 450 && /^\d{2,5}$/.test(item.str.trim()))?.str.trim();

          const isAlternativeRow = pendingAlternative || /^(?:oppure\b|o\s|in alternativa\b|alt(?:ernativa)?\s*[:.])/i.test(foodName);
          pendingAlternative = false;
          foodName = foodName.replace(/^(?:oppure\b|o\b|in alternativa(?: a)?\b|alt(?:ernativa)?\s*[:.])\s*[:.]?\s*/i, '');

          // Fallback if X coordinates put quantity in nameParts or line had 2 items
          if (!foodQty && line.items.length >= 2) {
            let qArr = [];
            line.items.forEach((it, idx) => {
              if (idx === 0 && line.items.length > 1) return;
              if (it.x < 450) qArr.push(it.str.trim());
            });
            foodQty = qArr.join(' ').trim();
          }

          if (!foodName) foodName = lineRaw;

          // Main recipe title header before sub-ingredients HAS NO QUANTITY (recipe code on right is ignored)
          if (isMainRecipeTitle) {
            foodQty = "";
          } else {
            // Format "g 100", "g. 100", "gr 100", "ml 200" -> "100 g", "200 ml"
            const matchReverse = foodQty.match(/^(g|gr|ml|kg)\.?\s*(\d+[,.]?\d*)$/i);
            if (matchReverse) {
              foodQty = `${matchReverse[2]} ${matchReverse[1].toLowerCase() === 'gr' ? 'g' : matchReverse[1].toLowerCase()}`;
            } else {
              // Format "100 g", "100g", "100 gr" -> "100 g"
              const matchStd = foodQty.match(/^(\d+[,.]?\d*)\s*(g|gr|ml|kg)$/i);
              if (matchStd) {
                foodQty = `${matchStd[1]} ${matchStd[2].toLowerCase() === 'gr' ? 'g' : matchStd[2].toLowerCase()}`;
              } else if (/^(\d+|\d+[,.]\d+)$/.test(foodQty)) {
                foodQty = `${foodQty} g`;
              }
            }

            // Format "quantità bastante" or "a piacere" into "q.b."
            if (/quantita\s+bastante|a\s+piacere|q\.?b\.?/i.test(normalizeText(foodQty))) {
              foodQty = "q.b.";
            }
          }

          // Preserve explicit choices before the legacy suffix cleanup removes their quantities.
          if (/\s(?:oppure|o|in alternativa(?: a)?)\s/i.test(foodName)) {
            const choice = parseFoodChoices(foodName, foodQty);
            if (choice.name) {
              choice.id = `item_${currentDayKey}_${currentMeal.id}_${lineIdx}_${Math.floor(Math.random()*10000)}`;
              choice.isSubItem = isSub;
              if (alternativeCode) choice.alternativeCode = alternativeCode;
              choice.alternativeSourceName = foodName;
              currentMeal.items.push(choice);
              totalParsedItems++;
            }
            return;
          }

          const embeddedQuantity = parseFoodChoices(foodName, foodQty);
          if (!foodQty && embeddedQuantity.rawQty) foodQty = embeddedQuantity.rawQty;

          // Truncate any remaining quantity or unit suffix from foodName so name stays clean
          foodName = foodName.replace(/^-\s*/, '').trim();
          foodName = foodName.replace(/\s+\d+\s*(?:g|gr|ml|kg|cucchiai|cucchiaini|bicchieri|fette|pezzi|porzion[ei]|tazz[ae]|piatto|pezzo).*$/i, '').trim();
          foodName = foodName.replace(/\s+q\.?b\.?.*$/i, '').trim();
          foodName = foodName.replace(/\s+quantit[aa]\s+bastante.*$/i, '').trim();
          foodName = foodName.replace(/\s+a\s+piacere.*$/i, '').trim();
          foodName = foodName.replace(/\s+(?:g|gr|ml)$/i, '').trim();

          if (!foodName || foodName.length < 2 || metadataBlacklistRegex.test(foodName)) return;

          const convResult = convertQuantityEngine(foodName, foodQty);
          totalParsedItems++;

          const parsedItem = {
            id: `item_${currentDayKey}_${currentMeal.id}_${lineIdx}_${Math.floor(Math.random()*10000)}`,
            rawName: foodName,
            name: convResult.name,
            rawQty: foodQty,
            qty: convResult.qty,
            isConverted: convResult.converted,
            conversionNote: convResult.note,
            isSubItem: isSub,
            isRecipe: isMainRecipeTitle,
            ...(alternativeCode ? { alternativeCode } : {})
          };
          const previousItem = currentMeal.items[currentMeal.items.length - 1];
          if (isAlternativeRow && previousItem && !isSub && !previousItem.isRecipe) {
            previousItem.alternatives = [...(previousItem.alternatives || []), parsedItem];
          } else {
            currentMeal.items.push(parsedItem);
          }
        });

        dietPlan.days[currentDayKey].meals = pageMeals;
      }

      if (totalParsedItems === 0) {
        throw new Error("EMPTY_PARSED_DATA");
      }

      applyPdfAlternatives(dietPlan, alternativeGroups, unitMeasures);
      return dietPlan;
    }


export { normalizeText, parseSpoonCount, convertQuantityEngine, parseFoodChoices, getFoodChoices, escapeHtml, shoppingQuantity, formatShoppingOption, shoppingOption, shoppingOptionKey, sumShoppingOption, buildShoppingList, getSampleProgeoDiet, pdfFoodRow, parsePdfAlternativePage, parsePdfUnitMeasures, applyPdfAlternatives, parseProgeoPdf };
