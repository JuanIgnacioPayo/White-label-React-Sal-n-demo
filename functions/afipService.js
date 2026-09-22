const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

/**
 * Servicio para conectarse a AFIP y generar Facturas
 */
class AfipService {
    constructor(cuit) {
        this.cuit = cuit;
        this.afip = null;
        this.initPromise = this.init();
    }

    async init() {
        let certContent = null;
        let keyContent = null;
        let accessToken = null;

        // 1. Intentar cargar desde la base de datos de Firebase
        try {
            if (admin.apps && admin.apps.length > 0) {
                const db = admin.database();
                const afipSnapshot = await db.ref('config/afip').once('value');
                if (afipSnapshot.exists()) {
                    const data = afipSnapshot.val();
                    
                    // Elegir token según CUIT
                    accessToken = this.cuit === '20325938081' ? data.accessTokenJuan : data.accessToken;
                    
                    if (data.keys) {
                        const suffix = `_${this.cuit}`;
                        // Buscar certificados específicos para el CUIT o generales
                        const dynamicCert = data.keys[`certificado${suffix}_crt`] || 
                                            data.keys[`certificado${suffix}`] ||
                                            data.keys[`certificado_${this.cuit}_crt`] ||
                                            data.keys[`certificado_${this.cuit}`];
                                            
                        const dynamicKey = data.keys[`privada${suffix}_key`] || 
                                           data.keys[`privada${suffix}`] ||
                                           data.keys[`privada_${this.cuit}_key`] ||
                                           data.keys[`privada_${this.cuit}`];

                        certContent = dynamicCert || data.keys.certificado_crt || data.keys.certificado;
                        keyContent = dynamicKey || data.keys.privada_key || data.keys.privada;
                    }
                }
            }
        } catch (e) {
            console.error("Error al cargar credenciales de AFIP desde la Base de Datos:", e.message);
        }

        // 2. Fallback a archivos locales si no se encontraron en la Base de Datos
        if (!certContent || !keyContent) {
            const certPathDynamic = path.resolve(__dirname, 'keys', `certificado_${this.cuit}.crt`);
            const keyPathDynamic = path.resolve(__dirname, 'keys', `privada_${this.cuit}.key`);
            const certPathDefault = path.resolve(__dirname, 'keys', 'certificado.crt');
            const keyPathDefault = path.resolve(__dirname, 'keys', 'privada.key');

            let certPath = certPathDynamic;
            let keyPath = keyPathDynamic;

            if (!fs.existsSync(certPathDynamic) || !fs.existsSync(keyPathDynamic)) {
                certPath = certPathDefault;
                keyPath = keyPathDefault;
                if (!fs.existsSync(certPathDefault) || !fs.existsSync(keyPathDefault)) {
                    console.warn(`[MODO DEMO AFIP] Certificados no detectados para CUIT ${this.cuit}. Activando emulador de facturación.`);
                    this.isDemo = true;
                    return;
                }
            }

            certContent = fs.readFileSync(certPath, 'utf8');
            keyContent = fs.readFileSync(keyPath, 'utf8');
        }

        if (!accessToken) {
            accessToken = process.env.AFIP_ACCESS_TOKEN || '';
            if (this.cuit === '20325938081') {
                accessToken = process.env.AFIP_ACCESS_TOKEN_JUAN || accessToken;
            }
        }

        if (!accessToken) {
            console.warn(`[MODO DEMO AFIP] Access Token no detectado. Activando emulador de facturación.`);
            this.isDemo = true;
            return;
        }

        const Afip = require('@afipsdk/afip.js');
        this.afip = new Afip({ 
            CUIT: parseInt(this.cuit, 10),
            cert: certContent,
            key: keyContent,
            access_token: accessToken,
            production: true // Produccion activa con token
        });
    }

    async ensureInitialized() {
        await this.initPromise;
    }

