const admin = require('firebase-admin');
const serviceAccount = require('./keys/serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://melishare-redirect-payo-default-rtdb.firebaseio.com"
    });
}
const db = admin.database();

async function check() {
    const id = '-OyaadBwqZMi0YgIbUsi';
    const idLookup = await db.ref(`presupuestos_por_id/${id}`).once('value');
    if (!idLookup.exists()) {
        console.log("Not found in lookup");
        process.exit(1);
    }
    const path = idLookup.val().path;
    const p = await db.ref(`presupuestos/${path}/${id}`).once('value');
    const val = p.val();
    console.log("facturado:", val.facturado);
    console.log("facturaAFIP:", val.facturaAFIP);
    console.log("facturadoManualmente:", val.facturadoManualmente);
    process.exit(0);
}

check();
