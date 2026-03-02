document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('word-tbody');
    const emptyState = document.getElementById('empty-state');
    const langSelect = document.getElementById('language-select');
    const btnReset = document.getElementById('btn-reset');
    const btnReport = document.getElementById('btn-report');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportTxt = document.getElementById('btn-export-txt');
    const exportGroup = document.getElementById('export-group');
    const statusBanner = document.getElementById('status-banner');
    const tableContainer = document.querySelector('.table-container');
  
    let isFinalReport = false;
    let currentWordCounts = {};
  
    const safeSendMessage = (message) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url?.includes("youtube.com")) {
          chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {
            console.log("El script de contenido aún no está listo.");
          });
        }
      });
    };
  
    chrome.storage.local.get(['wordCounts', 'language', 'videoEnded'], (result) => {
      if (result.language) langSelect.value = result.language;
      if (result.wordCounts) {
        currentWordCounts = result.wordCounts;
        updateTable();
      }
      if (result.videoEnded) showFinalReport();
    });
  
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.wordCounts) {
          currentWordCounts = changes.wordCounts.newValue || {};
          if (!isFinalReport) updateTable();
        }
        if (changes.videoEnded?.newValue === true) showFinalReport();
      }
    });
  
    langSelect.addEventListener('change', (e) => {
      const lang = e.target.value;
      chrome.storage.local.set({ language: lang });
      safeSendMessage({ action: "setLanguage", language: lang });
    });
  
    btnReset.addEventListener('click', () => {
      if (confirm('¿Resetear todos los datos?')) {
        chrome.storage.local.set({ wordCounts: {}, videoEnded: false });
        currentWordCounts = {};
        isFinalReport = false;
        statusBanner.className = 'status live';
        statusBanner.textContent = '🔴 En vivo';
        btnReport.classList.remove('hidden');
        exportGroup.classList.add('hidden');
        updateTable();
        safeSendMessage({ action: "reset" });
      }
    });
  
    btnReport.addEventListener('click', showFinalReport);
    btnExportCsv.addEventListener('click', () => exportToCSV(currentWordCounts));
    btnExportTxt.addEventListener('click', () => exportToTXT(currentWordCounts));
  
    function updateTable() {
      const sortedWords = Object.entries(currentWordCounts).sort((a, b) => b[1] - a[1]);
      const displayWords = isFinalReport ? sortedWords : sortedWords.slice(0, 15);
  
      if (displayWords.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }
  
      tableContainer.style.display = 'block';
      emptyState.style.display = 'none';
      tbody.innerHTML = '';
      displayWords.forEach(([word, count]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${word}</td><td class="count-cell">${count}</td>`;
        tbody.appendChild(tr);
      });
    }
  
    function showFinalReport() {
      isFinalReport = true;
      statusBanner.className = 'status ended';
      statusBanner.textContent = '✅ Reporte Finalizado';
      btnReport.classList.add('hidden');
      exportGroup.classList.remove('hidden');
      updateTable();
    }
  
    function exportToCSV(data) {
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      let csv = "data:text/csv;charset=utf-8,Palabra,Frecuencia\n" + sorted.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = "reporte_youtube.csv";
      link.click();
    }
  
    function exportToTXT(data) {
      const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
      let txt = "REPORTE DE FRECUENCIA\n" + "=".repeat(20) + "\n\n" + sorted.map(([w, c]) => `${w.padEnd(20)} : ${c}`).join("\n");
      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_youtube.txt";
      link.click();
      URL.revokeObjectURL(url);
    }
  });