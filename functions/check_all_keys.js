const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://melishare-redirect-payo-default-rtdb.firebaseio.com"
});

const db = admin.database();
db.ref('config/apiKeys').once('value').then(snap => {
    console.log(snap.val());
    process.exit();
}).catch(e => {
    console.error(e);
    process.exit(1);
});
