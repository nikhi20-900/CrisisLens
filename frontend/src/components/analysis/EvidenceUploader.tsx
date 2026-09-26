import { UploadCloud, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { useCallback, useId, useState, type DragEvent } from 'react'

export function EvidenceUploader({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const inputId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const accept = useCallback(
    (next: File) => {
      const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(next.type)
      if (!ok) {
        setError('Please upload a valid PNG, JPEG, or WEBP image.')
        return
      }
      setError(null)
      onChange(next)
      const reader = new FileReader()
      reader.onload = () => setPreview(String(reader.result))
      reader.readAsDataURL(next)
    },
    [onChange],
  )

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    const dropped = event.dataTransfer.files[0]
    if (dropped) accept(dropped)
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="group relative flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-black/[0.12] bg-white p-6 text-center transition-all duration-200 hover:border-[#0071E3]/60 hover:bg-[#0071E3]/[0.02]"
      >
        {preview ? (
          <div className="relative w-full">
            <img src={preview} alt="Uploaded incident evidence" className="max-h-64 w-full rounded-xl object-contain shadow-xs" />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#0071E3]">
              <CheckCircle2 size={14} /> Click to change image
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] transition-transform duration-200 group-hover:scale-110">
              <UploadCloud size={24} strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#1D1D1F]">Upload Photographic Evidence</p>
            <p className="mt-1 text-xs text-[#6E6E73]">Drag & drop field photo, or click to browse</p>
            <span className="mt-3 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-[#86868B] uppercase tracking-wider">
              PNG · JPEG · WEBP (Max 15MB)
            </span>
          </div>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const next = event.target.files?.[0]
            if (next) accept(next)
          }}
        />
      </label>
      {file ? (
        <div className="flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2 text-[11px] font-medium text-[#6E6E73]">
          <ImageIcon size={14} className="text-[#0071E3]" />
          <span className="truncate">{file.name}</span>
          <span className="ml-auto text-[#86868B]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      ) : null}
      {error ? (
        <p className="text-[12px] font-semibold text-[#D70015]">{error}</p>
      ) : null}
    </div>
  )
}
