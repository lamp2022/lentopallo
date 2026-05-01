import { state } from './state'
import { getPositions } from './state'
import { esc } from './utils'
import { recalcScores, calcStreaks, calcScoreView } from './scoring'
import { saveState, encodeShareUrl } from './persistence'
import { rotate as rotateCourt } from './court'
import type { CourtPosition, NotationSkill, NotationGrade, NotationEvent } from './types'
import { sendMagicLink, signOutUser, signInWithPassword } from './auth'
import { fetchTeams, fetchUserProfile } from './teams'

export const CLEAR_COURT_LABEL = 'Tyhjennä kenttä'

// On first game action of set 1, snapshot the court layout so set 2/3 can revert to it.
function captureInitialCourtIfNeeded(): void {
  if (state.currentSet === 1 && state.initialCourt === null) {
    state.initialCourt = JSON.parse(JSON.stringify(state.court)) as typeof state.court
    if (!state.setsStarted.includes(1)) state.setsStarted.push(1)
  }
}

// ── renderAll ────────────────────────────────────────────────────────────────

export function renderAll(): void {
  if (state.authScreen !== 'scoring') return
  renderTabBar()
  renderSetBar()
  renderRoster()
  renderCourt()
  if (state.activeTab === 'rotation') {
    showEl('scoreBtns'); showEl('serverInfo'); showEl('rotateSection'); showEl('bench'); showEl('scoreSection')
    hideEl('notationSummary')
    showEl('rosterBody'); showEl('rosterHeader')
    renderScoreBtns()
    renderBench()
    renderScoreBoard()
  } else {
    hideEl('scoreBtns'); hideEl('serverInfo'); hideEl('rotateSection'); hideEl('bench'); hideEl('scoreSection')
    hideEl('rosterBody'); hideEl('rosterHeader')
    showEl('notationSummary')
    renderNotationSummary()
  }
  saveState()
  setTimeout(() => { state.lastTickPlayer = null }, 500)
}

function showEl(id: string): void { const el = document.getElementById(id); if (el) el.style.display = '' }
function hideEl(id: string): void { const el = document.getElementById(id); if (el) el.style.display = 'none' }

// ── renderTabBar ─────────────────────────────────────────────────────────────

export function renderTabBar(): void {
  const el = document.getElementById('tabBar')
  if (!el) return
  el.innerHTML =
    `<button class="btn-tab${state.activeTab === 'rotation' ? ' active' : ''}" onclick="setActiveTab('rotation')">Rotaatio</button>` +
    `<button class="btn-tab${state.activeTab === 'notation' ? ' active' : ''}" onclick="setActiveTab('notation')">Merkinn&auml;t</button>`
}

export function setActiveTab(tab: 'rotation' | 'notation'): void {
  state.activeTab = tab
  renderAll()
}

// ── renderSetBar ─────────────────────────────────────────────────────────────

export function renderSetBar(): void {
  const el = document.getElementById('setBar')
  if (!el) return
  let html = '<span>Er&auml;:</span>'
  if (state.activeTab === 'notation') {
    for (let i = 1; i <= 3; i++) {
      const active = i === state.scoreViewSet ? ' active' : ''
      html += `<button class="btn-set${active}" onclick="setScoreView('${i}')">${i}</button>`
    }
    const allActive = state.scoreViewSet === 0 ? ' active' : ''
    html += `<button class="btn-set${allActive}" onclick="setScoreView('0')">Yht</button>`
  } else {
    for (let i = 1; i <= 3; i++) {
      const active = i === state.currentSet ? ' active' : ''
      html += `<button class="btn-set${active}" onclick="setSet(${i})">${i}</button>`
    }
  }
  el.innerHTML = html
}

// ── renderCourt ──────────────────────────────────────────────────────────────

export function renderCourt(): void {
  const el = document.getElementById('court')
  if (!el) return
  const positions = getPositions()
  el.innerHTML = positions.map((pos) => {
    const playerNr = state.court[pos as CourtPosition]
    const display = playerNr ? '#' + playerNr : '&mdash;'
    const cls = playerNr ? '' : ' empty'
    let nameHtml = '<div class="player-name">&nbsp;</div>'
    let dotHtml = ''
    if (playerNr) {
      const p = state.players.find(x => x.nr === playerNr)
      if (p) {
        const rawName = p.name.length > 12 ? p.name.substring(0, 12) : p.name
        const escapedCourtName = esc(rawName)
        if (p.name) {
          nameHtml = `<div class="player-name">${escapedCourtName}</div>`
        }
        if (p.role) dotHtml = `<span class="role-dot ${esc(p.role)}"></span>`
      }
    }
    if (state.activeTab === 'notation') {
      return `<div class="court-cell-wrap">` +
        `<div class="pos-nr">Paikka ${pos}</div>` +
        `<div class="court-cell court-cell-notation" data-court-pos="${pos}" onclick="openNotationPicker(${pos})">` +
        `<div class="notation-pos-nr">${pos}</div>` +
        `</div></div>`
    }
    const tickCount = playerNr ? (state.serveTicks[playerNr] || 0) : 0
    let tickDots = ''
    if (tickCount > 0) {
      const isNew = state.lastTickPlayer === playerNr
      const oldCount = isNew ? tickCount - 1 : tickCount
      if (oldCount > 0) tickDots = new Array(oldCount + 1).join('&#9679;')
      if (isNew) tickDots += '<span class="tick-new">&#9679;</span>'
    }
    const tickHtml = `<div class="serve-ticks">${tickDots}</div>`
    return `<div class="court-cell-wrap">` +
      `<div class="pos-nr">Paikka ${pos}</div>` +
      `<div class="court-cell" data-court-pos="${pos}" onclick="openPicker(${pos})">` +
      nameHtml +
      `<div class="player-nr${cls}">${display}${dotHtml}</div>` +
      tickHtml +
      `</div></div>`
  }).join('')
}

