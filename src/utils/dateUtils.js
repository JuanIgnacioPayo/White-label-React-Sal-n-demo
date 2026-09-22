/**
 * Formatea una fecha en formato YYYY-MM-DD a texto en español con día de la semana.
 * Ejemplo: '2026-09-25' -> 'viernes 25 de septiembre de 2026'
 * 
 * @param {string} fechaStr 
 * @returns {string}
 */
export function formatFechaEspanol(fechaStr) {
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

/**
 * Reemplaza variables de fecha en una plantilla de título o concatena según corresponda.
 * 
 * @param {string} titleTemplate 
 * @param {string} fechaStr 
 * @param {string} defaultTemplate 
 * @returns {string}
 */
export function formatTitleWithDate(titleTemplate, fechaStr, defaultTemplate = 'Precios para el día {fecha}') {
  const formattedDate = formatFechaEspanol(fechaStr);
  if (!formattedDate) return titleTemplate || defaultTemplate;
  const formattedDateCap = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const template = (titleTemplate && titleTemplate.trim() !== '') ? titleTemplate.trim() : defaultTemplate;

  if (template.includes('{fecha}')) {
    return template.replace(/\{fecha\}/g, formattedDate);
  }
  if (template.includes('{Fecha}')) {
    return template.replace(/\{Fecha\}/g, formattedDateCap);
  }
  if (template.toLowerCase().endsWith('para el día') || template.toLowerCase().endsWith('para el dia')) {
    return `${template} ${formattedDate}`;
  }
  if (!template.includes(formattedDate) && !template.includes(formattedDateCap)) {
    return `${template} - ${formattedDateCap}`;
  }
  return template;
}

/**
 * Reemplaza variables de fecha en una plantilla de descripción.
 * 
 * @param {string} descTemplate 
 * @param {string} fechaStr 
 * @param {string} defaultDesc 
 * @returns {string}
 */
export function formatDescWithDate(descTemplate, fechaStr, defaultDesc = 'Consultá los precios y servicios disponibles para el día {fecha} en nuestro salón de eventos.') {
  const formattedDate = formatFechaEspanol(fechaStr);
  if (!formattedDate) return descTemplate || defaultDesc;
  const formattedDateCap = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const template = (descTemplate && descTemplate.trim() !== '') ? descTemplate.trim() : defaultDesc;

  if (template.includes('{fecha}')) {
    return template.replace(/\{fecha\}/g, formattedDate);
  }
  if (template.includes('{Fecha}')) {
    return template.replace(/\{Fecha\}/g, formattedDateCap);
  }
  return template;
}
