// Copie dans le presse-papiers (secours quand le téléchargement est impossible).

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