// ── renderScoreBtns ──────────────────────────────────────────────────────────

export function renderScoreBtns(): void {
  const serverEl = document.getElementById('serverInfo')
  const btnsEl = document.getElementById('scoreBtns')
  if (!serverEl || !btnsEl) return
  const serverNr = state.court[1]
  const disabled = serverNr ? '' : ' disabled'
  if (serverNr) {
    const p = state.players.find(x => x.nr === serverNr)
    const escapedServerName = p ? esc(p.name) : ''
    const nameStr = p && p.name ? ' ' + escapedServerName : ''
    serverEl.innerHTML = `Sy&ouml;tt&auml;&auml;: #${serverNr}${nameStr}`
  } else {
    serverEl.innerHTML = 'Ei sy&ouml;tt&auml;j&auml;&auml;'
  }
  btnsEl.innerHTML =
    `<button class="btn-score btn-score-plus" onclick="addScore(1,event)"${disabled}>+1</button>` +
    `<button class="btn-score btn-score-minus" onclick="addScore(-1,event)"${disabled}>-1</button>`
}

// ── renderBench ──────────────────────────────────────────────────────────────

export function renderBench(): void {
  const el = document.getElementById('bench')
  if (!el) return
  const onCourt: Record<number, boolean> = {}
  for (const pos in state.court) {
    const nr = state.court[pos as unknown as CourtPosition]
    if (nr) onCourt[nr] = true
  }
  const benchPlayers = state.players.filter(p => !onCourt[p.nr])
  let html = `<h3>Vaihdossa (${benchPlayers.length})</h3><div class="bench-list">`
  if (benchPlayers.length === 0) {
    html += '<div class="bench-empty">&mdash;</div>'
  } else {
    benchPlayers.forEach(p => {
      const escapedBenchName = esc(p.name)
      const escapedBenchRole = esc(p.role || '')
      const nameHtml = p.name ? `<span class="bench-name">${escapedBenchName}</span>` : ''
      html += `<div class="bench-player" data-role="${escapedBenchRole}">#${p.nr}${nameHtml}</div>`
    })
  }
  html += '</div>'
  el.innerHTML = html
}

// ── renderScoreBoard ─────────────────────────────────────────────────────────

export function renderScoreBoard(): void {
  const el = document.getElementById('scoreSection')
  if (!el) return
  if (state.eventLog.length === 0) { el.innerHTML = ''; return }

  let selOpts = ''
  for (let i = 1; i <= 3; i++) {
    selOpts += `<option value="${i}"${state.scoreViewSet === i ? ' selected' : ''}>Er&auml; ${i}</option>`
  }
  selOpts += `<option value="0"${state.scoreViewSet === 0 ? ' selected' : ''}>Yhteens&auml;</option>`

  const view = calcScoreView(state.eventLog, state.scoreViewSet)

  let html = `<h3>Pisteet <select class="score-select" onchange="setScoreView(this.value)">${selOpts}</select></h3>`
  html += '<div class="score-list">'
  html += '<div class="score-row score-header"><span></span><span class="score-col-hdr">+1</span><span class="score-col-hdr">&minus;1</span><span class="score-col-hdr">Pelit.</span><span class="score-col-hdr">Yht</span></div>'

  state.players.forEach(p => {
    const svPos = view.servePos[p.nr] || 0
    const svNeg = view.serveNeg[p.nr] || 0
    const pt = view.point[p.nr] || 0
    const tot = view.total[p.nr] || 0
    const fmt = (v: number) => v > 0 ? '+' + v : '' + v
    const cls = (v: number) => v > 0 ? 'pos' : (v < 0 ? 'neg' : 'zero')
    const escapedScoreName = esc(p.name)
    const escapedScoreRole = esc(p.role || '')
    const nameHtml = p.name ? `<span class="score-name" data-role="${escapedScoreRole}">${escapedScoreName}</span>` : ''
    let streakHtml = ''
    if (state.scoreViewSet === 0) {
      const streaks = calcStreaks(p.nr, state.eventLog)
      if (streaks.length > 0) streakHtml = `<span class="streak-badge">${streaks.join(', ')}</span>`
    }
    // svPos counts +1 serves (display as +N or 0); svNeg counts -1 serves (display as -N or 0)
    const posDisplay = svPos > 0 ? '+' + svPos : '0'
    const negDisplay = svNeg > 0 ? '−' + svNeg : '0'
    const posCls = svPos > 0 ? 'pos' : 'zero'
    const negCls = svNeg > 0 ? 'neg' : 'zero'
    html += `<div class="score-row">` +
      `<span><span class="score-player">#${p.nr}</span>${nameHtml}${streakHtml}</span>` +
      `<span class="score-val ${posCls}">${posDisplay}</span>` +
      `<span class="score-val ${negCls}">${negDisplay}</span>` +
      `<span class="score-val ${cls(pt)}">${fmt(pt)}</span>` +
      `<span class="score-val ${cls(tot)}" style="font-weight:700">${fmt(tot)}</span>` +
      `</div>`
  })
  html += '</div>'
  el.innerHTML = html
}

