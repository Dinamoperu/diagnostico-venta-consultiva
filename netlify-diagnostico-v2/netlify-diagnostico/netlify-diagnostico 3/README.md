# Diagnóstico Premium de Venta Consultiva

Proyecto listo para subir a GitHub y desplegar en Netlify.

## Qué trae
- Formulario por pasos
- Resultado en la misma página
- Función de Netlify que llama a OpenAI
- Gráfico simple por fases

## Estructura
- `index.html`
- `styles.css`
- `app.js`
- `netlify.toml`
- `netlify/functions/generate-diagnosis.js`

## Cómo subirlo
1. Sube esta carpeta a un repositorio de GitHub.
2. Conecta ese repositorio a Netlify.
3. En Netlify, ve a **Site configuration > Environment variables**.
4. Crea la variable `OPENAI_API_KEY` con tu clave de OpenAI.
5. Haz deploy.

## Nota importante
Sin `OPENAI_API_KEY`, el formulario cargará, pero no podrá generar el diagnóstico.
