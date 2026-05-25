import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Settings } from 'lucide-react';
import api from '../lib/axios';
import useVoiceStore from '../store/useVoiceStore';
import useSubscriptionStore from '../store/useSubscriptionStore';
import VoiceSettingsModal from '../components/VoiceSettingsModal';
import '../styles/voiceCompanion.css';

const VoiceCompanion = () => {
  const { status, session, messages, remainingMinutes, error, startSession, sendMessage, endSession, clearSession, fetchVoiceSettings } = useVoiceStore();
  const { checkQuota } = useSubscriptionStore();

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [summary, setSummary] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        const quota = await checkQuota();
        if (quota?.remainingMinutes != null) {
          useVoiceStore.setState({ remainingMinutes: quota.remainingMinutes });
        }
      } catch {
        /* quota check optional on mount */
      }
      fetchVoiceSettings().catch(() => {});
    };
    load();
    return () => {
      audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.audioBase64) {
      playBase64Audio(lastMsg.audioBase64);
    }
  }, [messages]);

  const playBase64Audio = (base64) => {
    try {
      const audioUrl = `data:audio/mp3;base64,${base64}`;
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (e) {
      console.error('Failed to play audio', e);
    }
  };

  const handleStartSession = async () => {
    try {
      await fetchVoiceSettings();
      await startSession('Neutral');
      const quota = await checkQuota();
      if (quota?.remainingMinutes != null) {
        useVoiceStore.setState({ remainingMinutes: quota.remainingMinutes });
      }
    } catch (e) {
      if (e.response?.status !== 402) {
        alert(e.response?.data?.message || 'Failed to start session.');
      }
    }
  };

  const startRecording = async () => {
    try {
      audioRef.current.pause();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        try {
          await sendMessage(audioBlob, 'Neutral');
          const quota = await checkQuota();
          if (quota?.remainingMinutes != null) {
            useVoiceStore.setState({ remainingMinutes: quota.remainingMinutes });
          }
        } catch (err) {
          if (err.response?.status !== 402) {
            console.error('Voice message error', err);
          }
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      chunksRef.current = [];
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied', err);
      alert('Microphone access is required.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleEndSession = async () => {
    try {
      const sum = await endSession();
      setSummary(sum);
    } catch (e) {
      console.error('End session error', e);
    }
  };

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const lastAsstMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="voice-companion-container animate-fade-in">
      <div className="voice-top-bar">
        <div className="stat-badge">Remaining: {remainingMinutes.toFixed(1)} mins</div>
        <button
          type="button"
          className="icon-btn voice-settings-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Voice settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="voice-orb-container">
        <div className="ripple"></div>
        <div className="ripple"></div>
        <div className="ripple"></div>
        <div className={`voice-orb ${status === 'active' && !isRecording ? 'active' : ''} ${status === 'processing' ? 'processing' : ''}`} />
      </div>

      <div className="status-text">
        {status === 'idle' && 'Ready to talk'}
        {status === 'starting' && 'Connecting...'}
        {status === 'active' && !isRecording && 'Listening'}
        {status === 'processing' && 'Thinking...'}
        {status === 'quota_exceeded' && 'Weekly quota reached'}
        {isRecording && 'Recording...'}
      </div>

      {(status === 'quota_exceeded' || status === 'error') && error && (
        <div className="voice-quota-banner glass-panel">
          <p>{error}</p>
          <div className="flex gap-2 justify-center mt-2" style={{ flexWrap: 'wrap' }}>
            {status === 'quota_exceeded' && session && (
              <button type="button" className="btn btn-secondary" onClick={handleEndSession}>
                End session
              </button>
            )}
            {status === 'quota_exceeded' && !session && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await api.post('/v1/voice/subscription/reset');
                    useVoiceStore.setState({ status: 'idle', error: null });
                    const quota = await checkQuota();
                    if (quota?.remainingMinutes != null) {
                      useVoiceStore.setState({ remainingMinutes: quota.remainingMinutes });
                    }
                  } catch {
                    alert('Could not reset usage. Restart the backend with NODE_ENV=development.');
                  }
                }}
              >
                Reset usage (dev)
              </button>
            )}
          </div>
        </div>
      )}

      <div className="voice-controls">
        {status === 'idle' ? (
          <button className="btn btn-primary" onClick={handleStartSession}>
            <Mic size={20} /> Start Session
          </button>
        ) : (
          <>
            <button
              className={`control-btn record ${isRecording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={status === 'processing' || status === 'ending' || status === 'quota_exceeded'}
            >
              <Mic size={24} />
            </button>
            <button
              className="control-btn"
              onClick={handleEndSession}
              disabled={status === 'processing' || status === 'ending'}
            >
              <Square size={24} />
            </button>
          </>
        )}
      </div>

      {status !== 'idle' && (
        <div className="text-center mt-4 text-sm text-muted">Hold microphone button to speak</div>
      )}

      {(lastUserMsg || lastAsstMsg) && status !== 'idle' && (
        <div className="transcript-box glass-panel mt-6">
          {lastUserMsg && <div className="text-muted mb-2">You: &quot;{lastUserMsg.content}&quot;</div>}
          {lastAsstMsg && <div className="text-primary">Companion: &quot;{lastAsstMsg.content}&quot;</div>}
        </div>
      )}

      {summary && status === 'ended' && (
        <div className="summary-modal">
          <div className="summary-content">
            <h2 className="text-2xl font-bold mb-4">Session Summary</h2>
            <div className="flex-col gap-4">
              <div>
                <span className="text-muted">Emotion Shift:</span> {summary.emotion_change}
              </div>
              <div>
                <span className="text-muted">Engagement Score:</span> {summary.score}/100
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-accent-primary">Insights:</h4>
                <ul className="list-disc pl-5 mt-2">
                  {summary.insights?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              className="btn btn-primary w-full mt-6"
              onClick={() => {
                setSummary(null);
                clearSession();
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <VoiceSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default VoiceCompanion;
