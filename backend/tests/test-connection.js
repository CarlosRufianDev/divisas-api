#!/usr/bin/env node

/**
 * 🧪 Script de prueba simple para verificar conectividad
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testConnection() {
  console.log('🔍 Verificando conexión al servidor...');

  try {
    // Test básico de conexión
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Servidor respondiendo:', response.status);
    console.log('📊 Respuesta:', response.data);
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🔴 El servidor no está ejecutándose en puerto 4000');
      console.log('   Verifica que "npm run dev" esté funcionando');
    }
    return false;
  }

  console.log('\n🧪 Probando endpoint de análisis técnico...');

  try {
    const response = await axios.post(`${BASE_URL}/api/calculator/technical-analysis`, {
      from: 'USD',
      to: 'EUR',
      days: 7
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Análisis técnico respondiendo:', response.status);
    console.log('📊 Estructura de respuesta:', Object.keys(response.data));

    if (response.data.analysis) {
      console.log('📈 Análisis disponible:', Object.keys(response.data.analysis));
    }

    if (response.data.recommendation) {
      console.log('🎯 Recomendación disponible:', response.data.recommendation.action);
    }

  } catch (error) {
    console.log('❌ Error en análisis técnico:', error.message);
    if (error.response) {
      console.log('📟 Código de estado:', error.response.status);
      console.log('📋 Respuesta del servidor:', error.response.data);
    }
  }

  console.log('\n🧪 Probando endpoint de tendencias...');

  try {
    const response = await axios.get(`${BASE_URL}/api/calculator/trending-rates?base=USD&days=7`);

    console.log('✅ Tendencias respondiendo:', response.status);
    console.log('📊 Número de monedas:', response.data.rates?.length || 0);

  } catch (error) {
    console.log('❌ Error en tendencias:', error.message);
    if (error.response) {
      console.log('📟 Código de estado:', error.response.status);
      console.log('📋 Respuesta del servidor:', error.response.data);
    }
  }
}

testConnection().catch(console.error);
