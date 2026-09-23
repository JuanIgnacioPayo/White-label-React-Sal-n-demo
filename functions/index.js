const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions/v2");
const fs = require('fs');
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onValueCreated } = require("firebase-functions/v2/database");require('dotenv').config({ path: '.env.local' });

let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  } catch (e) {
    if (fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    }
  }
}

if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp(
    serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : undefined
  );
}

const geminiApiKey = process.env.GEMINI_API_KEY;

// Helper to get Groq instance (Dynamic Key)
async function getGroqAI(db) {
  const Groq = require("groq-sdk");
  let key = process.env.GROQ_API_KEY; // Default fallback

  try {
    const keySnapshot = await db.ref('config/apiKeys/groq').once('value');
    if (keySnapshot.exists() && keySnapshot.val().trim() !== '') {
      let rawKey = keySnapshot.val().trim();
      // Remove wrapping double or single quotes if present
      if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
        rawKey = rawKey.substring(1, rawKey.length - 1).trim();
      }
      if (rawKey === 'leaked_key_removed') {
        logger.warn("Database Groq key is the known invalid key. Falling back to env key.");
      } else {
        key = rawKey;
        logger.info("Using dynamic Groq API Key from DB");
      }
    } else {
      logger.info("Using default Groq API Key from Env");
    }
  } catch (e) {
    logger.error("Error fetching dynamic API key, using fallback:", e);
  }

  if (!key) {
    throw new HttpsError('internal', 'Groq API Key not configured.');
  }
  return new Groq({ apiKey: key });
}

// const genAI = new GoogleGenerativeAI(geminiApiKey); // REMOVED GLOBAL INSTANCE

