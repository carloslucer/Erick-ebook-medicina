// Se ejecuta dentro de facebook.com/ads/library: detecta cada tarjeta de anuncio,
// le pone una insignia con su puntuación y muestra un panel con el ranking.
(function () {
  if (window.__espiaAnuncios) return;
  window.__espiaAnuncios = true;
  const { extraerDeTexto, puntuar, nivel, detectarDigital, dominioDeUrl, RE_ID, RE_ID_G } = window.EA;
  const anuncios = new Map(); // id -> datos
  let guardados = {};
  let filtros = { minDias: 0, minVar: 1, soloDigital: false, soloActivos: false, orden: "puntaje" };
  let autoScroll = null;
  // IDs que estaban en pantalla al tocar "Limpiar": no se vuelven a contar
  // aunque Facebook todavía no los haya sacado de la página.
  let ignorados = new Set();

  // ---------- Detección de tarjetas ----------
  function contarIds(el) {
    const m = (el.innerText || "").match(RE_ID_G);
    return m ? m.length : 0;
  }

  // Desde el texto "ID de la biblioteca" sube hasta el contenedor más grande
  // que todavía tenga un solo anuncio: esa es la tarjeta.
  function tarjetaDesde(nodo) {
    let el = nodo;
    while (el.parentElement && el.parentElement !== document.body && el.parentElement !== document.documentElement && contarIds(el.parentElement) === 1) {
      el = el.parentElement;
    }
    return el;
  }

  function nodosConId() {
    const res = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        /\d{10,}/.test(n.nodeValue) && !/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|TEMPLATE)$/.test(n.parentElement?.tagName)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    const corto = (el) => (el.innerText || "").length < 200 && RE_ID.test(el.innerText || "");
    while (w.nextNode()) {
      // El rótulo y el número pueden estar en elementos distintos: se sube
      // hasta 3 niveles buscando un texto corto del tipo "rótulo: número".
      let el = w.currentNode.parentElement;
      for (let i = 0; el && i < 3 && !corto(el); i++) el = el.parentElement;
      if (el && corto(el) && !el.closest("#ea-panel")) res.push(el);
    }
    return res;
  }

  function leerTarjeta(card) {
    const texto = card.innerText || "";
    const datos = extraerDeTexto(texto);
    if (!datos.id) return null;

    // Anunciante: primer enlace con texto a una página de Facebook.
    let anunciante = "";
    for (const a of card.querySelectorAll('a[href*="facebook.com/"]')) {
      const t = a.innerText.trim();
      if (t && t.length < 80 && !/ver detalles|see ad details|ver resumen|see summary/i.test(t)) {
        anunciante = t;
        break;
      }
    }

    // Destino: enlaces salientes (l.facebook.com/l.php?u=...)
    let destino = null;
    for (const a of card.querySelectorAll("a[href]")) {
      const d = dominioDeUrl(a.href);
      if (d) { destino = d; break; }
    }

    // Copy: el texto entre "Patrocinado" y el bloque del enlace.
    let copy = texto;
    const i = copy.search(/\n(Patrocinado|Sponsored|Patrocinado)\n/);
    if (i >= 0) copy = copy.slice(i).replace(/^\n\w+\n/, "");
    copy = copy.replace(/\s+/g, " ").trim().slice(0, 400);

    const img = card.querySelector('img[src*="scontent"], video[poster]');
    const miniatura = img ? img.src || img.poster : "";
    const tieneVideo = !!card.querySelector("video");

    return {
      ...datos,
      anunciante,
      destino: destino?.dominio || "",
      url: destino?.url || "",
      copy,
      miniatura,
      tieneVideo,
      ...detectarDigital(copy, destino?.dominio),
      inicio: datos.inicio ? datos.inicio.toISOString().slice(0, 10) : "",
      fin: datos.fin ? datos.fin.toISOString().slice(0, 10) : "",
      linkBiblioteca: `https://www.facebook.com/ads/library/?id=${datos.id}`,
    };
  }

  function escanear() {
    const vistas = new Set();
    for (const nodo of nodosConId()) {
      const card = tarjetaDesde(nodo);
      if (vistas.has(card)) continue;
      vistas.add(card);
      const ad = leerTarjeta(card);
      if (!ad || ignorados.has(ad.id)) continue;
      ad._card = card;
      anuncios.set(ad.id, { ...(anuncios.get(ad.id) || {}), ...ad });
    }
    recalcular();
  }

  function recalcular() {
    // Cuántos anuncios tiene cada anunciante en lo que se cargó: si un mismo
    // vendedor tiene muchos anuncios, está invirtiendo fuerte en ese producto.
    const porAnunciante = {};
    for (const ad of anuncios.values()) {
      if (ad.anunciante) porAnunciante[ad.anunciante] = (porAnunciante[ad.anunciante] || 0) + ad.variaciones;
    }
    for (const ad of anuncios.values()) {
      ad.anunciosDelAnunciante = porAnunciante[ad.anunciante] || 1;
      ad.puntaje = puntuar(ad);
      ad.nivel = nivel(ad.puntaje);
      ponerInsignia(ad);
    }
    pintarLista();
  }

  // ---------- Insignia sobre cada tarjeta ----------
  function ponerInsignia(ad) {
    const card = ad._card;
    if (!card || !card.isConnected) return;
    let b = card.querySelector(":scope > .ea-badge");
    if (!b) {
      b = document.createElement("div");
      b.className = "ea-badge";
      if (getComputedStyle(card).position === "static") card.style.position = "relative";
      card.prepend(b);
      b.addEventListener("click", (e) => {
        if (e.target.closest(".ea-star")) {
          e.stopPropagation();
          alternarGuardado(ad.id);
        }
      });
    }
    card.classList.toggle("ea-oculto", !pasaFiltros(ad));
    card.classList.remove("ea-ganador", "ea-prometedor", "ea-testeo", "ea-frio");
    card.classList.add("ea-" + ad.nivel.clave);
    b.className = "ea-badge ea-" + ad.nivel.clave;
    b.innerHTML = `
      <span class="ea-score">${ad.puntaje}</span>
      <span class="ea-tag">${ad.nivel.etiqueta}</span>
      <span class="ea-meta">${ad.dias ?? "?"} días · ${ad.variaciones} var.</span>
      ${ad.plataformas.length ? `<span class="ea-plat">${esc(ad.plataformas[0])}</span>` : ""}
      <button class="ea-star" title="Guardar para modelar">${guardados[ad.id] ? "★" : "☆"}</button>`;
  }

  function pasaFiltros(ad) {
    if ((ad.dias ?? 0) < filtros.minDias) return false;
    if (ad.variaciones < filtros.minVar) return false;
    if (filtros.soloDigital && !ad.palabras.length && !ad.plataformas.length) return false;
    if (filtros.soloActivos && ad.activo === false) return false;
    return true;
  }

  // ---------- Guardados ----------
  function alternarGuardado(id) {
    const ad = anuncios.get(id);
    if (guardados[id]) delete guardados[id];
    else if (ad) {
      const { _card, nivel: _n, ...limpio } = ad;
      guardados[id] = { ...limpio, guardadoEl: new Date().toISOString().slice(0, 10), nota: "" };
    }
    chrome.storage.local.set({ guardados });
    if (ad) ponerInsignia(ad);
    pintarLista();
  }

  // ---------- Panel ----------
  const panel = document.createElement("div");
  panel.id = "ea-panel";
  panel.innerHTML = `
    <div class="ea-head">
      <strong>🔎 Espía de Anuncios</strong>
      <button class="ea-min" title="Minimizar">–</button>
    </div>
    <div class="ea-body">
      <div class="ea-stats"></div>
      <div class="ea-filtros">
        <label>Mín. días activo <input type="number" min="0" data-f="minDias"></label>
        <label>Mín. variaciones <input type="number" min="1" data-f="minVar"></label>
        <label><input type="checkbox" data-f="soloDigital"> Solo productos digitales</label>
        <label><input type="checkbox" data-f="soloActivos"> Solo activos</label>
        <label>Ordenar por
          <select data-f="orden">
            <option value="puntaje">Puntaje</option>
            <option value="dias">Días activo</option>
            <option value="variaciones">Variaciones</option>
            <option value="anunciante">Anuncios del anunciante</option>
          </select>
        </label>
      </div>
      <div class="ea-acciones">
        <button data-a="scroll">▶ Cargar más (auto‑scroll)</button>
        <button data-a="csv">⬇ Exportar CSV</button>
        <button data-a="rescan">↻ Re‑escanear</button>
        <button data-a="limpiar" title="Borra los resultados para empezar una búsqueda nueva">🗑 Limpiar</button>
        <button data-a="diag" title="Copia el texto de la página para enviarlo y ajustar la detección">🩺 Copiar diagnóstico</button>
      </div>
      <ol class="ea-lista"></ol>
    </div>`;
  document.documentElement.appendChild(panel);

  panel.querySelector(".ea-min").onclick = () => panel.classList.toggle("ea-cerrado");
  panel.querySelectorAll("[data-f]").forEach((el) => {
    el.addEventListener("input", () => {
      const k = el.dataset.f;
      filtros[k] = el.type === "checkbox" ? el.checked : el.type === "number" ? +el.value || 0 : el.value;
      chrome.storage.local.set({ filtros });
      for (const ad of anuncios.values()) ponerInsignia(ad);
      pintarLista();
    });
  });
  panel.querySelector('[data-a="csv"]').onclick = () =>
    descargarCSV([...anuncios.values()].filter(pasaFiltros).sort(comparar), "anuncios-biblioteca");
  panel.querySelector('[data-a="rescan"]').onclick = () => {
    ignorados.clear();
    escanear();
  };
  panel.querySelector('[data-a="limpiar"]').onclick = () => limpiar(true);

  // Borra resultados, insignias y marcas de la página. Los guardados (☆) no se tocan.
  function limpiar(ignorarVisibles) {
    if (autoScroll) panel.querySelector('[data-a="scroll"]').click();
    ignorados = new Set(ignorarVisibles ? anuncios.keys() : []);
    for (const ad of anuncios.values()) {
      const c = ad._card;
      if (!c) continue;
      c.querySelector(":scope > .ea-badge")?.remove();
      c.classList.remove("ea-oculto", "ea-ganador", "ea-prometedor", "ea-testeo", "ea-frio", "ea-flash");
    }
    anuncios.clear();
    pintarLista();
  }
  panel.querySelector('[data-a="diag"]').onclick = async (e) => {
    const texto = [
      "URL: " + location.href,
      "Detectados: " + anuncios.size,
      "Nodos con ID: " + nodosConId().length,
      "---",
      (document.querySelector('[role="main"]') || document.body).innerText.slice(0, 4000),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      e.target.textContent = "✔ Copiado: pegalo en el chat";
    } catch {
      console.log(texto);
      e.target.textContent = "No se pudo copiar (ver consola F12)";
    }
    setTimeout(() => (e.target.textContent = "🩺 Copiar diagnóstico"), 3000);
  };
  panel.querySelector('[data-a="scroll"]').onclick = (e) => {
    if (autoScroll) {
      clearInterval(autoScroll);
      autoScroll = null;
      e.target.textContent = "▶ Cargar más (auto‑scroll)";
      return;
    }
    e.target.textContent = "⏸ Detener auto‑scroll";
    let quietas = 0, alto = 0;
    autoScroll = setInterval(() => {
      window.scrollTo(0, document.body.scrollHeight);
      if (document.body.scrollHeight === alto) quietas++;
      else { quietas = 0; alto = document.body.scrollHeight; }
      if (quietas > 6 || anuncios.size > 1500) e.target.click();
    }, 1800);
  };

  function pintarFiltros() {
    panel.querySelectorAll("[data-f]").forEach((el) => {
      const v = filtros[el.dataset.f];
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v;
    });
  }

  function comparar(a, b) {
    const k = filtros.orden;
    if (k === "dias") return (b.dias ?? 0) - (a.dias ?? 0);
    if (k === "variaciones") return b.variaciones - a.variaciones;
    if (k === "anunciante") return b.anunciosDelAnunciante - a.anunciosDelAnunciante;
    return b.puntaje - a.puntaje;
  }

  function pintarLista() {
    const todos = [...anuncios.values()];
    const visibles = todos.filter(pasaFiltros).sort(comparar);
    const ganadores = todos.filter((a) => a.nivel?.clave === "ganador").length;
    const digitales = todos.filter((a) => a.palabras.length || a.plataformas.length).length;
    panel.querySelector(".ea-stats").innerHTML = `
      <div><b>${todos.length}</b><span>analizados</span></div>
      <div><b>${ganadores}</b><span>ganadores</span></div>
      <div><b>${digitales}</b><span>digitales</span></div>
      <div><b>${Object.keys(guardados).length}</b><span>guardados</span></div>`;

    panel.querySelector(".ea-lista").innerHTML = visibles.slice(0, 40).map((ad) => `
      <li data-id="${ad.id}" class="ea-${ad.nivel.clave}">
        <span class="ea-score">${ad.puntaje}</span>
        <div class="ea-info">
          <b>${esc(ad.anunciante || "Sin nombre")}</b>
          <small>${ad.dias ?? "?"} días · ${ad.variaciones} var. · ${ad.anunciosDelAnunciante} del anunciante${ad.destino ? " · " + esc(ad.destino) : ""}</small>
          <p>${esc(ad.copy.slice(0, 110))}…</p>
        </div>
        <button class="ea-star">${guardados[ad.id] ? "★" : "☆"}</button>
      </li>`).join("") || `<li class="ea-vacio">Hacé una búsqueda (ej. “ebook”, “guía pdf”, “hotmart”) y bajá para cargar anuncios.</li>`;
  }

  panel.querySelector(".ea-lista").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;
    const ad = anuncios.get(li.dataset.id);
    if (e.target.closest(".ea-star")) return alternarGuardado(li.dataset.id);
    if (ad?._card?.isConnected) {
      ad._card.scrollIntoView({ behavior: "smooth", block: "center" });
      ad._card.classList.add("ea-flash");
      setTimeout(() => ad._card.classList.remove("ea-flash"), 1600);
    } else if (ad) window.open(ad.linkBiblioteca, "_blank");
  });

  // ---------- Observador: Facebook carga anuncios al hacer scroll ----------
  let t = null;
  new MutationObserver((muts) => {
    if (muts.every((m) => m.target.closest?.("#ea-panel, .ea-badge"))) return;
    clearTimeout(t);
    t = setTimeout(escanear, 700);
  }).observe(document.body, { childList: true, subtree: true });

  // Al cambiar de búsqueda (SPA) se limpia lo anterior.
  let ultimaUrl = location.href;
  setInterval(() => {
    if (location.href !== ultimaUrl) {
      ultimaUrl = location.href;
      limpiar(false);
      setTimeout(escanear, 1200);
    }
  }, 1000);

  // ---------- utilidades ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function descargarCSV(lista, nombre) {
    const cols = ["puntaje", "anunciante", "dias", "variaciones", "anunciosDelAnunciante", "activo",
      "inicio", "fin", "destino", "url", "plataformas", "palabras", "tieneVideo", "copy", "linkBiblioteca"];
    const filas = [cols.join(",")].concat(lista.map((a) =>
      cols.map((c) => {
        let v = a[c];
        if (Array.isArray(v)) v = v.join(" ");
        return `"${String(v ?? "").replace(/"/g, '""')}"`;
      }).join(",")));
    const blob = new Blob(["﻿" + filas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Arranque: se carga lo guardado y se hace el primer escaneo.
  chrome.storage.local.get(["guardados", "filtros"], (r) => {
    guardados = r.guardados || {};
    filtros = { ...filtros, ...(r.filtros || {}) };
    pintarFiltros();
    escanear();
  });

  chrome.storage.onChanged.addListener((c) => {
    if (c.guardados) {
      guardados = c.guardados.newValue || {};
      for (const ad of anuncios.values()) ponerInsignia(ad);
      pintarLista();
    }
  });
})();
