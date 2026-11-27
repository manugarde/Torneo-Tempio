export const TEMPLATE_RIGHE = 15

export function nomeFoglio(nome, usati) {
  // Rimuove caratteri vietati
  let risultato = nome.replace(/[\[\]:*?/\\]/g, '')
  // Taglia a 31 caratteri
  risultato = risultato.substring(0, 31)
  // Rimuove spazi iniziali e finali
  risultato = risultato.trim()
  // Se vuoto usa 'Squadra'
  if (risultato === '') {
    risultato = 'Squadra'
  }
  
  // Gestisce i nomi duplicati
  let nomeUnico = risultato
  let contatore = 1
  
  while (usati.has(nomeUnico.toLowerCase())) {
    contatore++
    // Calcola quanto spazio c'è per il suffisso (es. " (2)")
    const suffisso = ' (' + contatore + ')'
    const spazioDisponibile = 31 - suffisso.length
    
    // Se non c'è spazio per il nome base, taglia il nome
    if (spazioDisponibile <= 0) {
      nomeUnico = suffisso.substring(0, 31)
    } else {
      // Taglia il nome base e aggiunge il suffisso
      const nomeBase = risultato.substring(0, spazioDisponibile)
      nomeUnico = nomeBase + suffisso
    }
  }
  
  usati.add(nomeUnico.toLowerCase())
  return nomeUnico
}

export function foglioDaSquadra(squadra, usati = new Set()) {
  // Ordina i giocatori per numero, con null alla fine
  const giocatoriOrdinati = [...(squadra.giocatori ?? [])].sort((a, b) => {
    if (a.numero == null) return b.numero == null ? 0 : 1
    if (b.numero == null) return -1
    return a.numero - b.numero
  })
  
  // Crea le righe dei giocatori
  const righeGiocatori = giocatoriOrdinati.map(g => [g.numero ?? null, g.nome])
  
  // Costruisce il foglio
  const foglio = {
    sheet: nomeFoglio(squadra.nome, usati),
    data: [
      ['TORNEO CALCIO A 5 TEMPIO'],
      ['NOME DELLA SQUADRA', squadra.nome],
      [],
      ['n° maglia', 'Nome e cognome'],
      ...righeGiocatori
    ]
  }
  
  return foglio
}

export function foglioTemplate() {
  const foglio = foglioDaSquadra({ nome: '', giocatori: [] })
  
  // Aggiunge le righe vuote extra
  for (let i = 0; i < TEMPLATE_RIGHE; i++) {
    foglio.data.push([null, null])
  }
  
  return foglio
}

export function squadraDaFoglio({ sheet, data }) {
  // Estrae il nome della squadra
  const nome = String(data[1]?.[1] ?? '').trim()
  
  // Se il nome è vuoto, ritorna null
  if (!nome) {
    return null
  }
  
  // Trova l'indice dell'intestazione
  let h = 3 // Default
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.[1] && String(data[i][1]).trim().toLowerCase() === 'nome e cognome') {
      h = i
      break
    }
  }
  
  // Processa le righe dei giocatori
  const giocatori = []
  
  for (let i = h + 1; i < data.length; i++) {
    const row = data[i] ?? []
    const nomeGiocatore = String(row[1] ?? '').trim()
    
    // Salta le righe senza nome
    if (!nomeGiocatore) {
      continue
    }
    
    // Gestisce il numero di maglia
    const cella = String(row[0] ?? '').trim()
    let numero = null
    if (cella) {
      numero = Number(cella)
      if (!Number.isInteger(numero)) {
        throw new Error('Foglio "' + sheet + '", riga ' + (i + 1) + ': numero maglia non valido')
      }
    }
    
    giocatori.push({ nome: nomeGiocatore, numero })
  }
  
  return { nome, giocatori }
}

export function unisciSquadra(esistenti, importata, nuovoId) {
  // Normalizza il nome per la ricerca
  const key = (nome) => nome.trim().toLowerCase()
  
  // Cerca la squadra esistente
  const esistente = esistenti.find(s => key(s.nome) === key(importata.nome))
  
  if (esistente) {
    // Aggiorna la squadra esistente
    const nuovaSquadra = { ...esistente }
    
    // Gestisce i giocatori
    nuovaSquadra.giocatori = importata.giocatori.map(g => {
      // Trova il giocatore esistente con lo stesso nome
      const giocatoreEsistente = (esistente.giocatori ?? []).find(gg => gg.nome.trim().toLowerCase() === g.nome.trim().toLowerCase())
      
      if (giocatoreEsistente) {
        // Mantiene l'id esistente
        return { ...g, id: giocatoreEsistente.id }
      } else {
        // Crea un nuovo giocatore
        return { ...g, id: nuovoId() }
      }
    })
    
    return { squadra: nuovaSquadra, nuova: false }
  } else {
    // Crea una nuova squadra
    const nuovaSquadra = {
      id: undefined,
      nome: importata.nome.trim(),
      girone: 'A',
      logo: '',
      giocatori: importata.giocatori.map(g => ({ ...g, id: nuovoId() }))
    }
    
    return { squadra: nuovaSquadra, nuova: true }
  }
}