async function getHolidayData() {
  const { google } = require('googleapis');
  const { GoogleAuth } = require('google-auth-library');
  const db = admin.database();
  const CALENDAR_API_KEY = process.env.CALENDAR_API_KEY;

  if (!CALENDAR_API_KEY) {
    logger.error("CALENDAR_API_KEY is not set.");
    throw new HttpsError('internal', 'CALENDAR_API_KEY is not configured.');
  }

  const calendar = google.calendar({ version: 'v3', auth: new GoogleAuth().fromAPIKey(CALENDAR_API_KEY) });
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const holidaysCalendarIdRef = db.ref('config/calendarIDs/holidaysCalendarId');
  const holidaysCalendarIdSnapshot = await holidaysCalendarIdRef.once('value');
  const holidaysCalendarId = holidaysCalendarIdSnapshot.val();

  if (!holidaysCalendarId) {
    throw new HttpsError('internal', 'Holidays calendar ID not configured.');
  }

  let googleHolidays = [];
  try {
    const response = await calendar.events.list({
      calendarId: holidaysCalendarId,
      timeMin: new Date(currentYear, 0, 1).toISOString(),
      timeMax: new Date(nextYear, 11, 31).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    googleHolidays = response.data.items.map(event => ({
      date: event.start.date,
      name: event.summary
    }));
  } catch (error) {
    logger.error('Error fetching Google holidays:', error);
  }

  let modifiedHolidays = { added: {}, removed: {} };
  try {
    const modifiedSnapshot = await db.ref('feriados_modificados').once('value');
    if (modifiedSnapshot.exists()) {
      const data = modifiedSnapshot.val();
      modifiedHolidays = {
        added: data.added || {},
        removed: data.removed || {}
      };
    }
  } catch (error) {
    logger.error('Error fetching modified holidays from Firebase:', error);
  }

  let recurringHolidays = {};
  try {
    const recurringSnapshot = await db.ref('feriados_recurrentes').once('value');
    if (recurringSnapshot.exists()) {
      recurringHolidays = recurringSnapshot.val();
    }
  } catch (error) {
    logger.error('Error fetching recurring holidays from Firebase:', error);
  }

  return { googleHolidays, modifiedHolidays, recurringHolidays };
}

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://melishare-redirect-payo.web.app";

function generatePriceLink(dateString, holidayData, activeVersion, activeScheduleStructure) {
  const { googleHolidays, modifiedHolidays, recurringHolidays } = holidayData;

  const clickedDate = new Date(dateString + 'T00:00:00');
  const dayOfWeek = clickedDate.getDay();
  const day = clickedDate.getDate();
  const month = clickedDate.getMonth();
  const monthDayKey = `${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  let isFeriado = false;
  if (Object.values(modifiedHolidays.added).some(h => h.date === dateString)) isFeriado = true;
  if (Object.values(recurringHolidays).some(h => h.monthDay === monthDayKey)) isFeriado = true;

  const isGoogleHoliday = googleHolidays.some(h => h.date === dateString);
  const isManuallyRemoved = modifiedHolidays.removed[dateString.replace(/-/g, '')];

  if (isGoogleHoliday && !isManuallyRemoved) isFeriado = true;

  let alquilerId = null;
  if (activeScheduleStructure === 'fixed') {
    if (day === 24 && month === 11) alquilerId = 13;
    else if (day === 31 && month === 11) alquilerId = 14;
    else if (isFeriado || dayOfWeek === 0 || dayOfWeek === 6) alquilerId = 3;
    else if (dayOfWeek >= 1 && dayOfWeek <= 5) alquilerId = 1;
  } else {
    // Dynamic (default)
    if (day === 24 && month === 11) alquilerId = 13;
    else if (day === 31 && month === 11) alquilerId = 14;
    else if (isFeriado || dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) alquilerId = 3;
    else if (dayOfWeek >= 1 && dayOfWeek <= 4) alquilerId = 1;
  }

  if (!alquilerId) return null;

  const params = new URLSearchParams();
  params.set('fecha', dateString);
  params.set(`item_${alquilerId}_id`, alquilerId);
  params.set(`item_${alquilerId}_cantidad`, 1);
  params.set('v', activeVersion || 2);

  const finalLink = `${FRONTEND_BASE_URL}/precios?${params.toString()}`;
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const dayName = dayNames[dayOfWeek];

  return { link: finalLink, dayName };
}

exports.askAI = onCall({
  timeoutSeconds: 300,
  memory: "1GiB",
  cors: true,
  invoker: 'public'
}, async (request) => {
  const userPrompt = request.data.prompt;
  if (!userPrompt) throw new HttpsError('invalid-argument', 'Missing prompt.');

  // Initialize Groq dynamically
  const genAI = await getGroqAI(admin.database());
  // Dynamic Key Fetch removed hardcoded logics
  try {
    let knowledgeBase;
    if (process.env.NODE_ENV !== 'production') {
      try {
        knowledgeBase = JSON.parse(fs.readFileSync('functions/bot_data_extended.txt', 'utf8'));
      } catch (e) { /* fallback empty or error */ }
    } else {
      try {
        const fileContent = await admin.storage().bucket().file('knowledge_base/bot_data_extended.json').download();
        knowledgeBase = JSON.parse(fileContent[0].toString('utf8'));
      } catch (e) {
        throw new Error("KB fetch failed: " + e.message);
      }
    }

    let systemPromptContent = "";
    if (process.env.NODE_ENV !== 'production') {
      try {
        systemPromptContent = fs.readFileSync('functions/system_prompt.txt', 'utf8');
      } catch (e) { /* fallback */ }
    } else {
      try {
        const fileContent = await admin.storage().bucket().file('knowledge_base/system_prompt.txt').download();
        systemPromptContent = fileContent[0].toString('utf8');
      } catch (e) {
        logger.error("Failed to fetch system_prompt.txt", e);
      }
    }

    if (!systemPromptContent) {
      systemPromptContent = `Eres Bot. Responde solo con JSON: ${JSON.stringify(knowledgeBase)}`;
    }

    let activeVersion = 2; // Default
    let activeScheduleStructure = 'dynamic'; // Default

    // --- DYNAMIC PRICE INJECTION START ---
    let futurePricingTable = "\n\n=== TABLA DE PRECIOS FUTUROS (USAR ESTA TABLA PARA CUALQUIER COTIZACIÓN) ===\n";
    try {
      const db = admin.database();
      const now = new Date();
      // Adjust for timezone -3 (Argentina)
      now.setHours(now.getHours() - 3);

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      // Fetch base year config
      const yearConfigSnapshot = await db.ref('datosId/26').once('value');
      let baseYear = currentYear; // Default to current if not found, though likely 2025

      if (yearConfigSnapshot.exists()) {
        const yearConfig = yearConfigSnapshot.val();
        // y_ano1 is stored as a number like 2025
        if (yearConfig.y_ano1) {
          baseYear = parseInt(yearConfig.y_ano1);
        }
      }

      // Fetch Active Price Version
      const activeVersionSnapshot = await db.ref('config/activePriceVersion').once('value');
      if (activeVersionSnapshot.exists()) {
        activeVersion = activeVersionSnapshot.val();
      }
      logger.info(`[DynamicPrice] Active Version found: ${activeVersion}`);

      // Fetch Active Schedule Structure
      const scheduleSnapshot = await db.ref('config/activeScheduleStructure').once('value');
      if (scheduleSnapshot.exists()) {
        activeScheduleStructure = scheduleSnapshot.val();
      }

      // Calculate the corrected month index
      // If baseYear is 2025 and current is Jan 2026: (2026 - 2025) * 12 + 1 = 13
      let monthIndex = (currentYear - baseYear) * 12 + currentMonth;

      // Fallback/Safety: if calculation goes wrong or negative (unlikely unless system time is wrong), default to currentMonth
      if (monthIndex < 1) monthIndex = currentMonth;

      logger.info(`[DynamicPrice] Calculated baseYear: ${baseYear}, currentYear: ${currentYear}, monthIndex: ${monthIndex}`);
      
      // 1. Inyectar precio del mes actual en el Knowledge Base (para retrocompatibilidad)
      const currentPricesSnapshot = await db.ref(`datosId/${monthIndex}`).once('value');
      if (currentPricesSnapshot.exists()) {
        const prices = currentPricesSnapshot.val();
        const updatePriceInKB = (kb, serviceNamePartial, newPrice) => {
          if (!kb.services || !newPrice) return;
          const service = kb.services.find(s => s.name.includes(serviceNamePartial));
          if (service) service.price = `${newPrice} ARS`;
        };
        updatePriceInKB(knowledgeBase, "Alquiler de Salón (Viernes, Sábados", prices.a_precio_4hs_);
        updatePriceInKB(knowledgeBase, "Alquiler de Salón (Lunes a Jueves", prices.b_precio_3hs_);
        updatePriceInKB(knowledgeBase, "Hora Extra de Evento (Fines de semana", prices.c_hora_extra_finde_);
        updatePriceInKB(knowledgeBase, "Hora Extra de Evento (Lunes a Jueves)", prices.d_hora_extra_semana_);
        if (knowledgeBase.pricing_notes && prices.l_seña_) {
          knowledgeBase.pricing_notes.deposit = `Seña de ${prices.l_seña_} ARS para congelar el precio. El restante se puede pagar hasta el día del evento. Las señas no se devuelven bajo ningún concepto.`;
        }
      }

      // 2. Construir la Tabla de Precios Futuros (Próximos 12 meses)
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      
      for (let i = 0; i < 12; i++) {
        const fetchIndex = monthIndex + i;
        const offsetTotalMonths = (currentMonth - 1) + i;
        const displayYear = currentYear + Math.floor(offsetTotalMonths / 12);
        const displayMonthIndex = offsetTotalMonths % 12;
        const displayMonthName = monthNames[displayMonthIndex];

        const futurePricesSnapshot = await db.ref(`datosId/${fetchIndex}`).once('value');
        if (futurePricesSnapshot.exists()) {
          const fp = futurePricesSnapshot.val();
          // Solo agregar si tiene precios definidos
          if (fp.a_precio_4hs_ || fp.b_precio_3hs_) {
            futurePricingTable += `- ${displayMonthName} ${displayYear}:\n`;
            if (fp.a_precio_4hs_) futurePricingTable += `  * ${activeScheduleStructure === 'fixed' ? 'Sábados, Domingos y Feriados' : 'Viernes, Sábados, Domingos y Feriados'} (4hs): $${fp.a_precio_4hs_}\n`;
            if (fp.b_precio_3hs_) futurePricingTable += `  * ${activeScheduleStructure === 'fixed' ? 'Lunes a Viernes' : 'Lunes a Jueves'} (3hs): $${fp.b_precio_3hs_}\n`;
            if (fp.c_hora_extra_finde_) futurePricingTable += `  * Hora extra Finde: $${fp.c_hora_extra_finde_}\n`;
            if (fp.d_hora_extra_semana_) futurePricingTable += `  * Hora extra Semana: $${fp.d_hora_extra_semana_}\n`;
            if (fp.l_seña_) futurePricingTable += `  * Seña requerida: $${fp.l_seña_}\n`;
          }
        }
      }
      futurePricingTable += "=========================================================================\n\n";

      // 3. Construir la Tabla de Servicios Opcionales (Proyector, Arcade, etc.)
      const optionalServicesSnapshot = await db.ref('optionalServices').once('value');
      if (optionalServicesSnapshot.exists()) {
        const optionalServices = optionalServicesSnapshot.val();
        let optionalTable = "=== SERVICIOS OPCIONALES EXTRAS ===\n";
        const osArray = Array.isArray(optionalServices) ? optionalServices.filter(s => s) : Object.values(optionalServices).filter(s => s);
        osArray.forEach(os => {
          if (os && os.name) {
            optionalTable += `- ${os.name}: ${os.price} ARS\n`;
            if (os.description) optionalTable += `  Descripción: ${os.description}\n`;
          }
        });
        optionalTable += "===================================\n\n";
        futurePricingTable += optionalTable;
      }

    } catch (priceError) {
      logger.error("[DynamicPrice] Error fetching/injecting dynamic prices:", priceError);
      futurePricingTable = ""; // Si hay error, no agregar tabla
    }
    // --- DYNAMIC PRICE INJECTION END ---

    // --- SCHEDULE STRUCTURE INJECTION START ---
    if (activeScheduleStructure === 'fixed') {
      if (knowledgeBase.services) {
         const s1 = knowledgeBase.services.find(s => s.name && s.name.includes("Lunes a Jueves"));
         if (s1) s1.name = s1.name.replace("Lunes a Jueves", "Lunes a Viernes");
         const s2 = knowledgeBase.services.find(s => s.name && s.name.includes("Viernes, Sábados"));
         if (s2) s2.name = s2.name.replace("Viernes, Sábados", "Sábados");
      }
      systemPromptContent += `\n\nATENCIÓN (REGLA DE HORARIOS OBLIGATORIA): LA ESTRUCTURA DE HORARIOS ACTUAL ES "FIJA" (Fixed Schedule). \nESTO SIGNIFICA QUE LOS DÍAS VIERNES SE CONSIDERAN EXCLUSIVAMENTE COMO "DÍA DE SEMANA" (LUNES A VIERNES) A NIVEL DE PRECIOS Y HORARIOS. \nNO DES PRECIOS NI REGLAS DE FIN DE SEMANA PARA NINGÚN VIERNES. \nSOLO LOS SÁBADOS, DOMINGOS Y FERIADOS SE CONSIDERAN FIN DE SEMANA.`;
    }
    // --- SCHEDULE STRUCTURE INJECTION END ---
    const systemPrompt = systemPromptContent.replace('${JSON.stringify(knowledgeBase)}', JSON.stringify(knowledgeBase)) + (typeof futurePricingTable !== 'undefined' ? futurePricingTable : "");
    
    const modelName = "openai/gpt-oss-120b"; 
    logger.info(`[askAI] Initializing model: ${modelName}. Prompt: ${userPrompt.substring(0, 50)}... SystemPrompt len: ${systemPrompt.length}`);
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "generatePriceLink",
          description: "Generates price link",
          parameters: { 
            type: "object", 
            properties: { dateString: { type: "string", description: "Fecha en formato YYYY-MM-DD" } }, 
            required: ["dateString"] 
          }
        }
      }
    ];

    let result = await genAI.chat.completions.create({
      model: modelName,
      messages: messages,
      tools: tools,
      tool_choice: "auto"
    });

    const responseMessage = result.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === "generatePriceLink") {
        const args = JSON.parse(toolCall.function.arguments);
        const holidayData = await getHolidayData();
        const linkData = generatePriceLink(args.dateString, holidayData, activeVersion, activeScheduleStructure); 
        
        messages.push(responseMessage);
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "generatePriceLink",
          content: JSON.stringify(linkData || { error: "Failed" })
        });

        result = await genAI.chat.completions.create({
          model: modelName,
          messages: messages
        });
        
        return { response: result.choices[0].message.content };
      }
    }

    return { response: responseMessage.content };

  } catch (error) {
    logger.error("[askAI] Error:", error.message, error.stack);
    throw new HttpsError('internal', error.message || 'AI Error');
  }
});

exports.saveAiSystemPrompt = onCall({ cors: true, invoker: 'public' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
  await admin.storage().bucket().file('knowledge_base/system_prompt.txt').save(req.data.content);
  return { success: true };
});

exports.uploadKnowledgeBase = onCall({ cors: true, invoker: 'public' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Auth required');
  JSON.parse(req.data.content);
  await admin.storage().bucket().file('knowledge_base/bot_data_extended.json').save(req.data.content, { contentType: 'application/json' });
  return { success: true };
});


const cors = require("cors")({ origin: true });
exports.checkCalendarEvent = onRequest({}, (req, res) => {
  cors(req, res, async () => {
    const { google } = require('googleapis');
    const { GoogleAuth } = require('google-auth-library');
    const { date, summaryText } = req.body.data;
    if (!date || !summaryText) return res.status(400).send({ error: { message: "Missing params" } });

    try {
      const db = admin.database();
      const eventsCalendarId = (await db.ref('config/calendarIDs/eventsCalendarId').once('value')).val();
      if (!eventsCalendarId) return res.status(500).send({ error: { message: "No calendar ID" } });

      let serviceAccountKey = null;
      try {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          serviceAccountKey = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        }
      } catch (e) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
          serviceAccountKey = JSON.parse(require('fs').readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
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

      if (!serviceAccountKey) {
        return res.status(500).send({ error: { message: "No Google Service Account credentials found in env or database." } });
      }

      const auth = new GoogleAuth({ credentials: serviceAccountKey, scopes: ['https://www.googleapis.com/auth/calendar.readonly'] });
      const calendar = google.calendar({ version: 'v3', auth: await auth.getClient() });

      const timeMin = new Date(date);
      const timeMax = new Date(timeMin.getTime() + (24 * 60 * 60 * 1000));

      const response = await calendar.events.list({
        calendarId: eventsCalendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        key: process.env.CALENDAR_API_KEY
      });

      const events = response.data.items;
      let isSynced = false;
      const foundCalendarEvents = [];
      const cleanStr = (s) => (s || '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim().toLowerCase();
      const targetClean = cleanStr(summaryText);

      if (events) {
        events.forEach(event => {
          foundCalendarEvents.push({ summary: event.summary, start: event.start, end: event.end, htmlLink: event.htmlLink });
          if (cleanStr(event.summary) === targetClean) isSynced = true;
        });
      }
      res.status(200).send({ data: { isSynced, eventCount: events?.length || 0, calendarEvents: foundCalendarEvents } });
    } catch (error) {
      res.status(500).send({ error: { message: "Internal Error" } });
    }
  });
});

exports.getBillingAmount = onCall({
  cors: ["http://localhost:5173", "https://melishare-redirect-payo.web.app", "https://melishare-redirect-payo.firebaseapp.com"],
  memory: "512MiB",
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentcation required.');
  try {
    const { getCurrentCost } = require("./billingService");
    return await getCurrentCost();
  } catch (error) {
    logger.error(`Error fetching billing amount:`, error);
    throw new HttpsError('internal', 'Error.', error.message);
  }
});

const { servePrecios } = require("./servePrecios");
exports.precios = onRequest({
  memory: "512MiB",
  cors: true
}, servePrecios);

// Notificaciones en tiempo real para Feedback/Bugs
exports.onFeedbackCreated = onValueCreated({
  ref: "feedback/{id}"
}, async (event) => {
  const data = event.data.val();
  const id = event.params.id;

  logger.info(`🚨 Nuevo feedback detectado [${id}]: ${data.type}`);

  // 1. Preparar mensaje
  const typeText = data.type === 'bug' ? '⚠️ BUG REPORTADO' : '💡 SUGERENCIA';
  const messageText = `${typeText}\n\n"${data.description}"\n\nPágina: ${data.page || 'N/A'}`;

  // 2. Notificación Push a la APP Android (vía FCM)
  const pushPayload = {
    notification: {
      title: typeText,
      body: data.description.substring(0, 100) + (data.description.length > 100 ? '...' : ''),
    },
    topic: 'admin_alerts', // Cambiado a un tópico genérico de administración
    data: {
      id: id,
      type: data.type,
      page: data.page || '',
      click_action: 'FLUTTER_NOTIFICATION_CLICK' // Opcional, según la app
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'feedback_channel'
      }
    }
  };

  const notificationPromises = [];

  try {
    notificationPromises.push(admin.messaging().send(pushPayload));
    logger.info("Push notification sent to topic 'admin_alerts'");
  } catch (err) {
    logger.error("Error sending push notification:", err);
  }

  // 3. WhatsApp vía CallMeBot (OPCIONAL/PLACEHOLDER - El usuario debe habilitarlo)
  // Para usar esto, el usuario debe proveer PHONE y APIKEY en config/notifications/callmebot
  try {
    const configSnap = await admin.database().ref('config/notifications/whatsapp/callmebot').once('value');
    if (configSnap.exists()) {
      const { phone, apikey, enabled } = configSnap.val();
      if (enabled && phone && apikey) {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const encodedText = encodeURIComponent(`📢 *NOTIFICACIÓN SALÓN*\n\n${messageText}`);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${apikey}`;
        notificationPromises.push(fetch(url));
        logger.info("WhatsApp alert triggered via CallMeBot");
      }
    }
  } catch (err) {
    logger.error("WhatsApp notification failed:", err);
  }

  // 4. Email vía Nodemailer (Placeholder funcional)
  try {
    const emailConfigSnap = await admin.database().ref('config/notifications/email').once('value');
    if (emailConfigSnap.exists()) {
      const { to, enabled, service, user, pass } = emailConfigSnap.val();
      if (enabled && to && user && pass) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: service || 'gmail',
          auth: { user, pass }
        });

        const mailOptions = {
          from: `"Plataforma Salones Demo" <${user}>`,
          to: to,
          subject: `${typeText}: Nuevo reporte recibido`,
          text: messageText
        };

        notificationPromises.push(transporter.sendMail(mailOptions));
        logger.info("Email alert sent");
      }
    }
  } catch (err) {
    logger.error("Email notification failed:", err);
  }

  await Promise.allSettled(notificationPromises);
  return null;
});

