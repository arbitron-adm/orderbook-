// Функция для обновления заголовков стакана
function updateOrderbookHeaders() {
    const headerContainer = document.querySelector('.orderbook_tableHeader__cUOVb');
    if (!headerContainer) return;
  
    // Ищем нужные элементы по классам
    const priceHeader = headerContainer.querySelector('.orderbook_price__cuGtY');
    const volHeader   = headerContainer.querySelector('.orderbook_vol__z1Ryy');
    const amountHeader = headerContainer.querySelector('.orderbook_amount__nZxFj');
  
    // Задаём новые названия
    // if (priceHeader && priceHeader.firstChild) {
    //   priceHeader.firstChild.textContent = 'Цена';
    // }
    // if (volHeader && volHeader.firstChild) {
    //   volHeader.firstChild.textContent = 'Кол-во';
    // }
    // if (amountHeader && amountHeader.firstChild) {
    //   amountHeader.firstChild.textContent = 'Сумма';
    // }
  }
  
  // Вызываем при загрузке
  updateOrderbookHeaders();
  
  // Следим за динамическими изменениями DOM
  const observer = new MutationObserver(() => updateOrderbookHeaders());
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Вспомогательные функции для парсинга и форматирования
  function parseNumber(text) {
    const regex = /([\d.,]+)\s*([KMB]?)/i;
    const match = text.match(regex);
    if (match) {
      let number = parseFloat(match[1].replace(',', '.'));
      const suffix = match[2].toUpperCase();
      let multiplier = 1;
      if (suffix === 'K') multiplier = 1e3;
      else if (suffix === 'M') multiplier = 1e6;
      else if (suffix === 'B') multiplier = 1e9;
      return number * multiplier;
    }
    return NaN;
  }
  
  function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(3) + 'B';
    else if (num >= 1e6) return (num / 1e6).toFixed(3) + 'M';
    else if (num >= 1e3) return (num / 1e3).toFixed(3) + 'K';
    else return num.toFixed(3);
  }
  
  // Функция для вычисления средней и std
  function getMeanAndStd(values) {
    if (!values.length) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return { mean, std: Math.sqrt(variance) };
  }
  
  // Основная логика обновления строк в стакане
  setInterval(() => {
    // Все строки ордербука
    const rows = document.querySelectorAll('.orderbook_tableRow__M1cC0');
  
    // Собираем объёмы, чтобы вычислить статистику
    const volumes = [];
    rows.forEach(row => {
      const volEl = row.querySelector('.orderbook_vol__z1Ryy');
      if (volEl) {
        const vol = parseNumber(volEl.textContent);
        if (!isNaN(vol) && vol > 0) {
          volumes.push(vol);
        }
      }
    });
  
    if (!volumes.length) return;
  
    // Рассчитываем среднее и стандартное отклонение
    const { mean, std } = getMeanAndStd(volumes);
  
    // Обходим каждую строку
    rows.forEach(row => {
      const priceEl = row.querySelector('.orderbook_price__cuGtY');
      const volEl   = row.querySelector('.orderbook_vol__z1Ryy');
      const amountEl = row.querySelector('.orderbook_amount__nZxFj');
  
      // Сбрасываем ранее выставленные классы
      row.classList.remove('big-volume', 'huge-volume', 'cluster');
  
      if (priceEl && volEl && amountEl) {
        const price = parseNumber(priceEl.textContent);
        const volume = parseNumber(volEl.textContent);
  
        if (!isNaN(price) && price > 0 && !isNaN(volume)) {
          // Высчитываем новую «Сумму» = price * volume
          const newAmount = volume * price;
        //   amountEl.textContent = formatNumber(newAmount);
  
          // Логика подсветки больших объёмов
          if (volume > mean + 2 * std) {
            row.classList.add('huge-volume');
          } else if (volume > mean + std) {
            row.classList.add('big-volume');
          }
        }
      }
    });
  
    // Выделяем «кластеры»: подряд 3+ строк с big/huge-volume
    let clusterCount = 0;
    let clusterRows = [];
    rows.forEach(row => {
      if (row.classList.contains('big-volume') || row.classList.contains('huge-volume')) {
        clusterCount++;
        clusterRows.push(row);
      } else {
        if (clusterCount >= 3) {
          clusterRows.forEach(r => r.classList.add('cluster'));
        }
        clusterCount = 0;
        clusterRows = [];
      }
    });
    // Если подряд 3+ в самом конце
    if (clusterCount >= 3) {
      clusterRows.forEach(r => r.classList.add('cluster'));
    }
  
  }, 1); // Обновляем каждые 1 мс (можете увеличить интервал при необходимости)
  