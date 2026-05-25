import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dumbbell,
  Utensils,
  BarChart2,
  User,
  Plus,
  Trash2,
  Play,
  Timer,
  ChevronRight,
  Droplet,
  Scale,
  LogOut,
  Award,
  Activity,
  X,
  Check
} from 'lucide-react';

// ==========================================
// MOCK DATA & CONSTANTS
// ==========================================

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'cardio';
  primaryMuscleGroup: string;
  equipment: string;
}

const GLOBAL_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Barbell Bench Press', description: 'Lie on a flat bench, grip barbell, lower to chest, and press up.', category: 'strength', primaryMuscleGroup: 'Chest', equipment: 'Barbell' },
  { id: 'ex-2', name: 'Barbell Back Squat', description: 'Rest barbell on shoulders, squat down until hips are below knees, drive up.', category: 'strength', primaryMuscleGroup: 'Legs', equipment: 'Barbell' },
  { id: 'ex-3', name: 'Barbell Deadlift', description: 'Pull weighted barbell from floor to hip height, keeping back straight.', category: 'strength', primaryMuscleGroup: 'Back', equipment: 'Barbell' },
  { id: 'ex-4', name: 'Dumbbell Bicep Curl', description: 'Hold dumbbells at sides, curl weights up towards shoulders, lower down.', category: 'strength', primaryMuscleGroup: 'Arms', equipment: 'Dumbbells' },
  { id: 'ex-5', name: 'Overhead Shoulder Press', description: 'Press barbell or dumbbells from shoulders straight overhead.', category: 'strength', primaryMuscleGroup: 'Shoulders', equipment: 'Barbell' },
  { id: 'ex-6', name: 'Pull-Up', description: 'Hang from pull-up bar, pull chest to bar height, and control descent.', category: 'strength', primaryMuscleGroup: 'Back', equipment: 'Bodyweight' },
  { id: 'ex-7', name: 'Push-Up', description: 'Perform plank position, lower chest to ground, press back up.', category: 'strength', primaryMuscleGroup: 'Chest', equipment: 'Bodyweight' },
  { id: 'ex-8', name: 'Tricep Rope Pushdown', description: 'Push cable attachment down, keeping elbows close to torso.', category: 'strength', primaryMuscleGroup: 'Arms', equipment: 'Machine' },
  { id: 'ex-9', name: 'Dumbbell Lateral Raise', description: 'Raise dumbbells outwards to shoulder level, lower slowly.', category: 'strength', primaryMuscleGroup: 'Shoulders', equipment: 'Dumbbells' },
  { id: 'ex-10', name: 'Leg Press', description: 'Push weighted sled away from body using legs.', category: 'strength', primaryMuscleGroup: 'Legs', equipment: 'Machine' },
  { id: 'ex-11', name: 'Treadmill Run', description: 'Run or jog at a steady pace on a treadmill.', category: 'cardio', primaryMuscleGroup: 'Legs', equipment: 'Machine' }
];

interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Routine {
  id: string;
  name: string;
  description: string;
  exercises: RoutineExercise[];
}

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'rot-1',
    name: 'Full Body Fundamentals',
    description: 'A great basic full body workout for beginners and strength development.',
    exercises: [
      { exerciseId: 'ex-2', sets: 3, reps: 8, weight: 60 },
      { exerciseId: 'ex-1', sets: 3, reps: 8, weight: 40 },
      { exerciseId: 'ex-6', sets: 3, reps: 8, weight: 0 }
    ]
  },
  {
    id: 'rot-2',
    name: 'Upper Body Pump',
    description: 'Focused workout on Chest, Back, and Arm muscles.',
    exercises: [
      { exerciseId: 'ex-1', sets: 4, reps: 10, weight: 50 },
      { exerciseId: 'ex-6', sets: 3, reps: 8, weight: 0 },
      { exerciseId: 'ex-4', sets: 3, reps: 12, weight: 12 },
      { exerciseId: 'ex-8', sets: 3, reps: 12, weight: 20 }
    ]
  }
];

// ==========================================
// INTERFACES FOR STATE
// ==========================================

interface Profile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  goal: string; // lose, build, maintain
  activityLevel: string;
  injuries: string[];
}

interface WorkoutSetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ActiveWorkout {
  name: string;
  routineId?: string;
  startedAt: string;
  elapsedSeconds: number;
  exercises: {
    exerciseId: string;
    sets: WorkoutSetLog[];
  }[];
}

interface CompletedWorkout {
  id: string;
  name: string;
  date: string;
  durationSeconds: number;
  totalVolume: number;
  exercises: {
    exerciseId: string;
    setsCount: number;
    bestWeight: number;
  }[];
}

interface NutritionLog {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
}

interface WaterLog {
  date: string;
  amountMl: number;
}

interface WeightLog {
  date: string;
  weight: number;
}

