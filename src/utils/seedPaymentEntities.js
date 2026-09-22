/**
 * Helper Script to Seed Initial Payment Entities to Firebase
 * 
 * This file can be run once to populate your Firebase database with common
 * Argentine payment entities. After running this, you can manage them via
 * the PaymentEntitiesManager UI.
 * 
 * To use:
 * 1. Open browser console on your app
 * 2. Copy and paste this code
 * 3. Press Enter
 */

import { database } from './firebase/firebase';
import { ref, set } from 'firebase/database';

const INITIAL_ENTITIES = [
    {
        name: 'INACAP',
        endpoint: 'https://www.mercadopago.com.ar/one-experience/simple-input/input_barcode?from=billpayments_entities_search&journey_id=3c08b816-7262-48d1-a088-c4e78e45b8c2&session_id=d826c325-1c8c-4127-963a-854b9f59bf24&panel_active=CDP',
        keywords: ['INACAP'],
        createdAt: Date.now()
    },
    { name: 'EDENOR', endpoint: null, keywords: ['EDENOR'], createdAt: Date.now() },
    { name: 'EDESUR', endpoint: null, keywords: ['EDESUR'], createdAt: Date.now() },
    { name: 'MET ROGAS', endpoint: null, keywords: ['METROGAS'], createdAt: Date.now() },
    { name: 'AYSA', endpoint: null, keywords: ['AYSA'], createdAt: Date.now() },
    { name: 'TELECOM', endpoint: null, keywords: ['TELECOM', 'PERSONAL'], createdAt: Date.now() },
    { name: 'CLARO', endpoint: null, keywords: ['CLARO'], createdAt: Date.now() },
    { name: 'MOVISTAR', endpoint: null, keywords: ['MOVISTAR'], createdAt: Date.now() },
    { name: 'NATURGY', endpoint: null, keywords: ['NATURGY', 'BANCO'], createdAt: Date.now() },
    { name: 'CABLEVISION', endpoint: null, keywords: ['CABLEVISION', 'FIBERTEL'], createdAt: Date.now() },
    { name: 'OSDE', endpoint: null, keywords: ['OSDE'], createdAt: Date.now() },
    { name: 'SWISS MEDICAL', endpoint: null, keywords: ['SWISS MEDICAL'], createdAt: Date.now() },
    { name: 'GALENO', endpoint: null, keywords: ['GALENO'], createdAt: Date.now() },
    { name: 'AGIP', endpoint: null, keywords: ['AGIP', 'RENTAS'], createdAt: Date.now() },
    { name: 'ARBA', endpoint: null, keywords: ['ARBA'], createdAt: Date.now() }
];

export async function seedPaymentEntities() {
    const entitiesRef = ref(database, 'config/paymentEntities');

    try {
        await set(entitiesRef, INITIAL_ENTITIES.reduce((acc, entity, index) => {
            acc[`entity_${index}`] = entity;
            return acc;
        }, {}));

        console.log('✅ Payment entities seeded successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error seeding entities:', error);
        return false;
    }
}

// Uncomment to run automatically when imported
// seedPaymentEntities();
