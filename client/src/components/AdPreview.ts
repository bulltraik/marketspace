// components/AdPreview.ts
// Live preview component for advertisements — renders copy text with the selected font style.

import type { FontStyle } from '../types'

const fontMap: Record<FontStyle, string> = {
  modern:    "'Inter', sans-serif",
  classic:   "'Georgia', serif",
  technical: "'Courier New', monospace",
  elegant:   "'Palatino Linotype', 'Book Antiqua', serif",
}

/**
 * Render an ad preview into the given container.
 */
export function renderAdPreview(
  container: HTMLElement,
  copyText: string,
  fontStyle: FontStyle,
  imageUrl?: string | null
): void {
  const fontFamily = fontMap[fontStyle] || fontMap.modern

  container.innerHTML = `
    <div class="ad-preview" style="font-family: ${fontFamily};">
      ${imageUrl ? `<img src="${imageUrl}" alt="Ad preview" class="ad-preview-image" />` : ''}
      <p class="ad-preview-copy">${copyText || 'Your ad text here...'}</p>
      <span class="ad-preview-font-label">${fontStyle}</span>
    </div>
  `
}

/**
 * Attach live preview listeners to form inputs.
 */
export function attachLivePreview(
  copyInput: HTMLInputElement | HTMLTextAreaElement,
  fontSelect: HTMLSelectElement,
  previewContainer: HTMLElement,
  imageUrl?: string | null
): void {
  const update = () => {
    renderAdPreview(
      previewContainer,
      copyInput.value,
      fontSelect.value as FontStyle,
      imageUrl
    )
  }

  copyInput.addEventListener('input', update)
  fontSelect.addEventListener('change', update)

  // Initial render
  update()
}
