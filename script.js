/* ============================================================
   Catálogo de vinos automático
   Lee las imágenes de la carpeta (formato Categoria_Nombre.ext)
   y genera las secciones y fichas sin tocar el código.
   ============================================================ */
(function () {
  "use strict";

  const C = Object.assign({
    nombreTienda: "Vinos El Aladino", lema: "", eslogan: "", carpetaImagenes: "imagenes", ajusteFotos: "cover", encuadreLogo: { zoom: 2.15, x: 50, y: 24 }, intro: "", cinta: [], valores: [],
    whatsapp: "", email: "", instagram: "", verificarEdad: true, ordenCategorias: [],
    githubUsuario: "", githubRepo: "", rama: ""
  }, window.CONFIG || {});

  const EXTENSIONES = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
  const ES_LOGO = /^logo\.[a-z0-9]+$/i;
  const ES_PORTADA = /^portada\.[a-z0-9]+$/i;
  const carpeta = String(C.carpetaImagenes).replace(/^\/+|\/+$/g, "");
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const ICONOS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>'
  };

  // ---------- Utilidades ----------
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const capitalizar = (s) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  /** "Tinto_Rioja_Reserva 2019.jpg" -> { categoria: "Tinto", nombre: "Rioja Reserva 2019" } */
  function parsearNombre(archivo) {
    let base = archivo.replace(/\.[^.]+$/, "");
    try { base = decodeURIComponent(base); } catch (e) { /* ya decodificado */ }
    const i = base.indexOf("_");
    let categoria = i > 0 ? base.slice(0, i) : "Otros";
    let nombre = i > 0 ? base.slice(i + 1) : base;
    categoria = capitalizar(categoria.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim());
    nombre = nombre.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
    return { categoria, nombre: nombre || categoria };
  }

  // ---------- Obtener la lista de imágenes ----------
  async function listarImagenes() {
    // 1) Lista manual opcional: imagenes/lista.json -> ["Tinto_Rioja.jpg", ...]
    try {
      const r = await fetch(`${carpeta}/lista.json`, { cache: "no-store" });
      if (r.ok) {
        const lista = await r.json();
        if (Array.isArray(lista)) return lista.filter((n) => EXTENSIONES.test(n));
      }
    } catch (e) { /* no hay lista.json, seguimos */ }

    // 2) Detección automática con la API de GitHub
    let usuario = C.githubUsuario, repo = C.githubRepo;
    const host = location.hostname;
    if (!usuario && host.endsWith(".github.io")) {
      usuario = host.replace(/\.github\.io$/, "");
      const primer = location.pathname.split("/").filter(Boolean)[0];
      repo = repo || (primer && !primer.includes(".") ? primer : `${usuario}.github.io`);
    }
    if (!usuario || !repo) {
      throw new Error("No se pudo detectar el repositorio. Si usas dominio propio, rellena githubUsuario y githubRepo en config.js.");
    }

    const url = `https://api.github.com/repos/${usuario}/${repo}/contents/${carpeta}` + (C.rama ? `?ref=${encodeURIComponent(C.rama)}` : "");
    const claveCache = "vinos-cache:" + url;
    try {
      const cache = JSON.parse(sessionStorage.getItem(claveCache) || "null");
      if (cache && Date.now() - cache.t < 5 * 60 * 1000) return cache.lista;
    } catch (e) { /* sin caché */ }

    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (r.status === 404) return [];
    if (!r.ok) throw new Error(r.status === 403 ? "GitHub ha limitado temporalmente las consultas. Recarga en unos minutos." : `Error ${r.status} al leer las imágenes.`);
    const datos = await r.json();
    const lista = (Array.isArray(datos) ? datos : []).filter((f) => f.type === "file" && EXTENSIONES.test(f.name)).map((f) => f.name);
    try { sessionStorage.setItem(claveCache, JSON.stringify({ t: Date.now(), lista })); } catch (e) { /* sin caché */ }
    return lista;
  }

  // ---------- Agrupar por categoría ----------
  function agrupar(archivos) {
    const mapa = new Map();
    for (const archivo of archivos) {
      if (ES_LOGO.test(archivo) || ES_PORTADA.test(archivo)) continue;
      const { categoria, nombre } = parsearNombre(archivo);
      const clave = categoria.toLocaleLowerCase("es");
      if (!mapa.has(clave)) mapa.set(clave, { categoria, productos: new Map() });
      const productos = mapa.get(clave).productos;
      const claveNombre = nombre.toLocaleLowerCase("es");
      if (!productos.has(claveNombre)) { // nombres únicos dentro de la categoría
        productos.set(claveNombre, { nombre, categoria, src: `${carpeta}/${encodeURIComponent(archivo)}` });
      }
    }
    const orden = (C.ordenCategorias || []).map((c) => String(c).toLocaleLowerCase("es"));
    return [...mapa.entries()]
      .sort(([a], [b]) => {
        const ia = orden.indexOf(a), ib = orden.indexOf(b);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 1e9 : ia) - (ib === -1 ? 1e9 : ib);
        return a.localeCompare(b, "es");
      })
      .map(([, g]) => ({
        categoria: g.categoria,
        id: "cat-" + slug(g.categoria),
        productos: [...g.productos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }))
      }));
  }

  // ---------- Logo ----------
  function probarImagen(src) {
    return new Promise((ok) => { const im = new Image(); im.onload = () => ok(src); im.onerror = () => ok(null); im.src = src; });
  }
  async function buscarLogo(archivos) {
    const enCarpeta = archivos.find((a) => ES_LOGO.test(a));
    if (enCarpeta) return `${carpeta}/${encodeURIComponent(enCarpeta)}`;
    for (const ext of ["png", "jpg", "jpeg", "webp", "svg"]) { // también vale en la raíz del repositorio
      for (const nombre of ["Logo", "logo"]) {
        const src = await probarImagen(`${nombre}.${ext}`);
        if (src) return src;
      }
    }
    return null;
  }
  function aplicarLogo(src) {
    if (!src) return;
    const e = C.encuadreLogo || {};
    $$(".js-logo-crop").forEach((img) => {
      img.src = src; img.hidden = false;
      img.style.setProperty("--z", Number(e.zoom) || 1);
      img.style.setProperty("--fx", (e.x ?? 50) + "%");
      img.style.setProperty("--fy", (e.y ?? 50) + "%");
    });
    $$(".js-only-logo").forEach((el) => el.removeAttribute("hidden"));
    $$(".js-no-logo").forEach((el) => el.setAttribute("hidden", ""));
    $("#inicio").classList.remove("no-logo");
    const fav = $("#favicon"); if (fav) fav.href = src;
    observarReveal();
  }

  function aplicarPortada(archivos) {
    const f = archivos.find((a) => ES_PORTADA.test(a));
    if (!f) return;
    $$(".js-portada").forEach((img) => (img.src = `${carpeta}/${encodeURIComponent(f)}`));
    $("#frame-second").removeAttribute("hidden");
    $(".hero-media").classList.add("has-second");
  }

  function pintarExtras() {
    const cinta = (C.cinta || []).filter(Boolean);
    if (cinta.length) {
      const bloque = cinta.map((t) => `<span>${escapeHTML(t)}</span><svg class="ribbon-icon"><use href="#uvas" /></svg>`).join("");
      $("#ribbon").innerHTML = `<div>${bloque}</div><div>${bloque}</div>`;
    } else $(".ribbon").setAttribute("hidden", "");
    const valores = (C.valores || []).filter((v) => v && v.titulo);
    if (valores.length) {
      $("#valores").innerHTML = valores.map((v, i) => `
        <div class="valor reveal" style="transition-delay:${i * 120}ms">
          <svg class="valor-icon icon-${escapeHTML(v.icono || "uvas")}"><use href="#${escapeHTML(v.icono || "uvas")}" /></svg>
          <h3>${escapeHTML(v.titulo)}</h3>
          <p>${escapeHTML(v.texto || "")}</p>
        </div>`).join('<span class="valor-sep" aria-hidden="true">✦</span>');
    } else $("#valores").setAttribute("hidden", "");
  }

  // ---------- Contacto ----------
  function enlacesContacto(vino) {
    const enlaces = [];
    const msg = vino ? `Hola, me interesa el vino "${vino.nombre}" (${vino.categoria}). ¿Me podéis dar más información?` : "Hola, me gustaría información sobre vuestros vinos.";
    if (C.whatsapp) enlaces.push({ tipo: "whatsapp", texto: vino ? "Pedir por WhatsApp" : "WhatsApp", url: `https://wa.me/${String(C.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}` });
    if (C.email) enlaces.push({ tipo: "email", texto: vino ? "Consultar por email" : C.email, url: `mailto:${C.email}?subject=${encodeURIComponent(vino ? "Consulta: " + vino.nombre : "Consulta")}&body=${encodeURIComponent(msg)}` });
    if (C.instagram) enlaces.push({ tipo: "instagram", texto: vino ? "Escríbenos en Instagram" : "@" + C.instagram, url: `https://instagram.com/${C.instagram.replace(/^@/, "")}` });
    return enlaces;
  }

  // ---------- Pintar ----------
  let grupos = [];
  let filtroCat = "todas";
  let busqueda = "";

  function pintarCatalogo() {
    const cont = $("#catalogo");
    const q = busqueda.trim().toLocaleLowerCase("es");
    const visibles = grupos
      .filter((g) => filtroCat === "todas" || g.id === filtroCat)
      .map((g) => ({ ...g, productos: g.productos.filter((p) => !q || p.nombre.toLocaleLowerCase("es").includes(q) || p.categoria.toLocaleLowerCase("es").includes(q)) }))
      .filter((g) => g.productos.length);

    if (!grupos.length) {
      cont.innerHTML = `<div class="empty"><h3>La bodega está preparándose</h3><p>Sube tus fotos a la carpeta <code>${escapeHTML(carpeta)}/</code> con el formato <code>Categoria_Nombre.jpg</code> y aparecerán aquí automáticamente.</p></div>`;
      return;
    }
    if (!visibles.length) {
      cont.innerHTML = `<div class="empty"><h3>Sin resultados</h3><p>No encontramos vinos que coincidan con “${escapeHTML(busqueda)}”.</p></div>`;
      return;
    }

    cont.innerHTML = visibles.map((g) => {
      return `
      <section class="categoria" id="${g.id}">
        <div class="categoria-header reveal">
          <span class="star">✦</span>
          <h2>${escapeHTML(g.categoria)}</h2>
          <div class="ornament"><span></span><i>✦</i><span></span></div>
          <span class="count">${g.productos.length} ${g.productos.length === 1 ? "vino" : "vinos"}</span>
        </div>
        <div class="grid${g.productos.length < 3 ? " few" : ""}">
          ${g.productos.map((p, i) => `
            <button class="card reveal" style="transition-delay:${Math.min(i, 8) * 60}ms" data-cat="${g.id}" data-i="${g.productos.indexOf(p)}">
              <div class="card-img"><img src="${p.src}" alt="${escapeHTML(p.nombre)}" loading="lazy" /></div>
              <div class="card-body">
                <p class="eyebrow">${escapeHTML(p.categoria)}</p>
                <h3>${escapeHTML(p.nombre)}</h3>
                <span class="mini">✦ ✦ ✦</span>
              </div>
            </button>`).join("")}
        </div>
      </section>`;
    }).join("");

    $$(".card", cont).forEach((card) => {
      card.addEventListener("click", () => {
        const g = visibles.find((x) => x.id === card.dataset.cat);
        abrirDetalle(g.productos[+card.dataset.i]);
      });
    });
    observarReveal();
  }

  function pintarNavYChips() {
    $("#nav").innerHTML =
      grupos.map((g) => `<a href="#${g.id}" data-filtro="${g.id}">${escapeHTML(g.categoria)}</a>`).join("") +
      `<a href="#contacto">Contacto</a>`;

    const total = grupos.reduce((s, g) => s + g.productos.length, 0);
    $("#chips").innerHTML =
      `<button class="chip active" data-filtro="todas">Todas<small>${total}</small></button>` +
      grupos.map((g) => `<button class="chip" data-filtro="${g.id}">${escapeHTML(g.categoria)}<small>${g.productos.length}</small></button>`).join("");

    $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
      filtroCat = chip.dataset.filtro;
      $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
      pintarCatalogo();
      $("#carta").scrollIntoView({ behavior: "smooth" });
    }));

    $$("#nav a[data-filtro]").forEach((a) => a.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      if (filtroCat !== "todas") {
        filtroCat = "todas";
        $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.filtro === "todas"));
        pintarCatalogo();
      }
    }));
    $$("#nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }

  // ---------- Detalle ----------
  function abrirDetalle(vino) {
    $("#lb-img").src = vino.src;
    $("#lb-img").alt = vino.nombre;
    $("#lb-cat").textContent = vino.categoria;
    $("#lb-name").textContent = vino.nombre;
    const enlaces = enlacesContacto(vino);
    $("#lb-actions").innerHTML = enlaces.length
      ? enlaces.map((e, i) => `<a class="btn ${i === 0 ? "btn-gold" : "btn-ghost"}" href="${e.url}" target="_blank" rel="noopener">${ICONOS[e.tipo]}${escapeHTML(e.texto)}</a>`).join("")
      : "";
    $("#lightbox").hidden = false;
    document.body.classList.add("no-scroll");
  }
  function cerrarDetalle() {
    $("#lightbox").hidden = true;
    document.body.classList.remove("no-scroll");
  }

  // ---------- Animaciones ----------
  let observer;
  function observarReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((el) => el.classList.add("visible")); return; }
    observer = observer || new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal:not(.visible)").forEach((el) => observer.observe(el));
  }

  // ---------- Verificación de edad ----------
  function verificarEdad() {
    if (!C.verificarEdad || store.get("edad-ok") === "1") return;
    const gate = $("#age-gate");
    gate.hidden = false;
    document.body.classList.add("no-scroll");
    $("#age-yes").addEventListener("click", () => {
      store.set("edad-ok", "1");
      gate.hidden = true;
      document.body.classList.remove("no-scroll");
    });
    $("#age-no").addEventListener("click", () => { $("#age-denied").hidden = false; });
  }

  // ---------- Inicio ----------
  async function iniciar() {
    document.title = C.eslogan ? `${C.nombreTienda} · ${C.eslogan.replace(/\.$/, "")}` : C.nombreTienda;
    $$(".js-store-name").forEach((el) => (el.textContent = C.nombreTienda));
    const palabras = C.nombreTienda.trim().split(/\s+/);
    $("#hero-title").innerHTML = palabras.length > 2 && /^vinos?$/i.test(palabras[0])
      ? `<small>${escapeHTML(palabras[0])}</small><span>${escapeHTML(palabras.slice(1).join(" "))}</span>`
      : `<span>${escapeHTML(C.nombreTienda)}</span>`;
    $$(".js-lema").forEach((el) => { el.textContent = C.lema; el.toggleAttribute("hidden", !C.lema); });
    $$(".js-intro").forEach((el) => { el.textContent = C.intro; el.toggleAttribute("hidden", !C.intro); });
    if (C.eslogan) {
      const frase = C.eslogan.replace(/\.$/, "");
      $$(".js-seal-text").forEach((el) => (el.textContent = frase.length > 22 ? `${frase} ✦ ` : `${frase} ✦ ${frase} ✦ `));
    }
    $$(".js-eslogan").forEach((el) => { el.textContent = C.eslogan; el.hidden = !C.eslogan; });
    $$(".js-year-now").forEach((el) => (el.textContent = new Date().getFullYear()));
    if (String(C.ajusteFotos).toLowerCase() === "contain") document.body.classList.add("fit-contain");
    $("#footer-contact").innerHTML = enlacesContacto(null)
      .map((e) => `<a href="${e.url}" target="_blank" rel="noopener">${ICONOS[e.tipo]}<span>${escapeHTML(e.texto)}</span></a>`).join("");

    verificarEdad();
    pintarExtras();
    observarReveal();

    window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 40), { passive: true });
    $("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("menu-open"));
    $("#lightbox-close").addEventListener("click", cerrarDetalle);
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") cerrarDetalle(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarDetalle(); });
    $("#search").addEventListener("input", (e) => { busqueda = e.target.value; pintarCatalogo(); });

    try {
      const archivos = await listarImagenes();
      buscarLogo(archivos).then(aplicarLogo);
      aplicarPortada(archivos);
      grupos = agrupar(archivos);
      pintarNavYChips();
      pintarCatalogo();
    } catch (err) {
      buscarLogo([]).then(aplicarLogo);
      $("#catalogo").innerHTML = `<div class="error"><h3>No pudimos cargar la carta</h3><p>${escapeHTML(err.message)}</p></div>`;
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
