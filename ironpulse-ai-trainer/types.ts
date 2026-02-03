export interface Exercise {
  id?: string | number;
  name: string;
  type?: string;
  muscle: string;
  equipment?: string;
  difficulty?: string;
  instructions: string;
  sets?: number;
  reps?: string;
  duration_minutes?: number;
  gifUrl?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  durationSeconds: number;
  exercisesCompleted: number;
  totalExercises: number;
  name: string;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  lastWorkoutDate: string | null;
  totalMinutes: number;
}

export interface SavedWorkout {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  targetMuscle: string;
  goal: string;
}

export interface AcademiaApiResponse {
  id: number;
  name: string;
  muscle: string;
  equipment: string;
  instructions: string[];
  gifUrl?: string;
  videoUrl?: string;
}

export interface ApiNinjasResponse {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}