const AfipService = require('./afipService');

exports.generarFacturaAFIP = onCall({ cors: true, invoker: 'public' }, async (request) => {
    const data = request.data;
    
    // Auth check
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { presupuestoId, path, importeTotal, docTipo, docNro, fechaEvento, emisor } = data;
    if (!presupuestoId || !path || !importeTotal) {
        throw new HttpsError('invalid-argument', 'Missing required arguments');
    }

    try {
        const db = admin.database();
        
        // Cargar Configuración de AFIP desde la BD
        const configSnap = await db.ref('config/afip').once('value');
        const config = configSnap.val() || {};
        
        let cuit = config.cuit || "23056951954"; // CUIT fallback (de Maria Luisa)
        let puntoVenta = parseInt(config.puntoVenta || 4, 10); // Lee desde config, default 4
        
        if (emisor === 'juan') {
            cuit = config.cuitJuan || "20325938081"; // CUIT de Juan Ignacio
            puntoVenta = parseInt(config.puntoVentaJuan || 5, 10);
        }

        const limiteConsumidorFinal = parseFloat(config.limiteConsumidorFinal || 191000);

        const afipService = new AfipService(cuit);

        let facturasResult = [];
        
        let razonSocialArca = data.razonSocial || null;
        let domicilioArca = null;
        let condicionIvaArca = null;

        if (docNro && docNro !== 0 && docNro !== '0') {
            try {
                const docNroCleanForLookup = String(docNro).replace(/[^0-9]/g, '');
                const datosArca = await afipService.obtenerDatosContribuyente(parseInt(docNroCleanForLookup, 10));
                
                if (datosArca) {
                    if (!razonSocialArca) razonSocialArca = datosArca.razonSocial;
                    domicilioArca = datosArca.domicilio;
                    condicionIvaArca = datosArca.condicionIva;
                    logger.info("Datos obtenidos de ARCA:", { cuit: docNroCleanForLookup, razonSocial: razonSocialArca, domicilio: domicilioArca, condicionIva: condicionIvaArca });
                }
            } catch (lookupError) {
                logger.warn("No se pudo obtener datos completos de ARCA, se usará fallback:", lookupError.message);
            }
        }
        
        logger.info("=== AFIP FACTURA REQUEST ===", {
            emisor: emisor,
            cuitEmisor: cuit,
            puntoVenta: puntoVenta,
            docTipo: docTipo,
            docNro: docNro,
            importeTotal: importeTotal,
            fechaEvento: fechaEvento,
            presupuestoId: presupuestoId,
            razonSocialArca: razonSocialArca
        });

        // Si no hay DNI/CUIT (Consumidor Final Genérico) fraccionar si es necesario
        if (!docNro || docNro === 0 || docNro === '0') {
            facturasResult = await afipService.facturarConsumidorFinalConFraccionamiento({
                importeTotal: parseFloat(importeTotal),
                limiteConsumidorFinal: limiteConsumidorFinal,
                puntoVenta: puntoVenta,
                fechaEvento: fechaEvento
            });
        } else {
            // Factura con documento identificado (un solo ticket)
            // Sanitizar CUIT/DNI: quitar guiones y caracteres no numéricos
            const docNroClean = String(docNro).replace(/[^0-9]/g, '');
            logger.info("DocNro sanitizado:", { original: docNro, clean: docNroClean, parsed: parseInt(docNroClean, 10) });
            const factura = await afipService.crearFacturaC({
                importe: parseFloat(importeTotal),
                docTipo: parseInt(docTipo, 10),
                docNro: parseInt(docNroClean, 10),
                puntoVenta: puntoVenta,
                fechaEvento: fechaEvento
            });
            facturasResult.push({ ...factura, monto: parseFloat(importeTotal) });
        }

        // Agregar detalles de ARCA a cada factura si se obtuvieron
        facturasResult = facturasResult.map(f => ({ 
            ...f, 
            razonSocialArca,
            domicilioArca,
            condicionIvaArca
        }));

        // Guardar resultado en el presupuesto
        const presupuestoRef = db.ref(`presupuestos/${path}/${presupuestoId}`);
        await presupuestoRef.update({
            facturaAFIP: facturasResult,
            facturado: true,
            cuitEmisor: cuit,
            fechaFacturacion: new Date().toISOString()
        });

        return { success: true, facturas: facturasResult };
        
    } catch (error) {
        logger.error("Error en generarFacturaAFIP:", {
            message: error.message,
            data: error.data || 'No data',
            status: error.status || 'No status',
            stack: error.stack
        });
        throw new HttpsError('internal', error.message);
    }
});

