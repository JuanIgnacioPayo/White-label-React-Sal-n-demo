const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

function formatFechaEspanol(fechaStr) {
    if (!fechaStr) return '';
    const match = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return fechaStr;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    // Usar UTC a las 12:00 para evitar desfasajes por huso horario
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaSemana = diasSemana[date.getUTCDay()];
    const mes = meses[date.getUTCMonth()];
    return `${diaSemana} ${day} de ${mes} de ${year}`;
}

// This function will be called by functions/index.js
async function servePrecios(req, res) {
    try {
        // 1. Redirecciones de Normalización SEO (301 Permanente)
        const host = req.get('host');
        const pathOnly = req.url.split('?')[0];

        const preciosLegacyMatch = pathOnly.match(/^\/precios(\d+)$/);
        const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';

        let fechaParam = null;
        try {
            const urlObj = new URL(req.url, `https://${host || 'melishare-redirect-payo.web.app'}`);
            fechaParam = urlObj.searchParams.get('fecha');
        } catch (e) {
            if (req.query && req.query.fecha) fechaParam = req.query.fecha;
        }

        if (preciosLegacyMatch) {
            const finalPath = `/precios/${preciosLegacyMatch[1]}`;
            return res.redirect(301, `${finalPath}${queryString}`);
        }
        
        // Prevent SSR for missing static assets (images, js, css, etc.)
        if (pathOnly.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i)) {
            return res.status(404).send("Not found");
        }

        const db = admin.database();

        // Sanitize path for Firebase key (no ., #, $, [, or ])
        let routeKey = pathOnly.replace(/^\/+/, '').replace(/\/+$/, '').replace(/[\/\.#\$\[\]]/g, '_'); 
        if (routeKey === '') routeKey = 'home';
        
        const generalConfigSnapshot = await db.ref('config/preciosDinamicoHeader').once('value');
        let headerConfig = generalConfigSnapshot.val() || {};

        if (routeKey) {
            try {
                const specificConfigSnapshot = await db.ref(`config/preciosDinamicoHeader_${routeKey}`).once('value');
                if (specificConfigSnapshot.exists()) {
                    const specificVal = specificConfigSnapshot.val();
                    if (specificVal.shareTitle) headerConfig.shareTitle = specificVal.shareTitle;
                    if (specificVal.shareDescription) headerConfig.shareDescription = specificVal.shareDescription;
                    if (specificVal.shareImageUrl !== undefined) headerConfig.shareImageUrl = specificVal.shareImageUrl;
                }
            } catch (err) {
                console.error("Firebase ref error for routeKey:", routeKey, err);
            }
        }

        // Si hay parámetro fecha en la URL, priorizar la configuración de precios_fecha
        if (fechaParam) {
            try {
                const fechaConfigSnapshot = await db.ref('config/preciosDinamicoHeader_precios_fecha').once('value');
                if (fechaConfigSnapshot.exists()) {
                    const fechaVal = fechaConfigSnapshot.val();
                    if (fechaVal.shareTitle) headerConfig.shareTitle = fechaVal.shareTitle;
                    if (fechaVal.shareDescription) headerConfig.shareDescription = fechaVal.shareDescription;
                    if (fechaVal.shareImageUrl !== undefined && fechaVal.shareImageUrl !== '') {
                        headerConfig.shareImageUrl = fechaVal.shareImageUrl;
                    }
                }
            } catch (err) {
                console.error("Firebase ref error for precios_fecha:", err);
            }
        }

        // Dynamic Title Generation
        let shareTitle = headerConfig.shareTitle || (fechaParam ? "Precios para el día {fecha}" : "Lista de precios");
        let shareDescription = headerConfig.shareDescription || "Vení a conocer nuestro salón de eventos en Parque Patricios. Precios actualizados y reservas online.";

        if (fechaParam) {
            const formattedDate = formatFechaEspanol(fechaParam);
            const formattedDateCap = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

            if (shareTitle.includes('{fecha}')) {
                shareTitle = shareTitle.replace(/\{fecha\}/g, formattedDate);
            } else if (shareTitle.includes('{Fecha}')) {
                shareTitle = shareTitle.replace(/\{Fecha\}/g, formattedDateCap);
            } else if (shareTitle.trim().toLowerCase().endsWith('para el día') || shareTitle.trim().toLowerCase().endsWith('para el dia')) {
                shareTitle = `${shareTitle.trim()} ${formattedDate}`;
            } else if (!shareTitle.includes(formattedDate) && !shareTitle.includes(formattedDateCap)) {
                shareTitle = `${shareTitle.trim()} - ${formattedDateCap}`;
            }

            if (shareDescription.includes('{fecha}')) {
                shareDescription = shareDescription.replace(/\{fecha\}/g, formattedDate);
            } else if (shareDescription.includes('{Fecha}')) {
                shareDescription = shareDescription.replace(/\{Fecha\}/g, formattedDateCap);
            }
        } else {
            // Always ensure the month is present on legacy monthly price routes
            const mesNames = ["", "Enero (Prox. Año)", "Febrero (Prox. Año)", "Marzo (Prox. Año)", "Abril (Prox. Año)", "Mayo (Prox. Año)", "Junio (Prox. Año)", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const preciosMatch = pathOnly.match(/\/precios(\d+)/);
            
            if (preciosMatch) {
                const mesIndex = parseInt(preciosMatch[1], 10);
                if (mesIndex >= 1 && mesIndex <= 12) {
                    const mesName = mesNames[mesIndex];
                    if (!shareTitle.includes(mesName)) {
                        shareTitle = `${shareTitle} de ${mesName}`;
                    }
                }
            }
        }

        const shareImageUrl = headerConfig.shareImageUrl;
        
        // Canonical URL
        const baseUrl = process.env.FRONTEND_BASE_URL || (host ? `https://${host}` : 'https://melishare-redirect-payo.web.app');
        let canonicalUrl = `${baseUrl}${pathOnly === '/' ? '/' : pathOnly}`;
        
        // Eliminar trailing slash solo si es una subpágina
        if (pathOnly !== '/' && canonicalUrl.endsWith('/')) {
            canonicalUrl = canonicalUrl.slice(0, -1);
        }

        // Redirección adicional para index.html (evitar duplicados)
        if (pathOnly === '/index.html') {
            return res.redirect(301, `/${queryString}`);
        }

        // 2. Read the index.html file
        let html;
        try {
            html = fs.readFileSync(path.join(__dirname, 'index_template.html'), 'utf-8');
        } catch (e) {
            console.error("index.html not found, using fallback", e);
            html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>__TITLE__</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
        }

        // 3. Inject/Replace Meta Tags
        const twitterCardType = (shareImageUrl && shareImageUrl.trim() !== "") ? "summary_large_image" : "summary";
        
        let metaTags = `
    <!-- Dynamic Open Graph Tags -->
    <meta property="og:title" content="${shareTitle}" />
    <meta property="og:description" content="${shareDescription}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="${twitterCardType}" />
    <meta name="twitter:title" content="${shareTitle}" />
    <meta name="twitter:description" content="${shareDescription}" />
    <link rel="canonical" href="${canonicalUrl}" />`;

        if (shareImageUrl && shareImageUrl.trim() !== "") {
            metaTags += `
    <meta property="og:image" content="${shareImageUrl}" />
    <meta name="twitter:image" content="${shareImageUrl}" />`;
        } else {
            // Explícitamente evitar que WhatsApp/redes usen el favicon como fallback proporcionando una URL falsa
            metaTags += `
    <meta property="og:image" content="${baseUrl}/no-image-preview" />
    <meta name="twitter:image" content="${baseUrl}/no-image-preview" />`;
        }

        let modifiedHtml = html
            .replace(/<title>.*?<\/title>/, `<title>${shareTitle}</title>`)
            .replace('</head>', `${metaTags}\n</head>`);

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.status(200).send(modifiedHtml);
    } catch (error) {
        console.error("Error in servePrecios:", error);
        res.status(500).send("Internal Server Error");
    }
}

module.exports = { servePrecios };
