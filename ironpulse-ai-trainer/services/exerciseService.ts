import { Exercise } from '../types';

// Default to the raw JSON from the repository as a serverless data source
let API_URL = 'https://raw.githubusercontent.com/luiizsilverio/api-academia/main/api.json';

export const setApiUrl = (url: string) => {
  API_URL = url;
  cachedExercises = null; // Clear cache to force refetch
};

export const getApiUrl = () => API_URL;

// Robust fallback data in Portuguese matching the expected API structure
const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: 1,
    name: "Supino Reto",
    muscle: "Peito",
    equipment: "Barra",
    difficulty: "Intermediário",
    instructions: "Deite-se no banco plano. Segure a barra com as mãos um pouco mais afastadas que a largura dos ombros. Desça a barra até tocar o peito e empurre de volta à posição inicial.",
    type: "Força",
    gifUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJ0ZXZ4Y2Z4Y2Z4Y2Z4Y2Z4Y2Z4Y2Z4Y2Z4Y2Z4Y2Z4/3o7TKSjRrfIPjeiVyM/giphy.gif" // Placeholder or generic
  },
  {
    id: 2,
    name: "Agachamento Livre",
    muscle: "Pernas",
    equipment: "Barra",
    difficulty: "Avançado",
    instructions: "Coloque a barra sobre os trapézios. Pés na largura dos ombros. Flexione os joelhos e quadril descendo até as coxas ficarem paralelas ao chão. Suba mantendo a coluna reta.",
    type: "Força"
  },
  {
    id: 3,
    name: "Puxada Frontal",
    muscle: "Costas",
    equipment: "Máquina",
    difficulty: "Iniciante",
    instructions: "Sentado na máquina, segure a barra com pegada aberta. Puxe a barra em direção ao peito superior, contraindo as escápulas. Retorne controlando o peso.",
    type: "Força"
  },
  {
    id: 4,
    name: "Desenvolvimento com Halteres",
    muscle: "Ombros",
    equipment: "Halteres",
    difficulty: "Intermediário",
    instructions: "Sentado, segure um halter em cada mão na altura dos ombros. Empurre os pesos para cima até estender os braços. Desça controladamente.",
    type: "Força"
  },
  {
    id: 5,
    name: "Rosca Direta",
    muscle: "Bíceps",
    equipment: "Barra",
    difficulty: "Iniciante",
    instructions: "Em pé, segure a barra com as palmas para frente. Flexione os cotovelos trazendo a barra até a altura do peito. Mantenha os cotovelos fixos ao lado do corpo.",
    type: "Força"
  },
  {
    id: 6,
    name: "Tríceps Pulley",
    muscle: "Tríceps",
    equipment: "Cabo",
    difficulty: "Iniciante",
    instructions: "Em pé de frente para a polia alta, segure a barra curta. Estenda os cotovelos empurrando a barra para baixo. Mantenha os cotovelos fixos.",
    type: "Força"
  },
  {
    id: 7,
    name: "Leg Press 45",
    muscle: "Pernas",
    equipment: "Máquina",
    difficulty: "Iniciante",
    instructions: "Sente-se no aparelho e coloque os pés na plataforma. Empurre a plataforma estendendo as pernas (sem travar os joelhos) e desça até formar 90 graus.",
    type: "Força"
  },
  {
    id: 8,
    name: "Abdominal Crunch",
    muscle: "Abdômen",
    equipment: "Peso do corpo",
    difficulty: "Iniciante",
    instructions: "Deitado de costas, flexione os joelhos. Coloque as mãos atrás da cabeça e flexione o tronco tentando aproximar as costelas do quadril.",
    type: "Força"
  },
  {
    id: 9,
    name: "Stiff",
    muscle: "Posterior de Coxa",
    equipment: "Barra",
    difficulty: "Intermediário",
    instructions: "Em pé, segure a barra à frente das coxas. Mantenha as pernas levemente flexionadas e desça o tronco mantendo a coluna reta, levando o quadril para trás.",
    type: "Força"
  },
  {
    id: 10,
    name: "Elevação Lateral",
    muscle: "Ombros",
    equipment: "Halteres",
    difficulty: "Intermediário",
    instructions: "Em pé, segure os halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros, com os cotovelos levemente flexionados.",
    type: "Força"
  }
];

// Cache to avoid repeated fetches
let cachedExercises: Exercise[] | null = null;

export const getAllExercises = async (): Promise<Exercise[]> => {
  if (cachedExercises) return cachedExercises;

  try {
    console.log(`Fetching exercises from: ${API_URL}`);
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from API: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Normalize data structure based on the expected API format
    // The API might return an array of objects directly
    const rawList = Array.isArray(data) ? data : (data.data || []);

    if (!Array.isArray(rawList) || rawList.length === 0) {
      console.warn("API returned empty or invalid list, using fallback.");
      return FALLBACK_EXERCISES;
    }

    const normalized: Exercise[] = rawList.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      name: item.name || item.nome || "Exercício",
      muscle: item.muscle || item.grupo_muscular || item.muscle_group || "Geral",
      equipment: item.equipment || item.equipamento || "Livre",
      difficulty: item.difficulty || item.dificuldade || "Variado",
      instructions: Array.isArray(item.instructions) 
        ? item.instructions.join(' ') 
        : (item.instructions || item.descricao || item.description || "Sem instruções detalhadas."),
      gifUrl: item.gifUrl || item.imagem || item.image || null,
      type: "Força"
    }));

    cachedExercises = normalized;
    return normalized;
  } catch (error) {
    console.warn("Could not fetch external API, using fallback data.", error);
    return FALLBACK_EXERCISES;
  }
};

export const searchExercises = async (params: { muscle?: string; name?: string }): Promise<Exercise[]> => {
  const all = await getAllExercises();
  
  return all.filter(ex => {
    let matches = true;
    
    if (params.muscle) {
      const pMuscle = params.muscle.toLowerCase();
      const exMuscle = ex.muscle.toLowerCase();
      
      // Direct match or translation map
      const map: Record<string, string> = { 
        'chest': 'peito', 
        'back': 'costas', 
        'legs': 'pernas', 
        'shoulders': 'ombros', 
        'arms': 'braços', 
        'abs': 'abdômen',
        'quadriceps': 'pernas',
        'lats': 'costas',
        'glutes': 'pernas'
      };
      
      const translatedSearch = map[pMuscle] || pMuscle;
      
      // Check if the exercise muscle contains the search term (or vice versa for broad categories)
      if (!exMuscle.includes(translatedSearch) && !translatedSearch.includes(exMuscle)) {
        matches = false;
      }
    }

    if (params.name) {
      if (!ex.name.toLowerCase().includes(params.name.toLowerCase())) matches = false;
    }

    return matches;
  });
};
