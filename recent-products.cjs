const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccount.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function getRecent() {
  try {
    const snapshot = await db.collection('products').get();
    const products = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      // Skip mockups
      if (data.isMockup === true) return;
      if (data.name && data.name.toLowerCase().includes('mockup')) return;
      
      // Try to get timestamp from createdAt or from ID
      let timestamp = 0;
      if (data.createdAt) {
        timestamp = data.createdAt.toMillis ? data.createdAt.toMillis() : new Date(data.createdAt).getTime();
      } else {
        const match = doc.id.match(/-(\d{13})$/);
        if (match) {
          timestamp = parseInt(match[1], 10);
        }
      }
      
      products.push({ id: doc.id, name: data.name, timestamp });
    });

    products.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log("Top 10 Most Recently Added Products:\n");
    products.slice(0, 10).forEach((p, i) => {
      const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleString() : 'Unknown date';
      console.log(`${i+1}. ${p.name || 'Unnamed Product'} (Added: ${dateStr})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getRecent();
