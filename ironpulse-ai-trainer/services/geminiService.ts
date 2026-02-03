import { GoogleGenAI, Type } from '@google/genai';
import { Exercise } from '../types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateWorkoutPlan = async (
  goal: string,
  level: string,
  duration: string,
  targetMuscle: string,
  includeCardio: boolean
): Promise<{ name: string; exercises: Exercise[] }> => {
  
  // Safely access API key handling browser environments where process might be undefined
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("Environment variable access failed", e);
  }
  
  if (!apiKey) {
    throw new Error("Google API Key is not configured in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey, vertexai: true });

  const prompt = `
    Crie um treino de academia completo e detalhado.
    
    PARÂMETROS DO USUÁRIO:
    - Objetivo Principal: ${goal}
    - Nível de Experiência: ${level}
    - Duração Disponível: ${duration}
    - Foco Muscular (Parte do Corpo): ${targetMuscle}
    - Incluir Cardio/Aeróbico: ${includeCardio ? "SIM, inclua exercícios de cardio no início ou fim." : "NÃO, foco apenas em musculação."}
    
    INSTRUÇÕES IMPORTANTES DE VARIEDADE:
    1. MISTURA DE EQUIPAMENTOS: É obrigatório variar entre exercícios com Peso Livre (Halteres, Barras), Peso do Corpo (Calistenia) e Máquinas. Não faça um treino só de máquinas nem só de pesos livres.
    2. ESPECIFICIDADE: No campo 'equipment', NÃO use apenas "Máquina". Diga qual máquina exata (ex: "Cadeira Extensora", "Leg Press 45", "Polia Alta", "Smith Machine", "Peck Deck").
    3. Se for halteres, especifique "Halteres". Se for barra, "Barra Olímpica" ou "Barra W".
    
    INSTRUÇÕES DE RESPOSTA:
    Retorne APENAS um objeto JSON com o nome do treino e uma lista de exercícios.
    
    Para cada exercício, forneça:
    - name (nome em PORTUGUÊS, ex: "Supino Reto com Halteres", "Agachamento Livre")
    - muscle (grupo muscular principal em Português: Peito, Costas, Pernas, Abdômen, Braços, Ombros, Cardio)
    - sets (número sugerido de séries, ex: 3 or 4)
    - reps (string com repetições, ex: "10-12", "Falha", "15 min")
    - instructions (breve instrução técnica em português)
    - type (Força, Cardio, Alongamento, Powerlifting)
    - equipment (Seja específico: "Halteres", "Barra", "Cadeira Extensora", "Polia", "Peso do corpo", etc)
  `;

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    muscle: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    type: { type: Type.STRING },
                    equipment: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  },
                  required: ["name", "muscle", "sets", "reps", "instructions", "equipment"]
                }
              }
            },
            required: ["name", "exercises"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const data = JSON.parse(text);
      
      // Add unique IDs to generated exercises to ensure React rendering stability
      if (data.exercises && Array.isArray(data.exercises)) {
        data.exercises = data.exercises.map((ex: any, i: number) => ({
          ...ex,
          id: `gen-${Date.now()}-${i}`
        }));
      }

      return data;
    } catch (error: any) {
      attempt++;
      console.error(`Gemini API Attempt ${attempt} failed:`, error);

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${backoffTime}ms...`);
      await delay(backoffTime);
    }
  }

  throw new Error("Failed to generate workout plan after multiple retries");
};