exports.anularFacturaAFIP = onCall({ cors: true, invoker: 'public' }, async (request) => {
    const data = request.data;
    if (!request.auth) throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');

    const { presupuestoId, path, facturaIndex } = data;
    if (!presupuestoId || !path || facturaIndex === undefined) {
        throw new HttpsError('invalid-argument', 'Missing required arguments');
    }

    try {
        const db = admin.database();
        const presupuestoRef = db.ref(`presupuestos/${path}/${presupuestoId}`);
        const snapshot = await presupuestoRef.once('value');
        const presupuesto = snapshot.val();

        if (!presupuesto || !presupuesto.facturaAFIP || !presupuesto.facturaAFIP[facturaIndex]) {
            throw new HttpsError('not-found', 'Invoice not found in the budget');
        }

        const facturaOriginal = presupuesto.facturaAFIP[facturaIndex];
        if (facturaOriginal.anulada) {
            throw new HttpsError('already-exists', 'Invoice is already annulled');
        }

        const configSnap = await db.ref('config/afip').once('value');
        const config = configSnap.val() || {};
        
        let cuit = config.cuit || '23056951954';
        let puntoVenta = parseInt(config.puntoVenta || 4, 10);
        
        const isJuan = facturaOriginal.puntoVenta === 5 || facturaOriginal.puntoVenta === '5';
        if (isJuan) {
            cuit = config.cuitJuan || '20325938081';
            puntoVenta = parseInt(config.puntoVentaJuan || 5, 10);
        }

        const afipService = new AfipService(cuit);
        const notaCredito = await afipService.crearNotaDeCreditoC({
            importe: facturaOriginal.monto,
            docTipo: facturaOriginal.docTipo || 99,
            docNro: facturaOriginal.docNro || 0,
            puntoVenta: puntoVenta,
            comprobanteAsociado: facturaOriginal.comprobante
        });

        const facturasArray = [...presupuesto.facturaAFIP];
        facturasArray[facturaIndex].anulada = true;
        facturasArray[facturaIndex].notaCredito = notaCredito;

        await presupuestoRef.update({ facturaAFIP: facturasArray });
        return { success: true, notaCredito };
    } catch (error) {
        logger.error('Error en anularFacturaAFIP:', error);
        throw new HttpsError('internal', error.message);
    }
});

