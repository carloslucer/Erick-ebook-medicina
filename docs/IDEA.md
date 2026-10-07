# Método LOCAR: estado del proyecto

Landing: `index.html` (página estática, se puede publicar en Vercel, Netlify o GitHub Pages).
El contenido del ebook no se guarda en este repo porque es público.

## Producto

Método de estudio para **Patología** basado en *Robbins y Cotran. Patología estructural y funcional* + IA.
Dos fases: cursada (5 pasos por tema) y parciales de patología especial (guías autoevaluables con post-its).

## Ya está en la landing

La landing es **solo de venta**: muestra resultados y qué incluye, no el contenido del método.

- [x] Hero con promesa, precio y portada de muestra
- [x] Dolor del estudiante
- [x] Resultados que logra el método (4 beneficios)
- [x] Cómo funciona, a alto nivel (2 fases, sin explicar los pasos)
- [x] Vista previa bloqueada de una guía high-yield (sin contenido real)
- [x] Qué incluye (producto principal + bonus)
- [x] Precio: $19.000 ARS
- [x] Preguntas frecuentes de compra
- [x] Descargo legal (no afiliado al Robbins, no reemplaza la bibliografía)

## Imágenes

- [x] Portadas del ebook y de los 5 extras en `assets/img/` (fuente editable: `assets/fuente/portadas.html`, se regeneran con `node scripts/render-portadas.mjs`)
- [ ] Foto real de Erick
- [ ] Opcional: rehacer las portadas en Canva (conectar Canva en claude.ai)

## Pendiente: lo tienen que definir ustedes

- [ ] Qué significa **LOCAR**
- [~] Historia de Erick: borrador escrito en la landing. Falta que Erick lo revise y complete facultad, nota, año y foto
- [~] Testimonios: hay 3 ejemplos de formato. Reemplazarlos por reales antes de publicar (ver `docs/TESTIMONIOS.md`)
- [x] Precio: **$19.000 ARS** (pago único)
- [ ] Plataforma de pago (Mercado Pago / Hotmart)
- [ ] ¿Se nombra una facultad o cátedra en particular?
- [ ] Dominio

## Pendiente: contenido del ebook

- [ ] Corregir ortografía ("Pront" → "Prompt", "lo lo", "Patologia", "Guia") y la numeración de "Consideraciones"
- [ ] Método para el **final o integrador**
- [ ] Ejemplo resuelto con fotos reales del libro marcado y de la guía
- [ ] Bonus completo: 25 a 40 preguntas del 1er parcial (Patología General)
- [ ] Plantilla imprimible de la cara de atrás (6 campos)
- [ ] Qué hacer si no tenés el libro en papel, si no hubo teoría o si no hubo TP
- [ ] Repaso espaciado: cuándo volver a las guías
- [ ] Diseño del PDF (portada, tipografía, cajas para los prompts)
