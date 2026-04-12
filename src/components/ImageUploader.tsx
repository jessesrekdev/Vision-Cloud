import React, { useState } from 'react';
import { Link } from 'lucide-react';
import { toast } from 'sonner';

export const ImageUploader: React.FC<{ onUpload: (url: string) => void, currentIconUrl?: string }> = ({ onUpload, currentIconUrl }) => {
  const [urlInput, setUrlInput] = useState(currentIconUrl || '');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUpload(urlInput.trim());
      toast.success('Icon URL updated successfully');
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleUrlSubmit} className="w-full">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full p-4 pl-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </form>
      {currentIconUrl && (
        <div className="mt-4">
          <img 
            src={currentIconUrl} 
            alt="App Icon Preview" 
            className="w-24 h-24 object-cover rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