// Endpoint para consultar la razón social a ARCA directamente (útil para el frontend al cargar el presupuesto)
exports.consultarRazonSocialAFIP = onCall({ cors: true, invoker: 'public' }, async (request) => {
    try {
        const { cuit, emisor } = request.data;
        if (!cuit) {
            throw new HttpsError('invalid-argument', 'El CUIT es requerido.');
        }

        const cuitClean = String(cuit).replace(/[^0-9]/g, '');
        if (cuitClean.length !== 11) {
            throw new HttpsError('invalid-argument', 'El CUIT debe tener 11 dígitos.');
        }

        // Determinar qué CUIT usar para la consulta (el emisor)
        const db = admin.database();
        const configSnap = await db.ref('config/afip').once('value');
        const config = configSnap.val() || {};

        let emisorCuit = config.cuit || "23056951954"; // CUIT fallback (de Maria Luisa)
        if (emisor === 'juan') {
            emisorCuit = config.cuitJuan || "20325938081";
        }

        const afipService = new AfipService(emisorCuit);
        const datos = await afipService.obtenerDatosContribuyente(parseInt(cuitClean, 10));

        if (!datos || !datos.razonSocial) {
            return { success: false, razonSocial: null, message: "No se encontró la razón social en ARCA." };
        }

        return { success: true, razonSocial: datos.razonSocial, domicilio: datos.domicilio, condicionIva: datos.condicionIva };
    } catch (error) {
        logger.error("Error en consultarRazonSocialAFIP:", error);
        throw new HttpsError('internal', error.message);
    }
});

