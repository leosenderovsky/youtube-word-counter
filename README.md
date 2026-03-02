# 📊 YouTube Subtitle Word Counter

Una extensión de Google Chrome diseñada para analizar en tiempo real la frecuencia de las palabras utilizadas en los subtítulos de YouTube. Ideal para estudiantes de idiomas, creadores de contenido y analistas de datos.

Este proyecto nació como un prototipo funcional generado en **Google AI Studio (Gemini)** y ha evolucionado hacia una herramienta completa con visualización de datos y reportes descargables.

## ✨ Características

- **Panel Lateral (Side Panel):** Interfaz integrada que no interrumpe la navegación.
- **Análisis en Tiempo Real:** Cuenta palabras mientras el video se reproduce.
- **Filtrado Inteligente:** Ignora automáticamente "stop words" (preposiciones, artículos, etc.) en español e inglés.
- **Gráfico Visual:** Genera un gráfico de barras con las 5 palabras más utilizadas al finalizar.
- **Exportación de Datos:** Descarga los resultados en formato `.csv` o `.txt`.
- **Detección de Idioma:** Soporte ajustable para subtítulos en español e inglés.

## 🚀 Instalación (Modo Desarrollador)

Como esta extensión está en desarrollo, debes cargarla manualmente en Chrome:

1. Descarga o clona este repositorio.
2. Abre Google Chrome y ve a `chrome://extensions/`.
3. Activa el **"Modo de desarrollador"** en la esquina superior derecha.
4. Haz clic en **"Cargar descomprimida"**.
5. Selecciona la carpeta que contiene los archivos de la extensión.

## 🛠️ Tecnologías Utilizadas

- **JavaScript (Vanilla):** Lógica del Content Script y manipulación del DOM.
- **Chrome Extension API (V3):** Uso de `sidePanel`, `storage`, y `messaging`.
- **CSS3:** Diseño moderno con variables y estética "Dark Mode".
- **MutationObserver:** Para detectar cambios en los subtítulos de YouTube sin afectar el rendimiento.

## 📁 Estructura del Proyecto

* `manifest.json`: Configuración principal y permisos de la extensión.
* `background.js`: Gestiona el comportamiento del panel lateral.
* `content.js`: Inyecta la lógica en YouTube para leer los subtítulos de forma segura.
* `sidepanel.html/js`: La interfaz de usuario y la lógica de procesamiento de datos.
* `styles.css`: Estilos visuales optimizados para el panel lateral.

## ⚠️ Notas de Uso

* **Refresco necesario:** Si actualizas la extensión, recuerda refrescar la pestaña de YouTube para que el script de contenido se reinicie correctamente.
* **Subtítulos activos:** La extensión requiere que los subtítulos (CC) estén activados en el reproductor de YouTube para poder capturar los datos.

## 🤖 Origen del Proyecto

El núcleo de esta extensión fue desarrollado utilizando **Google AI Studio**. A través de una colaboración iterativa con la IA, se refinó la lógica de captura de subtítulos y se resolvieron problemas complejos de comunicación entre scripts, demostrando el potencial de la IA para acelerar el desarrollo de herramientas funcionales.

---
Desarrollado con ❤️ para analistas de contenido.