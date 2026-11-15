// Lecture d'un fichier choisi par l'utilisateur et téléchargement d'un fichier généré.

export function readFileAsText(file: File): Promise<string> {
  return file.text()
}

/** Déclenche le téléchargement ; renvoie false si le navigateur l'a refusé. */
export function downloadBlob(fileName: string, blob: Blob): boolean {
  try {
    const link = document.createElement('a')
    if (!('download' in link)) return false
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()
    // Laisse le temps au navigateur de lire le fichier avant de libérer l'URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return true
  } catch {
    return false
  }
}

export function downloadText(fileName: string, text: string): boolean {
  return downloadBlob(fileName, new Blob([text], { type: 'application/json' }))
}
