const textToSpeech = require('@google-cloud/text-to-speech');
require('dotenv').config({ path: '.env.melishare-redirect-payo' });

const client = new textToSpeech.TextToSpeechClient();

async function listVoices() {
    const [result] = await client.listVoices({ languageCode: 'es' });
    const voices = result.voices;

    console.log('Voices found: ' + voices.length);
    voices.forEach(voice => {
        // Filter for voices we are interested in (Neural2, AR, US, ES)
        if (voice.name.includes('Neural2') || voice.languageCode.includes('es-AR')) {
            console.log(`Name: ${voice.name}, Lang: ${voice.languageCodes[0]}, SSML Gender: ${voice.ssmlGender}`);
        }
    });
}

listVoices().catch(console.error);
