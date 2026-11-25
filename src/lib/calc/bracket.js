import { matchWinner } from './score.js';

export function proposePairings(classifiche, qualificatiPerGirone) {
  const gironi = Object.keys(classifiche).sort();
  if (!gironi.length || gironi.length % 2 !== 0) {
    return [];
  }
  if (qualificatiPerGirone !== 1 && qualificatiPerGirone !== 2) {
    return [];
  }
  // Check each girone has enough squadres
  for (const g of gironi) {
    if (!classifiche[g] || classifiche[g].length < qualificatiPerGirone) {
      return [];
    }
  }

  const result = [];
  for (let i = 0; i < gironi.length; i += 2) {
    const g1 = gironi[i];
    const g2 = gironi[i + 1];
    const squadre1 = classifiche[g1];
    const squadre2 = classifiche[g2];

    if (qualificatiPerGirone === 1) {
      result.push({
        casaId: squadre1[0].squadraId,
        ospiteId: squadre2[0].squadraId,
      });
    } else { // 2
      result.push({
        casaId: squadre1[0].squadraId,
        ospiteId: squadre2[1].squadraId,
      });
      result.push({
        casaId: squadre2[0].squadraId,
        ospiteId: squadre1[1].squadraId,
      });
    }
  }
  return result;
}

export function advanceUpdates(partita) {
  if (!partita.prossima) {
    return [];
  }
  const winner = matchWinner(partita);
  const campo = partita.prossima.lato === 'casa' ? 'casaId' : 'ospiteId';
  return [{
    partitaId: partita.prossima.partitaId,
    campo: campo,
    valore: winner,
  }];
}
