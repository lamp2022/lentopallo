import { loadState } from './persistence'
import { state } from './state'
import { recalcScores } from './scoring'
import { supabase } from './supabase'
import {
  addPlayer,
  toggleHelp,
  toggleRoster,
  handleRotate,
  clearCourt,
  newGame,
  flipCourt,
  addScore,
  setScoreView,
  openPicker,
  selectPlayer,
  clearPos,
  closePicker,
  addPointFromPicker,
  editNr,
  editName,
  setRole,
  removePlayer,
  setSet,
  copyLink,
  renderAuthScreen,
  renderAuthLoading,
  renderTeamSelect,
} from './render'

// Theme: restore from localStorage, default dark
function initTheme() {
  const saved = localStorage.getItem('lentopallo-theme')
  if (saved === 'light') {
    document.documentElement.dataset.theme = 'light'
  }
  updateThemeIcon()
}

function toggleTheme() {
  const isLight = document.documentElement.dataset.theme === 'light'
  if (isLight) {
    delete document.documentElement.dataset.theme
    localStorage.setItem('lentopallo-theme', 'dark')
  } else {
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('lentopallo-theme', 'light')
  }
  updateThemeIcon()
}

function updateThemeIcon() {
  const btn = document.getElementById('themeBtn')
  if (!btn) return
  const isLight = document.documentElement.dataset.theme === 'light'
  btn.textContent = isLight ? '\u2600' : '\u263E'
}

function showAuth(): void {
  const auth = document.getElementById('auth-container')
  const scoring = document.getElementById('scoring-container')
  if (auth) auth.style.display = ''
  if (scoring) scoring.style.display = 'none'
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme()

  // Load persisted state
  loadState()
  if (state.eventLog.length > 0) {
    recalcScores(state.eventLog)
  }

  // Wire static event listeners (scoring UI)
  document.getElementById('themeBtn')!.addEventListener('click', toggleTheme)
  document.getElementById('helpBtn')!.addEventListener('click', toggleHelp)
  document.getElementById('helpClose')!.addEventListener('click', toggleHelp)
  document.getElementById('helpOverlay')!.addEventListener('click', (e) => {
    if (e.target === document.getElementById('helpOverlay')) toggleHelp()
  })
  document.getElementById('rotateBtn')!.addEventListener('click', handleRotate)
  document.getElementById('clearBtn')!.addEventListener('click', clearCourt)
  document.getElementById('newGameBtn')!.addEventListener('click', newGame)
  document.getElementById('flipBtn')!.addEventListener('click', flipCourt)
  document.getElementById('rosterHeader')!.addEventListener('click', toggleRoster)
  document.getElementById('addPlayerBtn')!.addEventListener('click', addPlayer)
  document.getElementById('playerNr')!.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer() })
  document.getElementById('playerName')!.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer() })
  document.getElementById('pickerOverlay')!.addEventListener('click', (e) => {
    if (e.target === document.getElementById('pickerOverlay')) closePicker()
  })
  const copyBtn = document.getElementById('copyLinkBtn')
  if (copyBtn) copyBtn.addEventListener('click', copyLink)

  // Expose to window for inline onclick in dynamically rendered HTML
  Object.assign(window, {
    openPicker,
    selectPlayer,
    clearPos,
    closePicker,
    addPointFromPicker,
    addScore,
    setScoreView,
    editNr,
    editName,
    setRole,
    removePlayer,
    setSet,
  })

  // Show loading screen while waiting for INITIAL_SESSION
  state.authScreen = 'loading'
  showAuth()
  renderAuthLoading()

  // Auth state gate — drives all screen transitions
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION') {
      if (session) {
        state.authScreen = 'team-select'
        state.userEmail = session.user.email ?? null
        showAuth()
        void renderTeamSelect(session.user.id)
      } else {
        state.authScreen = 'login'
        showAuth()
        renderAuthScreen()
      }
    } else if (event === 'SIGNED_IN') {
      state.authScreen = 'team-select'
      state.userEmail = session?.user.email ?? null
      showAuth()
      void renderTeamSelect(session!.user.id)
    } else if (event === 'SIGNED_OUT') {
      state.authScreen = 'login'
      state.userEmail = null
      showAuth()
      renderAuthScreen()
    }
    // TOKEN_REFRESHED: do nothing, session auto-refreshes silently
  })
})
