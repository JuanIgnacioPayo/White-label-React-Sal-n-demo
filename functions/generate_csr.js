const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Datos AFIP Demo
const CUIT = '20000000001';
const RAZON_SOCIAL = 'Salon Magic Eventos SA';
const CN = 'Salon_Magic_Eventos';

console.log('Generando par de claves RSA de 2048 bits...');
forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, function(err, keypair) {
    if (err) {
        console.error('Error generando las claves:', err);
        return;
    }

    console.log('Claves generadas con éxito.');
    const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

    // Guardar clave privada
    const keysDir = path.join(__dirname, 'keys');
    if (!fs.existsSync(keysDir)){
        fs.mkdirSync(keysDir);
    }
    fs.writeFileSync(path.join(keysDir, 'privada.key'), privateKeyPem);
    console.log('✅ Clave privada guardada en functions/keys/privada.key');

    // Generar CSR
    console.log('Generando Certificate Signing Request (CSR)...');
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keypair.publicKey;
    
    // AFIP requires O (organization), CN (commonName), and serialNumber (CUIT XXXXXXXXXXX)
    csr.setSubject([
        {
            name: 'organizationName',
            value: RAZON_SOCIAL
        },
        {
            name: 'commonName',
            value: CN
        },
        {
            type: '2.5.4.5',
            value: 'CUIT ' + CUIT
        }
    ]);

    csr.sign(keypair.privateKey, forge.md.sha256.create());
    const csrPem = forge.pki.certificationRequestToPem(csr);
    
    fs.writeFileSync(path.join(keysDir, 'pedido.csr'), csrPem);
    console.log('✅ CSR guardado en functions/keys/pedido.csr');
});
