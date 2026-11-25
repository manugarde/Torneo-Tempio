export function matchScore(partita) {
  let casa = 0, ospite = 0;
  const eventi = partita.eventi || [];
  for (const e of eventi) {
    if (e.tipo === 'gol') {
      if (e.squadraId === partita.casaId) casa++;
      else if (e.squadraId === partita.ospiteId) ospite++;
    } else if (e.tipo === 'autogol') {
      // counts for the OTHER team
      if (e.squadraId === partita.casaId) ospite++;
      else if (e.squadraId === partita.ospiteId) casa++;
    }
  }
  return { casa, ospite };
}

export function matchWinner(partita) {
  if (partita.stato !== 'finita') return null;
  const { casa, ospite } = matchScore(partita);
  if (casa > ospite) return partita.casaId;
  if (ospite > casa) return partita.ospiteId;
  // equal scores
  if (partita.fase === 'eliminazione' && partita.rigori) {
    const { casa: rigCasa, ospite: rigOsp } = partita.rigori;
    if (rigCasa !== rigOsp) {
      return rigCasa > rigOsp ? partita.casaId : partita.ospiteId;
    }
  }
  return null;
}

export function canFinish(partita) {
  const { casa, ospite } = matchScore(partita);
  if (partita.fase === 'eliminazione') {
    if (casa === ospite) {
      if (!partita.rigori) return false;
      const { casa: rigCasa, ospite: rigOsp } = partita.rigori;
      if (rigCasa === rigOsp) return false;
    }
  }
  return true;
}
