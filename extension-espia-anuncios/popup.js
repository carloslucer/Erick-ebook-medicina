const RAPIDAS = [
  "ebook", "guía pdf", "hotmart", "kiwify", "curso online", "método",
  "acceso inmediato", "recetario", "plantillas", "descarga inmediata",
];

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function urlBiblioteca(q, pais, estado) {
  const p = new URLSearchParams({
    active_status: estado, ad_type: "all", country: pais, q,
    search_type: "keyword_unordered", media_type: "all",
  });
  return "https://www.facebook.com/ads/library/?" + p;
}

function abrir(q) {
  chrome.storage.local.set({ ultimaBusqueda: { pais: $("#pais").value, estado: $("#estado").value } });
  chrome.tabs.create({ url: urlBiblioteca(q, $("#pais").value, $("#estado").value) });
}

$("#buscar").addEventListener("submit", (e) => { e.preventDefault(); abrir($("#q").value.trim()); });
$("#chips").innerHTML = RAPIDAS.map((r) => `<button type="button">${esc(r)}</button>`).join("");
$("#chips").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") abrir(e.target.textContent); });

let guardados = {};

function pintar() {
  const lista = Object.values(guardados).sort((a, b) => b.puntaje - a.puntaje);
  $("#n").textContent = lista.length;
  $("#lista").innerHTML = lista.map((a) => `
    <li data-id="${a.id}">
      <div class="top"><span class="score">${a.puntaje}</span><b>${esc(a.anunciante || "Sin nombre")}</b><button class="x" title="Quitar">✕</button></div>
      <small>${a.dias ?? "?"} días · ${a.variaciones} var. · ${esc(a.destino || "sin enlace")}</small>
      <textarea placeholder="Notas: ángulo, promesa, precio, qué modelar…">${esc(a.nota)}</textarea>
      <a href="${esc(a.linkBiblioteca)}" target="_blank">Ver anuncio</a>
      ${a.url ? `<a href="${esc(a.url)}" target="_blank">Ver página de venta</a>` : ""}
    </li>`).join("") || `<li class="vacio">Tocá ☆ en un anuncio de la Biblioteca para guardarlo acá.</li>`;
}

$("#lista").addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li && e.target.classList.contains("x")) {
    delete guardados[li.dataset.id];
    chrome.storage.local.set({ guardados });
    pintar();
  }
});
$("#lista").addEventListener("change", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li && e.target.tagName === "TEXTAREA") {
    guardados[li.dataset.id].nota = e.target.value;
    chrome.storage.local.set({ guardados });
  }
});

$("#borrar").onclick = () => {
  if (confirm("¿Borrar todos los anuncios guardados?")) {
    guardados = {};
    chrome.storage.local.set({ guardados });
    pintar();
  }
};

$("#csv").onclick = () => {
  const cols = ["puntaje", "anunciante", "dias", "variaciones", "activo", "inicio", "destino", "url",
    "plataformas", "copy", "nota", "linkBiblioteca", "guardadoEl"];
  const filas = [cols.join(",")].concat(Object.values(guardados).map((a) =>
    cols.map((c) => `"${String(Array.isArray(a[c]) ? a[c].join(" ") : a[c] ?? "").replace(/"/g, '""')}"`).join(",")));
  const url = URL.createObjectURL(new Blob(["﻿" + filas.join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `ganadores-guardados-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

chrome.storage.local.get(["guardados", "ultimaBusqueda"], (r) => {
  guardados = r.guardados || {};
  if (r.ultimaBusqueda) {
    $("#pais").value = r.ultimaBusqueda.pais;
    $("#estado").value = r.ultimaBusqueda.estado;
  }
  pintar();
});