// ── renderRoster ─────────────────────────────────────────────────────────────

export function renderRoster(): void {
  const el = document.getElementById('rosterList')
  if (!el) return
  if (state.players.length === 0) {
    el.innerHTML = '<span style="color:var(--text3);font-size:12px">Ei pelaajia</span>'
    return
  }
  el.innerHTML = state.players.map(p => {
    const escapedRosterName = esc(p.name)
    const nameDisplay = p.name ? escapedRosterName : '&#9998;'
    const role = p.role || ''
    const escapedRole = esc(role)
    const selNorm = role === '' ? ' selected' : ''
    const selLib = role === 'libero' ? ' selected' : ''
    const selPas = role === 'passari' ? ' selected' : ''
    return `<span class="roster-tag">` +
      `<span class="nr" onclick="editNr(${p.nr}, this)">#${p.nr}</span> ` +
      `<span class="name" onclick="editName(${p.nr}, this)">${nameDisplay}</span> ` +
      `<select class="role-select" onchange="setRole(${p.nr}, this.value)">` +
      `<option value=""${selNorm}>Normaali</option>` +
      `<option value="libero"${selLib}>\uD83D\uDD34 Libero</option>` +
      `<option value="passari"${selPas}>\uD83D\uDD35 Passari</option>` +
      `</select> ` +
      `<span class="remove" onclick="removePlayer(${p.nr})" data-role="${escapedRole}">&times;</span>` +
      `</span>`
  }).join('')
}

// ── Interaction handlers ─────────────────────────────────────────────────────

export function toggleHelp(): void {
  document.getElementById('helpOverlay')?.classList.toggle('open')
}

export function toggleRoster(): void {
  state.rosterOpen = !state.rosterOpen
  document.getElementById('rosterBody')?.classList.toggle('collapsed', !state.rosterOpen)
  const toggle = document.getElementById('rosterToggle')
  if (toggle) toggle.innerHTML = state.rosterOpen ? '&#9660;' : '&#9654;'
}

export function addPlayer(): void {
  const nrInput = document.getElementById('playerNr') as HTMLInputElement
  const nameInput = document.getElementById('playerName') as HTMLInputElement
  const nr = parseInt(nrInput.value)
  if (!nr || nr < 1 || nr > 99) { showRosterError(nrInput, 'Numeron oltava 1–99'); return }
  if (state.players.length >= 10) { showRosterError(nrInput, 'Maksimi 10 pelaajaa'); return }
  if (state.players.some(p => p.nr === nr)) { showRosterError(nrInput, 'Numero ' + nr + ' on jo käytössä'); return }
  clearRosterError()
  state.players.push({ nr, name: nameInput.value.trim() })
  state.players.sort((a, b) => a.nr - b.nr)
  nrInput.value = ''
  nameInput.value = ''
  nrInput.focus()
  renderAll()
}

let rosterErrorTimeout: ReturnType<typeof setTimeout> | null = null

function showRosterError(el: HTMLInputElement, message: string): void {
  el.classList.add('input-error')
  el.focus()
  el.select()
  const errEl = document.getElementById('rosterError')
  if (errEl) {
    errEl.textContent = message
    errEl.style.display = ''
  }
  if (rosterErrorTimeout) clearTimeout(rosterErrorTimeout)
  rosterErrorTimeout = setTimeout(() => {
    el.classList.remove('input-error')
  }, 1500)
}

function clearRosterError(): void {
  const errEl = document.getElementById('rosterError')
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none' }
  if (rosterErrorTimeout) { clearTimeout(rosterErrorTimeout); rosterErrorTimeout = null }
}

export function removePlayer(nr: number): void {
  state.players = state.players.filter(p => p.nr !== nr)
  for (const pos in state.court) {
    if (state.court[pos as unknown as CourtPosition] === nr) {
      delete state.court[pos as unknown as CourtPosition]
    }
  }
  renderAll()
}

export function setSet(n: number): void {
  state.currentSet = n
  state.scoreViewSet = n
  state.serveTicks = {}
  state.lastTickPlayer = null
  // First entry into set 2 or 3: revert positions to set 1's starting layout.
  if (n > 1 && !state.setsStarted.includes(n) && state.initialCourt) {
    state.court = JSON.parse(JSON.stringify(state.initialCourt)) as typeof state.court
    state.setsStarted.push(n)
  }
  renderAll()
}

export function flipCourt(): void {
  state.courtFlipped = !state.courtFlipped
  const netTop = document.getElementById('netTop')
  const netBottom = document.getElementById('netBottom')
  if (netTop) netTop.style.display = state.courtFlipped ? 'none' : ''
  if (netBottom) netBottom.style.display = state.courtFlipped ? '' : 'none'
  const btn = document.getElementById('flipBtn')
  if (btn) btn.textContent = state.courtFlipped ? 'Kentt\u00e4 k\u00e4\u00e4nnetty' : 'K\u00e4\u00e4nn\u00e4 kentt\u00e4'
  renderAll()
}

export function addScore(delta: 1 | -1, evt?: MouseEvent): void {
  const serverNr = state.court[1]
  if (!serverNr) return
  captureInitialCourtIfNeeded()
  const p = state.players.find(x => x.nr === serverNr)
  // esc() used defensively to ensure stored name is safe for later HTML rendering
  const safeName = p ? esc(p.name) : ''
  state.eventLog.push({
    ts: Date.now(),
    set: state.currentSet,
    player: serverNr,
    name: safeName,
    delta,
    type: 'serve',
    court: JSON.parse(JSON.stringify(state.court)),
  })
  recalcScores(state.eventLog)
  renderAll()
  showScorePopup(delta, evt)
}

