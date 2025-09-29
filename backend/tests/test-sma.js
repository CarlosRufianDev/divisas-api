const axios = require('axios');

async function testSMA() {
  try {
    console.log('🧪 Probando que el campo SMA aparezca en la respuesta...');

    const response = await axios.post('http://localhost:4000/api/calculator/technical-analysis', {
      from: 'USD',
      to: 'EUR',
      days: 15
    });

    const analysis = response.data.analysis;

    console.log('✅ Respuesta recibida:');
    console.log(`   • SMA (legacy): ${analysis.sma}`);
    console.log(`   • SMA 7 días: ${analysis.sma7}`);
    console.log(`   • SMA 20 días: ${analysis.sma20}`);
    console.log(`   • RSI: ${analysis.rsi}`);
    console.log(`   • Volatilidad: ${analysis.volatility}%`);

    if (analysis.sma && analysis.sma7 && analysis.sma20) {
      console.log('🎉 ¡Perfecto! Todos los campos SMA están presentes');
    } else {
      console.log('❌ Faltan campos SMA');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSMA();
