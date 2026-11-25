export const IMPOSTAZIONI_DEFAULT = {
  nome: 'Torneo Tempio',
  punti: { vittoria: 3, pareggio: 1, sconfitta: 0 },
  criteriParita: ['differenzaReti', 'golFatti', 'scontroDiretto'],
  squalifiche: { modo: 'auto', sogliaGialli: 2, partiteRosso: 1, azzeraGialliFaseFinale: true },
  qualificatiPerGirone: 2,
}

/** Impostazioni salvate + default per i campi mancanti. */
export function conDefault(imp) {
  const i = imp ?? {}
  return {
    ...IMPOSTAZIONI_DEFAULT,
    ...i,
    punti: { ...IMPOSTAZIONI_DEFAULT.punti, ...i.punti },
    squalifiche: { ...IMPOSTAZIONI_DEFAULT.squalifiche, ...i.squalifiche },
  }
}
