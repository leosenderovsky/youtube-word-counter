function isContextValid() {
    return chrome.runtime && !!chrome.runtime.id;
  }
  
  const stopWords = {
    es: ["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "a", "al", "e", "o", "u", "y", "en", "ante", "bajo", "con", "contra", "desde", "durante", "entre", "hacia", "hasta", "para", "por", "según", "sin", "sobre", "tras", "que", "es", "son", "fue", "pero", "si", "no", "su", "sus", "como", "más", "me", "se", "lo", "te", "mi", "qué", "ya", "muy", "esto", "eso", "este", "esta", "estos", "estas"],
    en: ["the", "a", "an", "and", "or", "but", "if", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "to", "from", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "not", "this", "that", "it", "in", "on", "you", "i", "he", "she", "we", "they", "my", "your", "his", "her", "our", "their", "so", "what", "which", "who", "how", "why"]
  };
  
  let wordCounts = {};
  let currentLanguage = 'es';
  let lastProcessedText = "";
  let observer = null;
  
  if (isContextValid()) {
    chrome.storage.local.get(['wordCounts', 'language'], (result) => {
      if (result.wordCounts) wordCounts = result.wordCounts;
      if (result.language) currentLanguage = result.language;
    });
  }
  
  chrome.runtime.onMessage.addListener((request) => {
    if (!isContextValid()) return;
    if (request.action === "setLanguage") {
      currentLanguage = request.language;
    } else if (request.action === "reset") {
      wordCounts = {};
      lastProcessedText = "";
    }
  });
  
  function cleanAndExtractWords(text) {
    const cleaned = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"'\[\]]/g, " ");
    const words = cleaned.split(/\s+/).filter(word => word.length > 1);
    const currentStop = stopWords[currentLanguage] || stopWords['es'];
    return words.filter(word => !currentStop.includes(word));
  }
  
  function processSubtitles() {
    if (!isContextValid()) return;
    
    const captionSegments = document.querySelectorAll('.ytp-caption-segment');
    let currentText = Array.from(captionSegments).map(s => s.textContent).join(" ").trim();
  
    if (currentText && currentText !== lastProcessedText) {
      const newWords = cleanAndExtractWords(currentText);
      const oldWords = cleanAndExtractWords(lastProcessedText);
      
      // Solo contar palabras que no estaban en el segmento anterior
      newWords.forEach(word => {
        if (!oldWords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      
      chrome.storage.local.set({ wordCounts });
      lastProcessedText = currentText;
    }
  }
  
  const setup = () => {
    if (!isContextValid()) return;
    const captionWindow = document.querySelector('.ytp-caption-window-container');
    if (captionWindow && !observer) {
      observer = new MutationObserver(processSubtitles);
      observer.observe(captionWindow, { childList: true, subtree: true, characterData: true });
    }
    const video = document.querySelector('video');
    if (video) {
      video.onended = () => isContextValid() && chrome.storage.local.set({ videoEnded: true });
    }
  };
  
  const initInterval = setInterval(() => {
    if (!isContextValid()) {
      clearInterval(initInterval);
      return;
    }
    setup();
  }, 1000);