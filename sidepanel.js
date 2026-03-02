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
    const btnStart = document.getElementById('btn-start');
    const startContainer = document.getElementById('start-container');

    let isFinalReport = false;
    let currentWordCounts = {};

    // Función para enviar mensajes de forma segura al content script
    const safeSendMessage = (message, callback) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Solo enviar mensajes a pestañas de YouTube
            if (tabs[0] && tabs[0].id && tabs[0].url && tabs[0].url.includes("youtube.com")) {
                chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Error al enviar mensaje:", chrome.runtime.lastError.message);
                        if (callback) callback({ error: chrome.runtime.lastError.message });
                    } else {
                        if (callback) callback(response);
                    }
                });
            } else {
                // Si no estamos en YouTube, manejarlo adecuadamente
                handleNonYouTubePage();
                if (callback) callback({ error: "Not a YouTube page." });
            }
        });
    };

    // Verifica la URL actual al cargar el panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].url || !tabs[0].url.includes("youtube.com")) {
            handleNonYouTubePage();
        } else {
            // Si estamos en YouTube, cargar datos y configurar la UI
            chrome.storage.local.get(['wordCounts', 'language', 'videoEnded', 'isCapturing'], (result) => {
                if (result.language) langSelect.value = result.language;
                if (result.isCapturing) {
                    showCaptureUI();
                    if (result.wordCounts) {
                        currentWordCounts = result.wordCounts;
                        updateTable();
                    }
                } else {
                    showStartUI();
                }
                if (result.videoEnded) showFinalReport();
            });
        }
    });

    // Listener para cambios en el storage
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.wordCounts) {
                currentWordCounts = changes.wordCounts.newValue || {};
                if (!isFinalReport) updateTable();
            }
            if (changes.videoEnded?.newValue === true) showFinalReport();
        }
    });

    // Event Listeners para los controles
    langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        chrome.storage.local.set({ language: lang });
        safeSendMessage({ action: "setLanguage", language: lang });
    });

    btnStart.addEventListener('click', () => {
        const lang = langSelect.value;
        safeSendMessage({ action: "start", language: lang }, (response) => {
            if (response && response.status === 'started') {
                chrome.storage.local.set({ isCapturing: true, language: lang });
                showCaptureUI();
            }
        });
    });

    btnReset.addEventListener('click', () => {
        if (confirm('¿Resetear todos los datos?')) {
            chrome.storage.local.set({ wordCounts: {}, videoEnded: false, isCapturing: false });
            currentWordCounts = {};
            isFinalReport = false;
            showStartUI();
            safeSendMessage({ action: "reset" });
        }
    });

    btnReport.addEventListener('click', showFinalReport);
    btnExportCsv.addEventListener('click', () => exportToCSV(currentWordCounts));
    btnExportTxt.addEventListener('click', () => exportToTXT(currentWordCounts));

    // Funciones de UI
    function handleNonYouTubePage() {
        startContainer.style.display = 'block';
        btnStart.textContent = 'Solo en YouTube';
        btnStart.disabled = true;
        btnStart.classList.add('disabled');
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
        statusBanner.style.display = 'none';
        btnReport.style.display = 'none';
        exportGroup.classList.add('hidden');
    }

    function showStartUI() {
        startContainer.style.display = 'block';
        btnStart.textContent = 'Iniciar Captura';
        btnStart.disabled = false;
        btnStart.classList.remove('disabled');
        tableContainer.style.display = 'none';
        emptyState.style.display = 'none';
        statusBanner.style.display = 'none';
        btnReport.style.display = 'none';
        exportGroup.classList.add('hidden');
    }

    function showCaptureUI() {
        startContainer.style.display = 'none';
        statusBanner.style.display = 'block';
        btnReport.style.display = 'block';
        statusBanner.className = 'status live';
        statusBanner.textContent = '🔴 En vivo';
        updateTable();
    }

    function updateTable() {
        if (!currentWordCounts || Object.keys(currentWordCounts).length === 0) {
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        const sortedWords = Object.entries(currentWordCounts).sort((a, b) => b[1] - a[1]);
        const displayWords = isFinalReport ? sortedWords : sortedWords.slice(0, 15);

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
        btnReport.style.display = 'none'; // Ocultar en lugar de añadir clase
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
