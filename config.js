// ============================================================
//  CONFIGURACIÓN DE TU TIENDA — edita solo este archivo
// ============================================================
window.CONFIG = {
  // Textos principales
  nombreTienda: "Vinos El Aladino",
  lema: "Pasión · Misterio · Tradición",
  eslogan: "Un deseo en cada copa.",
  intro: "Una colección privada de vinos seleccionados, para quienes saben que cada copa guarda una historia.",

  // Cinta que se desliza bajo la portada
  cinta: ["Vinos", "Piscos", "Selección privada", "Un deseo en cada copa"],

  // Tres valores bajo la portada (icono: "uvas", "copa", "botella" o "lampara")
  valores: [
    { icono: "uvas",    titulo: "Pasión",    texto: "Cada botella, elegida con dedicación." },
    { icono: "lampara", titulo: "Misterio",  texto: "Aromas que invitan a descubrir." },
    { icono: "copa",    titulo: "Tradición", texto: "El legado de los mejores valles." }
  ],

  // Carpeta donde subes las fotos (formato: Categoria_Nombre.jpg)
  // El logo va en esta misma carpeta con el nombre "Logo" (Logo.jpg, Logo.png, Logo.webp…)
  // y la foto pequeña de la portada con el nombre "Portada" (Portada.jpg…). Ninguna sale en la carta.
  carpetaImagenes: "imagenes",

  // Qué parte del logo se ve en la imagen de la portada (para no mostrar textos como "Vino Tinto").
  // zoom: cuánto se acerca (1 = logo entero) · x, y: punto central en % (0-100)
  encuadreLogo: { zoom: 2.15, x: 50, y: 24 },

  // Cómo se ajustan las fotos en las tarjetas:
  // "cover"   = llenan todo el marco (ideal para fotos con fondo/ambiente, como las tuyas)
  // "contain" = se ve la foto completa (ideal para botellas recortadas con fondo blanco)
  ajusteFotos: "cover",

  // Contacto (deja vacío "" lo que no uses)
  whatsapp: "",            // con prefijo de país y sin "+" ni espacios, ej: "51987654321"
  email: "",               // ej: "pedidos@elaladino.com"
  instagram: "",           // solo el usuario, ej: "vinoselaladino"

  // Pregunta "¿Eres mayor de edad?" al entrar
  verificarEdad: true,

  // Orden de las categorías (opcional). Las que no pongas van después, en orden alfabético.
  // ej: ["Tinto", "Blanco", "Rosado", "Espumoso"]
  ordenCategorias: [],

  // Solo necesario si usas un DOMINIO PROPIO (ej: www.elaladino.com).
  // Con la dirección normal usuario.github.io se detecta solo.
  githubUsuario: "",
  githubRepo: "",
  rama: ""                 // vacío = rama principal
};