export function showScorePopup(delta: number, evt?: MouseEvent | null): void {
  const el = document.createElement('div')
  el.className = 'score-popup ' + (delta > 0 ? 'plus' : 'minus')
  el.textContent = delta > 0 ? '+1' : '-1'
  if (evt && typeof evt === 'object' && 'clientX' in evt) {
    el.style.left = evt.clientX - 20 + 'px'
    el.style.top = evt.clientY - 20 + 'px'
  } else {
    el.style.left = '50%'
    el.style.top = '50%'
  }
  document.body.appendChild(el)
  setTimeout(() => { el.remove() }, 650)
}

export function setScoreView(val: string): void {
  const n = parseInt(val)
  state.scoreViewSet = n
  if (state.activeTab === 'notation') {
    // Also advance currentSet so new notations are stamped to the right erä.
    // "Yht" (0) keeps currentSet as-is.
    if (n >= 1 && n <= 3) state.currentSet = n
    renderNotationSummary()
    renderSetBar()
  } else {
    renderScoreBoard()
  }
}

// ── Picker positioning ───────────────────────────────────────────────────────

function positionPickerNearCell(pickerEl: HTMLElement, pos: number): void {
  const cellEl = document.querySelector(`[data-court-pos="${pos}"]`) as HTMLElement | null
  if (!cellEl) return

  const rect = cellEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const GAP = 8
  const PICKER_W = Math.min(340, vw - 24)
  const EST_H = 380 // conservative height estimate

  let left: number
  let top: number

  if (vw <= 500) {
    // Mobile: full-width, below cell or above if near bottom
    left = Math.max(8, (vw - PICKER_W) / 2)
    top = rect.bottom + GAP
    if (top + EST_H > vh - 8) top = Math.max(8, rect.top - EST_H - GAP)
  } else {
    // Desktop: prefer right of cell, fall back to left
    top = rect.top + 24
    left = rect.right - 20
    if (left + PICKER_W > vw - 8) left = rect.left - PICKER_W + 20
    if (left < 8) left = 8
    // Clamp vertical
    if (top + EST_H > vh - 8) top = Math.max(8, vh - EST_H - 8)
  }

  pickerEl.style.position = 'absolute'
  pickerEl.style.left = `${left}px`
  pickerEl.style.top = `${top}px`
  pickerEl.style.width = `${PICKER_W}px`
  pickerEl.style.minWidth = ''
  pickerEl.style.maxHeight = `${vh - top - 12}px`
  pickerEl.style.overflowY = 'auto'
}

export function openPicker(pos: number): void {
  state.pickerPos = pos as CourtPosition
  const isFrontRow = [2, 3, 4].includes(pos)
  const isBackRow = !isFrontRow
  const currentPlayerNr = state.court[pos as CourtPosition]
  const currentPlayer = currentPlayerNr ? state.players.find(x => x.nr === currentPlayerNr) : null

  const onOtherPos: Record<number, boolean> = {}
  for (const p in state.court) {
    if (parseInt(p) !== pos) {
      const nr = state.court[p as unknown as CourtPosition]
      if (nr) onOtherPos[nr] = true
    }
  }

  const available = state.players.filter(p => {
    if (p.nr === currentPlayerNr) return false
    if (isFrontRow && p.role === 'libero') return false
    if (onOtherPos[p.nr]) {
      if (p.role === 'libero' && isBackRow && currentPlayer && currentPlayer.role !== 'passari') {
        return true
      }
      return false
    }
    return true
  })

  let html = `<h3>Paikka ${pos}</h3>`

  if (currentPlayer) {
    const escapedCurrentName = esc(currentPlayer.name)
    const escapedCurrentRole = esc(currentPlayer.role || '')
    html += `<div class="picker-point" onclick="addPointFromPicker(${currentPlayer.nr})">` +
      `<span style="font-size:26px;font-weight:900">+1</span>` +
      `<span style="font-size:16px;font-weight:600">Pelitilannepiste</span></div>` +
      `<div style="text-align:center;font-size:15px;color:var(--text2);margin:-4px 0 14px;font-family:var(--mono);font-weight:400" data-role="${escapedCurrentRole}">#${currentPlayer.nr}${currentPlayer.name ? ' ' + escapedCurrentName : ''} &middot; Paikka ${pos}</div>`
  }

  if (available.length > 0) {
    html += '<div class="picker-section-title">Vaihda pelaajaa</div>'
    available.forEach(p => {
      const escapedPickerName = esc(p.name)
      const nameStr = p.name ? ` <span style="font-size:14px;font-weight:400;color:var(--text2)">${escapedPickerName}</span>` : ''
      html += `<div class="picker-item" onclick="selectPlayer(${p.nr})">#${p.nr}${nameStr}</div>`
    })
  } else if (!currentPlayer) {
    html += '<div style="color:var(--text3);font-size:12px;padding:8px">Ei vapaita pelaajia</div>'
  }
  if (state.court[pos as CourtPosition]) {
    html += '<div class="picker-clear" onclick="clearPos()">Tyhjenn&auml;</div>'
  }
  html += '<div class="picker-cancel" onclick="closePicker()">Peruuta</div>'

  const pickerEl = document.getElementById('picker')
  if (pickerEl) {
    pickerEl.innerHTML = html
    document.getElementById('pickerOverlay')?.classList.add('open')
    positionPickerNearCell(pickerEl, pos)
  }
}

