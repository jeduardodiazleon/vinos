// ============================================================
//  CONFIGURACIÓN — edita solo este archivo
//  (los productos y precios se cambian en productos.xlsx)
// ============================================================
window.CONFIG = {
  // Número de WhatsApp que recibe los pedidos: código de país + número, sin "+" ni espacios
  whatsapp: "51928167707",

  // Excel con los productos (hoja "Productos")
  archivoExcel: "productos.xlsx",
  hojaExcel: "Productos",

  // Textos de la portada
  nombre: "Aladino",
  temporada: "Catálogo 2026 - 2027",
  subtitulo: "Precios por unidad",
  eslogan: "Un deseo en cada copa",
  pais: "Perú",
  moneda: "S/",

  // Aviso legal obligatorio
  aviso: "Tomar bebidas alcohólicas en exceso es dañino.",

  // Dirección de la web que aparece como enlace en el PDF descargable.
  // Vacío = se usa automáticamente la dirección desde donde se descarga.
  urlWeb: "",

  // Pregunta "¿Eres mayor de edad?" al entrar
  verificarEdad: true
};
