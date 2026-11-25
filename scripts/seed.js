import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { IMPOSTAZIONI_DEFAULT } from '../src/lib/defaults.js'

const staffEmail = 'staff@torneo.it'
const staffPassword = 'staff123'
const authSignUpUrl = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`
const authSignInUrl = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key`

async function main() {
  // Create staff user
  let response = await fetch(authSignUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: staffEmail, password: staffPassword, returnSecureToken: true }),
  })
  let json = await response.json()
  let uid
  if (json.error && json.error.message === 'EMAIL_EXISTS') {
    response = await fetch(authSignInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffEmail, password: staffPassword, returnSecureToken: true }),
    })
    json = await response.json()
  }
  uid = json.localId

  // Initialize test environment
  const env = await initializeTestEnvironment({
    projectId: 'demo-torneo',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8085,
    },
  })

  await env.clearFirestore()

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()

    // staff/{uid}
    await setDoc(doc(db, 'staff', uid), {})

    // meta/corrente
    await setDoc(doc(db, 'meta', 'corrente'), { edizione: '2026' })

    // edizioni/2026
    await setDoc(doc(db, 'edizioni', '2026'), {
      ...IMPOSTAZIONI_DEFAULT,
      nome: 'Torneo Tempio',
    })

    // Teams
    const teamNames = [
      { id: 'grani', nome: 'Granitici' },
      { id: 'lupi', nome: 'Lupi Galluresi' },
      { id: 'sughero', nome: 'Sughero FC' },
      { id: 'limbara', nome: 'Limbara' },
      { id: 'curraggia', nome: 'Curraggia' },
      { id: 'nuchis', nome: 'Nuchis United' },
      { id: 'carnevale', nome: 'Carnevale Boys' },
      { id: 'fonte', nome: 'Fonte Nuova' },
    ]
    const surnames = ['Piras', 'Serra', 'Giurga', 'Menes', 'Cucchi', 'Breglia', 'Sisti', 'Zuri', 'Nurit', 'Sos', 'Bella', 'Cuccu']

    // Assign girone: first 4 A, last 4 B
    const teamsWithGirone = teamNames.map((team, idx) => ({
      ...team,
      girone: idx < 4 ? 'A' : 'B',
    }))

    // Write each team and its players
    for (let i = 0; i < teamsWithGirone.length; i++) {
      const team = teamsWithGirone[i]
      const players = []
      for (let n = 0; n < 6; n++) {
        const surnameIdx = (i * 6 + n) % 12
        players.push({
          id: `${team.id}-${n}`,
          nome: surnames[surnameIdx],
          numero: n + 1,
        })
      }
      await setDoc(doc(db, 'edizioni', '2026', 'squadre', team.id), {
        id: team.id,
        nome: team.nome,
        girone: team.girone,
        giocatori: players,
      })
    }

    // Group matches
    const teamsByGirone = { A: [], B: [] }
    for (const team of teamsWithGirone) {
      teamsByGirone[team.girone].push(team)
    }

    let k = 0
    for (const girone of ['A', 'B']) {
      const teams = teamsByGirone[girone]
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const casa = teams[i]
          const ospite = teams[j]
          const casaGoals = Math.floor((k * 7) % 4)
          const ospiteGoals = Math.floor((k * 3) % 3)
          const events = []

          // Casa goals
          for (let g = 0; g < casaGoals; g++) {
            const eventId = `e${k}-${g}`
            const playerId = `${casa.id}-${g % 6}`
            events.push({
              id: eventId,
              tipo: 'gol',
              squadraId: casa.id,
              giocatoreId: playerId,
            })
          }
          // Ospite goals
          for (let g = 0; g < ospiteGoals; g++) {
            const eventId = `e${k}-${casaGoals + g}`
            const playerId = `${ospite.id}-${g % 6}`
            events.push({
              id: eventId,
              tipo: 'gol',
              squadraId: ospite.id,
              giocatoreId: playerId,
            })
          }
          // Yellow card for casa player 0 when k even
          if (k % 2 === 0) {
            events.push({
              id: `e${k}-yellow`,
              tipo: 'giallo',
              squadraId: casa.id,
              giocatoreId: `${casa.id}-0`,
            })
          }

          const matchData = {
            id: `g${k}`,
            fase: 'girone',
            girone: girone,
            casaId: casa.id,
            ospiteId: ospite.id,
            campo: 'Campo 1',
            dataOra: new Date(Date.UTC(2026, 6, 1 + Math.floor(k / 4), 17 + (k % 4))),
            stato: k < 8 ? 'finita' : k === 8 ? 'live' : 'programmata',
            eventi: events,
            rigori: null,
            prossima: null,
          }

          await setDoc(doc(db, 'edizioni', '2026', 'partite', `g${k}`), matchData)
          k++
        }
      }
    }

    // Knockout matches
    const knockoutMatches = [
      { id: 's1', turno: 'Semifinale', slot: 1, fase: 'eliminazione', casaId: null, ospiteId: null, stato: 'programmata', dataOra: new Date(Date.UTC(2026, 6, 5, 18, 0)), prossima: { partitaId: 'f', lato: 'casa' } },
      { id: 's2', turno: 'Semifinale', slot: 2, fase: 'eliminazione', casaId: null, ospiteId: null, stato: 'programmata', dataOra: new Date(Date.UTC(2026, 6, 5, 19, 0)), prossima: { partitaId: 'f', lato: 'ospite' } },
      { id: 'f', turno: 'Finale', slot: 1, fase: 'eliminazione', casaId: null, ospiteId: null, stato: 'programmata', dataOra: new Date(Date.UTC(2026, 6, 6, 19, 0)), prossima: null },
    ]
    for (const match of knockoutMatches) {
      await setDoc(doc(db, 'edizioni', '2026', 'partite', match.id), {
        ...match,
        eventi: [],
        rigori: null,
        campo: 'Campo 1',
      })
    }

    // Chiosco
    await setDoc(doc(db, 'edizioni', '2026', 'chiosco', '2026-07-01'), {
      giorno: '2026-07-01',
      punti: { grani: 5, lupi: 3, sughero: 8 },
    })
    await setDoc(doc(db, 'edizioni', '2026', 'chiosco', '2026-07-02'), {
      giorno: '2026-07-02',
      punti: { grani: 2, curraggia: 6 },
    })
  })

  await env.cleanup()
  console.log('Seed ok. Staff: staff@torneo.it / staff123')
}

main()
