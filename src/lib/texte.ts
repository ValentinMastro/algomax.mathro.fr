/** Texte simple → HTML : échappement, puis `**gras**`. */
export function enrichir(texte: string): string {
	return texte
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