export function selectPlayer(nr: number): void {
  if (state.pickerPos !== null) {
    const selectedPlayer = state.players.find(x => x.nr === nr)
    if (selectedPlayer && selectedPlayer.role === 'libero') {
      for (const p in state.court) {
        const pos = p as unknown as CourtPosition
        if (state.court[pos] === nr && parseInt(p) !== state.pickerPos) {
          delete state.court[pos]
        }
      }
    }
    state.court[state.pickerPos] = nr
    renderAll()
  }
  closePicker()
}

export function clearPos(): void {
  if (state.pickerPos !== null) {
    delete state.court[state.pickerPos]
    renderAll()
  }
  closePicker()
}

export function closePicker(e?: Event): void {
  if (e && e.target !== document.getElementById('pickerOverlay')) return
  document.getElementById('pickerOverlay')?.classList.remove('open')
  state.pickerPos = null
}

export function addPointFromPicker(nr: number): void {
  captureInitialCourtIfNeeded()
  const p = state.players.find(x => x.nr === nr)
  const safePointName = p ? esc(p.name) : ''
  state.eventLog.push({
    ts: Date.now(),
    set: state.currentSet,
    player: nr,
    name: safePointName,
    delta: 1,
    type: 'point',
    court: JSON.parse(JSON.stringify(state.court)),
  })
  closePicker()
  showScorePopup(1)
  recalcScores(state.eventLog)
  renderAll()
}

export function setRole(nr: number, role: string): void {
  const p = state.players.find(x => x.nr === nr)
  if (!p) return
  if (role) {
    state.players.forEach(x => {
      if (x.nr !== nr && x.role === role) x.role = undefined
    })
  }
  p.role = role as import('./types').PlayerRole | undefined
  renderAll()
}

export function editNr(nr: number, el: HTMLElement): void {
  const p = state.players.find(x => x.nr === nr)
  if (!p) return
  const input = document.createElement('input')
  input.className = 'edit-input nr-input'
  input.type = 'number'
  input.min = '1'
  input.max = '99'
  input.value = String(p.nr)
  el.replaceWith(input)
  input.focus()
  input.select()
  const save = () => {
    const newNr = parseInt(input.value)
    if (!newNr || newNr < 1 || newNr > 99) { renderAll(); return }
    if (newNr !== p.nr && state.players.some(x => x.nr === newNr)) { renderAll(); return }
    for (const pos in state.court) {
      if (state.court[pos as unknown as CourtPosition] === p.nr) {
        state.court[pos as unknown as CourtPosition] = newNr
      }
    }
    p.nr = newNr
    state.players.sort((a, b) => a.nr - b.nr)
    renderAll()
  }
  input.addEventListener('blur', save)
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') { save() }
    if (e.key === 'Escape') { renderAll() }
  })
}

export function editName(nr: number, el: HTMLElement): void {
  const p = state.players.find(x => x.nr === nr)
  if (!p) return
  const input = document.createElement('input')
  input.className = 'edit-input name-input'
  input.value = p.name
  input.placeholder = 'Nimi'
  el.replaceWith(input)
  input.focus()
  input.select()
  const save = () => {
    p.name = input.value.trim()
    renderAll()
  }
  input.addEventListener('blur', save)
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') { save() }
    if (e.key === 'Escape') { renderAll() }
  })
}

export function clearCourt(): void {
  if (!state.confirmingClear) {
    state.confirmingClear = true
    const btn = document.getElementById('clearBtn') as HTMLButtonElement
    if (btn) {
      btn.textContent = 'Vahvista tyhjennys'
      btn.style.borderColor = 'var(--red)'
      btn.style.color = 'var(--red)'
    }
    setTimeout(() => {
      state.confirmingClear = false
      if (btn) {
        btn.textContent = CLEAR_COURT_LABEL
        btn.style.borderColor = ''
        btn.style.color = ''
      }
    }, 3000)
    return
  }
  state.confirmingClear = false
  state.court = {}
  renderAll()
  const btn = document.getElementById('clearBtn') as HTMLButtonElement
  if (btn) {
    btn.textContent = CLEAR_COURT_LABEL
    btn.style.borderColor = ''
    btn.style.color = ''
  }
}

export function newGame(): void {
  if (!state.confirmingNewGame) {
    state.confirmingNewGame = true
    const btn = document.getElementById('newGameBtn') as HTMLButtonElement
    if (btn) {
      btn.textContent = 'Vahvista uusi peli?'
      btn.style.borderColor = 'var(--red)'
      btn.style.color = 'var(--red)'
    }
    setTimeout(() => {
      state.confirmingNewGame = false
      if (btn) {
        btn.textContent = 'Uusi peli'
        btn.style.borderColor = ''
        btn.style.color = ''
      }
    }, 3000)
    return
  }
  state.confirmingNewGame = false
  state.court = {}
  state.eventLog = []
  state.serveTicks = {}
  state.currentSet = 1
  state.scoreViewSet = 0
  state.initialCourt = null
  state.setsStarted = []
  renderAll()
  const btn = document.getElementById('newGameBtn') as HTMLButtonElement
  if (btn) {
    btn.textContent = 'Uusi peli'
    btn.style.borderColor = ''
    btn.style.color = ''
  }
}

export function handleRotate(): void {
  captureInitialCourtIfNeeded()
  state.lastTickPlayer = null
  const pos1Player = state.court[1]
  if (pos1Player) {
    if (!state.serveTicks[pos1Player]) state.serveTicks[pos1Player] = 0
    state.serveTicks[pos1Player]++
    state.lastTickPlayer = pos1Player
  }
  state.court = rotateCourt(state.court)
  renderAll()
}

