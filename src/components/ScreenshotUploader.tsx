import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { toast } from 'sonner';

export const ScreenshotUploader: React.FC<{ onUpload: (urls: string[]) => void; initialScreenshots?: string[] }> = ({ onUpload, initialScreenshots = [] }) => {
  const [screenshots, setScreenshots] = useState<string[]>(initialScreenshots);
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const updatedScreenshots = [...screenshots, urlInput.trim()];
      setScreenshots(updatedScreenshots);
      onUpload(updatedScreenshots);
      setUrlInput('');
      toast.success('Screenshot URL added successfully');
    }
  };

  const removeScreenshot = (index: number) => {
    const updatedScreenshots = screenshots.filter((_, i) => i !== index);
    setScreenshots(updatedScreenshots);
    onUpload(updatedScreenshots);
  };

  const moveScreenshot = (index: number, direction: 'left' | 'right') => {
    if ((direction === 'left' && index === 0) || (direction === 'right' && index === screenshots.length - 1)) return;
    
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    const updatedScreenshots = [...screenshots];
    const temp = updatedScreenshots[index];
    updatedScreenshots[index] = updatedScreenshots[newIndex];
    updatedScreenshots[newIndex] = temp;
    
    setScreenshots(updatedScreenshots);
    onUpload(updatedScreenshots);
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Screenshots</label>

      <form onSubmit={handleUrlSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/screenshot.png"
            className="w-full p-4 pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-6 py-4 font-bold bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
          Add
        </button>
      </form>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {screenshots.map((url, index) => (
          <div key={index} className="relative group shrink-0 snap-center">
            <img 
              src={url} 
              alt={`Screenshot ${index + 1}`} 
              className="h-64 w-auto object-contain bg-black/5 dark:bg-white/5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
              <button 
                onClick={(e) => { e.preventDefault(); removeScreenshot(index); }}
                className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
              {index > 0 && (
                <button 
                  onClick={(e) => { e.preventDefault(); moveScreenshot(index, 'left'); }}
                  className="p-1.5 text-white rounded-full hover:bg-white/20 transition-colors"
                  title="Move Left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {index < screenshots.length - 1 && (
                <button 
                  onClick={(e) => { e.preventDefault(); moveScreenshot(index, 'right'); }}
                  className="p-1.5 text-white rounded-full hover:bg-white/20 transition-colors"
                  title="Move Right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
