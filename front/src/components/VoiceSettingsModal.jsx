import React, { useEffect, useState } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import useVoiceStore from '../store/useVoiceStore';

const VoiceSettingsModal = ({ isOpen, onClose }) => {
  const { voiceSettings, fetchVoiceSettings, updateVoiceSettings, previewVoice } = useVoiceStore();
  const [form, setForm] = useState({
    preferredLanguage: 'egyptian_arabic',
    autoDetect: false,
    voiceStyle: 'warm',
    speed: 100,
  });
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [status, setStatus] = useState('');
  const previewAudioRef = React.useRef(new Audio());

  useEffect(() => {
    if (isOpen) {
      fetchVoiceSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (voiceSettings) {
      setForm({
        preferredLanguage: voiceSettings.preferredLanguage,
        autoDetect: voiceSettings.autoDetect,
        voiceStyle: voiceSettings.voiceStyle,
        speed: voiceSettings.speed,
      });
    }
  }, [voiceSettings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      await updateVoiceSettings(form);
      setStatus('Settings saved.');
    } catch (e) {
      setStatus('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const data = await previewVoice(form);
      if (data?.audioBase64) {
        previewAudioRef.current.src = `data:audio/mp3;base64,${data.audioBase64}`;
        await previewAudioRef.current.play();
      }
    } catch (e) {
      setStatus('Preview failed.');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="voice-settings-overlay" onClick={onClose}>
      <div className="voice-settings-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="voice-settings-header">
          <h2>Voice Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="voice-settings-body">
          <label className="voice-settings-label">
            Preferred language
            <select
              className="voice-settings-select"
              value={form.preferredLanguage}
              onChange={(e) =>
                setForm({
                  ...form,
                  preferredLanguage: e.target.value,
                  autoDetect: false,
                })
              }
            >
              <option value="egyptian_arabic">Egyptian Arabic (عربي مصري)</option>
              <option value="english">US English</option>
            </select>
          </label>

          <label className="voice-settings-toggle">
            <input
              type="checkbox"
              checked={form.autoDetect}
              onChange={(e) => setForm({ ...form, autoDetect: e.target.checked })}
            />
            <span>Auto-detect language from speech</span>
          </label>
          <p className="voice-settings-hint">
            {form.autoDetect
              ? 'When enabled, the companion may switch language based on how you speak.'
              : 'When off, the companion always listens and replies in your chosen language only.'}
          </p>

          <label className="voice-settings-label">
            Voice style
            <select
              className="voice-settings-select"
              value={form.voiceStyle}
              onChange={(e) => setForm({ ...form, voiceStyle: e.target.value })}
            >
              <option value="warm">Warm (female)</option>
              <option value="calm">Calm (male)</option>
            </select>
          </label>

          <label className="voice-settings-label">
            Speech speed: {form.speed}%
            <input
              type="range"
              min={80}
              max={120}
              step={5}
              value={form.speed}
              onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })}
              className="voice-settings-range"
            />
          </label>

          <button
            type="button"
            className="btn btn-secondary voice-preview-btn"
            onClick={handlePreview}
            disabled={previewing}
          >
            {previewing ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
            Preview voice
          </button>

          {status && <p className="voice-settings-status">{status}</p>}
        </div>

        <div className="voice-settings-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsModal;
