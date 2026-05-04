// components/FileUploader.ts
// Direct-to-Storage uploader using the Supabase JS SDK.

import { supabase } from '../services/supabase'

export interface UploadResult {
  path: string
  publicUrl: string
}

/**
 * Upload a file directly to a Supabase Storage bucket.
 *
 * @param bucket   Storage bucket name (e.g. 'product-images', 'shop-banners')
 * @param filePath Path within the bucket (e.g. `${shopId}/${Date.now()}.jpg`)
 * @param file     The File object to upload
 * @returns        The storage path and public URL
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File
): Promise<UploadResult> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Create a file input with upload handling.
 * Renders into the container and calls onUpload with the result.
 */
export function createFileUploader(
  container: HTMLElement,
  bucket: string,
  pathPrefix: string,
  onUpload: (result: UploadResult) => void,
  accept: string = 'image/*'
): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.id = `uploader-${bucket}-${Date.now()}`

  const status = document.createElement('p')
  status.className = 'upload-status'

  container.appendChild(input)
  container.appendChild(status)

  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    status.textContent = 'Uploading...'

    try {
      const filePath = `${pathPrefix}/${Date.now()}-${file.name}`
      const result = await uploadFile(bucket, filePath, file)
      status.textContent = 'Upload complete!'
      onUpload(result)
    } catch (err: any) {
      status.textContent = `Error: ${err.message}`
    }
  })
}