    /**
     * Genera una factura C
     */
    async crearFacturaC({ importe, docTipo = 99, docNro = 0, puntoVenta, fechaEvento = null }) {
        await this.ensureInitialized();
        // Concepto: 2 (Servicios)
        // docTipo: 99 (Consumidor Final), 80 (CUIT), 96 (DNI)
        
        const hoy = new Date();
        const cbteFch = parseInt(hoy.toISOString().replace(/-/g, '').slice(0,8));
        let fchServ = cbteFch;
        
        if (fechaEvento) {
            const fDate = new Date(fechaEvento);
            fchServ = parseInt(fDate.toISOString().replace(/-/g, '').slice(0,8));
        }

        // Corrección Error AFIP 10036: FchVtoPago no puede ser anterior a CbteFch (hoy)
        const fchVtoPago = fchServ < cbteFch ? cbteFch : fchServ;

        if (this.isDemo || !this.afip) {
            const fakeCAE = "74" + Math.floor(100000000000 + Math.random() * 900000000000);
            const fakeVto = parseInt(new Date(Date.now() + 10 * 86400000).toISOString().replace(/-/g, '').slice(0, 8));
            return {
                cae: fakeCAE,
                vencimiento: fakeVto,
                comprobante: Math.floor(100 + Math.random() * 900),
                puntoVenta: puntoVenta || 1,
                fechaVtoPago: fchVtoPago,
                fechaEmision: cbteFch,
                isDemo: true
            };
        }

        const lastVoucher = await this.afip.ElectronicBilling.getLastVoucher(puntoVenta, 11); // 11 = Factura C
        
        const data = {
            'CantReg': 1, // Cantidad de comprobantes a registrar
            'PtoVta': puntoVenta, // Punto de venta
            'CbteTipo': 11, // 11 = Factura C
            'Concepto': 2, // 2 = Servicios
            'DocTipo': docTipo, 
            'DocNro': docNro,
            'CbteDesde': lastVoucher + 1,
            'CbteHasta': lastVoucher + 1,
            'CbteFch': cbteFch, // Fecha del comprobante SIEMPRE HOY
            'FchServDesde': fchServ, // Fecha inicio servicio
            'FchServHasta': fchServ, // Fecha fin servicio
            'FchVtoPago': fchVtoPago, // Vencimiento pago = fecha del evento (o fecha actual si ya pasó)
            'ImpTotal': importe,
            'ImpTotConc': 0, // No gravado
            'ImpNeto': importe, // Neto gravado (Factura C = Todo al total)
            'ImpOpEx': 0, // Operaciones exentas
            'ImpIVA': 0, // IVA
            'ImpTrib': 0, // Tributos
            'MonId': 'PES', // Moneda pesos argentinos
            'MonCotiz': 1 // Cotizacion
        };

        const result = await this.afip.ElectronicBilling.createVoucher(data);
        return {
            cae: result.CAE,
            vencimiento: result.CAEFchVto,
            comprobante: lastVoucher + 1,
            puntoVenta: puntoVenta,
            fechaVtoPago: fchVtoPago,
            fechaEmision: cbteFch
        };
    }

    async crearNotaDeCreditoC({ importe, docTipo = 99, docNro = 0, puntoVenta, comprobanteAsociado, fechaEvento = null }) {
        await this.ensureInitialized();
        const hoy = new Date();
        const cbteFch = parseInt(hoy.toISOString().replace(/-/g, '').slice(0,8));
        let fchServ = cbteFch;
        
        if (fechaEvento) {
            const fDate = new Date(fechaEvento);
            fchServ = parseInt(fDate.toISOString().replace(/-/g, '').slice(0,8));
        }

        const fchVtoPago = fchServ < cbteFch ? cbteFch : fchServ;
        const lastVoucher = await this.afip.ElectronicBilling.getLastVoucher(puntoVenta, 13); // 13 = Nota de Crédito C
        
        const data = {
            'CantReg': 1,
            'PtoVta': puntoVenta,
            'CbteTipo': 13, 
            'Concepto': 2,
            'DocTipo': docTipo, 
            'DocNro': docNro,
            'CbteDesde': lastVoucher + 1,
            'CbteHasta': lastVoucher + 1,
            'CbteFch': cbteFch, 
            'FchServDesde': fchServ,
            'FchServHasta': fchServ,
            'FchVtoPago': fchVtoPago,
            'ImpTotal': importe,
            'ImpTotConc': 0, 
            'ImpNeto': importe,
            'ImpOpEx': 0,
            'ImpIVA': 0,
            'ImpTrib': 0,
            'MonId': 'PES', 
            'MonCotiz': 1,
            'CbtesAsoc': [
                {
                    'Tipo': 11,
                    'PtoVta': puntoVenta,
                    'Nro': comprobanteAsociado
                }
            ]
        };

        const result = await this.afip.ElectronicBilling.createVoucher(data);
        return {
            cae: result.CAE,
            vencimiento: result.CAEFchVto,
            comprobante: lastVoucher + 1,
            puntoVenta: puntoVenta,
            fechaVtoPago: fchVtoPago,
            fechaEmision: cbteFch
        };
    }

