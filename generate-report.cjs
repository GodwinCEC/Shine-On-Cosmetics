const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const serviceAccount = require('./serviceAccount.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function generateReport() {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = [];

    productsSnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    const actualProducts = products.filter(p => {
      if (p.isMockup === true) return false;
      if (p.name && p.name.toLowerCase().includes('mockup')) return false;
      return true;
    });

    let report = `# Products Report\n\n`;
    report += `Total Actual Products: ${actualProducts.length}\n\n`;

    actualProducts.forEach(p => {
      report += `## ${p.name || 'Unnamed Product'}\n`;
      report += `- **ID:** ${p.id}\n`;
      report += `- **Price:** GH₵${p.price}\n`;
      report += `- **Categories:** ${Array.isArray(p.categories) ? p.categories.join(', ') : (p.category || 'N/A')}\n`;
      report += `- **Target Gender:** ${p.gender || 'N/A'}\n`;
      report += `- **Featured:** ${p.isFeatured ? 'Yes' : 'No'}\n`;
      report += `- **Visible:** ${p.isVisible !== false ? 'Yes' : 'No'}\n`;
      if (p.description) {
        report += `- **Description:** ${p.description}\n`;
      }
      if (p.tags && p.tags.length > 0) {
        report += `- **Tags:** ${p.tags.join(', ')}\n`;
      }
      report += '\n';
    });

    fs.writeFileSync('products_report.md', report);
    console.log('Report generated successfully at products_report.md');
    process.exit(0);
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

generateReport();
