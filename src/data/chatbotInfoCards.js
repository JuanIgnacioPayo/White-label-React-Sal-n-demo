/**
 * Info Cards: Textos detallados pre-armados para el chatbot.
 * Estos textos se muestran como acordeones expandibles en el chat,
 * SIN pasar por la IA ni gastar tokens.
 * 
 * La IA solo necesita incluir ::INFO::id:: en su respuesta para que
 * el chatbot renderice el botón expandible correspondiente.
 */

export const chatbotInfoCards = {
  alquiler: {
    title: "📋 Detalle completo del alquiler",
    content: `**¿Qué incluye el alquiler del salón?**

✅ **Mobiliario:**
• 10 mesas rectangulares con manteles de cuerina negra
• 50 sillas

✅ **Cocina equipada:**
• Horno pizzero de 6 moldes
• Hornalla
• Heladera exhibidora
• Freezer de pozo
• Cafetera de filtro
• Horno microondas
• Pava eléctrica

✅ **Patio exterior:**
• Parrilla techada
• Horno a leña

✅ **Entretenimiento:**
• Equipo de audio de alta fidelidad
• Computadora con Spotify y YouTube Premium
• Luces en pista de baile

✅ **Otros:**
• WIFI
• 2 baños equipados en planta baja
• Grupo electrógeno (no cubre aires acondicionados)
• Limpieza antes y después del evento (incluida)

❌ **NO incluye:**
• Comida ni bebida
• Vajilla (vasos, platos, cubiertos)
• Mantelería fina
• Servicio de camareras/catering
• Animación

💡 Podés traer tu propio catering o pedirnos contactos de proveedores de confianza.`
  },

  cocina: {
    title: "🍳 Equipamiento de la cocina",
    content: `**Cocina completamente equipada:**

🔥 **Para cocinar:**
• Horno pizzero industrial de 6 moldes
• Hornalla
• Parrilla techada en el patio
• Horno a leña en el patio

❄️ **Para conservar:**
• Heladera exhibidora
• Freezer de pozo

☕ **Extras:**
• Cafetera de filtro
• Horno microondas
• Pava eléctrica
• 3 bandejas para calentar en el horno

🧹 **Limpieza disponible:**
• Esponja y esponja metálica
• Detergente
• Trapo absorbente

⚠️ **Tené en cuenta:** No incluimos vajilla (vasos, platos, cubiertos), utensilios de cocina ni repasadores. Si los necesitás, tenés que traerlos vos o alquilarlos.`
  },

  baños: {
    title: "🚿 Qué hay en los baños",
    content: `**Los 2 baños (planta baja) vienen equipados con:**

• Toallas
• Papel higiénico
• Jabón
• Spray de alcohol líquido

No es necesario que traigas elementos de higiene. ¡Ya está todo listo!`
  },

  reglas: {
    title: "📜 Reglas y políticas del salón",
    content: `**Reglas importantes para tu evento:**

💰 **Reserva y Seña:**
• Se requiere una seña para confirmar la fecha (el monto varía según el mes)
• La seña congela el precio del alquiler
• Las señas NO se devuelven bajo ningún concepto
• El resto se puede pagar hasta el día del evento
• Aceptamos: efectivo, transferencia, débito o Mercado Pago con crédito

📅 **Duración del evento:**
• Los eventos se contratan por hora
• Finde/Feriado: mínimo 4 horas + 2 horas previas de armado sin cargo
• Días de semana: mínimo 3 horas + 1.5 horas previas sin cargo
• Después del evento tenés 1 hora sin cargo para retirar tus cosas

🔇 **Ruido y música:**
• No se permiten bandas en vivo ni parlantes externos
• La animación con parlantes/micrófono solo puede ser dentro del salón (pista de baile), NO en el patio
• Despedí a tus invitados dentro del salón para no molestar a los vecinos

🚫 **Prohibido:**
• Papel picado y bengalas metalizadas (destiñen los pisos)
• Traer cosas el día anterior o dejarlas después del evento
• Visitas sin previo aviso (coordinar por WhatsApp)

📞 **Contacto:**
• Las llamadas se coordinan previamente por WhatsApp
• Las visitas al salón se coordinan por WhatsApp`
  },

  faq: {
    title: "❓ Preguntas frecuentes",
    content: `**Preguntas que nos hacen siempre:**

**¿Cuántas personas entran?**
→ 50 personas sentadas a la mesa o 65 personas en formato cóctel (paradas).

**¿Tienen estacionamiento?**
→ No tenemos estacionamiento privado. Se puede estacionar temporalmente para bajar mercadería pero pedimos dejar libre la entrada.

**¿Puedo llevar mi propio catering?**
→ ¡Sí! Permitimos catering externo. También te podemos recomendar proveedores de confianza.

**¿La limpieza está incluida?**
→ Sí, la limpieza antes y después del evento corre por cuenta del salón.

**¿Incluye vajilla?**
→ No. Incluimos 10 mesas, 50 sillas y manteles de cuerina negra, pero no vajilla, vasos ni platos. Podés traerlos o alquilarlos.

**¿Hay grupo electrógeno?**
→ Sí, puede suministrar energía por varias horas (no cubre los aires acondicionados).

**¿Puedo usar papel picado o bengalas?**
→ No, por favor. Destiñen los pisos.

**¿Se pueden traer cosas el día anterior?**
→ No se permite traer cosas antes ni dejarlas después del evento.`
  },

  contactos: {
    title: "📞 Proveedores recomendados",
    content: `**Contactos de confianza que trabajaron con nosotros:**

🍽️ **Vajilla, mesas y sillas para niños:**
• Rocío y Candela — WhatsApp: 1136414383

🍽️ **Vajilla y mantelería:**
• Carlos — WhatsApp: 1162066501

🧸 **Plaza blanda (juegos para chicos):**
• Martina — WhatsApp: 1125189378

🍕 **Catering de pizza y pernil:**
• Hugo — WhatsApp: 1166819781

🥩 **Catering de parrilla premium (Los Hierros):**
• Lucas o Daniela — WhatsApp: 1172378964

💡 Estos proveedores ya conocen el salón y saben cómo trabajar en el espacio.`
  }
};
