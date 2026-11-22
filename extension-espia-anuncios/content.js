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

  // ---------- Detección de tarjetas (incremental y en tandas) ----------
  // Para que la página no se trabe:
  //  1. Solo se revisa lo que Facebook agrega (no toda la página cada vez).
  //  2. Para ubicar las tarjetas se usa textContent y marcas en el DOM, que no
  //     obligan al navegador a recalcular el diseño (innerText sí).
  //  3. Las tarjetas se leen en tandas de 15 y entre tanda y tanda se le
  //     devuelve el control al navegador; las insignias se escriben todas
  //     juntas al final, así no se alterna lectura/escritura (layout thrashing).
  //  4. Una insignia solo se reescribe si cambió su contenido.
  const TANDA = 15;
  const NO_TEXTO = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|TEMPLATE)$/;
  let leidas = new WeakMap();        // tarjeta -> ID leído (Facebook reutiliza tarjetas al cambiar de búsqueda)
  const pendientes = new Set();      // subárboles nuevos a revisar
  let reintentar = [];               // rótulos cuya tarjeta todavía no se pudo delimitar
  let profundidad = null;            // niveles entre el rótulo del ID y la tarjeta (se aprende)
  const muestrasProf = [];
  let trabajando = false;
  const pausa = () => new Promise((r) => setTimeout(r, 0));

  function idDeTexto(t) {
    if (!t || t.length > 200) return null;
    const m = t.match(RE_ID);
    return m ? m[1] || m[2] : null;
  }

  // Marca con data-ea-idn los elementos "rótulo: número" dentro de root.
  function marcarRotulos(root) {
    const res = [];
    if (root.nodeType === 3) root = root.parentElement;
    if (!root || root.closest?.("#ea-panel, .ea-badge")) return res;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        /\d{10,}/.test(n.nodeValue) && !NO_TEXTO.test(n.parentElement?.tagName)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    while (w.nextNode()) {
      let el = w.currentNode.parentElement;
      for (let i = 0; el && i < 3 && !idDeTexto(el.textContent); i++) el = el.parentElement;
      const id = el && idDeTexto(el.textContent);
      if (!id || el.closest("#ea-panel")) continue;
      if (el.getAttribute("data-ea-idn") !== id) el.setAttribute("data-ea-idn", id);
      res.push(el);
    }
    return res;
  }

  const rotulosEn = (el) => el.querySelectorAll("[data-ea-idn]").length;

  // La tarjeta es el contenedor más grande que tiene un solo rótulo de ID.
  function tarjetaDesde(rotulo) {
    if (profundidad != null) {
      let el = rotulo;
      for (let i = 0; i < profundidad && el.parentElement; i++) el = el.parentElement;
      if (rotulosEn(el) === 1) return el;
    }
    let el = rotulo, niveles = 0;
    while (true) {
      const p = el.parentElement;
      if (!p || p === document.body || p === document.documentElement) return null; // está sola: esperar a que carguen más
      if (rotulosEn(p) > 1) break;
      el = p;
      niveles++;
    }
    muestrasProf.push(niveles);
    if (muestrasProf.length >= 4) {
      const ult = muestrasProf.slice(-4);
      if (ult.every((n) => n === ult[0])) profundidad = ult[0];
    }
    return el;
  }

  function leerTarjeta(card) {
    const texto = card.innerText || "";
    const datos = extraerDeTexto(texto);
    if (!datos.id) return null;

    // Anunciante: primer enlace con texto a una página de Facebook.
    let anunciante = "";
    for (const a of card.querySelectorAll('a[href*="facebook.com/"]')) {
      const t = a.textContent.trim();
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

    // Copy: el texto después de "Patrocinado".
    let copy = texto;
    const i = copy.search(/\n(Patrocinado|Sponsored|Publicidad)\n/);
    if (i >= 0) copy = copy.slice(i).replace(/^\n\w+\n/, "");
    copy = copy.replace(/\s+/g, " ").trim().slice(0, 400);

    const img = card.querySelector('img[src*="scontent"], video[poster]');
    return {
      ...datos,
      anunciante,
      destino: destino?.dominio || "",
      url: destino?.url || "",
      copy,
      miniatura: img ? img.src || img.poster : "",
      tieneVideo: !!card.querySelector("video"),
      ...detectarDigital(copy, destino?.dominio),
      inicio: datos.inicio ? datos.inicio.toISOString().slice(0, 10) : "",
      fin: datos.fin ? datos.fin.toISOString().slice(0, 10) : "",
      linkBiblioteca: `https://www.facebook.com/ads/library/?id=${datos.id}`,
    };
  }

  function encolar(nodo) {
    pendientes.add(nodo);
    if (trabajando) return;
    trabajando = true;
    setTimeout(procesar, 300);
  }

  function escanear() {
    leidas = new WeakMap();
    encolar(document.body);
  }

  async function procesar() {
    try {
      while (pendientes.size || reintentar.length) {
        // 1. Marcar rótulos de lo nuevo (barato: no fuerza diseño).
        const roots = [...pendientes];
        pendientes.clear();
        let rotulos = reintentar;
        reintentar = [];
        for (const r of roots) if (r.isConnected) rotulos.push(...marcarRotulos(r));
        rotulos = [...new Set(rotulos)].filter((r) => r.isConnected);
        if (!rotulos.length) break;

        // 2. Delimitar tarjetas.
        const cards = [];
        for (const r of rotulos) {
          const c = tarjetaDesde(r);
          if (!c) { if (rotulos.length === 1) reintentar.push(r); continue; }
          const id = r.getAttribute("data-ea-idn");
          if (leidas.get(c) !== id) { leidas.set(c, id); cards.push(c); }
        }
        if (reintentar.length === rotulos.length) { break; }

        // 3. Leer en tandas, cediendo el control entre tandas.
        for (let i = 0; i < cards.length; i += TANDA) {
          for (const card of cards.slice(i, i + TANDA)) {
            const ad = leerTarjeta(card);
            if (!ad || ignorados.has(ad.id)) continue;
            ad._card = card;
            const prev = anuncios.get(ad.id);
            anuncios.set(ad.id, { ...(prev || {}), ...ad, _firma: prev?._card === card ? prev._firma : "" });
          }
          await pausa();
        }
        recalcular();
        await pausa();
      }
    } finally {
      trabajando = false;
      if (pendientes.size) encolar([...pendientes][0]);
    }
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
    }
    requestAnimationFrame(() => {
      for (const ad of anuncios.values()) ponerInsignia(ad);
      pintarLista();
    });
  }

  // ---------- Insignia sobre cada tarjeta ----------
  function ponerInsignia(ad) {
    const card = ad._card;
    if (!card || !card.isConnected) return;
    const visible = pasaFiltros(ad);
    if (card.classList.contains("ea-oculto") === visible) card.classList.toggle("ea-oculto", !visible);
    const html = `
      <span class="ea-score">${ad.puntaje}</span>
      <span class="ea-tag">${ad.nivel.etiqueta}</span>
      <span class="ea-meta">${ad.dias ?? "?"} días · ${ad.variaciones} var.</span>
      ${ad.plataformas.length ? `<span class="ea-plat">${esc(ad.plataformas[0])}</span>` : ""}
      <button class="ea-star" title="Guardar para modelar">${guardados[ad.id] ? "★" : "☆"}</button>`;
    let b = card.querySelector(":scope > .ea-badge");
    if (b && ad._firma === html) return; // nada cambió
    if (!b) {
      b = document.createElement("div");
      b.dataset.id = ad.id;
      card.prepend(b);
    }
    card.classList.remove("ea-ganador", "ea-prometedor", "ea-testeo", "ea-frio");
    card.classList.add("ea-" + ad.nivel.clave);
    b.className = "ea-badge ea-" + ad.nivel.clave;
    b.innerHTML = html;
    ad._firma = html;
  }

  // Un solo listener para todas las estrellas de las insignias.
  document.addEventListener("click", (e) => {
    const star = e.target.closest?.(".ea-badge .ea-star");
    if (!star) return;
    e.stopPropagation();
    e.preventDefault();
    alternarGuardado(star.closest(".ea-badge").dataset.id);
  }, true);

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

  // ---------- Panel arrastrable ----------
  // Se arrastra desde la barra verde. La posición se guarda; doble clic en la
  // barra lo devuelve a su lugar original.
  const cabeza = panel.querySelector(".ea-head");
  cabeza.title = "Arrastrá para mover · doble clic para volver a su lugar";

  function ubicar(x, y) {
    const w = panel.offsetWidth, h = cabeza.offsetHeight;
    x = Math.min(Math.max(0, x), window.innerWidth - Math.min(w, 80));
    y = Math.min(Math.max(0, y), window.innerHeight - h);
    panel.style.left = x + "px";
    panel.style.top = y + "px";
    panel.style.right = "auto";
    return { x, y };
  }

  cabeza.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button")) return;
    e.preventDefault();
    const r = panel.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    cabeza.setPointerCapture(e.pointerId);
    panel.classList.add("ea-arrastrando");
    let pos = null;
    const mover = (ev) => (pos = ubicar(ev.clientX - dx, ev.clientY - dy));
    const soltar = () => {
      cabeza.removeEventListener("pointermove", mover);
      cabeza.removeEventListener("pointerup", soltar);
      cabeza.removeEventListener("pointercancel", soltar);
      panel.classList.remove("ea-arrastrando");
      if (pos) chrome.storage.local.set({ posPanel: pos });
    };
    cabeza.addEventListener("pointermove", mover);
    cabeza.addEventListener("pointerup", soltar);
    cabeza.addEventListener("pointercancel", soltar);
  });

  cabeza.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    panel.style.left = panel.style.top = panel.style.right = "";
    chrome.storage.local.remove("posPanel");
  });

  // Si se achica la ventana, que el panel no quede afuera.
  window.addEventListener("resize", () => {
    if (panel.style.left) ubicar(parseFloat(panel.style.left), parseFloat(panel.style.top));
  });
  panel.querySelectorAll("[data-f]").forEach((el) => {
    el.addEventListener("input", () => {
      const k = el.dataset.f;
      filtros[k] = el.type === "checkbox" ? el.checked : el.type === "number" ? +el.value || 0 : el.value;
      chrome.storage.local.set({ filtros });
      requestAnimationFrame(() => {
        for (const ad of anuncios.values()) ponerInsignia(ad);
        pintarLista();
      });
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
    leidas = new WeakMap();
    reintentar = [];
    pintarLista();
  }
  panel.querySelector('[data-a="diag"]').onclick = async (e) => {
    const texto = [
      "URL: " + location.href,
      "Detectados: " + anuncios.size,
      "Rótulos de ID: " + document.querySelectorAll("[data-ea-idn]").length + " · profundidad: " + profundidad,
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
  // Solo se encolan los nodos agregados, no se vuelve a recorrer toda la página.
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") {
        // Texto cambiado en el lugar (tarjeta reutilizada): solo interesa si es un ID.
        if (/\d{10,}/.test(m.target.nodeValue) && !m.target.parentElement?.closest("#ea-panel, .ea-badge")) encolar(m.target);
        continue;
      }
      if (m.target.closest?.("#ea-panel, .ea-badge")) continue;
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.id === "ea-panel" || n.classList?.contains("ea-badge"))) continue;
        if (n.nodeType === 1 || n.nodeType === 3) encolar(n);
      }
    }
  }).observe(document.body, { childList: true, characterData: true, subtree: true });

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
  chrome.storage.local.get(["guardados", "filtros", "posPanel"], (r) => {
    guardados = r.guardados || {};
    if (r.posPanel) ubicar(r.posPanel.x, r.posPanel.y);
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
