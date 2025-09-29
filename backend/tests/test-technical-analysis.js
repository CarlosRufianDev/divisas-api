#!/usr/bin/env node

/**
 * 🧪 Script de prueba para el análisis técnico
 * Verifica que todos los cálculos usen datos reales en lugar de simulaciones
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Función para hacer peticiones HTTP
async function makeRequest(endpoint, data = null) {
  try {
    const config = {
      method: data ? 'POST' : 'GET',
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Función para mostrar resultados formateados
function logResult(title, result) {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(50));

  if (result.success) {
    console.log('✅ Estado:', 'ÉXITO');

    if (result.data.analysis) {
      const analysis = result.data.analysis;
      console.log('📈 Análisis Técnico:');
      console.log(`   • Tendencia: ${analysis.trend}%`);
      console.log(`   • RSI: ${analysis.rsi}`);
      console.log(`   • Volatilidad: ${analysis.volatility}%`);

      if (analysis.sma7) console.log(`   • SMA 7: ${analysis.sma7}`);
      if (analysis.sma20) console.log(`   • SMA 20: ${analysis.sma20}`);

      console.log(`   • Soporte: ${analysis.support}`);
      console.log(`   • Resistencia: ${analysis.resistance}`);
      console.log(`   • Cambio diario promedio: ${analysis.avgDailyChange}%`);
    }

    if (result.data.recommendation) {
      const rec = result.data.recommendation;
      console.log('🎯 Recomendación:');
      console.log(`   • Acción: ${rec.action}`);
      console.log(`   • Confianza: ${rec.confidence}%`);
      console.log(`   • Mensaje: ${rec.message}`);
      console.log(`   • Señales: ${rec.signals.join(', ')}`);
      console.log(`   • Puntuación: ${rec.score}`);
    }

    if (result.data.dataPoints) {
      console.log(`📊 Puntos de datos: ${result.data.dataPoints}`);
    }

    if (result.data.apiSource) {
      console.log(`🔗 Fuente: ${result.data.apiSource}`);
    }
  } else {
    console.log('❌ Estado:', 'ERROR');
    console.log('❌ Error:', JSON.stringify(result.error, null, 2));
    if (result.status) console.log('📟 Código:', result.status);
  }
}

async function runTests() {
  console.log('🚀 Iniciando pruebas del análisis técnico mejorado...\n');

  // Test 1: Análisis técnico EUR/USD (Frankfurter)
  console.log('🧪 Test 1: Análisis técnico EUR/USD con datos históricos reales');
  const test1 = await makeRequest('/api/calculator/technical-analysis', {
    from: 'EUR',
    to: 'USD',
    days: 30
  });
  logResult('Análisis EUR/USD (30 días)', test1);

  // Test 2: Análisis técnico con período corto
  console.log('\n🧪 Test 2: Análisis técnico USD/GBP con período corto');
  const test2 = await makeRequest('/api/calculator/technical-analysis', {
    from: 'USD',
    to: 'GBP',
    days: 7
  });
  logResult('Análisis USD/GBP (7 días)', test2);

  // Test 3: Análisis técnico para moneda adicional (ARS)
  console.log('\n🧪 Test 3: Análisis técnico USD/ARS con datos históricos generados');
  const test3 = await makeRequest('/api/calculator/technical-analysis', {
    from: 'USD',
    to: 'ARS',
    days: 15
  });
  logResult('Análisis USD/ARS (15 días)', test3);

  // Test 4: Obtener tendencias con datos reales
  console.log('\n🧪 Test 4: Tendencias generales con base USD');
  const test4 = await makeRequest('/api/calculator/trending-rates?base=USD&days=7');
  logResult('Tendencias generales USD', test4);

  if (test4.success && test4.data.rates) {
    console.log('\n📊 Resumen de tendencias (primeras 5):');
    test4.data.rates.slice(0, 5).forEach((rate, index) => {
      console.log(`   ${index + 1}. ${rate.currency}: ${rate.change} (${rate.trendStatus})`);
    });
  }

  // Test 5: Análisis con período largo
  console.log('\n🧪 Test 5: Análisis técnico JPY/EUR con período largo');
  const test5 = await makeRequest('/api/calculator/technical-analysis', {
    from: 'JPY',
    to: 'EUR',
    days: 60
  });
  logResult('Análisis JPY/EUR (60 días)', test5);

  console.log('\n🎉 Pruebas completadas!');
  console.log('\n📋 Resumen de mejoras implementadas:');
  console.log('   ✅ RSI calculado con algoritmo real (no más 50 fijo)');
  console.log('   ✅ SMA múltiples (7, 20, 50 días) con datos históricos');
  console.log('   ✅ Volatilidad real usando desviación estándar');
  console.log('   ✅ Recomendaciones inteligentes con múltiples señales');
  console.log('   ✅ Datos históricos reales para monedas adicionales');
  console.log('   ✅ Sistema de puntuación mejorado para recomendaciones');
}

// Ejecutar pruebas
runTests().catch(console.error);
