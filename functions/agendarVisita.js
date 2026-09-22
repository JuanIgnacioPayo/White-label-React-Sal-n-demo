const { onRequest } = require("firebase-functions/v2/https");
const { getDatabase } = require("firebase-admin/database");
const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
const cors = require("cors")({ origin: true });

exports.agendarVisita = onRequest({ memory: "256MiB", maxInstances: 10 }, (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { nombre, telefono, start, end, originalEventId } = req.body;

        if (!nombre || !start || !end) {
            return res.status(400).send({ error: "Faltan datos obligatorios (nombre, start, end)" });
        }

        try {
            const db = getDatabase();
            
            // 1. Get Calendar IDs
            const calendarIdsSnap = await db.ref('config/calendarIDs').once('value');
            const calendarIds = calendarIdsSnap.exists() ? calendarIdsSnap.val() : {};
            const scheduledVisitsCalendarId = calendarIds.scheduledVisitsCalendarId;
            const visitSlotsCalendarId = calendarIds.visitSlotsCalendarId || "a0fjsiu8np8eq3nhsg8lgjg6io@group.calendar.google.com";

            if (!scheduledVisitsCalendarId) {
                return res.status(500).send({ error: "El calendario de visitas confirmadas no está configurado en el sistema." });
            }

            // 2. Get Service Account Credentials
            let serviceAccountKey = null;
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                try {
                    serviceAccountKey = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
                } catch (e) {
                    if (require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
                        serviceAccountKey = JSON.parse(require('fs').readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
                    }
                }
            }

            if (!serviceAccountKey) {
                const saSnap = await db.ref('config/google/serviceAccountKey').once('value');
                if (saSnap.exists()) {
                    serviceAccountKey = saSnap.val();
                    if (typeof serviceAccountKey === 'string') {
                        serviceAccountKey = JSON.parse(serviceAccountKey);
                    }
                }
            }

            // 3. Auth and Create Event
            let auth;
            if (serviceAccountKey) {
                auth = new GoogleAuth({
                    credentials: serviceAccountKey,
                    scopes: ['https://www.googleapis.com/auth/calendar.events']
                });
            } else {
                // Fallback to ADC (App Engine default service account)
                auth = new GoogleAuth({
                    scopes: ['https://www.googleapis.com/auth/calendar.events']
                });
            }
            const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });

            const event = {
                summary: `Visita: ${nombre} - ${telefono || ''}`,
                description: `Generado automáticamente desde la web.`,
                start: {
                    dateTime: start, // ISO string
                },
                end: {
                    dateTime: end, // ISO string
                }
            };

            const response = await calendar.events.insert({
                calendarId: scheduledVisitsCalendarId,
                resource: event,
            });

            // 4. Move original available slot to 30 mins earlier
            if (originalEventId && visitSlotsCalendarId) {
                try {
                    const originalNewStart = new Date(new Date(start).getTime() - 30 * 60000).toISOString();
                    const originalNewEnd = new Date(new Date(end).getTime() - 30 * 60000).toISOString();
                    
                    await calendar.events.patch({
                        calendarId: visitSlotsCalendarId,
                        eventId: originalEventId,
                        resource: {
                            start: { dateTime: originalNewStart },
                            end: { dateTime: originalNewEnd }
                        }
                    });
                } catch (patchError) {
                    console.error("No se pudo mover el evento original (naranja). Puede que falten permisos de edición en ese calendario.", patchError);
                    try {
                        await getDatabase().ref(`alertas/visitas/${Date.now()}`).set({
                            mensaje: `Se agendó la visita de ${nombre} correctamente, pero no se pudo mover el bloque naranja en tu calendario. Probablemente falten permisos de "Hacer cambios en eventos".`,
                            fecha: new Date().toISOString(),
                            leido: false
                        });
                    } catch(e) {}
                    // No abortamos si falla, porque la reserva principal ya se hizo.
                }
            }

            return res.status(200).send({ 
                success: true, 
                eventId: response.data.id,
                htmlLink: response.data.htmlLink
            });

        } catch (error) {
            console.error("Error agendando visita:", error);
            try {
                await getDatabase().ref(`alertas/visitas/${Date.now()}`).set({
                    mensaje: `Falló la agenda automática de la visita para ${nombre || 'Cliente'}. Motivo: ${error.message}. Por favor, agendá la visita manualmente.`,
                    fecha: new Date().toISOString(),
                    leido: false
                });
            } catch (alertErr) {
                console.error("No se pudo escribir la alerta", alertErr);
            }
            return res.status(500).send({ error: error.message || "Error interno del servidor" });
        }
    });
});
