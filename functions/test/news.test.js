const admin = require('firebase-admin');
const { expect } = require('chai');
const sinon = require('sinon');
const test = require('firebase-functions-test')(); // Initialize firebase-functions-test
const { fetchAndProcessNews } = require('../newsService');
const { askAI } = require('../index');
const RssParser = require('rss-parser'); // Import RssParser here
const { logger } = require('firebase-functions/v2'); // Import logger explicitly

// Initialize the Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Mock Firebase Realtime Database
const mockNewsData = {
  "article1": {
    id: "article1",
    source: "Clarín - Economía",
    title: "Inflación de Argentina desacelera en mayo",
    link: "http://clarin.com/inflacion-mayo",
    summary: "La inflación en Argentina mostró signos de desaceleración en el mes de mayo, según informes preliminares.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  },
  "article2": {
    id: "article2",
    source: "La Nación",
    title: "Debate político sobre nuevas medidas económicas",
    link: "http://lanacion.com/debate-economico",
    summary: "El congreso debate un nuevo paquete de medidas económicas propuesto por el gobierno.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  "article3": {
    id: "article3",
    source: "Investing.com - Economía",
    title: "Mercados globales reaccionan a tasas de interés",
    link: "http://investing.com/mercados-tasas",
    summary: "Los mercados internacionales observan con atención los movimientos de las tasas de interés.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  "article4": {
    id: "article4",
    source: "El Economista - Economía",
    title: "Nuevas regulaciones impactan al sector financiero",
    link: "http://eleconomista.com/regulaciones-financieras",
    summary: "El ministerio de economía anunció nuevas regulaciones para el sector financiero del país.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
  },
  "article5": {
    id: "article5",
    source: "Página/12",
    title: "Protestas en Buenos Aires por medidas gubernamentales",
    link: "http://pagina12.com/protestas-gobierno",
    summary: "Manifestantes se congregaron en la capital para expresar su descontento con las recientes políticas.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  // Add more mock data to reach 10, including some "filler" if needed for filtering tests
  "article6": {
    id: "article6",
    source: "Clarín - Política",
    title: "Acuerdo en el Congreso por reforma previsional",
    link: "http://clarin.com/reforma-previsional",
    summary: "Importante acuerdo entre bloques políticos para avanzar con la reforma del sistema de pensiones.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
  },
  "article7": {
    id: "article7",
    source: "iProfesional - Finanzas",
    title: "Criptomonedas: el futuro de las finanzas",
    link: "http://iprofesional.com/cripto-futuro",
    summary: "Análisis sobre el creciente impacto de las criptomonedas en el panorama financiero global.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
  },
  "article8": {
    id: "article8",
    source: "Ámbito Financiero - Economía",
    title: "Impacto del comercio exterior en la balanza de pagos",
    link: "http://ambito.com/comercio-exterior",
    summary: "Detalle del efecto del intercambio comercial internacional en la economía nacional.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
  },
  "article9": {
    id: "article9",
    source: "EL PAÍS - Economía",
    title: "Crisis energética global y su efecto en precios",
    link: "http://elpais.com/crisis-energetica",
    summary: "La subida de precios de la energía a nivel mundial genera preocupación en diversas industrias.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), // 9 days ago
  },
  "article10": {
    id: "article10",
    source: "Investing.com - Economía",
    title: "Análisis del mercado bursátil argentino",
    link: "http://investing.com/mercado-bursatil",
    summary: "Un estudio exhaustivo sobre las tendencias y previsiones del mercado de valores en Argentina.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
  // "Filler" news, to test filtering (if any general feeds are used and not correctly filtered)
  "filler1": {
    id: "filler1",
    source: "La Nación",
    title: "Recetas de cocina para el fin de semana",
    link: "http://lanacion.com/recetas",
    summary: "Ideas deliciosas para disfrutar en casa durante el fin de semana largo.",
    isoDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(), // 11 days ago
  },
};


describe('News Feature Backend', () => {
  let sandbox;
  let adminInitStub;

  before(() => {
    // Stub admin.initializeApp to prevent actual Firebase initialization issues
    adminInitStub = sinon.stub(admin, 'initializeApp');

    // Create a sandbox for all stubs
    sandbox = sinon.createSandbox();

    // Mock functions.logger
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    sandbox.stub(logger, 'warn');
    sandbox.stub(logger, 'debug');
  });

  after(() => {
    adminInitStub.restore();
    test.cleanup(); // Clean up firebase-functions-test
    sandbox.restore(); // Restore all stubs in the sandbox
  });

  describe('fetchAndProcessNews', () => {
    let dbRefStub;
    let newsRefStub;
    let parseURLStub;
    let summarizeTextStub;
    let setStub;

    beforeEach(() => {
      sandbox.resetHistory(); // Reset call history for all stubs in the sandbox

      // Mock admin.database().ref() chain for fetchAndProcessNews
      setStub = sandbox.stub().resolves();
      newsRefStub = sandbox.stub().returns({
        set: setStub,
        child: sandbox.stub().returns({ set: setStub })
      });
      dbRefStub = sandbox.stub(admin, 'database').returns({ ref: newsRefStub });

      // Stub Parser.prototype.parseURL
      parseURLStub = sandbox.stub(RssParser.prototype, 'parseURL').callsFake(async (url) => {
        if (url.includes('lanacion.com.ar') || url.includes('pagina12.com.ar')) {
          return {
            items: [
              { title: 'Noticia política importante', contentSnippet: 'El gobierno anuncia...', link: 'http://link1', pubDate: new Date().toISOString() },
              { title: 'Receta de cocina', contentSnippet: 'Cómo hacer...', link: 'http://link2', pubDate: new Date().toISOString() }, // Irrelevant
              { title: 'Mercado financiero hoy', contentSnippet: 'Dolar sube...', link: 'http://link3', pubDate: new Date().toISOString() },
            ]
          };
        } else if (url.includes('clarin.com/rss/economia')) {
          return {
            items: [
              { title: 'Nueva medida económica', contentSnippet: 'Impacto en el dolar...', link: 'http://link4', pubDate: new Date().toISOString() },
            ]
          };
        }
        return { items: [] }; // Default empty
      });

      // Stub summarizeText
      summarizeTextStub = sandbox.stub(require('../newsService'), 'summarizeText').callsFake(text => `Summary of: ${text}`);
    });

    afterEach(() => {
      sandbox.restore(); // Restore all stubs created in this sandbox instance
    });

    it('should fetch, filter, summarize and store relevant news articles', async () => {
      await fetchAndProcessNews();

      // Verify that admin.database().ref('news').set({}) was called to clear old news
      expect(setStub.getCall(0).calledWith({})).to.be.true;

      // Verify that relevant articles were passed to newsRef.child(articleId).set()
      // We expect 3 relevant articles from the mock data (1 political, 1 financial from La Nacion, 1 economic from Clarin)
      const callsToSetArticle = setStub.getCalls().filter(call => call.args.length > 0 && typeof call.args[0] === 'object' && call.args[0].id !== undefined);
      expect(callsToSetArticle.length).to.equal(3); // Based on mock data and expected filtering

      // Verify that the "Receta de cocina" article was filtered out
      const storedTitles = callsToSetArticle.map(call => call.args[0].title);
      expect(storedTitles).to.not.include('Receta de cocina');
      expect(storedTitles).to.include('Noticia política importante');
      expect(storedTitles).to.include('Mercado financiero hoy');
      expect(storedTitles).to.include('Nueva medida económica');
    });
  });

  describe('askAI news functionality', () => {
    let askAIWrapper;
    let onceStubFirebase; // Renamed to avoid conflict

    beforeEach(() => {
      sandbox.resetHistory();

      // Mock the admin.database().ref('news').orderByChild('isoDate').limitToLast(10).once('value')
      onceStubFirebase = sandbox.stub().resolves({
        val: () => mockNewsData,
        exists: () => true
      });
      sandbox.stub(admin, 'database').returns({
        ref: sandbox.stub().returns({
          orderByChild: sandbox.stub().returns({
            limitToLast: sandbox.stub().returns({ once: onceStubFirebase })
          })
        })
      });

      askAIWrapper = test.wrap(askAI);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should return 10 news articles when "noticias" is in the prompt', async () => {
      const request = {
        data: { prompt: "Quiero saber las últimas noticias" }
      };
      const context = {}; // Context can be empty for this test

      const result = await askAIWrapper(request, context);

      expect(result).to.have.property('response');
      const responseText = result.response;

      // Verify the response format
      expect(responseText).to.include("Aquí están las últimas noticias:");
      expect(responseText).to.include("**Fuente:** Clarín - Economía"); // Check for specific content
      expect(responseText).to.include(":::LINK::[Ver la fuente]::http://clarin.com/inflacion-mayo::"); // Check for the custom link format

      // Count the number of articles in the response
      const articleCount = (responseText.match(/---\n\n/g) || []).length + 1; // Count separators + 1
      expect(articleCount).to.equal(10);
    });

    it('should handle no news available gracefully', async () => {
      // Configure the mock to return no news
      onceStubFirebase.resolves({
        val: () => null,
        exists: () => false
      });

      const request = {
        data: { prompt: "Dame las noticias" }
      };
      const context = {};

      const result = await askAIWrapper(request, context);
      expect(result).to.have.property('response', "No hay noticias disponibles en este momento.");
    });
  });
});