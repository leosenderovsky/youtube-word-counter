function isContextValid() {
    return chrome.runtime && !!chrome.runtime.id;
}

// Palabras a ignorar para cada idioma
const stopWords = {
    es: ["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "a", "al", "e", "o", "u", "y", "en", "ante", "bajo", "con", "contra", "desde", "durante", "entre", "hacia", "hasta", "para", "por", "según", "sin", "sobre", "tras", "que", "es", "son", "fue", "pero", "si", "no", "su", "sus", "como", "más", "me", "se", "lo", "te", "mi", "qué", "ya", "muy", "esto", "eso", "este", "esta", "estos", "estas"],
    en: ["the", "a", "an", "and", "or", "but", "if", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "to", "from", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "not", "this", "that", "it", "in", "on", "you", "i", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "so", "what", "which", "who", "how", "why"]
};

let wordCounts = {};
let currentLanguage = 'es';
let lastProcessedText = "";
let subtitleObserver = null;
let adObserver = null;

// Cargar estado inicial desde el storage
if (isContextValid()) {
    chrome.storage.local.get(['wordCounts', 'language'], (result) => {
        if (result.wordCounts) wordCounts = result.wordCounts;
        if (result.language) currentLanguage = result.language;
    });
}

// Listener para mensajes desde el sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!isContextValid()) return true;
    switch (request.action) {
        case "start":
            currentLanguage = request.language;
            startCapture();
            sendResponse({ status: "started" });
            break;
        case "setLanguage":
            currentLanguage = request.language;
            break;
        case "reset":
            resetCapture();
            break;
    }
    return true;
});

// Inicia la captura de subtítulos y la detección de anuncios
function startCapture() {
    setupSubtitleObserver();
    setupAdObserver();
}

// Detiene y resetea toda la captura
function resetCapture() {
    wordCounts = {};
    lastProcessedText = "";
    if (subtitleObserver) subtitleObserver.disconnect();
    if (adObserver) adObserver.disconnect();
    subtitleObserver = null;
    adObserver = null;
}

// Configura el observer para los subtítulos
function setupSubtitleObserver() {
    if (subtitleObserver) subtitleObserver.disconnect();
    if (!isContextValid()) return;

    const captionWindow = document.querySelector('.ytp-caption-window-container');
    if (captionWindow) {
        subtitleObserver = new MutationObserver(processSubtitles);
        subtitleObserver.observe(captionWindow, { childList: true, subtree: true });
        console.log("Subtitle observer re-attached.");
    }

    const video = document.querySelector('video');
    if (video) {
        video.onended = () => {
            if (isContextValid()) chrome.storage.local.set({ videoEnded: true });
        };
    }
}

// Configura el observer para detectar anuncios
function setupAdObserver() {
    if (adObserver) adObserver.disconnect();
    const player = document.getElementById('movie_player');
    if (!player) return;

    adObserver = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class') {
                const isAdShowing = mutation.target.classList.contains('ad-interrupting') || mutation.target.classList.contains('ytp-ad-showing');
                if (isAdShowing) {
                    // Anuncio detectado, pausar observador de subtítulos
                    if (subtitleObserver) {
                        subtitleObserver.disconnect();
                        console.log("Ad detected, pausing subtitle capture.");
                    }
                } else {
                    // El anuncio terminó, reanudar observador de subtítulos
                    console.log("Ad finished, resuming subtitle capture.");
                    setTimeout(setupSubtitleObserver, 500); // Dar tiempo al DOM para actualizarse
                }
            }
        }
    });

    adObserver.observe(player, { attributes: true });
}

// Procesa el texto de los subtítulos
function processSubtitles() {
    if (!isContextValid()) return;

    const captionSegments = document.querySelectorAll('.ytp-caption-segment');
    let currentText = Array.from(captionSegments).map(s => s.textContent).join(" ").trim();

    if (currentText && currentText !== lastProcessedText) {
        const newWords = cleanAndExtractWords(currentText);
        const oldWords = cleanAndExtractWords(lastProcessedText);

        const uniqueNewWords = newWords.filter(word => !oldWords.includes(word));

        uniqueNewWords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        chrome.storage.local.set({ wordCounts });
        lastProcessedText = currentText;
    }
}

// Limpia y extrae palabras válidas del texto
function cleanAndExtractWords(text) {
    if (!text) return [];
    const cleaned = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"'\[\]]/g, " ");
    const words = cleaned.split(/\s+/).filter(word => word.length > 2);
    const currentStop = stopWords[currentLanguage] || stopWords['es'];
    return words.filter(word => !currentStop.includes(word));
}
