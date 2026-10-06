import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Trash2, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Eye, 
  Sparkles,
  FileImage
} from 'lucide-react';

export default function TimetablePhotoViewer({ 
  photo, 
  onSavePhoto, 
  onRemovePhoto, 
  title = "Uploaded Timetable Photo",
  subtitle = "Your original timetable image displayed directly on the page.",
  allowUpload = true 
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, JPEG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const photoData = {
        url: dataUrl,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toISOString(),
      };
      if (onSavePhoto) onSavePhoto(photoData);
      setZoom(1);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = () => {
    if (!photo?.url) return;
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.name || 'timetable-photo.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // No photo uploaded yet -> Show modern upload dropzone
  if (!photo || !photo.url) {
    return (
      <div className="bg-white rounded-[28px] border border-[#ECE6DC] p-6 sm:p-8 shadow-xs text-center space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[24px] p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragOver 
              ? 'border-[#FACC15] bg-[#FFFBEB]' 
              : 'border-[#E2DCStory] hover:border-[#181A1D] bg-[#FAF8F5] hover:bg-[#F4F0E8]'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#181A1D] text-[#FACC15] flex items-center justify-center shadow-xs">
            <ImageIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="font-display font-black text-[#181A1D] text-base sm:text-lg">
              Upload Your Timetable Photo
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Drag and drop an image of your class or exam timetable here, or click to browse. It will be displayed directly on this page for quick viewing anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="px-5 py-2.5 rounded-full bg-[#181A1D] hover:bg-[#2D3139] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#FACC15]" />
              Select Photo from Device
            </button>
          </div>

          <p className="text-[11px] text-[#A8A29A]">
            Supports JPG, PNG, WEBP, Screenshots (No scanning delays — displays immediately)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
        }}
      />

      {/* Main Photo Card */}
      <div className="bg-white rounded-[28px] border border-[#ECE6DC] p-4 sm:p-6 shadow-xs space-y-4">
        
        {/* Photo Header & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F4F1EB]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
              <FileImage className="w-5 h-5 text-[#D97706]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-[#181A1D] text-sm sm:text-base truncate">
                  {photo.name || title}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                  Active Timetable Photo
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] truncate">
                {photo.uploadedAt ? `Uploaded on ${fmtDate(photo.uploadedAt)}` : subtitle} {photo.size ? `· ${photo.size}` : ''}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-[#FAF8F5] border border-[#ECE6DC] rounded-full p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                title="Zoom Out"
                className="p-1.5 rounded-full text-[#78716C] hover:text-[#181A1D] hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2 py-0.5 text-[10px] font-bold text-[#181A1D] hover:bg-white rounded-md transition-all cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title="Zoom In"
                className="p-1.5 rounded-full text-[#78716C] hover:text-[#181A1D] hover:bg-white disabled:opacity-40 transition-all cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate 90°"
              className="p-2 rounded-full bg-[#FAF8F5] hover:bg-[#F4F1EB] border border-[#ECE6DC] text-[#78716C] hover:text-[#181A1D] shadow-2xs transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="Full Screen View"
              className="p-2 rounded-full bg-[#FAF8F5] hover:bg-[#F4F1EB] border border-[#ECE6DC] text-[#78716C] hover:text-[#181A1D] shadow-2xs transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              title="Download Photo"
              className="p-2 rounded-full bg-[#FAF8F5] hover:bg-[#F4F1EB] border border-[#ECE6DC] text-[#78716C] hover:text-[#181A1D] shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Replace Button */}
            {allowUpload && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Replace with new photo"
                className="px-3 py-1.5 rounded-full bg-[#181A1D] hover:bg-[#2D3139] text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-[#FACC15]" />
                <span className="hidden sm:inline">Replace</span>
              </button>
            )}

            {/* Remove Button */}
            {onRemovePhoto && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove this timetable photo?')) {
                    onRemovePhoto();
                  }
                }}
                title="Remove photo"
                className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#E11D48] shadow-2xs transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Image Display Area */}
        <div className="relative overflow-hidden rounded-[22px] bg-[#181A1D]/5 border border-[#ECE6DC] min-h-[360px] sm:min-h-[500px] flex items-center justify-center p-4">
          <div 
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src={photo.url}
              alt={photo.name || "Timetable"}
              className="max-h-[600px] w-auto max-w-full rounded-xl shadow-md object-contain select-none cursor-zoom-in"
              onClick={() => setIsFullscreen(true)}
            />
          </div>

          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#181A1D] border border-[#ECE6DC] shadow-xs flex items-center gap-2 pointer-events-none">
            <Eye className="w-3 h-3 text-[#FACC15]" />
            <span>Click photo to view fullscreen · Double tap to inspect</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-[#181A1D]/90 backdrop-blur-md flex flex-col p-4 sm:p-6 transition-all"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Top Floating Controls */}
          <div 
            className="flex items-center justify-between gap-4 pb-4 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white">
              <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">{photo.name || 'Timetable Photo'}</h4>
              <p className="text-xs text-white/60">Use controls below or scroll to inspect times and rooms</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Image Container */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out'
              }}
              className="max-w-none flex items-center justify-center"
            >
              <img
                src={photo.url}
                alt={photo.name || "Timetable Fullscreen"}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