exports.analizarComprobante = onCall({ cors: true, invoker: 'public', maxInstances: 10, timeoutSeconds: 60 }, async (request) => {
    try {
        const { imageBase64, mimeType } = request.data;
        if (!imageBase64) {
            throw new HttpsError('invalid-argument', 'No se proporcionó imagen.');
        }

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analiza este comprobante de transferencia bancaria.
Extrae el monto transferido (como número sin formato, ej: 150000).
Extrae el CUIT/CUIL de la persona que REALIZA el pago (el originante/remitente).
REGLA IMPORTANTE: El CUIT NO DEBE SER ni 20325938081 (Juan Ignacio Payo) ni 23056951954 (Maria Luisa Elena Bisogno). Si encuentras estos, ignóralos y busca el CUIT del pagador.
Devuelve ÚNICAMENTE un objeto JSON válido con este formato, sin markdown ni comillas invertidas:
{
  "monto": 150000,
  "cuit": "20123456789"
}
Si no encuentras el CUIT, pon null en "cuit". Si no encuentras el monto, pon null en "monto".`;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType || "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        // Parse JSON (remove markdown blocks if any)
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        return { success: true, data };
    } catch (error) {
        logger.error("Error en analizarComprobante:", error);
        throw new HttpsError('internal', error.message);
    }
});

exports.analizarDocumentoInteligente = onCall({ cors: true, invoker: 'public', maxInstances: 10, timeoutSeconds: 60 }, async (request) => {
    try {
        const { fileBase64, mimeType } = request.data;
        if (!fileBase64) {
            throw new HttpsError('invalid-argument', 'No se proporcionó archivo.');
        }

        const groq = await getGroqAI(admin.database());

        const isImage = mimeType.startsWith('image/');
        const isPdf = mimeType === 'application/pdf' || mimeType === 'application/x-pdf';

        if (!isImage && !isPdf) {
             throw new HttpsError('invalid-argument', 'Formato no soportado. Por favor sube un PDF o una Imagen.');
        }

        let documentText = "";
        let messages = [];
        let model = "openai/gpt-oss-120b"; // Groq model para texto
        let responseFormat = { type: "json_object" };

        const basePrompt = `Analiza este documento y determina de qué tipo es. Clasifícalo en una de estas categorías:
1. "COMPROBANTE_TRANSFERENCIA": Si es un comprobante de transferencia de banco/billetera virtual.
2. "FACTURA_SERVICIO": Si es una factura de gas, luz, internet, etc.
3. "RECIBO_SUELDO": Si es un recibo de haberes de empleado.
4. "CARGA_SOCIAL": Si es un pago de cargas sociales (F931 AFIP, Sindicato Empleados de Comercio, aportes de obra social, etc.).
5. "IMPUESTO": Si es un pago de impuestos nacionales, provinciales o municipales (Monotributo, IVA, Ganancias, ABL, Patentes, etc.).
6. "TARJETA_CREDITO": Si es un resumen de tarjeta de crédito (ej: Visa, Mastercard, Galicia, etc.).
7. "OTRO": Si no es ninguno de los anteriores.

Si el documento es una única factura, liquidación, o comprobante que desglosa múltiples conceptos, ATENCIÓN: SÓLO DEBES DEVOLVER EL MONTO TOTAL a pagar por toda la factura. EXCEPCIÓN: Si el documento es un resumen de TARJETA_CREDITO, sí debes separar los gastos como objetos "CONSUMO_TARJETA".

Para COMPROBANTE_TRANSFERENCIA extrae:
- "monto": total transferido (sólo número, sin signo $).
- "cuit": buscar algún CUIT/CUIL del destinatario o del emisor. ATENCIÓN: Si el CUIT leido es 27271427181 (Maria) o 20281427182 (Juan), IGNORARLO, ese es el CUIT dueño del sistema. Buscar otro CUIT en el comprobante que pertenezca al cliente. Si no hay otro, dejar vacío.
- "fecha": Fecha de la transferencia (YYYY-MM-DD).

Para FACTURA_SERVICIO:
- "monto": total a pagar (sólo número).
- "empresa": nombre de la empresa (ej: "Edesur").
- "vencimiento": fecha de vencimiento (YYYY-MM-DD).
- "codigo_barras": si encuentras el código de barras o la serie numérica larga del código de barras (típicamente entre 19 y 60 dígitos, ej: "0281000000..."), extráelo aquí. Si no, deja "".

Para RECIBO_SUELDO:
- "nombre": nombre del empleado.
- "periodo": mes y año abonado (ej: "Julio 2026").
- "monto": sueldo neto (sólo número).

Para CARGA_SOCIAL e IMPUESTO:
- "empresa": si es un sindicato, entidad u organismo recaudador, pon aquí el nombre (ej: "FAECYS", "SEC", "AFIP", "ARBA", "AGIP", "INACAP").
- "concepto": qué se está pagando (ej: "FAECYS - Aporte del 0.5%", "F931 AFIP", "Sindicato", "Monotributo", con detalle si es posible).
- "periodo": mes y año o fecha descriptiva (ej: "Agosto 2026").
- "monto": total a pagar (sólo número).
- "codigo_barras": si ves el código de barras o la serie numérica larga del código de barras (19 a 60 dígitos), extráelo aquí. Si no, deja "".

Para TARJETA_CREDITO:
- "monto": total a pagar de la tarjeta en PESOS (sólo número). IGNORA el monto en dólares y el pago mínimo.
- "empresa": nombre de la tarjeta o banco (ej: "VISA Galicia").
- "vencimiento": fecha de vencimiento actual (YYYY-MM-DD).
- "concepto": pon "Resumen Tarjeta de Crédito".

Si el documento es una TARJETA_CREDITO, TAMBIÉN debes extraer TODOS los gastos detallados en la tabla de consumos. Para cada uno, crea un objeto adicional de tipo "CONSUMO_TARJETA":
Para CONSUMO_TARJETA:
- "monto": el importe de ese consumo en particular (sólo número).
- "empresa": nombre del servicio o establecimiento (ej: "EDESUR", "MERCADOLIBRE", "Spotify").
- "fecha": fecha del consumo (YYYY-MM-DD).
- "concepto": detalle adicional o cuotas (ej: "Cuota 01/03" o dejar vacío si no hay).

OBLIGATORIO: Devuelve tu respuesta EXCLUSIVAMENTE en formato JSON. No incluyas ningún bloque markdown (como \`\`\`json) ni texto adicional fuera del JSON. Devuelve directamente el arreglo de objetos.

Estructura de ejemplo:
[
  {
    "tipo": "IMPUESTO",
    "datos": {
      "monto": 49527.18,
      "cuit": "20325938081",
      "empresa": "AFIP",
      "vencimiento": "2026-08-20",
      "nombre": "",
      "periodo": "08/26",
      "concepto": "Monotributo",
      "fecha": "2026-08-20",
      "codigo_barras": "0281000000123456789012345678901234567890"
    }
  }
]`;

        let pdfBarcode = null;
        if (isPdf) {
            // Extraer texto si es PDF
            const { PDFParse } = require('pdf-parse');
            const buffer = Buffer.from(fileBase64, 'base64');
            const parser = new PDFParse({ data: new Uint8Array(buffer) });
            await parser.load();
            const textObj = await parser.getText();
            documentText = (textObj.text || '').trim();

            // Buscar posibles números de código de barras en el texto del PDF (19 a 60 dígitos)
            const barcodeMatches = documentText.match(/(?:\d[\s\.]*){19,}/g);
            if (barcodeMatches && barcodeMatches.length > 0) {
                const cleanNums = barcodeMatches.map(m => m.replace(/[^\d]/g, '')).filter(num => num.length >= 19 && num.length <= 60);
                if (cleanNums.length > 0) {
                    cleanNums.sort((a, b) => b.length - a.length);
                    pdfBarcode = cleanNums[0];
                }
            }
            
            // OPTIMIZACIÓN: Limitar caracteres para no exceder contexto, dando prioridad a resúmenes de tarjeta
            const isTarjetaDoc = documentText.toUpperCase().includes("TARJETA") || documentText.toUpperCase().includes("VISA") || documentText.toUpperCase().includes("MASTERCARD");
            const pag3Index = documentText.indexOf("Página 3 /");
            
            let cutoffIndex = 8000;
            if (pag3Index > 0) {
                cutoffIndex = pag3Index + 2500;
            } else if (isTarjetaDoc) {
                cutoffIndex = 14000;
            }

            if (documentText.length > 50) {
                // Enough text extracted, use text-based analysis
                messages = [{ role: "user", content: basePrompt + "\n\n=== TEXTO DEL DOCUMENTO ===\n" + documentText.substring(0, cutoffIndex) }];
            } else {
                // PDF has little/no extractable text (scanned or image-based PDF)
                // Fallback: send as image to vision model
                logger.info("PDF text too short (" + documentText.length + " chars), falling back to vision model.");
                model = "openai/gpt-oss-120b";
                messages = [
                    { 
                        role: "user", 
                        content: [
                            { type: "text", text: basePrompt },
                            { type: "image_url", image_url: { url: `data:application/pdf;base64,${fileBase64}` } }
                        ] 
                    }
                ];
            }
        } else if (isImage) {
            // Usar modelo Vision de Groq
            model = "openai/gpt-oss-120b";
            
            messages = [
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: basePrompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } }
                    ] 
                }
            ];
        }
        
        logger.info(`Llamando a Groq API con modelo: ${model}. isPdf: ${isPdf}, isImage: ${isImage}, messages length: ${JSON.stringify(messages).length} chars`);

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.1,
            max_tokens: 6000
        });

        let responseText = completion.choices[0]?.message?.content || "{}";
        
        // PARSER RESILIENTE DE RESPUESTA IA (Maneja arrays, objetos múltiples sin corchetes, wrappers y truncados)
        const parseGroqResponse = (raw) => {
            let cleaned = (raw || "").replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').trim();

            const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (markdownMatch && markdownMatch[1]) {
                cleaned = markdownMatch[1].trim();
            }

            const normalizeData = (parsed) => {
                if (Array.isArray(parsed)) return parsed;
                if (parsed && typeof parsed === 'object') {
                    for (const key of ['documentos', 'items', 'gastos', 'consumos', 'data', 'resultado', 'resultados']) {
                        if (Array.isArray(parsed[key])) return parsed[key];
                    }
                    return [parsed];
                }
                return [parsed];
            };

            // 1. Intento parseo directo
            try {
                return normalizeData(JSON.parse(cleaned));
            } catch (e) {}

            // 2. Extraer entre [ y ]
            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                let arrayCandidate = cleaned.substring(firstBracket, lastBracket + 1).replace(/,\s*([\]}])/g, '$1');
                try {
                    return normalizeData(JSON.parse(arrayCandidate));
                } catch (e) {}
            }

            // 3. Extraer entre { y } (puede ser un objeto único o varios objetos separados por comas)
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                let objectCandidate = cleaned.substring(firstBrace, lastBrace + 1).replace(/,\s*([\]}])/g, '$1');
                try {
                    return normalizeData(JSON.parse(objectCandidate));
                } catch (e) {
                    try {
                        return normalizeData(JSON.parse(`[${objectCandidate}]`));
                    } catch (e2) {}
                }
            }

            // 4. Extracción objeto por objeto si la respuesta quedó truncada o con sintaxis rota
            const extractedObjects = [];
            let depth = 0, objStart = -1, inString = false, escape = false;
            for (let i = 0; i < cleaned.length; i++) {
                const char = cleaned[i];
                if (char === '"' && !escape) inString = !inString;
                else if (char === '\\' && !escape) { escape = true; continue; }
                else if (!inString) {
                    if (char === '{') {
                        if (depth === 0) objStart = i;
                        depth++;
                    } else if (char === '}') {
                        depth--;
                        if (depth === 0 && objStart !== -1) {
                            const singleObjStr = cleaned.substring(objStart, i + 1).replace(/,\s*([\]}])/g, '$1');
                            try {
                                const parsedObj = JSON.parse(singleObjStr);
                                if (parsedObj && (parsedObj.tipo || parsedObj.monto || parsedObj.datos)) {
                                    extractedObjects.push(parsedObj);
                                } else if (parsedObj && Array.isArray(parsedObj.documentos)) {
                                    extractedObjects.push(...parsedObj.documentos);
                                }
                            } catch (err) {}
                            objStart = -1;
                        }
                    }
                }
                escape = false;
            }

            if (extractedObjects.length > 0) {
                return extractedObjects;
            }

            throw new Error(`La IA devolvió un formato inválido. Respuesta cruda: ${cleaned.substring(0, 200)}...`);
        };

        let data = {};
        try {
            data = parseGroqResponse(responseText);
        } catch (parseError) {
            logger.error("Error parseando respuesta de Groq:", responseText);
            throw new HttpsError('internal', parseError.message);
        }

        const enrichItem = (item) => {
            if (!item) return;
            if (!item.datos) item.datos = {};

            if (pdfBarcode && !item.datos.codigo_barras) {
                item.datos.codigo_barras = pdfBarcode;
            }

            const fullDocText = (documentText || "").toUpperCase();
            if (fullDocText.includes("FAECYS") || fullDocText.includes("FEDERACION ARGENTINA DE EMPLEADOS DE COMERCIO") || fullDocText.includes("FEDERACIÓN ARGENTINA DE EMPLEADOS DE COMERCIO")) {
                if (!item.datos.empresa || item.datos.empresa.toUpperCase() === "SINDICATO" || item.datos.empresa.toUpperCase() === "CARGA SOCIAL") {
                    item.datos.empresa = "FAECYS";
                }
                if (!item.datos.concepto || !item.datos.concepto.toUpperCase().includes("FAECYS")) {
                    item.datos.concepto = item.datos.concepto ? `FAECYS - ${item.datos.concepto}` : "FAECYS - Aporte del 0.5%";
                }
            } else if (fullDocText.includes("INACAP") || fullDocText.includes("INSTITUTO ARGENTINO DE CAPACITACION")) {
                if (!item.datos.empresa) item.datos.empresa = "INACAP";
                if (item.datos.concepto && !item.datos.concepto.toUpperCase().includes("INACAP")) {
                    item.datos.concepto = `INACAP - ${item.datos.concepto}`;
                }
            } else if (fullDocText.includes("SINDICATO EMPLEADOS DE COMERCIO") || fullDocText.includes("SINDICATO DE EMPLEADOS DE COMERCIO") || fullDocText.includes("SEC CAPITAL")) {
                if (!item.datos.empresa) item.datos.empresa = "SEC";
                if (item.datos.concepto && !item.datos.concepto.toUpperCase().includes("SEC")) {
                    item.datos.concepto = `SEC - ${item.datos.concepto}`;
                }
            }
        };

        if (Array.isArray(data)) {
            data.forEach(enrichItem);
        } else {
            enrichItem(data);
        }

        return { success: true, data };
    } catch (error) {
        logger.error("Error en analizarDocumentoInteligente:", error);
        throw new HttpsError('internal', error.message);
    }
});

