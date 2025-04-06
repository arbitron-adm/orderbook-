function updateTableHeaders() {
    const headerContainer = document.querySelector('.market_tableHeader__T2Md5');
    if (!headerContainer) return;
  
    const priceHeader = headerContainer.querySelector('.market_price__V_09X .market_headerText__o04y_');
    const volumeHeader = headerContainer.querySelector('.market_vol__M6Ton .market_headerText__o04y_');
    const amountHeader = headerContainer.querySelector('.market_amount__a1I8g .market_headerText__o04y_');
  
    if (priceHeader) priceHeader.textContent = 'Цена';
    if (volumeHeader) volumeHeader.textContent = 'Кол-во';
    if (amountHeader) amountHeader.textContent = 'Сумма';
  }
  
  updateTableHeaders();
  
  // Следим за динамическими изменениями DOM (если заголовки могут перерисовываться)
  const observer = new MutationObserver(() => updateTableHeaders());
  observer.observe(document.body, { childList: true, subtree: true });
  
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
    const std = Math.sqrt(variance);
    return { mean, std };
  }
  
  setInterval(() => {
    const rows = document.querySelectorAll('.market_tableRow__Uuhwj');
  
    // Собираем объёмы, чтобы потом вычислять статистику
    const volumes = [];
    rows.forEach(row => {
      const volEl = row.querySelector('.market_vol__M6Ton');
      if (volEl) {
        const vol = parseNumber(volEl.textContent);
        if (!isNaN(vol) && vol > 0) {
          volumes.push(vol);
        }
      }
    });
  
    if (volumes.length === 0) return;
  
    // Получаем среднее и std
    const { mean, std } = getMeanAndStd(volumes);
  
    // Обновляем каждую строку
    rows.forEach(row => {
      const priceEl = row.querySelector('.market_price__V_09X');
      const volEl = row.querySelector('.market_vol__M6Ton');
      const amountEl = row.querySelector('.market_amount__a1I8g');
  
      // Снимаем старые классы
      row.classList.remove('big-volume', 'huge-volume', 'cluster');
  
      if (priceEl && volEl && amountEl) {
        const price = parseNumber(priceEl.textContent);
        const volume = parseNumber(volEl.textContent);
  
        if (!isNaN(price) && price > 0 && !isNaN(volume)) {
          // Обновляем колонку "Сумма"
          const newAmount = volume * price;
          amountEl.textContent = formatNumber(newAmount);
  
          // Определяем, «большой» ли объём
          if (volume > mean + 2 * std) {
            row.classList.add('huge-volume');
          } else if (volume > mean + std) {
            row.classList.add('big-volume');
          }
        }
      }
    });
  
    // Выделяем кластеры – если подряд 3 и более строк с big/huge
    let clusterCount = 0;
    let clusterRows = [];
    rows.forEach((row) => {
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
    if (clusterCount >= 3) {
      clusterRows.forEach(r => r.classList.add('cluster'));
    }
  
  }, 1); // Обновление раз в секунду