import React, { useState } from 'react';
import { ambientSound } from '../utils/audio';
import { 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Waves, 
  Flame, 
  Droplets, 
  Wind, 
  X,
  Sparkles
} from 'lucide-react';

interface AmbientSoundPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioStateChange: (isPlaying: boolean) => void;
}

type SoundType = 'rain' | 'waves' | 'campfire' | 'stream' | 'whitenoise';

const SOUNDS: { id: SoundType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'rain', label: 'Gentle Rain', icon: CloudRain },
  { id: 'waves', label: 'Ocean Waves', icon: Waves },
  { id: 'campfire', label: 'Warm Campfire', icon: Flame },
  { id: 'stream', label: 'Forest Stream', icon: Droplets },
  { id: 'whitenoise', label: 'Soft Breeze', icon: Wind }
];

export const AmbientSoundPlayer: React.FC<AmbientSoundPlayerProps> = ({
  isOpen,
  onClose,
  onAudioStateChange
}) => {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.4);

  if (!isOpen) return null;

  const handleToggleSound = (soundId: SoundType) => {
    if (activeSound === soundId) {
      ambientSound.stop();
      setActiveSound(null);
      onAudioStateChange(false);
    } else {
      ambientSound.play(soundId, volume);
      setActiveSound(soundId);
      onAudioStateChange(true);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    ambientSound.setVolume(newVol);
  };

  const handleStopAll = () => {
    ambientSound.stop();
    setActiveSound(null);
    onAudioStateChange(false);
  };

  return (
    <div 
      id="ambient-sound-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="ambient-sound-card"
        className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 id="ambient-sound-title" className="text-base font-bold text-stone-900 font-sans-ui">
              Focus Ambient Soundscapes
            </h3>
          </div>
          <button
            id="ambient-sound-close-btn"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-500">
          Listen to calming procedural soundscapes generated in real-time to immerse yourself in deep, mindful writing.
        </p>

        {/* Sounds Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SOUNDS.map((s) => {
            const Icon = s.icon;
            const isPlaying = activeSound === s.id;

            return (
              <button
                key={s.id}
                id={`ambient-btn-${s.id}`}
                onClick={() => handleToggleSound(s.id)}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/30'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isPlaying ? 'text-amber-600 animate-pulse' : 'text-stone-500'}`} />
                <span className="text-xs font-semibold">{s.label}</span>
                {isPlaying && (
                  <span className="text-[10px] text-amber-700 uppercase tracking-widest font-bold">
                    Playing
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Volume Slider & Controls */}
        <div className="pt-2 border-t border-stone-100 space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              {activeSound ? <Volume2 className="w-4 h-4 text-stone-500" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
              Volume
            </span>
            <span>{Math.round(volume * 100)}%</span>
          </div>

          <input
            id="ambient-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
          />

          {activeSound && (
            <button
              id="ambient-stop-all-btn"
              onClick={handleStopAll}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Mute & Stop Audio
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
