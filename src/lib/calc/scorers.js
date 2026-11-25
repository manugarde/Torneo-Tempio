export function topScorers(squadre, partite) {
  const counts = new Map();
  const playerMap = new Map();

  squadre.forEach(team => {
    team.giocatori.forEach(player => {
      playerMap.set(player.id, { nome: player.nome, squadraId: team.id });
    });
  });

  partite.forEach(match => {
    const eventi = match.eventi || [];
    eventi.forEach(ev => {
      if (ev.tipo !== 'gol') return;
      const giocatoreId = ev.giocatoreId;
      if (giocatoreId == null) return;
      const info = playerMap.get(giocatoreId);
      if (!info) return;
      const entry = counts.get(giocatoreId);
      if (entry) {
        entry.gol++;
      } else {
        counts.set(giocatoreId, { gol: 1, nome: info.nome, squadraId: info.squadraId });
      }
    });
  });

  const result = [];
  counts.forEach((info, id) => {
    result.push({
      giocatoreId: id,
      nome: info.nome,
      squadraId: info.squadraId,
      gol: info.gol
    });
  });

  result.sort((a, b) => {
    if (b.gol !== a.gol) return b.gol - a.gol;
    return a.nome.localeCompare(b.nome, 'it');
  });

  return result;
}
