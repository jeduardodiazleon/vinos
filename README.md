# 🍷 Vinos El Aladino — web para GitHub Pages

Catálogo elegante que se genera **solo** a partir de las fotos que subas.

## Cómo nombrar las fotos

Súbelas a la carpeta `imagenes/` con el formato:

```
Categoria_Nombre.jpg
```

| Archivo                          | Categoría (subtítulo) | Producto              |
|----------------------------------|-----------------------|-----------------------|
| `Tinto_Rioja Reserva 2019.jpg`   | Tinto                 | Rioja Reserva 2019    |
| `Tinto_Ribera_del_Duero.png`     | Tinto                 | Ribera del Duero      |
| `Blanco_Albariño.webp`           | Blanco                | Albariño              |

- Lo que va **antes del primer `_`** es la categoría; el resto es el nombre (los `_` siguientes se convierten en espacios).
- Las categorías se agrupan aunque varíen mayúsculas (`tinto` = `Tinto`).
- Formatos válidos: jpg, jpeg, png, webp, gif, avif, svg.
- Consejo: fotos de la botella con **fondo blanco** quedan perfectas (el fondo se funde con la tarjeta).

## Logo

Sube tu logo a `imagenes/` con el nombre **`Logo`** (`Logo.jpg`, `Logo.png`, `Logo.webp`…). En la portada y en el aviso de edad se muestra solo una parte (la ilustración), dentro de un marco, para que no salgan textos de la etiqueta como "Vino Tinto". Puedes ajustar qué parte se ve con `encuadreLogo` en `config.js`. No se muestra como producto. Para cambiarlo, sustituye el archivo.

## Foto pequeña de la portada

Sube a `imagenes/` una foto llamada **`Portada`** (`Portada.jpg`…). Aparece superpuesta junto a la imagen principal; tampoco sale en la carta. Si no existe, simplemente no se muestra.

## Cinta y valores

En `config.js` puedes cambiar la cinta que se desliza bajo la portada (`cinta`) y los tres valores con iconos (`valores`).

## Publicar en GitHub Pages

1. Crea un repositorio **público** en GitHub (ej. `vinos`).
2. Sube todos estos archivos (puedes arrastrarlos en *Add file → Upload files*).
3. Ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En 1–2 minutos tu web estará en `https://TU-USUARIO.github.io/vinos/`.

Para añadir vinos después: entra en la carpeta `imagenes/` del repositorio → *Add file → Upload files*. Aparecerán en la web en pocos minutos.

## Personalizar

Edita **`config.js`**: nombre de la tienda, eslogan, WhatsApp, email, Instagram, orden de categorías y aviso de mayoría de edad. Con WhatsApp configurado, cada vino tiene un botón que abre un mensaje ya escrito con el nombre del vino.

## Notas

- La web detecta las fotos usando la API pública de GitHub (límite: 60 consultas por hora por visitante, más que suficiente; además se guarda en caché).
- Si usas **dominio propio**, rellena `githubUsuario` y `githubRepo` en `config.js`.
- Alternativa sin API: crea `imagenes/lista.json` con la lista de archivos, ej. `["Tinto_Rioja.jpg", "Blanco_Verdejo.jpg"]`. También sirve para probar la web en tu ordenador.
- GitHub Pages no permite tiendas con pago online; esta web es un **catálogo** con pedidos por WhatsApp/email.
