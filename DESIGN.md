---
name: Método LOCAR
description: Landing de venta de un método de estudio para Patología, con la estética de un preparado teñido con H&E y el resaltador del alumno.
colors:
  slide-glass: "#f6f4f8"
  surface: "#ffffff"
  ink: "#221b2e"
  muted-ink: "#625a70"
  hairline: "#ddd6e6"
  hematoxylin: "#4b2a8a"
  hematoxylin-wash: "#ebe4f7"
  eosin: "#d9467a"
  eosin-wash: "#fbe3ec"
  highlighter: "#fff07a"
  skeleton: "#e7e1ee"
  pending-amber: "#b45309"
  pending-wash: "#fdf0dc"
  mp-blue: "#009ee3"
  mp-navy: "#2d3277"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6.5vw, 4.6rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Bricolage Grotesque, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 4vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Bricolage Grotesque, Segoe UI, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.08
  body:
    fontFamily: "Atkinson Hyperlegible, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  pill: "999px"
spacing:
  s1: "0.5rem"
  s2: "1rem"
  s3: "1.5rem"
  s4: "2.5rem"
  s5: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.hematoxylin}"
    textColor: "{colors.slide-glass}"
    rounded: "{rounded.pill}"
    padding: "0.95em 1.6em"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.hematoxylin}"
    rounded: "{rounded.pill}"
    padding: "0.95em 1.6em"
  button-mercadopago:
    backgroundColor: "{colors.mp-blue}"
    textColor: "{colors.surface}"
    rounded: "8px"
    padding: "0.8rem 1rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.s3}"
  chip-pending:
    backgroundColor: "{colors.pending-wash}"
    textColor: "{colors.pending-amber}"
    rounded: "{rounded.pill}"
    padding: "0.3em 0.75em"
---

# Design System: Método LOCAR

## Overview

**Creative North Star: "El preparado y el resaltador"**

La landing se ve como una mesa de estudio de Patología: el fondo es el vidrio claro de un portaobjetos, el color sale de la tinción H&E (violeta hematoxilina para lo importante, rosa eosina para señalar) y la marca del método es el gesto que todo estudiante conoce, resaltar y subrayar. Ese gesto no es decoración: es la jerarquía del propio método llevada a la tipografía.

La personalidad es clara y confiable. Pocas superficies, mucho aire, una sola columna de lectura con bloques que se abren a grilla cuando hay que comparar (dolores, qué incluye, testimonios). El momento más cargado visualmente es la portada del ebook en el hero y el bloque de compra; todo lo demás queda en calma para que esos dos lugares manden.

El checkout adopta la identidad de Mercado Pago dentro de un recuadro blanco propio: es la única zona donde se usan colores ajenos a la paleta, y es a propósito, para que el pago se reconozca.

**Key Characteristics:**
- Tema claro fijo, sin modo oscuro.
- Paleta H&E: violeta para acción y jerarquía, rosa para señalar, amarillo resaltador para la frase clave.
- Grotesca expresiva en titulares, una tipografía de alta legibilidad en el texto, monoespaciada para rótulos.
- Tarjetas blancas planas con borde fino; sombras solo en portadas.
- Lo pendiente se marca con ámbar y borde punteado, nunca se disimula.

## Colors

Una paleta de tinción histológica sobre vidrio: dos acentos de laboratorio y un amarillo de resaltador.

### Primary
- **Violeta Hematoxilina** (hematoxylin): botones principales, precio, sello de garantía, íconos de confianza, borde de la tarjeta destacada. Es el color de la acción.

### Secondary
- **Rosa Eosina** (eosin): rótulos en mayúscula sobre los títulos, subrayado de la frase resaltada, detalles del sello. Señala, no llama a la acción.

### Tertiary
- **Amarillo Resaltador** (highlighter): solo detrás de la frase clave de un título ("con un método") y en la vista previa bloqueada. Es el gesto de marca.

### Neutral
- **Vidrio de Portaobjetos** (slide-glass): fondo de página.
- **Superficie** (surface): tarjetas, recuadros y bloque de precio.
- **Tinta** (ink): texto principal y títulos.
- **Tinta Apagada** (muted-ink): bajadas y texto secundario.
- **Línea Fina** (hairline): bordes de tarjetas y divisores entre secciones.
- **Lavado Hematoxilina** (hematoxylin-wash) y **Lavado Eosina** (eosin-wash): fondos suaves de íconos y avatares.

### Named Rules
**The Resaltador Escaso Rule.** El amarillo aparece como máximo una vez por pantalla, detrás de la frase que el visitante no se puede perder. Si todo está resaltado, nada lo está, igual que en el método.

**The Ámbar Es Pendiente Rule.** El ámbar y el borde punteado significan "falta definir". No se usan como decoración; cuando el dato se completa, el ámbar desaparece.

