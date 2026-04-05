import type { Player, Court, GameEvent, CourtPosition, AuthScreen } from './types'

export const state = {
  players: [] as Player[],
  court: {} as Court,
  eventLog: [] as GameEvent[],
  currentSet: 1,
  serveTicks: {} as Record<number, number>,
  lastTickPlayer: null as number | null,
  scoreViewSet: 1,
  pickerPos: null as CourtPosition | null,
  rosterOpen: true,
  courtFlipped: false,
  confirmingClear: false,
  confirmingNewGame: false,
  authScreen: 'loading' as AuthScreen,
  selectedTeamId: null as string | null,
  selectedTeamName: null as string | null,
  userEmail: null as string | null,
  userRole: null as string | null,
  confirmingSignOut: false,
}

export function getPlayerByNr(nr: number): Player | undefined {
  return state.players.find(p => p.nr === nr)
}

export function getServerNr(): number | undefined {
  return state.court[1]
}

export function isOnCourt(nr: number): boolean {
  return Object.values(state.court).includes(nr)
}

export function getPositions(): CourtPosition[] {
  return state.courtFlipped ? [1, 6, 5, 2, 3, 4] : [4, 3, 2, 5, 6, 1]
}
