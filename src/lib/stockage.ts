// Lecture et écriture protégées dans le stockage du navigateur : l'application
// fonctionne même sans stockage disponible (navigation privée…).
const PREFIXE = 'algomax:';

export function lire<T>(cle: string, defaut: T): T {
	try {
		const v = localStorage.getItem(PREFIXE + cle);
		return v ? (JSON.parse(v) as T) : defaut;
	} catch {
		return defaut;
	}
}

export function ecrire(cle: string, valeur: unknown) {
	try {
		localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
	} catch {
		// Stockage indisponible : tant pis.
	}
}
