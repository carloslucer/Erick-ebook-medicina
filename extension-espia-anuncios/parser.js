// Funciones puras: leen el texto de una tarjeta de la Biblioteca de Anuncios
// y calculan la puntuación. Sin acceso al DOM para poder probarlas aparte.
(function (root) {
  const MESES = {
    // español
    ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
    may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
    sep: 8, sept: 8, septiembre: 8, set: 8, setiembre: 8, oct: 9, octubre: 9,
    nov: 10, noviembre: 10, dic: 11, diciembre: 11,
    // inglés
    jan: 0, january: 0, february: 1, march: 2, apr: 3, april: 3, june: 5,
    july: 6, aug: 7, august: 7, september: 8, october: 9, november: 10,
    dec: 11, december: 11,
    // portugués
    fev: 1, fevereiro: 1, "março": 2, marco: 2, mai: 4, maio: 4, junho: 5,
    julho: 6, out: 9, outubro: 9, novembro: 10, dez: 11, dezembro: 11,
  };

  const norm = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\./g, "");

  // Acepta "12 nov 2026", "12 de nov. de 2026", "Nov 12, 2026", "12/11/2026".
  function parseFecha(txt) {
    if (!txt) return null;
    const t = norm(txt.trim());
    let m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = t.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})/);
    if (m && norm(m[2]) in MESES) return new Date(+m[3], MESES[norm(m[2])], +m[1]);
    m = t.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m && norm(m[1]) in MESES) return new Date(+m[3], MESES[norm(m[1])], +m[2]);
    return null;
  }

  const DIA = 86400000;

  const PALABRAS_DIGITAL = [
    "ebook", "e-book", "libro digital", "pdf", "guia", "guía", "curso", "clase",
    "masterclass", "taller", "plantilla", "template", "metodo", "método",
    "descarga", "descargar", "acceso inmediato", "acceso de por vida",
    "recetario", "manual", "mentoria", "mentoría", "programa", "desafio", "desafío",
    "planner", "checklist", "workbook", "bonus", "bono", "garantia", "garantía",
  ];
  const PLATAFORMAS = [
    "hotmart", "kiwify", "eduzz", "monetizze", "braip", "perfectpay",
    "ticto", "kirvano", "cakto", "lastlink", "greenn", "payhip", "gumroad",
    "teachable", "thinkific", "kajabi", "systeme", "mercadopago", "mpago",
    "stripe", "clickbank", "digistore",
  ];

  function detectarDigital(texto, dominio) {
    const t = norm(texto + " " + (dominio || ""));
    const palabras = PALABRAS_DIGITAL.filter((p) => t.includes(norm(p)));
    const plataformas = PLATAFORMAS.filter((p) => t.includes(p));
    return { palabras: [...new Set(palabras.map(norm))], plataformas };
  }

  // Extrae los datos de la tarjeta a partir de su texto visible.
  function extraerDeTexto(texto, hoy = new Date()) {
    const out = {
      id: null, activo: null, inicio: null, fin: null, dias: null, variaciones: 1,
    };
    let m = texto.match(/(?:ID de la biblioteca|Library ID|ID da biblioteca)\s*:?\s*(\d{6,})/i);
    if (m) out.id = m[1];

    if (/\bInactiv[oa]\b|\bInactive\b/i.test(texto)) out.activo = false;
    else if (/\bActiv[oa]\b|\bActive\b/i.test(texto)) out.activo = true;

    // Anuncio activo: "Comenzó a circular el 12 nov 2026"
    m = texto.match(
      /(?:Comenz[oó] a circular el|Started running on|Come[cç]ou a ser veiculado em|En circulaci[oó]n desde el)\s+([^\n·]+?\d{4})/i
    );
    if (m) out.inicio = parseFecha(m[1]);

    // Anuncio inactivo: "12 nov 2026 - 20 nov 2026"
    if (!out.inicio) {
      m = texto.match(/(\d{1,2}\s+(?:de\s+)?[A-Za-zçé.]+\s+(?:de\s+)?\d{4}|[A-Za-z]+\.?\s+\d{1,2},\s+\d{4})\s*[-–]\s*(\d{1,2}\s+(?:de\s+)?[A-Za-zçé.]+\s+(?:de\s+)?\d{4}|[A-Za-z]+\.?\s+\d{1,2},\s+\d{4})/);
      if (m) {
        out.inicio = parseFecha(m[1]);
        out.fin = parseFecha(m[2]);
      }
    }
    if (out.inicio) {
      const hasta = out.fin || hoy;
      out.dias = Math.max(0, Math.round((hasta - out.inicio) / DIA));
    }

    // "3 anuncios usan este contenido y texto" / "3 ads use this creative and text"
    m = texto.match(/(\d+)\s+(?:anuncios usan|ads use|an[uú]ncios usam)/i);
    if (m) out.variaciones = +m[1];
    return out;
  }

  // Puntuación 0–100. Lo que más pesa: tiempo activo (si alguien paga un anuncio
  // durante semanas es porque le vende) y cantidad de variaciones (está escalando).
  function puntuar(ad) {
    let p = 0;
    const d = ad.dias ?? 0;
    if (d >= 60) p += 45;
    else if (d >= 30) p += 38;
    else if (d >= 14) p += 28;
    else if (d >= 7) p += 16;
    else if (d >= 3) p += 6;

    const v = ad.variaciones || 1;
    if (v >= 20) p += 25;
    else if (v >= 10) p += 20;
    else if (v >= 5) p += 14;
    else if (v >= 2) p += 7;

    const delAnunciante = ad.anunciosDelAnunciante || 1;
    if (delAnunciante >= 10) p += 15;
    else if (delAnunciante >= 5) p += 10;
    else if (delAnunciante >= 3) p += 5;

    if (ad.plataformas?.length) p += 10;
    else if (ad.palabras?.length) p += 5;

    if (ad.activo !== false) p += 5;
    else p = Math.round(p * 0.6); // inactivo: sirve como referencia, no como ganador actual

    return Math.min(100, p);
  }

  function nivel(p) {
    if (p >= 70) return { clave: "ganador", etiqueta: "🔥 Ganador" };
    if (p >= 45) return { clave: "prometedor", etiqueta: "📈 Prometedor" };
    if (p >= 25) return { clave: "testeo", etiqueta: "🧪 En testeo" };
    return { clave: "frio", etiqueta: "❄️ Frío" };
  }

  function dominioDeUrl(href) {
    try {
      let u = new URL(href);
      if (/l\.facebook\.com$/.test(u.hostname) && u.searchParams.get("u")) {
        u = new URL(u.searchParams.get("u"));
      }
      if (/facebook\.com$|fb\.me$|instagram\.com$/.test(u.hostname)) return null;
      return { dominio: u.hostname.replace(/^www\./, ""), url: u.href };
    } catch {
      return null;
    }
  }

  root.EA = { parseFecha, extraerDeTexto, puntuar, nivel, detectarDigital, dominioDeUrl, norm };
})(typeof window !== "undefined" ? window : globalThis);