export function copyLink(): void {
  const url = encodeShareUrl()
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById('copyMsg')
    if (msg) {
      msg.style.display = 'inline'
      setTimeout(() => { msg.style.display = 'none' }, 2000)
    }
  })
}

// ── Notation functions ────────────────────────────────────────────────────────

const SKILL_LABELS: Record<NotationSkill, string> = { S: 'Syöttö', V: 'Vastaanotto', H: 'Hyökkäys', T: 'Torjunta' }

export function openNotationPicker(pos: number): void {
  state.notationPickerPos = pos as CourtPosition
  const playerNr = state.court[pos as CourtPosition]
  const player = playerNr ? state.players.find(x => x.nr === playerNr) : null
  const playerLabel = player
    ? ` &mdash; ${player.name ? esc(player.name) : '#' + player.nr}`
    : ''

  let html = `<h3>Paikka ${pos}${playerLabel}</h3>`

  if (pos === 1) {
    // Server: only Syöttö
    html += `<div class="notation-skill-label">Syöttö</div>`
    html += `<div class="notation-grid notation-grid-serve">`
    html += notationBtn('S', '#', 'good', 'S #')
    html += notationBtn('S', '!', 'neutral', 'S !')
    html += notationBtn('S', '-', 'error', 'S &minus;')
    html += `</div>`
  } else {
    // Positions 2-4: V, H, T — positions 5-6: V, H only (back row, no Torjunta)
    const skills: NotationSkill[] = [5, 6].includes(pos) ? ['V', 'H'] : ['V', 'H', 'T']
    html += `<div class="notation-grid-header"><span></span><span class="grade-good">#</span><span class="grade-neutral">!</span><span class="grade-error">&minus;</span></div>`
    skills.forEach(skill => {
      html += `<div class="notation-row">`
      html += `<span class="notation-row-label">${SKILL_LABELS[skill]}</span>`
      html += notationBtn(skill, '#', 'good', `${skill} #`)
      html += notationBtn(skill, '!', 'neutral', `${skill} !`)
      html += notationBtn(skill, '-', 'error', `${skill} &minus;`)
      html += `</div>`
    })
  }

  html += `<div class="picker-cancel" onclick="closeNotationPicker()">Peruuta</div>`

  const pickerEl = document.getElementById('notationPicker')
  if (pickerEl) {
    pickerEl.innerHTML = html
    document.getElementById('notationPickerOverlay')?.classList.add('open')
    positionPickerNearCell(pickerEl, pos)
  }
}

function notationBtn(skill: NotationSkill, grade: NotationGrade, cls: string, label: string): string {
  return `<button class="btn-notation ${cls}" onclick="addNotation('${skill}','${grade}')">${label}</button>`
}

export function closeNotationPicker(): void {
  document.getElementById('notationPickerOverlay')?.classList.remove('open')
  state.notationPickerPos = null
}

export function addNotation(skill: NotationSkill, grade: NotationGrade): void {
  const pos = state.notationPickerPos
  if (!pos) return
  const event: NotationEvent = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    set: state.currentSet,
    position: pos,
    skill,
    grade,
    playerNr: state.court[pos],
  }
  state.notationLog.push(event)
  closeNotationPicker()
  renderAll()
}

export function undoLastNotation(): void {
  state.notationLog.pop()
  renderAll()
}

export function renderNotationSummary(): void {
  const el = document.getElementById('notationSummary')
  if (!el) return

  const filtered = state.scoreViewSet === 0
    ? state.notationLog
    : state.notationLog.filter(e => e.set === state.scoreViewSet)

  // Count per position × grade
  type PosGradeCounts = Record<NotationGrade, number>
  const byPos: Record<number, PosGradeCounts> = {}
  for (let p = 1; p <= 6; p++) byPos[p] = { '#': 0, '!': 0, '-': 0 }
  filtered.forEach(e => { byPos[e.position][e.grade]++ })

  const lastEvent = state.notationLog[state.notationLog.length - 1]
  const undoLabel = lastEvent
    ? `Peruuta: P${lastEvent.position} ${lastEvent.skill}${lastEvent.grade === '-' ? '−' : lastEvent.grade}`
    : 'Peruuta viimeisin'
  const undoDisabled = state.notationLog.length === 0 ? ' disabled' : ''

  let selOpts = ''
  for (let i = 1; i <= 3; i++) {
    selOpts += `<option value="${i}"${state.scoreViewSet === i ? ' selected' : ''}>Er&auml; ${i}</option>`
  }
  selOpts += `<option value="0"${state.scoreViewSet === 0 ? ' selected' : ''}>Yhteens&auml;</option>`

  let html = `<h3>Merkinn&auml;t <select class="score-select" onchange="setScoreView(this.value)">${selOpts}</select></h3>`
  html += `<div class="score-list">`
  html += `<div class="score-row score-header score-row-3col"><span></span><span class="score-col-hdr grade-good">#</span><span class="score-col-hdr grade-neutral">!</span><span class="score-col-hdr grade-error">&minus;</span></div>`

  let anyRow = false
  for (let p = 1; p <= 6; p++) {
    const row = byPos[p]
    const rowTotal = row['#'] + row['!'] + row['-']
    if (rowTotal === 0) continue
    anyRow = true
    const goodCls = row['#'] > 0 ? 'pos' : 'zero'
    const neutCls = row['!'] > 0 ? 'neutral' : 'zero'
    const errCls  = row['-'] > 0 ? 'neg' : 'zero'
    html += `<div class="score-row score-row-3col">` +
      `<span><span class="score-player">Paikka ${p}</span></span>` +
      `<span class="score-val ${goodCls}">${row['#'] || '&ndash;'}</span>` +
      `<span class="score-val ${neutCls}">${row['!'] || '&ndash;'}</span>` +
      `<span class="score-val ${errCls}">${row['-'] || '&ndash;'}</span>` +
      `</div>`
  }

  if (!anyRow) {
    html += `<div style="color:var(--text3);font-size:13px;padding:8px 12px">Ei merkint&ouml;j&auml;</div>`
  }

  html += `</div>`
  html += `<button class="btn btn-sm notation-undo"${undoDisabled} onclick="undoLastNotation()" style="margin-top:8px">${undoLabel}</button>`

  el.innerHTML = html
}