export default function App() {
  // ==========================================
  // APP STATE & PERSISTENCE LOAD
  // ==========================================
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ff_auth') === 'true';
  });
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('ff_onboarded') === 'true';
  });

  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('ff_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      age: 25,
      height: 175,
      weight: 70,
      targetWeight: 75,
      goal: 'build',
      activityLevel: 'moderately',
      injuries: []
    };
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('ff_routines');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(() => {
    const saved = localStorage.getItem('ff_active_workout');
    return saved ? JSON.parse(saved) : null;
  });

  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkout[]>(() => {
    const saved = localStorage.getItem('ff_history');
    return saved ? JSON.parse(saved) : [
      {
        id: 'h-1',
        name: 'Full Body Fundamentals',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
        durationSeconds: 2700,
        totalVolume: 2400,
        exercises: [
          { exerciseId: 'ex-2', setsCount: 3, bestWeight: 60 },
          { exerciseId: 'ex-1', setsCount: 3, bestWeight: 40 }
        ]
      },
      {
        id: 'h-2',
        name: 'Upper Body Pump',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
        durationSeconds: 3200,
        totalVolume: 2880,
        exercises: [
          { exerciseId: 'ex-1', setsCount: 4, bestWeight: 50 },
          { exerciseId: 'ex-4', setsCount: 3, bestWeight: 12 }
        ]
      }
    ];
  });

  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>(() => {
    const saved = localStorage.getItem('ff_nutrition');
    const today = new Date().toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : [
      { id: 'n-1', foodName: 'Oatmeal with Banana', calories: 350, protein: 12, carbs: 65, fat: 6, mealType: 'breakfast', time: `${today} 08:30` },
      { id: 'n-2', foodName: 'Grilled Chicken & Rice', calories: 650, protein: 48, carbs: 70, fat: 12, mealType: 'lunch', time: `${today} 13:00` }
    ];
  });

  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('ff_water');
    const today = new Date().toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : [
      { date: today, amountMl: 750 }
    ];
  });

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => {
    const saved = localStorage.getItem('ff_weight_logs');
    const today = new Date().toISOString().split('T')[0];
    const dayAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return saved ? JSON.parse(saved) : [
      { date: dayAgo(20), weight: 72.5 },
      { date: dayAgo(15), weight: 72.0 },
      { date: dayAgo(10), weight: 71.4 },
      { date: dayAgo(5), weight: 70.8 },
      { date: today, weight: 70.2 }
    ];
  });

  const [currentTab, setCurrentTab] = useState<'workout' | 'nutrition' | 'analytics' | 'profile'>('workout');

  // Navigation Screen Routing
  // 'auth' | 'onboarding' | 'app'
  const [activeScreen, setActiveScreen] = useState<'auth' | 'onboarding' | 'app'>(() => {
    if (!isAuthenticated) return 'auth';
    if (!hasCompletedOnboarding) return 'onboarding';
    return 'app';
  });

  // ==========================================
  // EFFECTS FOR STORAGE STORAGE AUTO-SYNC
  // ==========================================
  useEffect(() => {
    localStorage.setItem('ff_auth', isAuthenticated.toString());
    localStorage.setItem('ff_onboarded', hasCompletedOnboarding.toString());
    localStorage.setItem('ff_profile', JSON.stringify(profile));
    localStorage.setItem('ff_routines', JSON.stringify(routines));
    localStorage.setItem('ff_active_workout', activeWorkout ? JSON.stringify(activeWorkout) : '');
    localStorage.setItem('ff_history', JSON.stringify(workoutHistory));
    localStorage.setItem('ff_nutrition', JSON.stringify(nutritionLogs));
    localStorage.setItem('ff_water', JSON.stringify(waterLogs));
    localStorage.setItem('ff_weight_logs', JSON.stringify(weightLogs));
    
    if (!isAuthenticated) setActiveScreen('auth');
    else if (!hasCompletedOnboarding) setActiveScreen('onboarding');
    else setActiveScreen('app');
  }, [isAuthenticated, hasCompletedOnboarding, profile, routines, activeWorkout, workoutHistory, nutritionLogs, waterLogs, weightLogs]);

  // ==========================================
  // ACTIVE WORKOUT TIMER LOGIC
  // ==========================================
  const timerIntervalRef = useRef<any | null>(null);
  
  useEffect(() => {
    if (activeWorkout) {
      timerIntervalRef.current = setInterval(() => {
        setActiveWorkout(prev => {
          if (!prev) return null;
          return {
            ...prev,
            elapsedSeconds: prev.elapsedSeconds + 1
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeWorkout !== null]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const restIntervalRef = useRef<any | null>(null);

  const startRestTimer = (duration: number) => {
    setRestTimerSeconds(duration);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    restIntervalRef.current = setInterval(() => {
      setRestTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  const [showAddExActiveModal, setShowAddExActiveModal] = useState(false);

  // ==========================================
  // SCREEN 1: AUTHENTICATION (MOCK SCREEN)
  // ==========================================
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | 'apple'>('email');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'email' && !authEmail) return;
    setIsAuthenticated(true);
  };

  const RenderAuthScreen = () => {
    return (
      <div className="onboarding-container animated-fade" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'var(--grad-primary)', marginBottom: '16px', boxShadow: '0 8px 24px var(--primary-glow)' }}>
            <Dumbbell size={36} color="white" />
          </div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>FLEXFIT</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Your Ultimate Personal Technical Fitness Co-founder</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button 
              className={`btn flex-1 ${authMethod === 'email' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAuthMethod('email')}
              style={{ padding: '10px', fontSize: '13px' }}
            >
              Email
            </button>
            <button 
              className={`btn flex-1 ${authMethod === 'google' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setAuthMethod('google'); setIsAuthenticated(true); }}
              style={{ padding: '10px', fontSize: '13px' }}
            >
              Google
            </button>
            <button 
              className={`btn flex-1 ${authMethod === 'apple' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setAuthMethod('apple'); setIsAuthenticated(true); }}
              style={{ padding: '10px', fontSize: '13px' }}
            >
              Apple
            </button>
          </div>

          {authMethod === 'email' ? (
            <form onSubmit={handleSignIn}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                Sign In / Sign Up
              </button>
            </form>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <p>Connecting with securely managed OAuth gateway...</p>
              <div className="badge badge-purple">Clicking button logs in automatically</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // SCREEN 2: ONBOARDING SURVEY
  // ==========================================
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardName, setOnboardName] = useState('');
  const [onboardAge, setOnboardAge] = useState(25);
  const [onboardHeight, setOnboardHeight] = useState(175);
  const [onboardWeight, setOnboardWeight] = useState(70);
  const [onboardTargetWeight, setOnboardTargetWeight] = useState(75);
  const [onboardGoal, setOnboardGoal] = useState('build');
  const [onboardActivity, setOnboardActivity] = useState('moderately');
  const [onboardInjuries, setOnboardInjuries] = useState<string[]>([]);

  const handleInjuryToggle = (injury: string) => {
    if (onboardInjuries.includes(injury)) {
      setOnboardInjuries(onboardInjuries.filter(i => i !== injury));
    } else {
      setOnboardInjuries([...onboardInjuries, injury]);
    }
  };

  const handleOnboardingSubmit = () => {
    setProfile({
      name: onboardName || 'Flex Athlete',
      age: onboardAge,
      height: onboardHeight,
      weight: onboardWeight,
      targetWeight: onboardTargetWeight,
      goal: onboardGoal,
      activityLevel: onboardActivity,
      injuries: onboardInjuries
    });
    
    // Add first weight log automatically
    const today = new Date().toISOString().split('T')[0];
    setWeightLogs([{ date: today, weight: onboardWeight }, ...weightLogs.filter(w => w.date !== today)]);
    
    setHasCompletedOnboarding(true);
    setActiveScreen('app');
  };

  const RenderOnboardingScreen = () => {
    return (
      <div className="onboarding-container app-content animated-fade" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '32px' }}>
        <div style={{ marginTop: '20px' }}>
          <div className="progress-dots">
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className={`dot ${step === onboardingStep ? 'active' : ''}`} />
            ))}
          </div>
        </div>

        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {onboardingStep === 1 && (
            <div className="animated-slide">
              <h2>Let's get to know you</h2>
              <p>Welcome! Let's start with your name and age to tailor the plan.</p>
              <div className="card">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter name"
                    value={onboardName}
                    onChange={(e) => setOnboardName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age ({onboardAge} years)</label>
                  <input 
                    type="range" 
                    min="14" 
                    max="80" 
                    className="form-input" 
                    value={onboardAge}
                    onChange={(e) => setOnboardAge(parseInt(e.target.value))}
                    style={{ padding: '0', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="animated-slide">
              <h2>Body Metrics</h2>
              <p>Height and weight parameters help calculate energy values.</p>
              <div className="card">
                <div className="form-group">
                  <label className="form-label">Height: {onboardHeight} cm</label>
                  <input 
                    type="range" 
                    min="120" 
                    max="220" 
                    value={onboardHeight}
                    onChange={(e) => setOnboardHeight(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Weight: {onboardWeight} kg</label>
                  <input 
                    type="range" 
                    min="40" 
                    max="150" 
                    value={onboardWeight}
                    onChange={(e) => setOnboardWeight(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Weight: {onboardTargetWeight} kg</label>
                  <input 
                    type="range" 
                    min="40" 
                    max="150" 
                    value={onboardTargetWeight}
                    onChange={(e) => setOnboardTargetWeight(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="animated-slide">
              <h2>Select Fitness Goal</h2>
              <p>We'll tune calorie recommendations to match your primary goal.</p>
              <div>
                <div 
                  className={`option-card ${onboardGoal === 'lose' ? 'selected' : ''}`}
                  onClick={() => setOnboardGoal('lose')}
                >
                  <div style={{ background: 'var(--accent-rose)', padding: '10px', borderRadius: '10px', color: 'white' }}>
                    <Scale size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0' }}>Lose Weight</h3>
                    <p style={{ margin: 0, fontSize: '12px' }}>Maintain a calorie deficit to shed fat.</p>
                  </div>
                </div>

                <div 
                  className={`option-card ${onboardGoal === 'build' ? 'selected' : ''}`}
                  onClick={() => setOnboardGoal('build')}
                >
                  <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '10px', color: 'white' }}>
                    <Dumbbell size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0' }}>Build Muscle</h3>
                    <p style={{ margin: 0, fontSize: '12px' }}>Gain strength and muscle hypertrophy.</p>
                  </div>
                </div>

                <div 
                  className={`option-card ${onboardGoal === 'maintain' ? 'selected' : ''}`}
                  onClick={() => setOnboardGoal('maintain')}
                >
                  <div style={{ background: 'var(--secondary)', padding: '10px', borderRadius: '10px', color: 'white' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 2px 0' }}>Improve Fitness</h3>
                    <p style={{ margin: 0, fontSize: '12px' }}>Keep weight steady and boost general health.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div className="animated-slide">
              <h2>Activity Level</h2>
              <p>How active are you in your day-to-day routine?</p>
              <div>
                {[
                  { value: 'sedentary', title: 'Sedentary', desc: 'Little to no exercise, desk job.' },
                  { value: 'lightly', title: 'Lightly Active', desc: 'Light exercise/sports 1-3 days/week.' },
                  { value: 'moderately', title: 'Moderately Active', desc: 'Moderate workouts 3-5 days/week.' },
                  { value: 'very', title: 'Highly Active', desc: 'Heavy training/sports 6-7 days/week.' }
                ].map(item => (
                  <div 
                    key={item.value}
                    className={`option-card ${onboardActivity === item.value ? 'selected' : ''}`}
                    onClick={() => setOnboardActivity(item.value)}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 2px 0' }}>{item.title}</h3>
                      <p style={{ margin: 0, fontSize: '12px' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div className="animated-slide">
              <h2>Injuries / Focus Areas</h2>
              <p>Identify joints or muscles we should avoid overstraining.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['Shoulder', 'Knee', 'Lower Back', 'Wrist', 'Neck', 'Ankle'].map(injury => {
                  const isSelected = onboardInjuries.includes(injury);
                  return (
                    <div 
                      key={injury}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleInjuryToggle(injury)}
                      style={{ margin: 0, justifyContent: 'center', textAlign: 'center', padding: '20px 10px' }}
                    >
                      <span style={{ fontWeight: '600' }}>{injury}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px' }}>Leave unselected if you have no current joint issues or injuries.</p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {onboardingStep > 1 && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setOnboardingStep(prev => prev - 1)}
              style={{ width: '80px' }}
            >
              Back
            </button>
          )}
          
          {onboardingStep < 5 ? (
            <button 
              className="btn btn-primary flex-1"
              onClick={() => setOnboardingStep(prev => prev + 1)}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              className="btn btn-success flex-1"
              onClick={handleOnboardingSubmit}
            >
              Let's Go! <Check size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // SCREEN 3: TAB 1 (WORKOUT MANAGEMENT)
  // ==========================================
  
  // Custom Routine Builder state
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newRoutineExercises, setNewRoutineExercises] = useState<{ exerciseId: string; sets: number; reps: number; weight: number }[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Exercise library filter
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch) return GLOBAL_EXERCISES;
    return GLOBAL_EXERCISES.filter(ex => 
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.primaryMuscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
    );
  }, [exerciseSearch]);

  const addExerciseToNewRoutine = (exId: string) => {
    if (newRoutineExercises.some(e => e.exerciseId === exId)) return;
    setNewRoutineExercises([...newRoutineExercises, { exerciseId: exId, sets: 3, reps: 10, weight: 20 }]);
  };

  const removeExerciseFromNewRoutine = (exId: string) => {
    setNewRoutineExercises(newRoutineExercises.filter(e => e.exerciseId !== exId));
  };

  const handleUpdateNewRoutineExercise = (index: number, field: 'sets' | 'reps' | 'weight', val: number) => {
    const updated = [...newRoutineExercises];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    setNewRoutineExercises(updated);
  };

  const handleSaveRoutine = () => {
    if (!newRoutineName || newRoutineExercises.length === 0) return;
    const newRoutine: Routine = {
      id: `rot-custom-${Date.now()}`,
      name: newRoutineName,
      description: newRoutineDesc || 'User-defined workout routine.',
      exercises: newRoutineExercises
    };
    setRoutines([...routines, newRoutine]);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setNewRoutineExercises([]);
    setShowRoutineModal(false);
  };

  // Active workout routines
  const handleStartWorkout = (routine?: Routine) => {
    if (activeWorkout) {
      if (!confirm('You already have an active workout session. Do you want to cancel it and start a new one?')) return;
    }

    if (routine) {
      const activeExs = routine.exercises.map(item => ({
        exerciseId: item.exerciseId,
        sets: Array.from({ length: item.sets }, () => ({
          reps: item.reps,
          weight: item.weight,
          completed: false
        }))
      }));
      
      setActiveWorkout({
        name: routine.name,
        routineId: routine.id,
        startedAt: new Date().toISOString(),
        elapsedSeconds: 0,
        exercises: activeExs
      });
    } else {
      // Empty Workout
      setActiveWorkout({
        name: 'Quick Workout',
        startedAt: new Date().toISOString(),
        elapsedSeconds: 0,
        exercises: []
      });
    }
    
    // Switch to workout tab & scroll to top
    setCurrentTab('workout');
  };

  const handleAddExerciseToActiveWorkout = (exId: string) => {
    if (!activeWorkout) return;
    if (activeWorkout.exercises.some(e => e.exerciseId === exId)) return;
    
    const updatedExs = [...activeWorkout.exercises, {
      exerciseId: exId,
      sets: [{ reps: 10, weight: 20, completed: false }]
    }];
    
    setActiveWorkout({
      ...activeWorkout,
      exercises: updatedExs
    });
  };

  const handleAddSetToActiveExercise = (exIndex: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    const targetEx = updated.exercises[exIndex];
    const lastSet = targetEx.sets[targetEx.sets.length - 1] || { reps: 10, weight: 20 };
    targetEx.sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false
    });
    setActiveWorkout(updated);
  };

  const handleRemoveSetFromActiveExercise = (exIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    updated.exercises[exIndex].sets.splice(setIndex, 1);
    if (updated.exercises[exIndex].sets.length === 0) {
      updated.exercises.splice(exIndex, 1); // remove exercise if no sets remain
    }
    setActiveWorkout(updated);
  };

  const handleUpdateActiveSet = (exIndex: number, setIndex: number, field: 'reps' | 'weight', val: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    updated.exercises[exIndex].sets[setIndex] = {
      ...updated.exercises[exIndex].sets[setIndex],
      [field]: val
    };
    setActiveWorkout(updated);
  };

  const handleToggleSetCompletion = (exIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const updated = { ...activeWorkout };
    const currentSet = updated.exercises[exIndex].sets[setIndex];
    const nextCompleted = !currentSet.completed;
    
    currentSet.completed = nextCompleted;
    setActiveWorkout(updated);
    
    // Start 60-second rest timer when a set is completed
    if (nextCompleted) {
      startRestTimer(60);
    }
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout) return;
    
    // Calculate volume
    let totalVolume = 0;
    const summaryExercises: { exerciseId: string; setsCount: number; bestWeight: number }[] = [];
    
    activeWorkout.exercises.forEach(ex => {
      let maxWeight = 0;
      let completedSets = 0;
      
      ex.sets.forEach(set => {
        if (set.completed) {
          completedSets++;
          totalVolume += set.reps * set.weight;
          if (set.weight > maxWeight) maxWeight = set.weight;
        }
      });
      
      if (completedSets > 0) {
        summaryExercises.push({
          exerciseId: ex.exerciseId,
          setsCount: completedSets,
          bestWeight: maxWeight
        });
      }
    });

    if (summaryExercises.length === 0) {
      if (confirm('You haven\'t completed any sets yet. Discard workout?')) {
        setActiveWorkout(null);
      }
      return;
    }

    const completed: CompletedWorkout = {
      id: `h-saved-${Date.now()}`,
      name: activeWorkout.name || 'Quick Session',
      date: new Date().toISOString().split('T')[0],
      durationSeconds: activeWorkout.elapsedSeconds,
      totalVolume,
      exercises: summaryExercises
    };

    setWorkoutHistory([completed, ...workoutHistory]);
    setActiveWorkout(null);
    setRestTimerSeconds(null);
    setCurrentTab('analytics'); // Go view the analytics!
  };

  const handleDeleteRoutine = (rId: string) => {
    setRoutines(routines.filter(r => r.id !== rId));
  };

  const RenderWorkoutTab = () => {
    // If Active Workout modal is shown, overlay it or display directly

    if (activeWorkout) {
      return (
        <div className="animated-fade" style={{ paddingTop: '10px' }}>
          {/* Active Workout Interface */}
          <div className="card" style={{ border: '1px solid var(--primary)', boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)' }}>
            <div className="flex-row justify-between align-center" style={{ marginBottom: '16px' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '4px' }}>Active Session</span>
                <h2 style={{ margin: 0 }}>{activeWorkout.name}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                <Timer size={18} />
                <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace' }}>{formatTimer(activeWorkout.elapsedSeconds)}</span>
              </div>
            </div>

            {activeWorkout.exercises.map((ex, exIndex) => {
              const exerciseDetails = GLOBAL_EXERCISES.find(e => e.id === ex.exerciseId);
              return (
                <div key={ex.exerciseId} style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.01)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="flex-row justify-between align-center" style={{ marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px' }}>{exerciseDetails?.name}</h3>
                    <span className="badge badge-teal" style={{ fontSize: '9px' }}>{exerciseDetails?.primaryMuscleGroup}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 40px', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    <span>SET</span>
                    <span style={{ textAlign: 'center' }}>KG</span>
                    <span style={{ textAlign: 'center' }}>REPS</span>
                    <span style={{ textAlign: 'center' }}>DONE</span>
                  </div>

                  {ex.sets.map((set, setIndex) => (
                    <div key={setIndex} className="set-row">
                      <span className="set-number">{setIndex + 1}</span>
                      <input 
                        type="number" 
                        className="set-input" 
                        value={set.weight}
                        onChange={(e) => handleUpdateActiveSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      />
                      <input 
                        type="number" 
                        className="set-input" 
                        value={set.reps}
                        onChange={(e) => handleUpdateActiveSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div 
                          className={`checkbox-done ${set.completed ? 'checked' : ''}`}
                          onClick={() => handleToggleSetCompletion(exIndex, setIndex)}
                        >
                          {set.completed && <Check size={14} />}
                        </div>
                      </div>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '4px' }}
                        onClick={() => handleRemoveSetFromActiveExercise(exIndex, setIndex)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleAddSetToActiveExercise(exIndex)}
                    style={{ padding: '8px 12px', fontSize: '12px', marginTop: '8px', width: 'auto' }}
                  >
                    + Add Set
                  </button>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                className="btn btn-secondary flex-1"
                onClick={() => setShowAddExActiveModal(true)}
              >
                + Add Exercise
              </button>
              <button 
                className="btn btn-success flex-1"
                onClick={handleFinishWorkout}
              >
                Finish Workout
              </button>
            </div>
            
            <button 
              className="btn btn-danger" 
              onClick={() => { if(confirm('Discard current workout?')) setActiveWorkout(null); }}
              style={{ marginTop: '12px', padding: '10px', fontSize: '13px' }}
            >
              Discard Session
            </button>
          </div>

          {/* Rest Timer Overlay */}
          {restTimerSeconds !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '12px 16px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--secondary)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Timer size={18} className="text-gradient" />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Rest Interval Running</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'monospace' }}>{restTimerSeconds}s</span>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => setRestTimerSeconds(null)}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Add Exercise Modal (Inside active workout) */}
          {showAddExActiveModal && (
            <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#09090b', zIndex: 1000, padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '16px' }}>
                <h2>Add Exercise</h2>
                <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setShowAddExActiveModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search exercises..." 
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredExercises.map(ex => (
                  <div key={ex.id} className="card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px' }}>{ex.name}</h3>
                      <p style={{ margin: 0, fontSize: '11px' }}>{ex.primaryMuscleGroup} • {ex.equipment}</p>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        handleAddExerciseToActiveWorkout(ex.id);
                        setShowAddExActiveModal(false);
                      }}
                      style={{ padding: '6px 12px', fontSize: '11px', width: 'auto' }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="animated-fade">
        <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '4px' }}>Train Smart</span>
            <h1 style={{ margin: 0, fontSize: '26px' }}>Workout Hub</h1>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => handleStartWorkout()}
            style={{ width: 'auto', padding: '10px 14px', fontSize: '13px' }}
          >
            <Play size={14} /> Quick Start
          </button>
        </div>

        {/* Custom Routine Builder Modal Button */}
        <div className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', background: 'transparent' }}>
          <h3 style={{ margin: '0 0 4px 0' }}>Build Your Routine</h3>
          <p style={{ fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>Combine exercises into reusable templates with custom set/rep values.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowRoutineModal(true)}
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            <Plus size={16} /> Create Custom Routine
          </button>
        </div>

        <h2 style={{ marginTop: '24px', fontSize: '18px' }}>Routines Templates</h2>
        
        {routines.map(rot => (
          <div key={rot.id} className="card">
            <h3 style={{ margin: '0 0 6px 0' }}>{rot.name}</h3>
            <p style={{ fontSize: '12px', marginBottom: '12px' }}>{rot.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {rot.exercises.map(re => {
                const ex = GLOBAL_EXERCISES.find(e => e.id === re.exerciseId);
                return (
                  <span key={re.exerciseId} className="badge badge-teal" style={{ fontSize: '10px' }}>
                    {ex?.name} ({re.sets}x{re.reps})
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-primary flex-1"
                onClick={() => handleStartWorkout(rot)}
                style={{ padding: '10px' }}
              >
                Start Workout
              </button>
              {rot.id.startsWith('rot-custom') && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleDeleteRoutine(rot.id)}
                  style={{ width: '40px', padding: '10px', display: 'flex', justifyContent: 'center' }}
                >
                  <Trash2 size={16} color="var(--accent-rose)" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* ROUTINE BUILDER MODAL */}
        {showRoutineModal && (
          <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#09090b', zIndex: 1000, padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div className="flex-row justify-between align-center" style={{ marginBottom: '16px' }}>
              <h2>New Routine Template</h2>
              <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setShowRoutineModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              <div className="form-group">
                <label className="form-label">Routine Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Legs Hypertrophy, Pull A" 
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Short description..." 
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                />
              </div>

              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Exercises Selected:</h3>
              {newRoutineExercises.length === 0 ? (
                <p style={{ fontSize: '12px', fontStyle: 'italic', marginBottom: '16px' }}>No exercises added yet. Select from the library below.</p>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  {newRoutineExercises.map((re, index) => {
                    const ex = GLOBAL_EXERCISES.find(e => e.id === re.exerciseId);
                    return (
                      <div key={re.exerciseId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{ex?.name}</span>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sets:</span>
                              <input 
                                type="number" 
                                className="set-input" 
                                style={{ width: '45px', padding: '3px' }}
                                value={re.sets}
                                onChange={(e) => handleUpdateNewRoutineExercise(index, 'sets', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Reps:</span>
                              <input 
                                type="number" 
                                className="set-input" 
                                style={{ width: '45px', padding: '3px' }}
                                value={re.reps}
                                onChange={(e) => handleUpdateNewRoutineExercise(index, 'reps', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>KG:</span>
                              <input 
                                type="number" 
                                className="set-input" 
                                style={{ width: '50px', padding: '3px' }}
                                value={re.weight}
                                onChange={(e) => handleUpdateNewRoutineExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                          onClick={() => removeExerciseFromNewRoutine(re.exerciseId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Exercise Library</h3>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search exercise database..." 
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                style={{ marginBottom: '12px' }}
              />

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px' }}>
                {filteredExercises.map(ex => {
                  const isSelected = newRoutineExercises.some(re => re.exerciseId === ex.id);
                  return (
                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600' }}>{ex.name}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{ex.primaryMuscleGroup} • {ex.equipment}</div>
                      </div>
                      <button 
                        className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`} 
                        disabled={isSelected}
                        onClick={() => addExerciseToNewRoutine(ex.id)}
                        style={{ padding: '4px 8px', fontSize: '10px', width: 'auto' }}
                      >
                        {isSelected ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              className="btn btn-success" 
              onClick={handleSaveRoutine}
              style={{ marginTop: '16px' }}
              disabled={!newRoutineName || newRoutineExercises.length === 0}
            >
              Save Template
            </button>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // SCREEN 4: TAB 2 (NUTRITION & WATER)
  // ==========================================
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodNameInput, setFoodNameInput] = useState('');
  const [calInput, setCalInput] = useState('');
  const [protInput, setProtInput] = useState('');
  const [carbInput, setCarbInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [mealTypeInput, setMealTypeInput] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  // Calorie calculations based on goals
  const targetCalories = useMemo(() => {
    // Basic BMR calculation
    // Men estimate: 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
    // Activity multiplier: Sedentary: 1.2, Lightly: 1.375, Moderately: 1.55, Very: 1.725
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
    
    let multiplier = 1.2;
    if (profile.activityLevel === 'lightly') multiplier = 1.375;
    else if (profile.activityLevel === 'moderately') multiplier = 1.55;
    else if (profile.activityLevel === 'very') multiplier = 1.725;
    
    let tdee = Math.round(bmr * multiplier);
    
    if (profile.goal === 'lose') return tdee - 500;
    if (profile.goal === 'build') return tdee + 300;
    return tdee;
  }, [profile]);

  // Target Macros
  // 40% Carbs, 30% Protein, 30% Fat for general fitness
  // High Protein (35% P, 40% C, 25% F) for muscle build
  // Low Carb (45% P, 20% C, 35% F) for fat loss
  const targets = useMemo(() => {
    let pPct = 0.3;
    let cPct = 0.4;
    let fPct = 0.3;
    
    if (profile.goal === 'build') {
      pPct = 0.35;
      cPct = 0.40;
      fPct = 0.25;
    } else if (profile.goal === 'lose') {
      pPct = 0.40;
      cPct = 0.25;
      fPct = 0.35;
    }
    
    const pG = Math.round((targetCalories * pPct) / 4);
    const cG = Math.round((targetCalories * cPct) / 4);
    const fG = Math.round((targetCalories * fPct) / 9);
    
    return { protein: pG, carbs: cG, fat: fG };
  }, [targetCalories, profile.goal]);

  // Daily totals
  const dailyTotals = useMemo(() => {
    let cal = 0;
    let p = 0;
    let c = 0;
    let f = 0;
    
    nutritionLogs.forEach(log => {
      cal += log.calories;
      p += log.protein;
      c += log.carbs;
      f += log.fat;
    });
    
    return { calories: cal, protein: p, carbs: c, fat: f };
  }, [nutritionLogs]);

  // Water calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const waterTargetMl = 2500;
  
  const todayWater = useMemo(() => {
    const log = waterLogs.find(w => w.date === todayStr);
    return log ? log.amountMl : 0;
  }, [waterLogs, todayStr]);

  const handleAddWater = (amount: number) => {
    const updated = [...waterLogs];
    const logIdx = updated.findIndex(w => w.date === todayStr);
    
    if (logIdx >= 0) {
      updated[logIdx] = {
        ...updated[logIdx],
        amountMl: updated[logIdx].amountMl + amount
      };
    } else {
      updated.push({ date: todayStr, amountMl: amount });
    }
    
    setWaterLogs(updated);
  };

  const handleSaveFood = () => {
    if (!foodNameInput || !calInput) return;
    
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    
    const newFood: NutritionLog = {
      id: `food-${Date.now()}`,
      foodName: foodNameInput,
      calories: parseInt(calInput) || 0,
      protein: parseFloat(protInput) || 0,
      carbs: parseFloat(carbInput) || 0,
      fat: parseFloat(fatInput) || 0,
      mealType: mealTypeInput,
      time: `${today} ${nowTime}`
    };

    setNutritionLogs([newFood, ...nutritionLogs]);
    setFoodNameInput('');
    setCalInput('');
    setProtInput('');
    setCarbInput('');
    setFatInput('');
    setShowFoodModal(false);
  };

  const handleDeleteFood = (foodId: string) => {
    setNutritionLogs(nutritionLogs.filter(n => n.id !== foodId));
  };

  const RenderNutritionTab = () => {
    // Circle SVG configuration
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = Math.min(dailyTotals.calories / targetCalories, 1);
    const strokeDashoffset = circumference - (progressPercent * circumference);

    return (
      <div className="animated-fade">
        <div className="flex-row justify-between align-center" style={{ marginBottom: '20px' }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '4px' }}>Fuel Your Body</span>
            <h1 style={{ margin: 0, fontSize: '26px' }}>Nutrition Hub</h1>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowFoodModal(true)}
            style={{ width: 'auto', padding: '10px 14px', fontSize: '13px' }}
          >
            <Plus size={14} /> Add Meal
          </button>
        </div>

        {/* Circular Tracker Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '24px 16px' }}>
          <div className="circle-progress-container">
            <svg width="140" height="140">
              <defs>
                <linearGradient id="cyan-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle className="circle-bg" cx="70" cy="70" r={radius} />
              <circle 
                className="circle-fill" 
                cx="70" 
                cy="70" 
                r={radius} 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="circle-text">
              <span className="value">{Math.max(0, targetCalories - dailyTotals.calories)}</span>
              <span className="label">kcal left</span>
            </div>
          </div>

          <div style={{ flex: 1, paddingLeft: '16px' }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Eaten: </span>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>{dailyTotals.calories} kcal</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target: </span>
              <span style={{ fontSize: '15px', fontWeight: '700' }}>{targetCalories} kcal</span>
            </div>
          </div>
        </div>

        {/* Macro Budgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Protein', current: dailyTotals.protein, target: targets.protein, color: 'var(--primary)' },
            { label: 'Carbs', current: dailyTotals.carbs, target: targets.carbs, color: 'var(--secondary)' },
            { label: 'Fats', current: dailyTotals.fat, target: targets.fat, color: 'var(--accent-rose)' }
          ].map(macro => {
            const pct = Math.min((macro.current / macro.target) * 100, 100);
            return (
              <div key={macro.label} className="card" style={{ padding: '12px', marginBottom: 0, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{macro.label}</span>
                <div style={{ margin: '8px 0', fontSize: '16px', fontWeight: '700' }}>
                  {macro.current}g <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>/ {macro.target}g</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: macro.color, borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hydration Widget */}
        <div className="card">
          <div className="flex-row justify-between align-center" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplet color="var(--secondary)" size={20} /> Hydration Tracker
            </h3>
            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{todayWater} / {waterTargetMl} ml</span>
          </div>

          <div className="water-container">
            <div className="water-indicator">
              <div 
                className="water-fill" 
                style={{ height: `${Math.min((todayWater / waterTargetMl) * 100, 100)}%` }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAddWater(250)}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                + 250ml Glass
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleAddWater(500)}
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                + 500ml Bottle
              </button>
            </div>
          </div>
        </div>

        {/* Logged Foods */}
        <h2 style={{ fontSize: '18px', marginTop: '24px' }}>Food Logs Today</h2>
        {nutritionLogs.length === 0 ? (
          <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No meals logged today yet.</p>
        ) : (
          <div>
            {nutritionLogs.map(food => (
              <div key={food.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex-row align-center" style={{ gap: '6px', marginBottom: '2px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '8px', textTransform: 'uppercase' }}>{food.mealType}</span>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>{food.foodName}</h3>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                  </span>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                  onClick={() => handleDeleteFood(food.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ADD FOOD MODAL */}
        {showFoodModal && (
          <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#09090b', zIndex: 1000, padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div className="flex-row justify-between align-center" style={{ marginBottom: '16px' }}>
              <h2>Log Custom Meal</h2>
              <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setShowFoodModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select 
                  className="form-input" 
                  value={mealTypeInput} 
                  onChange={(e) => setMealTypeInput(e.target.value as any)}
                  style={{ background: '#1c1917' }}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Food/Meal Description</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Scrambled eggs or Whey Shake" 
                  value={foodNameInput}
                  onChange={(e) => setFoodNameInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Calories (kcal)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 400" 
                  value={calInput}
                  onChange={(e) => setCalInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="25" 
                    value={protInput}
                    onChange={(e) => setProtInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Carbs (g)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="30" 
                    value={carbInput}
                    onChange={(e) => setCarbInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fats (g)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="10" 
                    value={fatInput}
                    onChange={(e) => setFatInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              className="btn btn-success" 
              onClick={handleSaveFood}
              style={{ marginTop: '16px' }}
              disabled={!foodNameInput || !calInput}
            >
              Log Food
            </button>
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // SCREEN 5: TAB 3 (ANALYTICS & CHARTS)
  // ==========================================
  
  // Custom Weight add
  const [newWeightInput, setNewWeightInput] = useState('');
  
  const handleAddWeightLog = () => {
    const val = parseFloat(newWeightInput);
    if (!val || val <= 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const updated = [{ date: today, weight: val }, ...weightLogs.filter(w => w.date !== today)];
    
    // sort chronological for line graph rendering
    updated.sort((a,b) => a.date.localeCompare(b.date));
    
    setWeightLogs(updated);
    setProfile({ ...profile, weight: val }); // sync profile
    setNewWeightInput('');
  };

  // Streaks calculation: Number of consecutive days before/including today with workouts
  const streaksCount = useMemo(() => {
    if (workoutHistory.length === 0) return 0;
    
    const dates = new Set(workoutHistory.map(w => w.date));
    let count = 0;
    let checkDate = new Date();
    
    // Check back daily
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If streak checked today but no workout today, check if yesterday had a workout to keep streak alive
        if (count === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split('T')[0];
          if (dates.has(yesterdayStr)) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return count;
  }, [workoutHistory]);

  // Weight progression graph constants & calculations for analytics
  const chartW = 340;
  const chartH = 120;
  const padding = 15;

  const svgWeightLogs = useMemo(() => {
    // get last 7 weight entries
    return [...weightLogs]
      .sort((a,b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [weightLogs]);

  const weightGraphPath = useMemo(() => {
    if (svgWeightLogs.length < 2) return '';
    
    const weights = svgWeightLogs.map(l => l.weight);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const spread = maxW - minW || 1;
    
    const points = svgWeightLogs.map((log, index) => {
      const x = padding + (index / (svgWeightLogs.length - 1)) * (chartW - padding * 2);
      const y = chartH - padding - ((log.weight - minW) / spread) * (chartH - padding * 2);
      return { x, y };
    });

    // Build Bezier Curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
      path += ` C ${cpX} ${points[i - 1].y}, ${cpX} ${points[i].y}, ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, [svgWeightLogs]);

  const weightFillPath = useMemo(() => {
    if (!weightGraphPath || svgWeightLogs.length < 2) return '';
    
    const firstX = padding;
    const lastX = chartW - padding;
    const baseY = chartH;
    
    return `${weightGraphPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [weightGraphPath, svgWeightLogs]);

  // Volume Chart SVG
  // Max volume in history
  const historyLast5 = useMemo(() => {
    return [...workoutHistory].slice(-5).reverse();
  }, [workoutHistory]);

  const maxVolume = useMemo(() => {
    if (historyLast5.length === 0) return 1000;
    return Math.max(...historyLast5.map(h => h.totalVolume), 1000);
  }, [historyLast5]);

  const RenderAnalyticsTab = () => {
    return (
      <div className="animated-fade">
        <span className="badge badge-purple" style={{ marginBottom: '4px' }}>Track Progress</span>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '26px' }}>Analytics & Data</h1>

        {/* Streaks Card */}
        <div className="card flex-row align-center justify-between" style={{ background: 'var(--grad-sunset)', border: 'none', color: 'white' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: 'white' }}>Active Workout Streak</h3>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Consistency leads to growth. Keep it up!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={32} />
            <span style={{ fontSize: '32px', fontWeight: '800' }}>{streaksCount}</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>days</span>
          </div>
        </div>

        {/* Weight Progression Card */}
        <div className="card">
          <div className="flex-row justify-between align-center" style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Weight Tracker (kg)</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="number" 
                className="set-input" 
                placeholder="kg"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                style={{ width: '60px' }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleAddWeightLog}
                style={{ padding: '6px 10px', width: 'auto', fontSize: '12px' }}
              >
                Log
              </button>
            </div>
          </div>

          {svgWeightLogs.length < 2 ? (
            <div style={{ height: `${chartH}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Need at least 2 weight logs to show progression graph.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: `${chartH}px` }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weight-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area Gradient fill */}
                <path d={weightFillPath} fill="url(#weight-area-grad)" />
                {/* Line path */}
                <path d={weightGraphPath} fill="none" stroke="var(--primary)" strokeWidth="3" />
                {/* Dots */}
                {svgWeightLogs.map((log, index) => {
                  const weights = svgWeightLogs.map(l => l.weight);
                  const minW = Math.min(...weights) - 2;
                  const maxW = Math.max(...weights) + 2;
                  const spread = maxW - minW || 1;
                  const x = padding + (index / (svgWeightLogs.length - 1)) * (chartW - padding * 2);
                  const y = chartH - padding - ((log.weight - minW) / spread) * (chartH - padding * 2);
                  return (
                    <g key={index}>
                      <circle cx={x} cy={y} r="5" fill="#06b6d4" />
                      <text x={x} y={y - 8} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">{log.weight}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Volume Charts Card */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Lifted Volume (kg)</h3>
          {historyLast5.length === 0 ? (
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '12px', fontStyle: 'italic' }}>No workout sessions completed yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', paddingTop: '20px' }}>
              {historyLast5.map((hist) => {
                const heightPct = (hist.totalVolume / maxVolume) * 100;
                return (
                  <div key={hist.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>{hist.totalVolume}</span>
                    <div style={{ width: '30px', height: `${heightPct}px`, background: 'var(--grad-primary)', borderRadius: '6px 6px 0 0', boxShadow: '0 0 10px var(--secondary-glow)' }} />
                    <span style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '8px', width: '45px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {hist.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workout History logs */}
        <h2 style={{ fontSize: '18px', marginTop: '24px' }}>Workout History</h2>
        {workoutHistory.length === 0 ? (
          <p style={{ fontStyle: 'italic', fontSize: '13px' }}>No completed workouts in history.</p>
        ) : (
          <div>
            {workoutHistory.map(hist => (
              <div key={hist.id} className="card" style={{ padding: '16px' }}>
                <div className="flex-row justify-between align-center" style={{ marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>{hist.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{hist.date}</span>
                </div>
                <div className="flex-row" style={{ gap: '16px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
                    <span style={{ fontWeight: '600' }}>{Math.round(hist.durationSeconds / 60)} min</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Volume: </span>
                    <span style={{ fontWeight: '600' }}>{hist.totalVolume} kg</span>
                  </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hist.exercises.map(he => {
                    const ex = GLOBAL_EXERCISES.find(e => e.id === he.exerciseId);
                    return (
                      <span key={he.exerciseId} className="badge badge-teal" style={{ fontSize: '8px' }}>
                        {ex?.name} ({he.setsCount} sets • Max {he.bestWeight}kg)
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // SCREEN 6: TAB 4 (PROFILE & METRICS EDIT)
  // ==========================================
  const [profileNameInput, setProfileNameInput] = useState(profile.name);
  const [profileGoalInput, setProfileGoalInput] = useState(profile.goal);
  const [profileActivityInput, setProfileActivityInput] = useState(profile.activityLevel);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: profileNameInput,
      goal: profileGoalInput,
      activityLevel: profileActivityInput
    });
    alert('Profile updated successfully!');
  };

  const handleLogOut = () => {
    if (confirm('Are you sure you want to log out? Local data will remain saved.')) {
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      setOnboardingStep(1);
    }
  };

  const RenderProfileTab = () => {
    return (
      <div className="animated-fade">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{profile.name || 'Flex Athlete'}</h2>
            <span className="badge badge-purple">{profile.goal === 'build' ? 'Hypertrophy Mode' : profile.goal === 'lose' ? 'Calorie Deficit' : 'Fitness maintenance'}</span>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Body Specs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Height: </span>
              <span style={{ fontWeight: '700' }}>{profile.height} cm</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Weight: </span>
              <span style={{ fontWeight: '700' }}>{profile.weight} kg</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Age: </span>
              <span style={{ fontWeight: '700' }}>{profile.age} yrs</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Target Weight: </span>
              <span style={{ fontWeight: '700' }}>{profile.targetWeight} kg</span>
            </div>
          </div>

          {profile.injuries.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Injury precautions: </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {profile.injuries.map(inj => (
                  <span key={inj} className="badge badge-red" style={{ fontSize: '9px' }}>{inj}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="card">
          <h3 style={{ marginBottom: '16px' }}>Settings Profile</h3>
          
          <div className="form-group">
            <label className="form-label">Athlete Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Goal Target</label>
            <select 
              className="form-input" 
              value={profileGoalInput}
              onChange={(e) => setProfileGoalInput(e.target.value)}
              style={{ background: '#1c1917' }}
            >
              <option value="lose">Lose Weight</option>
              <option value="build">Build Muscle</option>
              <option value="maintain">Maintain General Fitness</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Daily Activity</label>
            <select 
              className="form-input" 
              value={profileActivityInput}
              onChange={(e) => setProfileActivityInput(e.target.value)}
              style={{ background: '#1c1917' }}
            >
              <option value="sedentary">Sedentary</option>
              <option value="lightly">Lightly Active</option>
              <option value="moderately">Moderately Active</option>
              <option value="very">Highly Active</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Save Changes
          </button>
        </form>

        <button 
          className="btn btn-danger" 
          onClick={handleLogOut}
          style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
        >
          <LogOut size={16} /> Sign Out Account
        </button>
      </div>
    );
  };

  // ==========================================
  // CORE RENDER FLOW ROUTER
  // ==========================================
  return (
    <div className="app-container">
      {/* Top Banner indicating active workout session */}
      {activeWorkout && currentTab !== 'workout' && (
        <div className="timer-banner animated-fade" onClick={() => setCurrentTab('workout')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} className="pulse" />
            <span>Active Workout ({activeWorkout.name})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{formatTimer(activeWorkout.elapsedSeconds)}</span>
            <ChevronRight size={14} />
          </div>
        </div>
      )}

      {/* Screen Router */}
      {activeScreen === 'auth' && RenderAuthScreen()}
      {activeScreen === 'onboarding' && RenderOnboardingScreen()}
      
      {activeScreen === 'app' && (
        <>
          <div className="app-content" style={{ paddingTop: activeWorkout && currentTab !== 'workout' ? '44px' : '24px' }}>
            {currentTab === 'workout' && RenderWorkoutTab()}
            {currentTab === 'nutrition' && RenderNutritionTab()}
            {currentTab === 'analytics' && RenderAnalyticsTab()}
            {currentTab === 'profile' && RenderProfileTab()}
          </div>

          {/* Bottom Navigation Menu */}
          <div className="bottom-nav">
            <button 
              className={`nav-item ${currentTab === 'workout' ? 'active' : ''}`}
              onClick={() => setCurrentTab('workout')}
            >
              <Dumbbell size={22} />
              <span className="nav-label">Workout</span>
            </button>
            <button 
              className={`nav-item ${currentTab === 'nutrition' ? 'active' : ''}`}
              onClick={() => setCurrentTab('nutrition')}
            >
              <Utensils size={22} />
              <span className="nav-label">Nutrition</span>
            </button>
            <button 
              className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentTab('analytics')}
            >
              <BarChart2 size={22} />
              <span className="nav-label">Analytics</span>
            </button>
            <button 
              className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentTab('profile')}
            >
              <User size={22} />
              <span className="nav-label">Profile</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
