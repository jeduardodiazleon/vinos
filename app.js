/* ============================================================
   Aladino · Carta y pedidos por WhatsApp
   Lee productos.xlsx, pinta la carta y gestiona el pedido.
   ============================================================ */
(function () {
  "use strict";

  const C = Object.assign({
    whatsapp: "", archivoExcel: "productos.xlsx", hojaExcel: "Productos",
    nombre: "Aladino", temporada: "", subtitulo: "", eslogan: "", pais: "", moneda: "S/",
    aviso: "", urlWeb: "", verificarEdad: true
  }, window.CONFIG || {});

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normal = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const slug = (s) => normal(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const dinero = (n) => `${C.moneda} ${Number.isInteger(n) ? n : n.toFixed(2)}`;
  const guardar = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } } };

  let productos = new Map();   // id -> producto
  let pedido = new Map();      // id -> cantidad
  let seccionesActuales = null;

  // ---------- 1. Leer el Excel ----------
  function precioDe(v) {
    if (typeof v === "number") return v;
    const n = parseFloat(String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function filasAProductos(filas) {
    if (!filas.length) throw new Error("El Excel está vacío");
    const cab = (filas[0] || []).map(normal);
    const col = (...nombres) => cab.findIndex((c) => nombres.includes(c));
    const iSec = col("seccion"), iCat = col("categoria"), iPres = col("presentacion", "formato"), iProd = col("producto", "nombre"), iPrecio = col("precio", "precio (s/)"), iDisp = col("disponible");
    if (iProd < 0 || iPrecio < 0) throw new Error("El Excel debe tener las columnas «Producto» y «Precio» en la fila 1");

    const secciones = [];
    const porSeccion = new Map();
    filas.slice(1).forEach((f) => {
      if (!f) return;
      const nombre = String(f[iProd] ?? "").trim();
      const precio = precioDe(f[iPrecio]);
      if (!nombre || precio === null) return;
      if (iDisp >= 0 && ["no", "false", "0", "agotado"].includes(normal(f[iDisp]))) return;
      const seccion = String((iSec >= 0 && f[iSec]) || "Carta").trim();
      const categoria = String((iCat >= 0 && f[iCat]) || "").trim();
      const presentacion = String((iPres >= 0 && f[iPres]) || "").trim();

      if (!porSeccion.has(seccion)) {
        const s = { nombre: seccion, id: "sec-" + slug(seccion), tarjetas: [], porClave: new Map() };
        porSeccion.set(seccion, s); secciones.push(s);
      }
      const s = porSeccion.get(seccion);
      const clave = categoria + "|" + presentacion;
      if (!s.porClave.has(clave)) {
        const t = { categoria, presentacion, items: [] };
        s.porClave.set(clave, t); s.tarjetas.push(t);
      }
      const id = slug([seccion, categoria, presentacion, nombre].join(" "));
      if (productos.has(id)) return; // repetido
      const p = { id, nombre, precio, categoria, presentacion, seccion };
      productos.set(id, p);
      s.porClave.get(clave).items.push(p);
    });
    if (!secciones.length) throw new Error("No se encontraron productos con nombre y precio");
    return secciones;
  }

  // ---------- 2. Pintar la carta ----------
  function pintarCarta(secciones) {
    $("#secciones").innerHTML = secciones.map((s) => `
      <section class="seccion" id="${s.id}">
        <div class="sec-cab reveal">
          <img src="img/aladino.webp" alt="" class="sec-palabra" />
          <div class="divisor"><span></span><i>✦</i><span></span></div>
          <div class="sec-titulo"><h2>${esc(s.nombre)}</h2></div>
        </div>
        <div class="tarjetas">
          ${s.tarjetas.map((t) => {
            const n = t.items.length;
            const ancha = n >= 10;
            const cols = ancha ? "c3" : n >= 7 ? "c2" : "";
            return `
            <article class="tarjeta${ancha ? " ancha" : ""} reveal">
              <header class="tarjeta-cab">
                <div><h3>${esc(t.categoria || s.nombre)}</h3>${t.presentacion ? `<p>${esc(t.presentacion)}</p>` : ""}</div>
                <span>✦</span>
              </header>
              <ul class="lista ${cols}">
                ${t.items.map((p) => `
                  <li class="item" data-id="${p.id}">
                    <span class="nombre" title="${esc(p.nombre)}">${esc(p.nombre)}</span>
                    <span class="puntos"></span>
                    <span class="precio">${esc(dinero(p.precio))}</span>
                    <span class="ctrl">
                      <button class="menos" aria-label="Quitar uno de ${esc(p.nombre)}">−</button>
                      <span class="cant">0</span>
                      <button class="mas" aria-label="Añadir ${esc(p.nombre)}">+</button>
                    </span>
                  </li>`).join("")}
              </ul>
            </article>`;
          }).join("")}
        </div>
      </section>`).join("");

    $("#nav").innerHTML = secciones.map((s) => `<a href="#${s.id}">${esc(s.nombre)}</a>`).join("") + `<a href="#contacto">Contacto</a>`;
    $$("#nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-abierto")));

    $("#secciones").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      const item = e.target.closest(".item");
      if (!btn || !item) return;
      cambiar(item.dataset.id, btn.classList.contains("mas") ? 1 : -1);
    });

    observarSecciones(secciones);
    revelar();
  }

  // ---------- 3. Pedido ----------
  function cambiar(id, delta) {
    const p = productos.get(id);
    if (!p) return;
    const nueva = Math.max(0, Math.min(999, (pedido.get(id) || 0) + delta));
    if (nueva === 0) pedido.delete(id); else pedido.set(id, nueva);
    if (delta > 0) aviso(`Añadido: ${p.nombre}${p.presentacion ? " · " + p.presentacion.split("·").pop().trim() : ""} (${nueva})`);
    guardarPedido();
    actualizar();
    if (delta > 0) { const b = $("#badge"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  }

  function totales() {
    let unidades = 0, total = 0;
    pedido.forEach((q, id) => { const p = productos.get(id); if (p) { unidades += q; total += q * p.precio; } });
    return { unidades, total: Math.round(total * 100) / 100 };
  }

  function actualizar() {
    // Carta
    $$(".item").forEach((li) => {
      const q = pedido.get(li.dataset.id) || 0;
      li.classList.toggle("en-pedido", q > 0);
      $(".cant", li).textContent = q;
    });
    // Barra y contador
    const { unidades, total } = totales();
    const badge = $("#badge");
    badge.textContent = unidades; badge.toggleAttribute("hidden", unidades === 0);
    $("#barra-pedido").toggleAttribute("hidden", unidades === 0 || !$("#panel").hidden);
    $("#bp-cant").textContent = unidades;
    $("#bp-items").textContent = `${unidades} ${unidades === 1 ? "unidad" : "unidades"}`;
    $("#bp-total").textContent = dinero(total);
    // Panel
    $("#panel-lista").innerHTML = [...pedido.entries()].map(([id, q]) => {
      const p = productos.get(id);
      if (!p) return "";
      return `
        <li class="p-item" data-id="${id}">
          <span class="p-nombre">${esc(p.nombre)}</span>
          <span class="p-sub">${esc(dinero(Math.round(q * p.precio * 100) / 100))}</span>
          <span class="p-meta">${esc([p.categoria, p.presentacion].filter(Boolean).join(" · "))}</span>
          <div class="p-fila">
            <span class="p-unit">${esc(dinero(p.precio))} c/u</span>
            <span class="p-ctrl">
              <button data-d="-1" aria-label="Quitar uno">−</button>
              <span>${q}</span>
              <button data-d="1" aria-label="Añadir uno">+</button>
            </span>
          </div>
        </li>`;
    }).join("");
    const vacio = pedido.size === 0;
    $("#panel-vacio").toggleAttribute("hidden", !vacio);
    $("#panel-datos").toggleAttribute("hidden", vacio);
    $("#panel-pie").toggleAttribute("hidden", vacio);
    $("#panel-total").textContent = dinero(total);
  }

  function guardarPedido() { guardar.set("aladino-pedido", JSON.stringify([...pedido.entries()])); }
  function cargarPedido() {
    try {
      const datos = JSON.parse(guardar.get("aladino-pedido") || "[]");
      datos.forEach(([id, q]) => { if (productos.has(id) && q > 0) pedido.set(id, Math.min(999, q | 0)); });
    } catch (e) { /* pedido no válido */ }
    $("#cliente-nombre").value = guardar.get("aladino-nombre") || "";
  }

  function abrirPanel() {
    $("#panel").hidden = false; $("#velo").hidden = false;
    document.body.classList.add("sin-scroll");
    actualizar();
  }
  function cerrarPanel() {
    $("#panel").hidden = true; $("#velo").hidden = true;
    document.body.classList.remove("sin-scroll");
    actualizar();
  }

  function mensajePedido() {
    const { unidades, total } = totales();
    const lineas = [`*NUEVO PEDIDO · ${C.nombre.toUpperCase()}*`, ""];
    let n = 0;
    pedido.forEach((q, id) => {
      const p = productos.get(id);
      if (!p) return;
      n++;
      lineas.push(`${n}. *${p.nombre}*`);
      const meta = [p.categoria, p.presentacion].filter(Boolean).join(" · ");
      if (meta) lineas.push(`    ${meta}`);
      lineas.push(`    ${q} x ${dinero(p.precio)} = ${dinero(Math.round(q * p.precio * 100) / 100)}`);
      lineas.push("");
    });
    lineas.push("------------------------------");
    lineas.push(`*TOTAL: ${dinero(total)}*`);
    lineas.push(`(${unidades} ${unidades === 1 ? "unidad" : "unidades"})`);
    const nombre = $("#cliente-nombre").value.trim();
    const notas = $("#cliente-notas").value.trim();
    if (nombre || notas) lineas.push("");
    if (nombre) lineas.push(`Nombre: ${nombre}`);
    if (notas) lineas.push(`Notas: ${notas}`);
    return lineas.join("\n");
  }

  function enviarPedido() {
    if (!pedido.size) return;
    const numero = String(C.whatsapp).replace(/\D/g, "");
    guardar.set("aladino-nombre", $("#cliente-nombre").value.trim());
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensajePedido())}`;
    const ventana = window.open(url, "_blank");
    if (!ventana) location.href = url;
  }

  // ---------- PDF descargable ----------
  const scriptsCargados = {};
  function cargarScript(src) {
    if (!scriptsCargados[src]) scriptsCargados[src] = new Promise((ok, mal) => {
      const sc = document.createElement("script");
      sc.src = src; sc.onload = ok; sc.onerror = () => mal(new Error("No se pudo cargar " + src));
      document.head.appendChild(sc);
    });
    return scriptsCargados[src];
  }
  async function descargarPDF() {
    if (!seccionesActuales) { aviso("La carta aún se está cargando…"); return; }
    $$(".js-pdf").forEach((b) => b.classList.add("ocupado"));
    aviso("Preparando el PDF…", 6000);
    try {
      await cargarScript("vendor/jspdf.umd.min.js");
      await cargarScript("pdf-catalogo.js");
      const url = C.urlWeb || (location.origin + location.pathname.replace(/index\.html$/, ""));
      await window.crearPDFCatalogo(seccionesActuales, C, { url });
      aviso("PDF descargado");
    } catch (e) {
      console.error(e);
      aviso("No se pudo crear el PDF. Inténtalo de nuevo.");
    } finally {
      $$(".js-pdf").forEach((b) => b.classList.remove("ocupado"));
    }
  }

  // ---------- 4. Detalles visuales ----------
  let temporizador;
  function aviso(texto, ms = 1500) {
    const t = $("#toast");
    t.textContent = texto; t.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (t.hidden = true), ms);
  }

  let obsReveal;
  function revelar() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((e) => e.classList.add("visible")); return; }
    obsReveal = obsReveal || new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); obsReveal.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
    $$(".reveal:not(.visible)").forEach((e) => obsReveal.observe(e));
  }

  function observarSecciones(secciones) {
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) $$("#nav a").forEach((a) => a.classList.toggle("activo", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    secciones.forEach((s) => obs.observe(document.getElementById(s.id)));
  }

  function verificarEdad() {
    if (!C.verificarEdad || guardar.get("aladino-edad") === "1") return;
    $("#age-gate").hidden = false;
    document.body.classList.add("sin-scroll");
    $("#age-yes").addEventListener("click", () => {
      guardar.set("aladino-edad", "1");
      $("#age-gate").hidden = true;
      document.body.classList.remove("sin-scroll");
    });
    $("#age-no").addEventListener("click", () => ($("#age-denied").hidden = false));
  }

  // ---------- 5. Inicio ----------
  async function iniciar() {
    const textos = { ".js-temporada": C.temporada, ".js-subtitulo": C.subtitulo, ".js-eslogan": C.eslogan, ".js-pais": C.pais, ".js-moneda": C.moneda, ".js-aviso": C.aviso };
    Object.entries(textos).forEach(([sel, val]) => $$(sel).forEach((el) => { el.textContent = val; el.toggleAttribute("hidden", !val); }));
    $("#anio").textContent = new Date().getFullYear();
    const numero = String(C.whatsapp).replace(/\D/g, "");
    if (numero) {
      $("#pie-whatsapp").href = `https://wa.me/${numero}`;
      $("#pie-numero").textContent = "+" + numero.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
    } else $("#pie-whatsapp").hidden = true;

    verificarEdad();
    revelar();

    window.addEventListener("scroll", () => $("#topbar").classList.toggle("solida", window.scrollY > 30), { passive: true });
    $("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("menu-abierto"));
    $("#como-pedir-btn").addEventListener("click", () => $("#como-pedir").scrollIntoView({ behavior: "smooth", block: "center" }));
    $("#barra-pedido").addEventListener("click", abrirPanel);
    $("#abrir-pedido-top").addEventListener("click", abrirPanel);
    $("#panel-cerrar").addEventListener("click", cerrarPanel);
    $("#velo").addEventListener("click", cerrarPanel);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#panel").hidden) cerrarPanel(); });
    $("#panel-lista").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-d]");
      if (b) cambiar(b.closest(".p-item").dataset.id, +b.dataset.d);
    });
    $("#enviar-pedido").addEventListener("click", enviarPedido);
    $$(".js-pdf").forEach((b) => b.addEventListener("click", descargarPDF));
    $("#vaciar-pedido").addEventListener("click", () => {
      if (!pedido.size) return;
      pedido.clear(); guardarPedido(); actualizar(); aviso("Pedido vaciado");
    });

    try {
      const filas = await window.leerExcel(C.archivoExcel, C.hojaExcel);
      const secciones = filasAProductos(filas);
      seccionesActuales = secciones;
      pintarCarta(secciones);
      cargarPedido();
      actualizar();
    } catch (err) {
      console.error(err);
      $("#secciones").innerHTML = `<div class="error"><h3>No pudimos cargar la carta</h3><p>${esc(err.message)}</p>${location.protocol === "file:" ? "<p>Abre la web desde GitHub Pages o un servidor; abriendo el archivo directamente el navegador no permite leer el Excel.</p>" : ""}</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