// ── Auth render functions ─────────────────────────────────────────────────────

function showAuthContainer(): void {
  const auth = document.getElementById('auth-container')
  const scoring = document.getElementById('scoring-container')
  if (auth) auth.style.display = ''
  if (scoring) scoring.style.display = 'none'
}

function showScoringContainer(): void {
  const auth = document.getElementById('auth-container')
  const scoring = document.getElementById('scoring-container')
  if (auth) auth.style.display = 'none'
  if (scoring) scoring.style.display = ''
}

export function renderAuthScreen(): void {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()
  container.innerHTML =
    '<div class="auth-container">' +
    '<div class="login-card">' +
    '<h1>LENTOPALLO</h1>' +
    '<p class="login-subtitle">Kirjaudu sy\u00f6tt\u00e4m\u00e4ll\u00e4 s\u00e4hk\u00f6postisi</p>' +
    '<input type="email" class="login-input" id="loginEmail" placeholder="s\u00e4hk\u00f6posti@esimerkki.fi" autofocus>' +
    '<div class="login-error" id="loginError" style="display:none"></div>' +
    '<button class="login-btn" id="loginBtn">L\u00e4het\u00e4 kirjautumislinkki</button>' +
    (import.meta.env.DEV && import.meta.env.VITE_TEST_EMAIL && import.meta.env.VITE_TEST_PASSWORD
      ? '<button class="login-btn login-btn-test" id="testLoginBtn" style="margin-top:12px;background:#444">Testikirjautuminen (DEV)</button>'
      : '') +
    '</div>' +
    '</div>'

  const btn = document.getElementById('loginBtn') as HTMLButtonElement | null
  const input = document.getElementById('loginEmail') as HTMLInputElement | null
  if (btn) btn.addEventListener('click', handleLogin)
  if (input) input.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') handleLogin() })

  const testBtn = document.getElementById('testLoginBtn') as HTMLButtonElement | null
  if (testBtn) testBtn.addEventListener('click', handleTestLogin)
}

async function handleTestLogin(): Promise<void> {
  const btn = document.getElementById('testLoginBtn') as HTMLButtonElement | null
  const errorEl = document.getElementById('loginError')
  const email = import.meta.env.VITE_TEST_EMAIL as string | undefined
  const password = import.meta.env.VITE_TEST_PASSWORD as string | undefined
  if (!btn || !email || !password) return

  btn.disabled = true
  btn.textContent = 'Kirjaudutaan\u2026'
  if (errorEl) errorEl.style.display = 'none'

  const { error } = await signInWithPassword(email, password)
  if (error) {
    btn.disabled = false
    btn.textContent = 'Testikirjautuminen (DEV)'
    if (errorEl) { errorEl.textContent = error.message; errorEl.style.display = '' }
  }
}

async function handleLogin(): Promise<void> {
  const input = document.getElementById('loginEmail') as HTMLInputElement | null
  const btn = document.getElementById('loginBtn') as HTMLButtonElement | null
  const errorEl = document.getElementById('loginError')
  if (!input || !btn) return

  const email = input.value.trim()
  if (!email.includes('@')) {
    input.classList.add('input-error')
    if (errorEl) { errorEl.textContent = 'Sy\u00f6t\u00e4 kelvollinen s\u00e4hk\u00f6postiosoite.'; errorEl.style.display = '' }
    return
  }

  input.classList.remove('input-error')
  if (errorEl) errorEl.style.display = 'none'
  btn.disabled = true
  btn.textContent = 'L\u00e4hetet\u00e4\u00e4n\u2026'

  const { error } = await sendMagicLink(email)
  if (error) {
    btn.disabled = false
    btn.textContent = 'L\u00e4het\u00e4 kirjautumislinkki'
    if (errorEl) { errorEl.textContent = error.message; errorEl.style.display = '' }
    return
  }
  renderLinkSent(email)
}

export function renderLinkSent(email: string): void {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()
  container.innerHTML =
    '<div class="auth-container">' +
    '<div class="link-sent-card">' +
    '<div class="link-sent-check">&#10003;</div>' +
    '<h2>Linkki l\u00e4hetetty</h2>' +
    '<p>Tarkista s\u00e4hk\u00f6postisi ja klikkaa kirjautumislinkkia.</p>' +
    '<button class="resend-link" id="resendBtn" disabled>L\u00e4het\u00e4 uudelleen (60s)</button>' +
    '</div>' +
    '</div>'

  let secondsLeft = 60
  const resendBtn = document.getElementById('resendBtn') as HTMLButtonElement | null
  const countdown = setInterval(() => {
    secondsLeft--
    if (resendBtn) {
      if (secondsLeft <= 0) {
        clearInterval(countdown)
        resendBtn.disabled = false
        resendBtn.textContent = 'L\u00e4het\u00e4 uudelleen'
        resendBtn.addEventListener('click', () => renderAuthScreen())
      } else {
        resendBtn.textContent = 'L\u00e4het\u00e4 uudelleen (' + secondsLeft + 's)'
      }
    } else {
      clearInterval(countdown)
    }
  }, 1000)

  void email // suppress unused warning
}

