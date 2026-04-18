const QUESTION_LABELS = {
  p1: '¿Qué tan consistente es tu equipo al generar una primera impresión profesional y de confianza en el primer contacto?',
  p2: 'Cuando un cliente muestra distancia o frialdad al inicio, ¿qué suele hacer tu equipo?',
  p3: '¿Qué tan presente está hoy la escucha activa en las conversaciones comerciales de tu equipo?',
  p4: '¿Qué tan bien formula tu equipo preguntas con propósito para entender la situación real del cliente?',
  p5: '¿Qué ocurre con más frecuencia en las reuniones o llamadas comerciales?',
  p6: '¿Qué tan orientado está tu equipo a entender a la persona y su contexto antes que al producto mismo?',
  p7: '¿Qué tan bien conecta tu equipo lo que ofrece con la necesidad específica del cliente?',
  p8: 'Cuando el cliente compara precio, ¿qué hace normalmente tu equipo?',
  p9: '¿Qué tan sólido es el conocimiento que tiene tu equipo sobre sus productos o servicios para argumentar con seguridad?',
  p10: '¿Cómo reacciona normalmente tu equipo frente a las objeciones del cliente?',
  p11: '¿Qué tan preparado está tu equipo para utilizar técnicas de manejo de objeciones?',
  p12: '¿Qué tan bien detecta tu equipo las señales de cierre y avanza con seguridad hacia el siguiente paso o el cierre final?'
};

const SCORE_MAP = {
  p1: {
    'Muy consistente': 4,
    'Bastante consistente': 3,
    'Poco consistente': 2,
    'Muy inconsistente': 1,
  },
  p2: {
    'Logra romper el hielo con naturalidad y criterio': 4,
    'A veces conecta, pero depende del vendedor': 3,
    'Tiende a ir directo al producto sin generar vínculo': 2,
    'Pierde conexión desde el inicio': 1,
  },
  p3: {
    'Muy presente': 4,
    'Presente de forma irregular': 3,
    'Poco presente': 2,
    'Casi ausente': 1,
  },
  p4: {
    'Muy bien': 4,
    'Bien, pero con brechas': 3,
    'Con dificultad': 2,
    'Muy débilmente': 1,
  },
  p5: {
    'El equipo comprende bien al cliente antes de proponer': 4,
    'Hace preguntas, pero no profundiza lo suficiente': 3,
    'Se enfoca muy rápido en explicar el producto': 2,
    'La conversación carece de estructura clara': 1,
  },
  p6: {
    'Muy orientado a la persona': 4,
    'Moderadamente orientado': 3,
    'Más orientado al producto': 2,
    'Casi totalmente orientado al producto': 1,
  },
  p7: {
    'Muy bien': 4,
    'Bien, aunque no siempre con precisión': 3,
    'De forma débil': 2,
    'Muy débilmente': 1,
  },
  p8: {
    'Sostiene el valor con argumentos claros': 4,
    'A veces defiende valor, pero sin mucha solidez': 3,
    'Se debilita y entra rápido en precio': 2,
    'Depende casi solo del descuento o la rebaja': 1,
  },
  p9: {
    'Muy sólido': 4,
    'Aceptable': 3,
    'Limitado': 2,
    'Muy débil': 1,
  },
  p10: {
    'Las acepta, explora y gestiona con criterio': 4,
    'Las maneja de forma aceptable, pero inconsistente': 3,
    'Tiende a responder de forma defensiva o apurada': 2,
    'Le cuesta mucho gestionarlas': 1,
  },
  p11: {
    'Muy preparado': 4,
    'Medianamente preparado': 3,
    'Poco preparado': 2,
    'Nada preparado': 1,
  },
  p12: {
    'Muy bien': 4,
    'Bien, pero con dudas': 3,
    'Con dificultad': 2,
    'Muy mal': 1,
  },
};

function average(values) {
  return Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(1));
}

function getScores(payload) {
  const scores = {
    conexion: average([payload.p1, payload.p2, payload.p3].map((key, i) => SCORE_MAP[`p${i + 1}`][key] || 1)),
    deteccion: average([payload.p4, payload.p5, payload.p6].map((key, i) => SCORE_MAP[`p${i + 4}`][key] || 1)),
    solucion: average([payload.p7, payload.p8, payload.p9].map((key, i) => SCORE_MAP[`p${i + 7}`][key] || 1)),
    cierre: average([payload.p10, payload.p11, payload.p12].map((key, i) => SCORE_MAP[`p${i + 10}`][key] || 1)),
  };
  return scores;
}

function maturityLevelFromScores(scores) {
  const global = average(Object.values(scores));
  if (global >= 3.4) return 'Madurez alta';
  if (global >= 2.4) return 'Madurez media';
  return 'Madurez baja';
}

function buildPrompt(payload, scores, maturityLevel) {
  const lines = Object.entries(QUESTION_LABELS)
    .map(([key, label]) => `- ${label}: ${payload[key]}`)
    .join('\n');

  return `Analiza este diagnóstico comercial y redacta un informe claro, consultivo y útil para un líder comercial.

Datos del líder:
- Nombre completo: ${payload.nombreCompleto}
- Correo corporativo: ${payload.correoCorporativo}
- Empresa: ${payload.empresa}
- Cargo: ${payload.cargo}
- Sector de la empresa: ${payload.sectorEmpresa}

Respuestas del test:
${lines}
- Respuesta abierta: ${payload.respuestaAbierta}

Puntajes preliminares por fase:
- Conexión: ${scores.conexion}/4
- Detección: ${scores.deteccion}/4
- Solución: ${scores.solucion}/4
- Cierre: ${scores.cierre}/4
- Nivel de madurez preliminar: ${maturityLevel}

Redacta la salida en español y en formato markdown simple.
Usa esta estructura exacta:
## 1. Nivel de madurez comercial
## 2. Interpretación general del diagnóstico
## 3. Análisis por fases
### Conexión con el cliente
### Detección de necesidades reales
### Oferta de soluciones específicas
### Cierre efectivo
## 4. Principales brechas detectadas
## 5. Competencias prioritarias a desarrollar
## 6. Riesgo comercial actual
## 7. Recomendación inicial de entrenamiento

Reglas:
- No repitas literalmente las respuestas del formulario.
- Interpreta patrones, brechas y riesgos.
- Mantén tono profesional, claro y consultivo.
- Sé concreto y útil, sin rodeos ni tecnicismos innecesarios.
- Menciona venta consultiva, foco en valor y habilidades blandas/comerciales cuando corresponda.`;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Falta configurar OPENAI_API_KEY en Netlify.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const scores = getScores(payload);
    const maturityLevel = maturityLevelFromScores(scores);
    const prompt = buildPrompt(payload, scores, maturityLevel);

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        temperature: 0.4,
        max_completion_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: 'Eres un consultor comercial experto en venta consultiva. Elaboras diagnósticos ejecutivos, claros y accionables para líderes comerciales.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await openAiResponse.json();
    if (!openAiResponse.ok) {
      const apiError = data?.error?.message || 'Error al consultar OpenAI.';
      return new Response(JSON.stringify({ error: apiError }), {
        status: openAiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const diagnosis = data?.choices?.[0]?.message?.content?.trim();
    if (!diagnosis) {
      return new Response(JSON.stringify({ error: 'OpenAI no devolvió contenido.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      maturityLevel,
      scores,
      diagnosis,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Error inesperado.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
