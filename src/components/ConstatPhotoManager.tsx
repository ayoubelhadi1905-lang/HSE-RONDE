import React, { useState, useRef } from 'react';
import { ConstatPhoto } from '../types';
import {
  Camera,
  Upload,
  Trash2,
  Maximize2,
  X,
  Image as ImageIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

// Compression helper to optimize uploaded photos
export const compressImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Generates SVG-based realistic placeholder photos for instant demo test
export const getSampleConstatPhoto = (
  type: 'armoire' | 'extincteur' | 'epi'
): ConstatPhoto => {
  const timestamp = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = new Date().toLocaleDateString('fr-FR');

  let title = 'Constat Sécurité';
  let badgeColor = '#DC2626';
  let iconEmoji = '⚠️';
  let desc = 'Non-conformité constatée en ronde';

  if (type === 'armoire') {
    title = 'Armoire Électrique Déverrouillée';
    desc = 'Porte TGBT ouverte sans consignation';
    iconEmoji = '⚡';
    badgeColor = '#B91C1C';
  } else if (type === 'extincteur') {
    title = 'Extincteur Décroché';
    desc = 'Goupille absente et obstacle devant l’accès';
    iconEmoji = '🧯';
    badgeColor = '#C2410C';
  } else if (type === 'epi') {
    title = 'Défaut Port des EPI';
    desc = 'Absence de lunettes et gants en zone broyage';
    iconEmoji = '🥽';
    badgeColor = '#4338CA';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#1E293B"/>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" stroke-width="1"/>
    </pattern>
    <rect width="600" height="400" fill="url(#grid)"/>
    <rect x="20" y="20" width="560" height="360" rx="16" fill="#0F172A" stroke="#475569" stroke-width="2"/>
    <circle cx="300" cy="150" r="54" fill="${badgeColor}" opacity="0.2"/>
    <circle cx="300" cy="150" r="40" fill="${badgeColor}"/>
    <text x="300" y="162" font-size="34" text-anchor="middle">${iconEmoji}</text>
    <rect x="40" y="40" width="180" height="32" rx="8" fill="${badgeColor}"/>
    <text x="50" y="61" fill="#FFFFFF" font-family="sans-serif" font-size="12" font-weight="bold">REF: 021F.Ps.POT.02</text>
    <text x="550" y="61" fill="#94A3B8" font-family="monospace" font-size="12" text-anchor="end">${dateStr} ${timestamp}</text>
    <text x="300" y="235" fill="#F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">${title}</text>
    <text x="300" y="265" fill="#CBD5E1" font-family="sans-serif" font-size="14" text-anchor="middle">${desc}</text>
    <rect x="180" y="295" width="240" height="32" rx="6" fill="#334155"/>
    <text x="300" y="316" fill="#F97316" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">PREUVE PHOTO HSE &bull; GROUPE SICDA</text>
  </svg>`;

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    dataUrl,
    name: `${title}.jpg`,
    dateAjout: `${dateStr} à ${timestamp}`,
    commentaire: desc,
  };
};

interface ConstatPhotoManagerProps {
  photos: ConstatPhoto[];
  onChangePhotos: (newPhotos: ConstatPhoto[]) => void;
  readOnly?: boolean;
  constatTitre?: string;
  maxPhotos?: number;
}

export const ConstatPhotoManager: React.FC<ConstatPhotoManagerProps> = ({
  photos = [],
  onChangePhotos,
  readOnly = false,
  constatTitre = 'Constat HSE',
  maxPhotos = 6,
}) => {
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<ConstatPhoto | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process files
  const handleProcessFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);

    try {
      const remainingSlots = maxPhotos - photos.length;
      const filesToProcess = Array.from(fileList).slice(0, remainingSlots);

      const newPhotoPromises = filesToProcess.map(async (file) => {
        const compressedDataUrl = await compressImageFile(file);
        const photo: ConstatPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          dataUrl: compressedDataUrl,
          name: file.name,
          dateAjout: new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        return photo;
      });

      const processed = await Promise.all(newPhotoPromises);
      onChangePhotos([...photos, ...processed]);
    } catch (err) {
      console.error('Erreur compression image:', err);
      alert("Erreur lors du traitement de l'image. Veuillez réessayer.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChangePhotos(updated);
  };

  const handleInsertSample = (type: 'armoire' | 'extincteur' | 'epi') => {
    if (photos.length >= maxPhotos) {
      alert(`Limite atteinte : ${maxPhotos} photos maximum par constat.`);
      return;
    }
    const sample = getSampleConstatPhoto(type);
    onChangePhotos([...photos, sample]);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleProcessFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleProcessFiles(e.target.files)}
      />

      {/* Header with Photo count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-orange-500" />
          Photos & Preuves Visuelles du Constat ({photos.length}/{maxPhotos})
        </label>
        {photos.length > 0 && (
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            ✓ {photos.length} photo(s) attachée(s)
          </span>
        )}
      </div>

      {/* Action buttons (upload / camera / sample) */}
      {!readOnly && photos.length < maxPhotos && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="Prendre une photo directement avec la caméra"
            >
              <Camera className="w-3.5 h-3.5" />
              Prendre Photo
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              title="Importer des images depuis votre disque ou smartphone"
            >
              <Upload className="w-3.5 h-3.5" />
              Importer Fichier
            </button>

            {/* Quick Demo Insert Buttons */}
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-100 p-1 rounded-xl">
              <span className="text-slate-500 px-1 font-medium">Exemples rapides :</span>
              <button
                type="button"
                onClick={() => handleInsertSample('armoire')}
                className="px-2 py-0.5 bg-white hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                title="Insérer un modèle de photo d'armoire électrique déverrouillée"
              >
                ⚡ Armoire
              </button>
              <button
                type="button"
                onClick={() => handleInsertSample('extincteur')}
                className="px-2 py-0.5 bg-white hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                title="Insérer un modèle de photo d'extincteur défectueux"
              >
                🧯 Extincteur
              </button>
              <button
                type="button"
                onClick={() => handleInsertSample('epi')}
                className="px-2 py-0.5 bg-white hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                title="Insérer un modèle de photo de non-port d'EPI"
              >
                🥽 EPI
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleProcessFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-orange-500 bg-orange-50/50'
                : 'border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <ImageIcon className="w-4 h-4 text-orange-500" />
              <span>
                Glissez-déposez des photos ici, ou{' '}
                <strong className="text-orange-600 underline">cliquez pour parcourir</strong> (JPG, PNG)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isProcessing && (
        <div className="text-xs text-orange-600 font-bold flex items-center gap-2 py-1 animate-pulse">
          <span className="w-3 h-3 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          Traitement et optimisation de l'image en cours...
        </div>
      )}

      {/* Photo Gallery Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video sm:aspect-square flex items-center justify-center"
            >
              <img
                src={photo.dataUrl}
                alt={photo.name || `Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                referrerPolicy="no-referrer"
              />

              {/* Photo Overlay Tag */}
              <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                Photo #{index + 1}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhotoForZoom(photo)}
                  className="p-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg shadow transition-transform active:scale-90"
                  title="Agrandir en plein écran"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition-transform active:scale-90"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Photo caption footer */}
              {photo.dateAjout && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-1.5 text-[9px] text-white truncate">
                  {photo.name || photo.dateAjout}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 italic">
          Aucune photo attachée à cette non-conformité. Ajoutez une photo pour documenter l'écart.
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoForZoom && (
        <div
          onClick={() => setSelectedPhotoForZoom(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{constatTitre}</h4>
                  <p className="text-[10px] text-slate-400">
                    {selectedPhotoForZoom.name || 'Photo de constat'} &bull; {selectedPhotoForZoom.dateAjout || ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoForZoom(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-black/40 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={selectedPhotoForZoom.dataUrl}
                alt={selectedPhotoForZoom.name || 'Preuve de non-conformité'}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {selectedPhotoForZoom.commentaire && (
              <div className="p-3 bg-slate-950 text-xs text-slate-300 border-t border-slate-800">
                <strong>Commentaire :</strong> {selectedPhotoForZoom.commentaire}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
