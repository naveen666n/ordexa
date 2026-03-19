import { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import mediaApi from '../../api/admin/media.api';
import { getImageSrc } from '../../lib/utils';

/**
 * ImageUploadField — reusable image field for admin forms.
 *
 * Props:
 *   value      — current URL string (relative or absolute)
 *   onChange   — called with the new URL string
 *   label      — optional label text
 *   hint       — optional hint text below the field
 *   placeholder — input placeholder
 */
const ImageUploadField = ({ value = '', onChange, label, hint, placeholder = 'https://... or upload a file' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data } = await mediaApi.upload(file);
      onChange(data.data.url);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const previewSrc = getImageSrc(value);

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-9 text-sm"
        />
        <label
          className={`flex items-center gap-1.5 text-xs cursor-pointer px-3 py-1 rounded-md border border-input bg-white hover:bg-gray-50 whitespace-nowrap transition-colors flex-shrink-0 ${
            uploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex items-center justify-center w-9 h-9 rounded-md border border-input hover:bg-gray-50 flex-shrink-0 text-muted-foreground hover:text-foreground"
            title="Clear"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {previewSrc && (
        <img
          src={previewSrc}
          alt="Preview"
          className="h-20 w-auto rounded-lg border object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
    </div>
  );
};

export default ImageUploadField;
