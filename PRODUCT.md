# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes de Medicina de cualquier universidad argentina que cursan **Patología** (en general 3er año) con el libro *Robbins y Cotran. Patología estructural y funcional* y guías de laboratorio de su cátedra. Situación típica: tienen parcialitos semanales y parciales de laboratorio con microscopio, sienten que el Robbins es inabarcable, subrayan todo y no saben qué se toma. Llegan a la landing mayormente desde el celular.

## Product Purpose

Vender el ebook **Método LOCAR** ($19.000 ARS, pago único): un método de estudio para Patología que combina el Robbins, las guías de la cátedra y la IA. El ebook enseña a filtrar qué estudiar, jerarquizar lo marcado, reconocer preparados en el laboratorio y autoevaluarse con IA. Éxito = el visitante entiende qué gana, confía y paga con Mercado Pago.

## Positioning

No es un resumen ni apuntes: es un **sistema de estudio** armado por un estudiante que ya cursó la materia. Se apoya en los materiales que el alumno ya tiene (su Robbins, su teoría, sus guías) y usa la IA para tomarle examen sobre lo que él marcó, no para resumir el libro.

## Operating Context

- Cursada de Patología: teoría, guías de laboratorio con microfotografías, trabajos prácticos, parcialitos y parciales de patología especial con microscopio.
- El alumno estudia con el Robbins en papel/fotocopiado y usa una IA de su elección (ChatGPT, Gemini, Claude).
- Compra: pago con Mercado Pago (tarjetas, dinero en cuenta, efectivo en Rapipago/Pago Fácil); entrega del PDF por mail.

## Capabilities and Constraints

- La landing es una página estática HTML/CSS (`index.html` = versión A con portadas de Canva; `landing-portadas-claude.html` = versión B).
- **La landing no muestra contenido interno del ebook** (prompts, pasos detallados, ejemplos resueltos, respuestas de los bonus). Solo resultados, estructura a alto nivel y qué incluye.
- Contenido del paquete: ebook principal, pack de prompts, ejemplo resuelto, bonus de preguntas del 1er parcial, plantilla imprimible, plan semanal.
- Pago: Mercado Pago, $19.000 ARS, pago único. El link de pago y la integración todavía no existen (botón `#mp-checkout`).
- Garantía: hoy figura de 7 días. **Pendiente de confirmar**; por la Ley de Defensa del Consumidor no puede ser menor a 10 días.
- **Pendientes sin definir:** significado del nombre "LOCAR", datos legales del vendedor (nombre/CUIT), botón de arrepentimiento, contacto de soporte, dominio, método para el final.

## Brand Commitments

- Nombre: **Método LOCAR** (significado aún sin definir).
- Voz: compañero que ya pasó por la materia. Voseo rioplatense, cercano, de estudiante a estudiante, directo y sin exagerar.
- Tema visual **claro fijo** (decisión explícita del equipo).
- Logo de Mercado Pago provisto por el equipo: `assets/logos/mercadopago-logo.png`.
- Aviso obligatorio: material complementario, no reemplaza la bibliografía y no está afiliado a los autores ni a la editorial del Robbins. No usar portada ni logo del Robbins.

## Evidence on Hand

- Borrador del ebook (no versionado en el repo por ser público).
- Portadas del ebook y bonus: `assets/img/canva/` (versión A) y `assets/img/` (versión B).
- **No hay testimonios reales todavía.** Los tres de la landing (Sofía M., Tomás R., Valentina G.) son ejemplos de formato marcados como tales y deben reemplazarse por reales con permiso.
- **No hay datos confirmados del autor** (facultad, nota, año, ayudantía): la historia de Erick es un borrador con campos entre corchetes.
- No inventar testimonios, notas, resultados, cantidad de alumnos, ni afirmaciones de la cátedra.

## Product Principles

1. **Mostrar el resultado, no regalar el método.** La landing vende lo que el alumno logra; el cómo está dentro del ebook.
2. **Confianza antes que urgencia.** Pago conocido (Mercado Pago), garantía clara, autor real y testimonios reales pesan más que trucos de escasez.
3. **Honestidad verificable.** Nada que un estudiante pueda desmentir en un grupo de WhatsApp de la facultad.
4. **Pensado para el celular.** La mayoría llega desde el teléfono; todo tiene que leerse y comprarse cómodo ahí.
