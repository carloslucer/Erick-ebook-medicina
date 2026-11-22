# Espía de Anuncios – Productos Ganadores (extensión de Chrome)

Analiza la [Biblioteca de Anuncios de Meta](https://www.facebook.com/ads/library/) y le pone un **puntaje de 0 a 100** a cada anuncio para encontrar ebooks y productos digitales que están vendiendo, y así modelarlos.

## Instalación (2 minutos)
1. Descargá esta carpeta (`extension-espia-anuncios`) o el archivo `espia-anuncios.zip` y descomprimilo.
2. En Chrome abrí `chrome://extensions`.
3. Activá **Modo de desarrollador** (arriba a la derecha).
4. Tocá **Cargar extensión sin empaquetar** y elegí la carpeta `extension-espia-anuncios`.
5. Fijá el ícono 🔎 en la barra de Chrome.

## Cómo usarla
1. Tocá el ícono → escribí una palabra clave (o usá una búsqueda rápida: *ebook, guía pdf, hotmart, kiwify…*) → elegí país → **Abrir búsqueda**.
2. En la Biblioteca aparece el panel **Espía de Anuncios** a la derecha y cada anuncio muestra su insignia.
3. Tocá **Cargar más (auto-scroll)** para que baje solo y analice cientos de anuncios.
4. Filtrá por *mín. días activo* (recomendado: 14 o 30), *mín. variaciones* y *solo productos digitales*.
5. Tocá ☆ para guardar los que quieras modelar. En el popup podés anotar el ángulo, la promesa y el precio, y exportar todo a CSV.

## Cómo se calcula el puntaje
| Señal | Puntos | Por qué |
|---|---|---|
| Días activo (3/7/14/30/60+) | hasta 45 | Nadie paga un anuncio semanas si no le vende |
| Variaciones del mismo anuncio (2/5/10/20+) | hasta 25 | Está duplicando para escalar |
| Anuncios del mismo anunciante en la búsqueda | hasta 15 | Invierte fuerte en ese producto |
| Plataforma de venta (Hotmart, Kiwify, Eduzz…) o palabras como ebook/pdf/guía | hasta 10 | Es producto digital |
| Activo | +5 | Inactivos se multiplican ×0,6 |

🔥 70+ ganador · 📈 45+ prometedor · 🧪 25+ en testeo · ❄️ frío

## Notas
- Todo funciona dentro de tu navegador: no envía datos a ningún servidor. Los guardados quedan en `chrome.storage` de tu Chrome.
- Lee el texto visible de la Biblioteca en español, inglés y portugués. Si Meta cambia el diseño y deja de detectar anuncios, tocá **Re-escanear**; si sigue sin andar, hay que ajustar `parser.js`.
- "Modelar" = estudiar el ángulo, la promesa, la oferta y el formato del ganador para crear tu propia versión, no copiar textos ni imágenes ajenos.