    /**
     * Factura grandes montos fraccionándolos si superan el límite de Consumidor Final
     */
    async facturarConsumidorFinalConFraccionamiento({ importeTotal, limiteConsumidorFinal, docTipo = 99, docNro = 0, puntoVenta, fechaEvento = null }) {
        await this.ensureInitialized();
        const facturasGeneradas = [];
        let montoRestante = importeTotal;
        const LIMITE = limiteConsumidorFinal || 190000; // Valor seguro por defecto si no se pasa

        while (montoRestante > 0.005) { // Evitamos problemas de coma flotante
            const montoAFacturar = montoRestante > LIMITE ? LIMITE : montoRestante;
            
            // Redondear a 2 decimales para evitar problemas con AFIP
            const montoRounded = Math.round(montoAFacturar * 100) / 100;
            
            // Freno de emergencia por si hay errores de redondeo que generen bucle infinito
            if (montoRounded <= 0) {
                console.warn(`Se intentó facturar un monto <= 0 (${montoRounded}). Se detiene el fraccionamiento.`);
                break;
            }
            
            const factura = await this.crearFacturaC({
                importe: montoRounded,
                docTipo: 99, // Consumidor final
                docNro: 0,
                puntoVenta,
                fechaEvento
            });
            
            facturasGeneradas.push({
                ...factura,
                monto: montoRounded
            });

            montoRestante -= montoRounded;
        }

        return facturasGeneradas;
    }

    async obtenerDatosContribuyente(cuit) {
        await this.ensureInitialized();
        try {
            const taxpayerDetails = await this.afip.RegisterScopeThirteen.getTaxpayerDetails(cuit);
            if (taxpayerDetails) {
                let razonSocial = '';
                if (taxpayerDetails.razonSocial) {
                    razonSocial = taxpayerDetails.razonSocial;
                } else {
                    const nombre = taxpayerDetails.nombre || '';
                    const apellido = taxpayerDetails.apellido || '';
                    razonSocial = `${apellido} ${nombre}`.trim();
                }

                let domicilio = '';
                if (taxpayerDetails.domicilio) {
                    // Try different possible properties depending on AFIP SDK version
                    const d = Array.isArray(taxpayerDetails.domicilio) ? taxpayerDetails.domicilio[0] : taxpayerDetails.domicilio;
                    domicilio = `${d.direccion || ''} ${d.localidad || ''} ${d.descripcionProvincia || ''}`.trim();
                } else if (taxpayerDetails.domicilioFiscal) {
                    const d = taxpayerDetails.domicilioFiscal;
                    domicilio = `${d.direccion || ''} ${d.localidad || ''} ${d.descripcionProvincia || ''}`.trim();
                }

                let condicionIva = 'IVA Exento'; // Default fallback for valid CUITs
                if (taxpayerDetails.datosMonotributo) {
                    condicionIva = 'Responsable Monotributo';
                } else if (taxpayerDetails.datosRegimenGeneral && taxpayerDetails.datosRegimenGeneral.impuesto) {
                    const impuestos = taxpayerDetails.datosRegimenGeneral.impuesto;
                    const isIVA = impuestos.some(i => i.idImpuesto == 30 || i.idImpuesto == 11);
                    const isExento = impuestos.some(i => i.idImpuesto == 32 || i.idImpuesto == 33 || i.idImpuesto == 34);
                    if (isIVA) condicionIva = 'Responsable Inscripto';
                    else if (isExento) condicionIva = 'IVA Exento';
                }

                return { razonSocial, domicilio, condicionIva, raw: taxpayerDetails };
            }
            return null;
        } catch (error) {
            console.error(`Error al consultar contribuyente para CUIT ${cuit}:`, error.message);
            return null;
        }
    }

    /**
     * Obtiene la razón social desde ARCA (AFIP) dado un CUIT/CUIL.
     * @param {string|number} cuit - CUIT del contribuyente a consultar
     * @returns {string|null} Razón social / denominación del contribuyente, o null si no se encuentra
     */
    async obtenerRazonSocial(cuit) {
        await this.ensureInitialized();
        try {
            const taxpayerDetails = await this.afip.RegisterScopeThirteen.getTaxpayerDetails(cuit);
            if (taxpayerDetails) {
                // Persona jurídica → razonSocial, Persona física → nombre + apellido
                if (taxpayerDetails.razonSocial) {
                    return taxpayerDetails.razonSocial;
                }
                const nombre = taxpayerDetails.nombre || '';
                const apellido = taxpayerDetails.apellido || '';
                return `${apellido} ${nombre}`.trim() || null;
            }
            return null;
        } catch (error) {
            console.error(`Error al consultar razón social para CUIT ${cuit}:`, error.message);
            return null;
        }
    }
}

module.exports = AfipService;
