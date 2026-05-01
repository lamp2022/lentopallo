// Player roles
export type PlayerRole = 'normaali' | 'passari' | 'libero';

// Court positions 1-6
export type CourtPosition = 1 | 2 | 3 | 4 | 5 | 6;

// Event types
export type EventType = 'serve' | 'point';

// Player in roster
export interface Player {
  nr: number;       // 1-99
  name: string;     // can be empty string
  role?: PlayerRole;
}

// Court mapping: position -> player number (0 or undefined = empty)
export type Court = Partial<Record<CourtPosition, number>>;

// Single scoring event (append-only log entry)
export interface GameEvent {
  ts: number;         // Unix timestamp ms
  set: number;        // 1-5
  player: number;     // player nr
  name: string;       // player name at event time
  delta: 1 | -1;
  type: EventType;
  court: Court;       // snapshot at event time
}

// Score entry per player
export interface ScoreEntry {
  total: number;
  serve: number;
  point: number;
}

// Score map keyed by player number
export type ScoreMap = Record<number, ScoreEntry>;

// Full game state for persistence
export interface GameState {
  players: Player[];
  court: Court;
  eventLog: GameEvent[];
  currentSet: number;
  serveTicks: Record<number, number>;
  initialCourt?: Court | null;     // captured at first game action of set 1; baseline for set 2/3 revert
  setsStarted?: number[];          // sets that have already been entered (revert applied once per set)
  notationLog?: NotationEvent[];   // optional for backwards compat
}

// Score view data
export interface ScoreView {
  serve: Record<number, number>;       // net serve points (+1 sum + -1 sum)
  servePos: Record<number, number>;    // count of +1 serve events
  serveNeg: Record<number, number>;    // count of -1 serve events
  point: Record<number, number>;
  total: Record<number, number>;
}

// Auth screen states
export type AuthScreen = 'login' | 'loading' | 'link-sent' | 'team-select' | 'scoring' | 'no-club' | 'auth-error'

// ── Notation ─────────────────────────────────────────────────────────────────

// Skill categories
export type NotationSkill = 'S' | 'V' | 'H' | 'T'

// Grade symbols: # = hyvä, ! = neutraali, - = virhe
export type NotationGrade = '#' | '!' | '-'

// Single notation event (append-only log)
export interface NotationEvent {
  id: string              // crypto.randomUUID()
  ts: number              // Unix ms
  set: number             // currentSet at time of recording
  position: CourtPosition
  skill: NotationSkill
  grade: NotationGrade
  playerNr?: number       // player in that position at recording time
}

// Active tab
export type ActiveTab = 'rotation' | 'notation'
