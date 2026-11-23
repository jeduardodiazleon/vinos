# Aladino · Catálogo web con pedidos por WhatsApp

Web con el mismo diseño de la carta impresa. Los productos y precios se leen del Excel **`productos.xlsx`**, y los clientes arman su pedido con **+ / −** y lo envían por WhatsApp.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `productos.xlsx` | **Productos y precios** (lo único que editarás a menudo) |
| `config.js` | Número de WhatsApp, textos de la portada, aviso legal |
| `index.html`, `styles.css`, `app.js`, `lector-excel.js` | La web (no hace falta tocarlos) |
| `img/` | Ilustración, logotipo y lámpara de la carta |
| `pdf-catalogo.js`, `vendor/` | Generador del PDF descargable (jsPDF 4.2.1, licencia MIT) |

## Cambiar productos o precios

1. Abre `productos.xlsx` (Excel, Google Sheets o LibreOffice).
2. En la hoja **Productos**, cada fila es un producto:
   - **Sección**: Vinos, Piscos, Cremas y complementos… (una nueva crea otro apartado).
   - **Categoría** + **Presentación**: título y subtítulo de la tarjeta. Las filas con la misma Sección + Categoría + Presentación van en la misma tarjeta.
   - **Producto** y **Precio** (solo el número, ej. `12` o `12.50`).
   - **Disponible**: pon `No` para ocultarlo sin borrarlo.
3. Guarda como **.xlsx** con el mismo nombre y súbelo a GitHub reemplazando el anterior. En 1–2 minutos la web se actualiza.

No cambies los títulos de la fila 1 ni el nombre de la hoja «Productos». El orden de las filas es el orden en la web.

## Cómo funciona el pedido

- El cliente toca **+** (y **−** para quitar). La cantidad aparece en el producto y abajo sale una barra con el total.
- En **Ver pedido** revisa productos, cantidades, precio por unidad y total, y puede añadir su nombre y dirección (opcional).
- **Enviar pedido por WhatsApp** abre WhatsApp al número de `config.js` con un mensaje así:

```
*NUEVO PEDIDO · ALADINO*

1. *Borgoña Blanca*
    Comerciales · Botella · 750 ml
    2 x S/ 12 = S/ 24

------------------------------
*TOTAL: S/ 24*
(2 unidades)
```

El pedido se guarda en el navegador del cliente, así que no se pierde si recarga la página.

## Catálogo en PDF

Los botones **PDF** (arriba), **Descargar catálogo en PDF** (portada) y **Descargar PDF** (pie) crean al momento un PDF con el mismo diseño de la carta y **los precios actuales del Excel**. No hay que subir ningún PDF a mano.

El PDF incluye enlaces a la web: el botón **Ver la versión más reciente** en la portada, la dirección al pie de cada página y otro enlace en la contraportada. Así, quien tenga un PDF antiguo puede abrir siempre la carta actualizada. También tiene la fecha de los precios y un enlace a WhatsApp.

Por defecto el enlace apunta a la dirección desde la que se descarga. Si usas un dominio propio, escríbelo en `urlWeb` dentro de `config.js`.

## Publicar en GitHub Pages

1. Sube todos estos archivos a la raíz del repositorio (si ya tenías la versión anterior, borra `script.js` y la carpeta `imagenes/`, que ya no se usan).
2. **Settings → Pages → Deploy from a branch → main / (root)**.
3. La web estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

> Para probarla en tu ordenador hay que abrirla con un servidor local (por ejemplo `python -m http.server`); abriendo `index.html` con doble clic el navegador no deja leer el Excel.