**The Checkout Prestado Rule.** El azul y celeste de Mercado Pago viven solo dentro del recuadro de pago. Fuera de él, la paleta es H&E.

## Typography

**Display Font:** Bricolage Grotesque (con Segoe UI, system-ui)
**Body Font:** Atkinson Hyperlegible (con Segoe UI, system-ui)
**Label/Mono Font:** JetBrains Mono (con ui-monospace)

**Character:** una grotesca con carácter y peso alto para los titulares, que da energía sin perder seriedad, apoyada en una tipografía diseñada para máxima legibilidad. La monoespaciada en mayúsculas espaciadas funciona como el rótulo de un frasco de laboratorio.

### Hierarchy
- **Display** (800, clamp(2.4rem, 6.5vw, 4.6rem), 1.08): solo el titular del hero.
- **Headline** (800, clamp(1.8rem, 4vw, 2.75rem), 1.08): títulos de sección.
- **Title** (700, 1.2rem): títulos de tarjetas.
- **Body** (400, 1.0625rem, 1.65): texto corrido; bajadas a 1.2rem en color apagado. Ancho de lectura máximo 42rem.
- **Label** (600, 0.72–0.78rem, 0.08–0.12em, mayúsculas): rótulos de sección y tipos de ítem.

### Named Rules
**The Rótulo Rule.** La monoespaciada solo rotula; nunca se usa para frases que haya que leer.

## Layout

Columna central de hasta 72rem con margen lateral fijo de 16px. Las secciones se separan con 4rem de aire vertical y una línea fina. El hero usa dos columnas (texto 1.25fr, portada 1fr) que se apilan bajo 860px. Las grillas de tarjetas pasan de 3 o 2 columnas a 1 en celular (860px y 560px). Escala de espacios: 0.5, 1, 1.5, 2.5 y 4rem. El bloque de compra se centra en una columna de 34rem.

## Elevation & Depth

Sistema plano. Las tarjetas se separan del fondo por el blanco y un borde fino, no por sombras. Las sombras se reservan para objetos físicos: las portadas del ebook (que se ven como libros apoyados) y el recuadro de Mercado Pago.

### Shadow Vocabulary
- **Libro apoyado** (`box-shadow: 0 40px 70px -30px color-mix(in srgb, #4b2a8a 60%, transparent)`): portada del hero.
- **Miniatura** (`box-shadow: 0 16px 30px -18px rgba(0,0,0,.45)`): portadas en "Qué incluye" y en la pila del precio.

### Named Rules
**The Plano Por Defecto Rule.** Si no es un objeto (un libro, un comprobante de pago), no lleva sombra.

## Shapes

Esquinas suavemente redondeadas (10px) en tarjetas, 16px en los bloques de precio y garantía, 6px en portadas y botones totalmente redondeados (píldora). Los círculos aparecen en íconos de confianza, avatares y el sello de garantía. El borde punteado es exclusivo de lo pendiente.

## Components

### Buttons
- **Shape:** píldora (999px).
- **Primary:** fondo violeta hematoxilina, texto claro, tipografía display 700.
- **Hover / Focus:** sube 2px; foco con contorno rosa de 3px.
- **Ghost:** transparente con borde y texto violeta.
- **Mercado Pago:** rectángulo de 8px, ancho completo, celeste Mercado Pago con texto blanco, solo dentro del recuadro de pago.

### Chips
- **Pendiente:** ámbar sobre lavado ámbar, borde punteado, monoespaciada en mayúsculas.
- **Medios de pago:** blancos con borde gris claro, logo de la marca a color.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** superficie blanca.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 1px línea fina; la tarjeta destacada lleva 2px violeta.
- **Internal Padding:** 1.5rem.

### Navigation
Barra superior pegajosa y translúcida con el nombre "LOCAR." (punto en rosa) y un botón chico de compra que se oculta en celular.

### Bloque de compra (signature)
Tarjeta blanca de 34rem con borde violeta de 2px: pila de portadas, precio en display violeta, lista de contenido y, adentro, el recuadro de Mercado Pago. Debajo, la tarjeta de garantía con sello circular y la fila de tres íconos de confianza.

## Do's and Don'ts

### Do:
- **Do** usar el violeta hematoxilina (#4b2a8a) para toda acción principal.
- **Do** resaltar en amarillo una sola frase clave por pantalla.
- **Do** mantener las tarjetas planas, blancas y con borde fino.
- **Do** marcar lo que falta definir en ámbar con borde punteado hasta que se complete.
- **Do** mantener el tema claro en todas las pantallas.

### Don't:
- **Don't** usar los colores de Mercado Pago fuera del recuadro de pago.
- **Don't** usar la portada ni el logo del Robbins.
- **Don't** agregar modo oscuro.
- **Don't** poner sombras en tarjetas de texto.
