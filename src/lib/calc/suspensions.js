export function computeSuspensions(squadre, partite, manuali, impostazioni) {
  const { modo, sogliaGialli, partiteRosso, azzeraGialliFaseFinale } = impostazioni.squalifiche;
  const result = new Map();

  squadre.forEach(t => {
    t.giocatori.forEach(g => {
      // Filter matches for this team
      const ordered = partite.filter(m => m.casaId === t.id || m.ospiteId === t.id);
      // Sort matches by dataOra (null last), then by id
      ordered.sort((a, b) => {
        const da = a.dataOra?.getTime() ?? Infinity;
        const db = b.dataOra?.getTime() ?? Infinity;
        if (da !== db) return da - db;
        return a.id.localeCompare(b.id);
      });

      let pending = 0;
      let gialli = 0;
      const lista = [];
      let fasePrecedente = null;

      ordered.forEach(m => {
        if (pending > 0) {
          lista.push(m.id);
          pending--;
        }

        if (azzeraGialliFaseFinale && m.fase === 'eliminazione' && fasePrecedente !== 'eliminazione') {
          gialli = 0;
        }
        fasePrecedente = m.fase;

        if (m.stato === 'finita' && modo === 'auto') {
          const mine = (m.eventi || []).filter(e => e.giocatoreId === g.id);
          const hasRosso = mine.some(e => e.tipo === 'rosso');
          if (hasRosso) {
            pending += partiteRosso;
          } else {
            const gialloCount = mine.filter(e => e.tipo === 'giallo').length;
            gialli += gialloCount;
            while (gialli >= sogliaGialli) {
              pending++;
              gialli -= sogliaGialli;
            }
          }
        }
      });

      result.set(g.id, {
        squadraId: t.id,
        partiteSqualificato: lista,
        residue: pending,
        gialliAttivi: gialli
      });
    });
  });

  // Apply manuali
  manuali.forEach(x => {
    const r = result.get(x.giocatoreId);
    if (!r) return;
    const t = squadre.find(st => st.id === r.squadraId);
    if (!t) return;
    const ordered = partite.filter(m => m.casaId === t.id || m.ospiteId === t.id);
    ordered.sort((a, b) => {
      const da = a.dataOra?.getTime() ?? Infinity;
      const db = b.dataOra?.getTime() ?? Infinity;
      if (da !== db) return da - db;
      return a.id.localeCompare(b.id);
    });
    const i = ordered.findIndex(m => m.id === x.daPartitaId);
    if (i === -1) return;

    if (x.tipo === 'aggiungi') {
      const slice = ordered.slice(i, i + x.partite);
      const addedIds = slice.map(m => m.id);
      const currentSet = new Set(r.partiteSqualificato);
      let taken = 0;
      addedIds.forEach(id => {
        if (!currentSet.has(id)) {
          currentSet.add(id);
          taken++;
        }
      });
      r.residue += x.partite - taken;
      // Add to lista while preserving order
      slice.forEach(m => {
        if (!r.partiteSqualificato.includes(m.id)) {
          r.partiteSqualificato.push(m.id);
        }
      });
    } else if (x.tipo === 'annulla') {
      const idx = r.partiteSqualificato.indexOf(x.daPartitaId);
      if (idx !== -1) {
        r.partiteSqualificato.splice(idx, 1);
        // residue adjustment not required by spec
      }
    }
  });

  return result;
}

export function isSuspended(result, giocatoreId, partitaId) {
  const r = result.get(giocatoreId);
  if (!r) return false;
  return r.partiteSqualificato.includes(partitaId);
}

export function atRisk(result, impostazioni) {
  const { modo } = impostazioni.squalifiche;
  if (modo !== 'auto') {
    return [];
  }
  const { sogliaGialli } = impostazioni.squalifiche;
  const risk = [];
  result.forEach((r, giocatoreId) => {
    if (r.gialliAttivi === sogliaGialli - 1) {
      risk.push(giocatoreId);
    }
  });
  return risk;
}
