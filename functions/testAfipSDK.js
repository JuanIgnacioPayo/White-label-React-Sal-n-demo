require('dotenv').config({ path: '.env.melishare-redirect-payo' });
const Afip = require('@afipsdk/afip.js');
const fs = require('fs');
const path = require('path');

const cuit = '20325938081';
const certPath = path.resolve(__dirname, 'keys', `certificado_${cuit}.crt`);
const keyPath = path.resolve(__dirname, 'keys', `privada_${cuit}.key`);

const afip = new Afip({
    CUIT: parseInt(cuit, 10),
    cert: fs.readFileSync(certPath, 'utf8'),
    key: fs.readFileSync(keyPath, 'utf8'),
    access_token: process.env.AFIP_ACCESS_TOKEN_JUAN,
    production: true
});

async function test() {
    try {
        console.log("Requesting TA...");
        const ta = await afip.GetServiceTA('wsfe');
        console.log("Success:", ta);
    } catch (e) {
        console.error("Error occurred!");
        console.error("Message:", e.message);
        console.error("Status:", e.status);
        console.error("Data:", e.data);
    }
}

test();