// CRON JOB: Facturación Automática Diaria (10:00 AM)
exports.facturacionAutomaticaDiaria = onSchedule({
    schedule: '0 10 * * *',
    timeZone: 'America/Argentina/Buenos_Aires',
    memory: '256MiB'
}, async (event) => {
    logger.info("Iniciando cron job de facturación automática diaria...");
    const db = admin.database();
    
    // 1. Obtener configuración
    const configSnap = await db.ref('config/afip').once('value');
    const config = configSnap.val() || {};
    
    const autoMaria = config.automatizacionActivada || false;
    const autoJuan = config.automatizacionActivadaJuan || false;
    
    if (!autoMaria && !autoJuan) {
        logger.info("Facturación automática desactivada para ambos CUITs.");
        return null;
    }
    
    const hoy = new Date();
    const añoActual = hoy.getFullYear();
    const mesActualStr = String(hoy.getMonth() + 1).padStart(2, '0');
    
    const presupuestosMesRef = db.ref(`presupuestos/${añoActual}/${mesActualStr}`);
    const presupuestosMesSnap = await presupuestosMesRef.once('value');
    
    let totalFacturadoMesMaria = 0;
    let totalFacturadoMesJuan = 0;
    const eventosMariaHoy = [];
    const eventosJuanHoy = [];
    let turnoMaria = true;

    if (presupuestosMesSnap.exists()) {
        presupuestosMesSnap.forEach(diaSnap => {
            diaSnap.forEach(presupuestoSnap => {
                const pres = presupuestoSnap.val();
                const tieneCuit = pres.cuit && pres.cuit.trim() !== '';
                
                // Sumar lo ya facturado separando por tipo
                if (pres.facturado && pres.facturaAFIP) {
                    pres.facturaAFIP.forEach(f => {
                        if (tieneCuit) {
                            totalFacturadoMesJuan += (f.monto || 0);
                        } else {
                            totalFacturadoMesMaria += (f.monto || 0);
                        }
                    });
                }
                
                // Identificar eventos para facturar hoy
                if (pres.selectedDate && !pres.facturado) {
                    const dateEvento = new Date(pres.selectedDate);
                    const esHoy = dateEvento.getDate() === hoy.getDate() && 
                                  dateEvento.getMonth() === hoy.getMonth() && 
                                  dateEvento.getFullYear() === hoy.getFullYear();
                    
                    if (esHoy) {
                        const totalEvento = pres.totalFinal || 0;
                        if (totalEvento < 1) {
                            logger.warn(`Saltando presupuesto ${presupuestoSnap.key} por tener monto total inválido o 0: ${totalEvento}`);
                            return; // No facturamos montos nulos o negativos
                        }

                        const eventoData = {
                            id: presupuestoSnap.key,
                            path: `${añoActual}/${mesActualStr}/${diaSnap.key}`,
                            total: totalEvento,
                            cuit: pres.cuit || ''
                        };
                        
                        if (tieneCuit) {
                            eventosJuanHoy.push(eventoData);
                        } else {
                            if (autoMaria && autoJuan) {
                                if (turnoMaria) {
                                    eventosMariaHoy.push(eventoData);
                                } else {
                                    eventosJuanHoy.push(eventoData);
                                }
                                turnoMaria = !turnoMaria;
                            } else if (autoJuan) {
                                eventosJuanHoy.push(eventoData);
                            } else {
                                eventosMariaHoy.push(eventoData);
                            }
                        }
                    }
                }
            });
        });
    }

    logger.info(`María - Facturado mes: ${totalFacturadoMesMaria}, Eventos hoy: ${eventosMariaHoy.length}, Auto: ${autoMaria}`);
    logger.info(`Juan - Facturado mes: ${totalFacturadoMesJuan}, Eventos hoy: ${eventosJuanHoy.length}, Auto: ${autoJuan}`);

    // === Facturar María (Consumidor Final) ===
    if (autoMaria && eventosMariaHoy.length > 0) {
        const limiteAnualMaria = parseFloat(config.limiteAnualMonotributo || 0);
        const limiteMensualMaria = limiteAnualMaria / 12;
        const limiteConsumidorFinal = parseFloat(config.limiteConsumidorFinal || 191000);
        const cuitMaria = "23056951954";
        const puntoVentaMaria = parseInt(config.puntoVenta || 4, 10);
        
        const afipServiceMaria = new (require('./afipService'))(cuitMaria);
        
        for (const evento of eventosMariaHoy) {
            if (totalFacturadoMesMaria + evento.total > limiteMensualMaria) {
                logger.warn(`FRENO María: Facturar evento ${evento.id} excedería el límite mensual (${limiteMensualMaria}).`);
                await db.ref(`alertas/facturacion/${Date.now()}`).set({
                    mensaje: `Se pausó la facturación automática de María para el evento ${evento.id} porque excede el límite mensual de monotributo.`,
                    fecha: new Date().toISOString(),
                    leido: false
                });
                continue;
            }
            
            try {
                const facturas = await afipServiceMaria.facturarConsumidorFinalConFraccionamiento({
                    importeTotal: parseFloat(evento.total),
                    limiteConsumidorFinal: limiteConsumidorFinal,
                    puntoVenta: puntoVentaMaria,
                    fechaEvento: new Date().toISOString()
                });
                
                await db.ref(`presupuestos/${evento.path}/${evento.id}`).update({
                    facturaAFIP: facturas,
                    facturado: true,
                    fechaFacturacion: new Date().toISOString(),
                    automatica: true
                });
                
                totalFacturadoMesMaria += evento.total;
                logger.info(`María - Evento ${evento.id} facturado exitosamente.`);
            } catch (e) {
                logger.error(`Error facturando evento automático María ${evento.id}:`, e);
            }
        }
    }

    // === Facturar Juan (Empresas) ===
    if (autoJuan && eventosJuanHoy.length > 0) {
        const limiteAnualJuan = parseFloat(config.limiteAnualMonotributoJuan || 0);
        const limiteMensualJuan = limiteAnualJuan / 12;
        const cuitJuan = "20325938081";
        const puntoVentaJuan = parseInt(config.puntoVentaJuan || 5, 10);
        
        const afipServiceJuan = new (require('./afipService'))(cuitJuan);
        
        for (const evento of eventosJuanHoy) {
            if (totalFacturadoMesJuan + evento.total > limiteMensualJuan) {
                logger.warn(`FRENO Juan: Facturar evento ${evento.id} excedería el límite mensual (${limiteMensualJuan}).`);
                await db.ref(`alertas/facturacion/${Date.now()}`).set({
                    mensaje: `Se pausó la facturación automática de Juan para el evento ${evento.id} porque excede el límite mensual de monotributo.`,
                    fecha: new Date().toISOString(),
                    leido: false
                });
                continue;
            }
            
            try {
                let facturas;
                if (evento.cuit && evento.cuit.trim() !== '') {
                    const cuitClean = String(evento.cuit).replace(/[^0-9]/g, '');
                    const factura = await afipServiceJuan.crearFacturaC({
                        importe: parseFloat(evento.total),
                        docTipo: 80, // 80 = CUIT
                        docNro: parseInt(cuitClean, 10),
                        puntoVenta: puntoVentaJuan,
                        fechaEvento: new Date().toISOString()
                    });
                    facturas = [{ ...factura, monto: parseFloat(evento.total) }];
                } else {
                    const limiteConsumidorFinal = parseFloat(config.limiteConsumidorFinal || 191000);
                    facturas = await afipServiceJuan.facturarConsumidorFinalConFraccionamiento({
                        importeTotal: parseFloat(evento.total),
                        limiteConsumidorFinal: limiteConsumidorFinal,
                        puntoVenta: puntoVentaJuan,
                        fechaEvento: new Date().toISOString()
                    });
                }
                
                await db.ref(`presupuestos/${evento.path}/${evento.id}`).update({
                    facturaAFIP: facturas,
                    facturado: true,
                    fechaFacturacion: new Date().toISOString(),
                    automatica: true
                });
                
                totalFacturadoMesJuan += evento.total;
                logger.info(`Juan - Evento ${evento.id} facturado exitosamente.`);
            } catch (e) {
                logger.error(`Error facturando evento automático Juan ${evento.id}:`, e);
            }
        }
    }

    return null;
});