export function renderAuthLoading(): void {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()
  container.innerHTML =
    '<div class="auth-container">' +
    '<div class="login-card">' +
    '<h1>LENTOPALLO</h1>' +
    '<p class="auth-loading-text">Kirjaudutaan sis\u00e4\u00e4n</p>' +
    '</div>' +
    '</div>'
}

export function renderAuthError(): void {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()
  container.innerHTML =
    '<div class="auth-container">' +
    '<div class="auth-error-card">' +
    '<h2>Linkki on vanhentunut</h2>' +
    '<p>Kirjautumislinkki on k\u00e4ytetty tai vanhentunut. Pyyd\u00e4 uusi linkki.</p>' +
    '<button class="login-btn" id="retryAuthBtn">Pyyd\u00e4 uusi linkki</button>' +
    '</div>' +
    '</div>'
  const btn = document.getElementById('retryAuthBtn')
  if (btn) btn.addEventListener('click', () => renderAuthScreen())
}

export async function renderTeamSelect(userId: string): Promise<void> {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()

  // Show loading while fetching
  container.innerHTML =
    '<div class="auth-container">' +
    '<p class="auth-loading-text">Ladataan joukkueita</p>' +
    '</div>'

  const profile = await fetchUserProfile(userId)
  if (!profile || profile.club_id === null) {
    renderNoClubState()
    return
  }

  const teams = await fetchTeams()
  const emailHtml = esc(state.userEmail || '')
  let teamsHtml: string
  if (teams.length === 0) {
    teamsHtml = '<p class="empty-teams-text">Ei joukkueita. Pyyd\u00e4 j\u00e4rjestelm\u00e4nvalvojaa luomaan joukkue.</p>'
  } else {
    teamsHtml = '<div class="team-list" id="teamList">' +
      teams.map(t =>
        '<div class="team-card" data-team-id="' + t.id + '" data-team-name="' + esc(t.name) + '">' +
        '<span class="team-card-name">' + esc(t.name) + '</span>' +
        '<span class="team-card-chevron">\u203a</span>' +
        '</div>'
      ).join('') +
      '</div>'
  }

  container.innerHTML =
    '<div style="padding:0 16px;max-width:560px;margin:0 auto">' +
    '<div class="team-header">' +
    '<div class="team-header-left"><h1>LENTOPALLO</h1></div>' +
    '<div class="team-header-right">' +
    '<span class="user-email">' + emailHtml + '</span>' +
    '<button class="signout-link" id="signOutBtn">Kirjaudu ulos</button>' +
    '</div>' +
    '</div>' +
    '<h2 class="team-section-heading">VALITSE JOUKKUE</h2>' +
    teamsHtml +
    '</div>'

  const signOutBtn = document.getElementById('signOutBtn')
  if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut)

  if (teams.length > 0) {
    const teamList = document.getElementById('teamList')
    if (teamList) {
      teamList.addEventListener('click', (e: Event) => {
        const card = (e.target as HTMLElement).closest('.team-card') as HTMLElement | null
        if (card && card.dataset.teamId && card.dataset.teamName) {
          selectTeam(card.dataset.teamId, card.dataset.teamName)
        }
      })
    }
  }
}

export function renderNoClubState(): void {
  const container = document.getElementById('auth-container')
  if (!container) return
  showAuthContainer()
  container.innerHTML =
    '<div class="auth-container">' +
    '<div class="login-card">' +
    '<h1>LENTOPALLO</h1>' +
    '<p class="no-club-text">Odota j\u00e4rjestelm\u00e4nvalvojan hyv\u00e4ksynt\u00e4\u00e4</p>' +
    '<button class="signout-link" id="signOutBtn" style="display:block;margin:0 auto">Kirjaudu ulos</button>' +
    '</div>' +
    '</div>'
  const btn = document.getElementById('signOutBtn')
  if (btn) btn.addEventListener('click', handleSignOut)
}

export function selectTeam(teamId: string, teamName: string): void {
  state.selectedTeamId = teamId
  state.selectedTeamName = teamName
  state.authScreen = 'scoring'
  showScoringContainer()
  renderAll()
}

let signOutTimeout: ReturnType<typeof setTimeout> | null = null

export function handleSignOut(): void {
  if (!state.confirmingSignOut) {
    state.confirmingSignOut = true
    const btn = document.getElementById('signOutBtn')
    if (btn) btn.textContent = 'Vahvista uloskirjautuminen'
    signOutTimeout = setTimeout(() => {
      state.confirmingSignOut = false
      const btn2 = document.getElementById('signOutBtn')
      if (btn2) btn2.textContent = 'Kirjaudu ulos'
    }, 3000)
  } else {
    if (signOutTimeout) clearTimeout(signOutTimeout)
    state.confirmingSignOut = false
    void signOutUser()
  }
}

Object.assign(window, {
  handleSignOut,
  openNotationPicker, closeNotationPicker, addNotation, undoLastNotation, setActiveTab,
})
