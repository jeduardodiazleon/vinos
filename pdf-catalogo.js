/* ============================================================
   Genera el catálogo en PDF (A4) con el estilo de la carta,
   a partir de los productos actuales del Excel.
   crearPDFCatalogo(secciones, config, { url }) -> Promise
   ============================================================ */
(function () {
  "use strict";

  const COL = {
    fondo: [11, 11, 13], tarjeta: [18, 18, 21], oro: [224, 184, 102], oroClaro: [243, 217, 153],
    oroOsc: [168, 129, 61], texto: [236, 230, 218], suave: [154, 146, 133],
    granate: [92, 26, 43], granateFin: [23, 18, 26]
  };
  const A4 = { w: 210, h: 297 };
  const M = 14;                 // margen lateral
  const TOPE = 31;              // inicio del contenido en páginas interiores
  const FONDO_UTIL = 273;       // límite inferior del contenido
  const GAP = 5;                // separación entre tarjetas

  // Convierte una imagen (webp/png) a PNG con transparencia
  function imagenPNG(src) {
    return new Promise((ok, mal) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext("2d").drawImage(im, 0, 0);
        ok({ data: c.toDataURL("image/png"), w: im.naturalWidth, h: im.naturalHeight });
      };
      im.onerror = () => mal(new Error("No se pudo cargar " + src));
      im.src = src;
    });
  }

  async function crearPDFCatalogo(secciones, C, opciones) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const url = opciones.url;
    const numero = String(C.whatsapp || "").replace(/\D/g, "");
    const fecha = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const dinero = (n) => `${C.moneda || "S/"} ${Number.isInteger(n) ? n : n.toFixed(2)}`;
    const mayus = (s) => String(s || "").toLocaleUpperCase("es");

    const [ilus, palabra, lampara] = await Promise.all(["img/ilustracion.webp", "img/aladino.webp", "img/lampara.webp"].map(imagenPNG));

    doc.setProperties({ title: `${C.nombre || "Aladino"} · ${C.temporada || "Catálogo"}`, subject: "Catálogo de precios por unidad", author: C.nombre || "Aladino", creator: url });

    // ---------- utilidades de dibujo ----------
    const color = (fn, c) => doc[fn](c[0], c[1], c[2]);
    const opacidad = (o) => doc.setGState(new doc.GState({ opacity: o, "stroke-opacity": o }));
    function texto(t, x, y, { tam = 10, estilo = "normal", c = COL.texto, esp = 0, alin = "left" } = {}) {
      doc.setFont("times", estilo); doc.setFontSize(tam); color("setTextColor", c);
      const ancho = doc.getTextWidth(t) + esp * Math.max(0, t.length - 1);
      const x0 = alin === "center" ? x - ancho / 2 : alin === "right" ? x - ancho : x;
      doc.text(t, x0, y, { charSpace: esp });
      return { x: x0, ancho };
    }
    function ajustar(t, max, tam, estilo = "normal") {
      doc.setFont("times", estilo); doc.setFontSize(tam);
      if (doc.getTextWidth(t) <= max) return t;
      while (t.length > 1 && doc.getTextWidth(t + "…") > max) t = t.slice(0, -1);
      return t.trim() + "…";
    }
    function estrella(cx, cy, r, c = COL.oro) {
      const p = [];
      for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4; const rr = i % 2 ? r * 0.3 : r; p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
      const rel = p.slice(1).map((q, i) => [q[0] - p[i][0], q[1] - p[i][1]]);
      color("setFillColor", c); doc.lines(rel, p[0][0], p[0][1], [1, 1], "F", true);
    }
    function divisor(cx, y, largo) {
      color("setDrawColor", COL.oro); doc.setLineWidth(0.25);
      doc.line(cx - largo - 3, y, cx - 3, y); doc.line(cx + 3, y, cx + largo + 3, y);
      estrella(cx, y, 1.3);
    }
    function lineasTitulo(t, y, tam = 17, esp = 3.2) {
      const { x, ancho } = texto(t, A4.w / 2, y, { tam, c: COL.oroClaro, esp, alin: "center" });
      color("setDrawColor", COL.oro); doc.setLineWidth(0.3);
      doc.line(M, y - tam * 0.12, x - 6, y - tam * 0.12); doc.line(x + ancho + 6, y - tam * 0.12, A4.w - M, y - tam * 0.12);
    }
    function esquinas(x, y, w, h, r) {     // tapa las esquinas del degradado con el color de fondo
      const k = 0.5523 * r;
      color("setFillColor", COL.fondo);
      doc.lines([[r, 0], [-k, 0, -r, r - k, -r, r]], x, y, [1, 1], "F", true);
      doc.lines([[-r, 0], [k, 0, r, r - k, r, r]], x + w, y, [1, 1], "F", true);
    }
    function fondo() { color("setFillColor", COL.fondo); doc.rect(0, 0, A4.w, A4.h, "F"); }
    function enlace(t, x, y, destino, op = {}) {
      const r = texto(t, x, y, op);
      doc.link(r.x, y - (op.tam || 10) * 0.3, r.ancho, (op.tam || 10) * 0.42, { url: destino });
      return r;
    }

    // ---------- portada ----------
    function marcoCupula(y0, alto) {
      const x = M, w = A4.w - 2 * M, cx = A4.w / 2;
      color("setDrawColor", COL.oro); doc.setLineWidth(0.35);
      doc.roundedRect(x, y0, w, alto, 16, 16, "S");
      opacidad(0.35); doc.setLineWidth(0.25); doc.roundedRect(x + 2.4, y0 + 2.4, w - 4.8, alto - 4.8, 14, 14, "S"); opacidad(1);
      // cúpula
      const curva = [[13, 0, 19, -4, 23, -8], [2.2, -2, 3.6, -4, 5, -6], [1.4, 2, 2.8, 4, 5, 6], [4, 4, 10, 8, 23, 8]];
      color("setFillColor", COL.fondo); doc.lines(curva, cx - 28, y0 + 0.2, [1, 1], "F", true);
      doc.setLineWidth(0.35); color("setDrawColor", COL.oro); doc.lines(curva, cx - 28, y0, [1, 1], "S", false);
      estrella(cx, y0 + 4.5, 1.4);
    }

    function portada() {
      fondo();
      marcoCupula(20, 262);
      const cx = A4.w / 2;
      const wI = 128, hI = wI * ilus.h / ilus.w;
      doc.addImage(ilus.data, "PNG", cx - wI / 2, 34, wI, hI, "ilus", "FAST");
      const wP = 84, hP = wP * palabra.h / palabra.w;
      doc.addImage(palabra.data, "PNG", cx - wP / 2, 34 + hI - 13, wP, hP, "palabra", "FAST");
      let y = 34 + hI - 13 + hP + 13;
      texto(mayus(C.temporada || "Catálogo"), cx, y, { tam: 15, c: COL.oroClaro, esp: 2.1, alin: "center" });
      divisor(cx, y + 7.5, 22);
      texto(mayus(C.subtitulo || ""), cx, y + 14, { tam: 7, c: COL.suave, esp: 1.8, alin: "center" });
      texto(C.eslogan || "", cx, y + 29, { tam: 14, estilo: "italic", c: COL.oro, alin: "center" });
      texto(mayus(C.pais || ""), cx, y + 36, { tam: 6.5, c: COL.oroOsc, esp: 2.4, alin: "center" });

      // botón con enlace a la versión web
      y += 50;
      const bw = 96, bh = 11;
      color("setDrawColor", COL.oro); doc.setLineWidth(0.35);
      color("setFillColor", COL.oro); doc.roundedRect(cx - bw / 2, y, bw, bh, 1, 1, "F");
      texto("VER LA VERSIÓN MÁS RECIENTE", cx, y + 7, { tam: 8.5, estilo: "bold", c: [22, 17, 10], esp: 1, alin: "center" });
      doc.link(cx - bw / 2, y, bw, bh, { url });
      enlace(url.replace(/^https?:\/\//, ""), cx, y + 17.5, url, { tam: 8, c: COL.oroClaro, alin: "center" });
      texto(`Precios actualizados al ${fecha}`, cx, y + 23.5, { tam: 7.5, estilo: "italic", c: COL.suave, alin: "center" });
      if (numero) enlace(`Pedidos por WhatsApp: +${numero.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4")}`, cx, y + 29.5, `https://wa.me/${numero}`, { tam: 7.5, c: COL.suave, alin: "center" });
    }

    // ---------- páginas interiores ----------
    let pagina = 1;
    function nuevaPagina() {
      doc.addPage(); pagina++; fondo();
      const wP = 40, hP = wP * palabra.h / palabra.w;
      doc.addImage(palabra.data, "PNG", A4.w / 2 - wP / 2, 9, wP, hP, "palabra", "FAST");
      divisor(A4.w / 2, 23, 76);
      pie();
      return TOPE;
    }
    function pie() {
      color("setDrawColor", COL.oro); opacidad(0.5); doc.setLineWidth(0.2); doc.line(M, 279, A4.w - M, 279); opacidad(1);
      texto(`Precios por unidad en soles (${C.moneda || "S/"})`, M, 283.5, { tam: 6.5, c: COL.suave });
      texto(C.eslogan || "", A4.w / 2, 283.5, { tam: 9, estilo: "italic", c: COL.oro, alin: "center" });
      texto(String(pagina), A4.w - M, 283.5, { tam: 7, c: COL.suave, alin: "right" });
      if (C.aviso) texto(C.aviso, A4.w / 2, 287.5, { tam: 6, c: COL.suave, alin: "center" });
      const etiqueta = "Ver versión más reciente: ", corta = url.replace(/^https?:\/\//, "");
      doc.setFont("times", "normal"); doc.setFontSize(6.5);
      const x0 = A4.w / 2 - doc.getTextWidth(etiqueta + corta) / 2;
      texto(etiqueta, x0, 291.8, { tam: 6.5, c: COL.suave });
      doc.setFont("times", "normal"); doc.setFontSize(6.5);
      enlace(corta, x0 + doc.getTextWidth(etiqueta), 291.8, url, { tam: 6.5, c: COL.oroClaro });
    }

    // medidas de una tarjeta
    const FILA = 5.5, CAB = 12, PAD = 4.5;
    function columnasDe(n) { return n >= 10 ? 3 : n >= 7 ? 2 : 1; }
    function altoTarjeta(t) { const cols = columnasDe(t.items.length); return CAB + 3.6 + Math.ceil(t.items.length / cols) * FILA + 2.2; }

    function tarjeta(t, x, y, w, nombreSeccion) {
      const h = altoTarjeta(t);
      const r = 2.4;
      color("setFillColor", COL.tarjeta); doc.roundedRect(x, y, w, h, r, r, "F");
      // cabecera con degradado granate
      const tiras = 36;
      for (let i = 0; i < tiras; i++) {
        const f = i / (tiras - 1);
        const k = f < 0.45 ? f / 0.45 * 0.55 : 0.55 + (f - 0.45) / 0.55 * 0.45;
        const c = COL.granate.map((v, j) => Math.round(v + (COL.granateFin[j] - v) * k));
        color("setFillColor", c); doc.rect(x + (w / tiras) * i, y, w / tiras + 0.15, CAB, "F");
      }
      esquinas(x, y, w, h, r);
      color("setDrawColor", COL.oro); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, h, r, r, "S");
      doc.setLineWidth(0.25); doc.line(x + PAD, y + CAB, x + w - PAD, y + CAB);
      texto(ajustar(mayus(t.categoria || nombreSeccion), w - 2 * PAD - 8, 8, "bold"), x + PAD, y + 5.3, { tam: 8, estilo: "bold", c: COL.oroClaro, esp: 1.1 });
      if (t.presentacion) texto(t.presentacion, x + PAD, y + 9.6, { tam: 7.5, estilo: "italic", c: COL.suave });
      estrella(x + w - PAD - 1.2, y + 4.6, 1.3);

      // productos (en columnas, de arriba abajo)
      const cols = columnasDe(t.items.length);
      const filas = Math.ceil(t.items.length / cols);
      const sepCol = 6;
      const anchoCol = (w - 2 * PAD - sepCol * (cols - 1)) / cols;
      t.items.forEach((p, i) => {
        const c = Math.floor(i / filas), f = i % filas;
        const cx = x + PAD + c * (anchoCol + sepCol);
        const cy = y + CAB + 3.6 + f * FILA + 3.4;
        const precio = dinero(p.precio);
        doc.setFont("times", "bold"); doc.setFontSize(8.6);
        const anchoPrecio = doc.getTextWidth(precio);
        const nombre = ajustar(p.nombre, anchoCol - anchoPrecio - 5, 9.4);
        const n = texto(nombre, cx, cy, { tam: 9.4 });
        texto(precio, cx + anchoCol, cy, { tam: 8.6, estilo: "bold", c: COL.oro, alin: "right" });
        const x1 = n.x + n.ancho + 1.4, x2 = cx + anchoCol - anchoPrecio - 1.4;
        if (x2 > x1) {
          color("setDrawColor", COL.oro); opacidad(0.45); doc.setLineWidth(0.25); doc.setLineDashPattern([0.25, 0.9], 0);
          doc.line(x1, cy - 0.4, x2, cy - 0.4); doc.setLineDashPattern([], 0); opacidad(1);
        }
      });
      return h;
    }

    // ---------- montaje ----------
    portada();
    let y = nuevaPagina();
    const anchoMedio = (A4.w - 2 * M - GAP) / 2;

    secciones.forEach((s, si) => {
      const primera = s.tarjetas[0];
      const altoCab = 14;
      if (si > 0) y += 6;
      if (y + altoCab + (primera ? altoTarjeta(primera) : 0) > FONDO_UTIL) y = nuevaPagina();
      lineasTitulo(mayus(s.nombre), y + 8);
      y += altoCab;
      let colY = [y, y];

      s.tarjetas.forEach((t) => {
        const h = altoTarjeta(t);
        const ancha = t.items.length >= 10;
        if (ancha) {
          let y0 = Math.max(...colY);
          if (y0 + h > FONDO_UTIL) { y0 = nuevaPagina(); }
          tarjeta(t, M, y0, A4.w - 2 * M, s.nombre);
          colY = [y0 + h + GAP, y0 + h + GAP];
        } else {
          let c = colY[0] <= colY[1] ? 0 : 1;
          if (colY[c] + h > FONDO_UTIL && colY[1 - c] + h <= FONDO_UTIL) c = 1 - c;
          if (colY[c] + h > FONDO_UTIL) { const n = nuevaPagina(); colY = [n, n]; c = 0; }
          tarjeta(t, M + c * (anchoMedio + GAP), colY[c], anchoMedio, s.nombre);
          colY[c] += h + GAP;
        }
      });
      y = Math.max(...colY) - GAP;
    });

    // ---------- contraportada ----------
    doc.addPage(); pagina++; fondo();
    marcoCupula(20, 262);
    const cx = A4.w / 2;
    const wL = 46, hL = wL * lampara.h / lampara.w;
    doc.addImage(lampara.data, "PNG", cx - wL / 2 + 4, 70, wL, hL, "lampara", "FAST");
    const wP = 92, hP = wP * palabra.h / palabra.w;
    doc.addImage(palabra.data, "PNG", cx - wP / 2, 70 + hL + 4, wP, hP, "palabra", "FAST");
    let yc = 70 + hL + hP + 16;
    divisor(cx, yc, 24);
    texto(C.eslogan || "", cx, yc + 10, { tam: 14, estilo: "italic", c: COL.oro, alin: "center" });
    texto(mayus(C.pais || ""), cx, yc + 40, { tam: 6.5, c: COL.oroOsc, esp: 2.4, alin: "center" });
    if (C.aviso) texto(C.aviso, cx, yc + 47, { tam: 7, c: COL.suave, alin: "center" });
    enlace("Ver la versión más reciente del catálogo", cx, yc + 64, url, { tam: 9, estilo: "italic", c: COL.oroClaro, alin: "center" });
    enlace(url.replace(/^https?:\/\//, ""), cx, yc + 70, url, { tam: 7.5, c: COL.suave, alin: "center" });

    const nombreArchivo = `Catalogo_${(C.nombre || "Aladino").replace(/\s+/g, "_")}_${fecha.replace(/\//g, "-")}.pdf`;
    doc.save(nombreArchivo);
    return nombreArchivo;
  }

  window.crearPDFCatalogo = crearPDFCatalogo;
})();
