const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '../.env.local' });

let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
}

admin.initializeApp({
  credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
  databaseURL: "https://melishare-redirect-payo-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function main() {
  try {
    const currentSnap = await db.ref('datosId/1/testimonios').once('value');
    let currentTestimonios = currentSnap.val() || [];
    
    fs.writeFileSync('../scratch/current_db_testimonios.json', JSON.stringify(currentTestimonios, null, 2));
    console.log(`Found ${currentTestimonios.length} testimonios in current DB.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

main();
