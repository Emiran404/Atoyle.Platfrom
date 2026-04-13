import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';
import { Modal } from './Modal';
import { useAuthStore } from '../../store/authStore';

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    if (isOpen && fileUrl && token) {
      fetchFile();
    }
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, fileUrl, token]);

  const fetchFile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Dosya yüklenemedi');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      console.error('File fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'dosya';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImage = fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = fileName?.match(/\.pdf$/i);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fileName || 'Dosya Görüntüleyici'}
      size={isFullscreen ? 'full' : 'xl'}
    >
      <div className="flex flex-col h-[70vh] relative">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Küçült' : 'Tam Ekran'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!blobUrl}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-all"
          >
            <Download size={16} />
            İndir
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Dosya güvenli bir şekilde yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Hata Oluştu</h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button
                onClick={fetchFile}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : isImage ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain shadow-lg rounded"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={`${blobUrl}#toolbar=0`}
              className="w-full h-full border-none"
              title={fileName}
            />
          ) : (
            <div className="text-center p-8">
              <FileText size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-4">Bu dosya türü doğrudan önizlenemiyor.</p>
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                Dosyayı İndir
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export { FileViewerModal };
