/* ============================================================
   Lector mínimo de archivos .xlsx (sin librerías externas)
   Usa las funciones nativas del navegador (DecompressionStream y DOMParser).
   leerExcel(url, nombreHoja?) -> Promise<Array<Array<valor>>>
   ============================================================ */
(function () {
  "use strict";

  async function descomprimir(datos, metodo) {
    if (metodo === 0) return datos;                       // sin compresión
    if (metodo !== 8) throw new Error("Formato de compresión no soportado");
    if (typeof DecompressionStream === "undefined") throw new Error("Tu navegador es demasiado antiguo para leer la carta. Actualízalo, por favor.");
    const stream = new Blob([datos]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // Lee el índice del ZIP y devuelve { ruta: () => Promise<texto> }
  function leerZip(buffer) {
    const bytes = new Uint8Array(buffer);
    const vista = new DataView(buffer);
    let fin = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (vista.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    }
    if (fin < 0) throw new Error("El archivo no es un Excel (.xlsx) válido");
    const total = vista.getUint16(fin + 10, true);
    let p = vista.getUint32(fin + 16, true);
    const archivos = {};
    const dec = new TextDecoder();
    for (let n = 0; n < total; n++) {
      if (vista.getUint32(p, true) !== 0x02014b50) break;
      const metodo = vista.getUint16(p + 10, true);
      const tamComp = vista.getUint32(p + 20, true);
      const lenNombre = vista.getUint16(p + 28, true);
      const lenExtra = vista.getUint16(p + 30, true);
      const lenComent = vista.getUint16(p + 32, true);
      const local = vista.getUint32(p + 42, true);
      const nombre = dec.decode(bytes.subarray(p + 46, p + 46 + lenNombre));
      archivos[nombre] = async () => {
        const ini = local + 30 + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true);
        return dec.decode(await descomprimir(bytes.slice(ini, ini + tamComp), metodo));
      };
      p += 46 + lenNombre + lenExtra + lenComent;
    }
    return archivos;
  }

  const xml = (texto) => new DOMParser().parseFromString(texto, "application/xml");
  const porNombre = (nodo, nombre) => [...nodo.getElementsByTagName("*")].filter((e) => e.localName === nombre);
  const textoDe = (nodo) => porNombre(nodo, "t").map((t) => t.textContent).join("");

  function columna(ref) {
    const letras = ref.replace(/[0-9]/g, "");
    let n = 0;
    for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
    return n - 1;
  }

  async function leerExcel(url, nombreHoja) {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`No se encontró el archivo ${url}`);
    const zip = leerZip(await resp.arrayBuffer());

    // Hojas del libro
    const libro = xml(await zip["xl/workbook.xml"]());
    const rels = xml(await zip["xl/_rels/workbook.xml.rels"]());
    const destinos = {};
    porNombre(rels, "Relationship").forEach((r) => (destinos[r.getAttribute("Id")] = r.getAttribute("Target")));
    const hojas = porNombre(libro, "sheet").map((h) => ({
      nombre: h.getAttribute("name"),
      ruta: (() => {
        const id = h.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || h.getAttribute("r:id");
        const t = (destinos[id] || "").replace(/^\/?xl\//, "").replace(/^\//, "");
        return "xl/" + t;
      })()
    }));
    const buscada = (nombreHoja || "").toLowerCase();
    const hoja = hojas.find((h) => h.nombre.toLowerCase() === buscada) || hojas[0];
    if (!hoja || !zip[hoja.ruta]) throw new Error("No se encontró la hoja de productos en el Excel");

    // Textos compartidos
    let compartidos = [];
    if (zip["xl/sharedStrings.xml"]) {
      compartidos = porNombre(xml(await zip["xl/sharedStrings.xml"]()), "si").map(textoDe);
    }

    // Celdas
    const doc = xml(await zip[hoja.ruta]());
    const filas = [];
    porNombre(doc, "row").forEach((fila) => {
      const r = parseInt(fila.getAttribute("r"), 10) - 1;
      const datos = [];
      porNombre(fila, "c").forEach((c, i) => {
        const ref = c.getAttribute("r");
        const col = ref ? columna(ref) : i;
        const tipo = c.getAttribute("t");
        const v = porNombre(c, "v")[0];
        let valor = null;
        if (tipo === "s") valor = v ? compartidos[parseInt(v.textContent, 10)] : "";
        else if (tipo === "inlineStr") valor = textoDe(c);
        else if (tipo === "b") valor = v ? v.textContent === "1" : false;
        else if (tipo === "str" || tipo === "e") valor = v ? v.textContent : "";
        else if (v) { const num = Number(v.textContent); valor = isNaN(num) ? v.textContent : num; }
        datos[col] = valor;
      });
      filas[isNaN(r) ? filas.length : r] = datos;
    });
    return filas.filter(Boolean);
  }

  window.leerExcel = leerExcel;
})();