exports.setBucketCors = onRequest(async (req, res) => {
  const corsConfig = [
    {
      origin: ['*'],
      method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
      maxAgeSeconds: 3600
    }
  ];
  await admin.storage().bucket().setCorsConfiguration(corsConfig);
  res.status(200).send('CORS Configured for bucket');
});

exports.testCredentialsStatus = onCall({ cors: true, invoker: 'public' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('permission-denied', 'Only authenticated users can test credentials.');
  }

  const db = admin.database();
  const results = {
    groq: { ok: false, message: 'No probado' },
    calendar: { ok: false, message: 'No probado' },
    afipMaria: { ok: false, message: 'No probado' },
    afipJuan: { ok: false, message: 'No probado' }
  };

  // Obtener puntos de venta reales configurados
  let puntoVentaMaria = 4;
  let puntoVentaJuan = 5;
  try {
    const configSnap = await db.ref('config').once('value');
    if (configSnap.exists()) {
      const config = configSnap.val();
      puntoVentaMaria = parseInt(config.puntoVenta || 4, 10);
      puntoVentaJuan = parseInt(config.puntoVentaJuan || 5, 10);
    }
  } catch (err) {
    logger.error("Error al obtener puntos de venta de la config:", err.message);
  }

  // 1. Probar Groq AI
  try {
    const genAI = await getGroqAI(db);
    const completion = await genAI.chat.completions.create({
      messages: [{ role: 'user', content: 'Responde con la palabra OK.' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 5
    });
    const reply = completion.choices[0]?.message?.content;
    if (reply && reply.trim().toUpperCase().includes('OK')) {
      results.groq = { ok: true, message: 'Conexión exitosa con Groq AI.' };
    } else {
      results.groq = { ok: false, message: `Groq respondió pero devolvió contenido inesperado: "${reply}"` };
    }
  } catch (e) {
    results.groq = { ok: false, message: `Error: ${e.message}` };
  }

  // 2. Probar Google Calendar
  try {
    const { google } = require('googleapis');
    let serviceAccountKey = null;

    // Primero intentar con la cuenta de servicio de la DB
    const saSnap = await db.ref('config/google/serviceAccountKey').once('value');
    if (saSnap.exists()) {
      serviceAccountKey = saSnap.val();
      if (typeof serviceAccountKey === 'string') {
        serviceAccountKey = JSON.parse(serviceAccountKey);
      }
    }

    // Fallback a variable de entorno
    if (!serviceAccountKey && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        serviceAccountKey = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      } catch (e) {
        if (require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
          serviceAccountKey = JSON.parse(require('fs').readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
        }
      }
    }

    if (serviceAccountKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      });
      const client = await auth.getClient();
      await client.getAccessToken();
      results.calendar = { ok: true, message: 'Autenticación con Cuenta de Servicio (Service Account) exitosa.' };
    } else {
      // Si no hay service account, ver si hay credenciales OAuth cargadas en DB
      const googleSnap = await db.ref('config/google/credentials').once('value');
      if (googleSnap.exists()) {
        const oauthCreds = googleSnap.val();
        if (oauthCreds.installed || oauthCreds.web) {
          results.calendar = { ok: true, message: 'Credenciales OAuth configuradas correctamente en la Base de Datos.' };
        } else {
          results.calendar = { ok: false, message: 'No se encontraron credenciales de Cuenta de Servicio ni OAuth.' };
        }
      } else {
        const calendarApiKey = process.env.CALENDAR_API_KEY;
        if (calendarApiKey) {
          results.calendar = { ok: true, message: 'Calendario accesible mediante API Key pública.' };
        } else {
          results.calendar = { ok: false, message: 'No se encontraron credenciales de Google Calendar.' };
        }
      }
    }
  } catch (e) {
    results.calendar = { ok: false, message: `Error: ${e.message}` };
  }

  // 3. Probar AFIP Maria (CUIT 23056951954)
  try {
    const AfipService = require('./afipService');
    const afipService = new AfipService('23056951954');
    await afipService.ensureInitialized();
    const lastVoucher = await afipService.afip.ElectronicBilling.getLastVoucher(puntoVentaMaria, 11);
    results.afipMaria = { ok: true, message: `Conexión exitosa (Pto Vta ${puntoVentaMaria}). Último comprobante: #${lastVoucher}` };
  } catch (e) {
    results.afipMaria = { ok: false, message: `Error: ${e.message}` };
  }

  // 4. Probar AFIP Juan (CUIT 20325938081)
  try {
    const AfipService = require('./afipService');
    const afipService = new AfipService('20325938081');
    await afipService.ensureInitialized();
    const lastVoucher = await afipService.afip.ElectronicBilling.getLastVoucher(puntoVentaJuan, 11);
    results.afipJuan = { ok: true, message: `Conexión exitosa (Pto Vta ${puntoVentaJuan}). Último comprobante: #${lastVoucher}` };
  } catch (e) {
    results.afipJuan = { ok: false, message: `Error: ${e.message}` };
  }

  return results;
});const { agendarVisita } = require('./agendarVisita');
exports.agendarVisita = agendarVisita;
