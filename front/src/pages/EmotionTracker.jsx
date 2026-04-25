import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Camera, Mic, Loader2, Video, StopCircle, Brain, RefreshCcw, Activity, Gamepad2, Sparkles } from 'lucide-react';
import api from '../lib/axios';
import { generateGame } from '../lib/gameEngine';
import useEmotionStore from '../store/useEmotionStore';
import useGameStore from '../store/useGameStore';

// Helper to convert Web Audio API AudioBuffer to WAV format
const audioBufferToWav = (buffer) => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const result = new ArrayBuffer(length);
  const view = new DataView(result);
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([result], { type: "audio/wav" });
};

// Map backend emotion names → engine lowercase keys
const EMOTION_MAP = {
  happy: 'happy', sad: 'sad', angry: 'angry',
  neutral: 'neutral', anxious: 'anxious', fear: 'anxious', surprise: 'happy',
  disgust: 'angry',
};

// Infer energy level from confidence score
const inferEnergy = (confidence = 0) => {
  if (confidence > 0.7) return 'high';
  if (confidence > 0.4) return 'medium';
  return 'low';
};

const EMOTION_EMOJIS = { sad:'😢', anxious:'😰', happy:'😊', angry:'😤', neutral:'😐' };
const DIFFICULTY_COLORS = { easy:'#10b981', medium:'#f59e0b', hard:'#ef4444' };

const EmotionTracker = () => {
  const navigate = useNavigate();
  const { setEmotion } = useEmotionStore();
  const { streak_days, past_sessions } = useGameStore();

  const [faceFile, setFaceFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [gameRec, setGameRec] = useState(null); // generated game recommendation

  // Advice & Safety State
  const [advice, setAdvice] = useState(null);
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [contactNotified, setContactNotified] = useState(false);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const faceInputRef = useRef(null);
  const voiceInputRef = useRef(null);

  // Preview URLs
  const [faceUrl, setFaceUrl] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState(null);

  useEffect(() => {
    if (faceFile) {
      const url = URL.createObjectURL(faceFile);
      setFaceUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFaceUrl(null);
    }
  }, [faceFile]);

  useEffect(() => {
    if (voiceFile) {
      const url = URL.createObjectURL(voiceFile);
      setVoiceUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVoiceUrl(null);
    }
  }, [voiceFile]);

  // Ensure video element gets the stream once it mounts
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [cameraActive, mediaStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [mediaStream, isRecording]);

  // --- Camera Functions ---
  const startCamera = async () => {
    setFaceFile(null); // Reset existing capture if any
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      setCameraActive(true);
    } catch (err) {
      setError("Camera access denied or unavailable.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      const file = new File([blob], "live_capture.jpg", { type: "image/jpeg" });
      setFaceFile(file);
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
  };

  // --- Audio Functions ---
  const startRecording = async () => {
    setVoiceFile(null); // Reset existing capture if any
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const wavBlob = audioBufferToWav(audioBuffer);
          const file = new File([wavBlob], "live_recording.wav", { type: "audio/wav" });
          setVoiceFile(file);
        } catch (err) {
          console.error("WAV conversion failed", err);
          const fallbackBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([fallbackBlob], "live_recording.webm", { type: "audio/webm" });
          setVoiceFile(file);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const renderAdviceContent = (adv) => {
    if (!adv) return null;
    if (typeof adv === 'string') return adv;
    
    // Attempt to extract intelligent fields if it is an object
    if (adv.items && Array.isArray(adv.items)) {
       return (
         <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
           {adv.items.map((item, i) => <li key={i}>{item}</li>)}
         </ul>
       );
    }
    return JSON.stringify(adv, null, 2);
  };

  // --- Analysis ---
  const handleAnalyze = async () => {
    if (!faceFile && !voiceFile) {
      setError("Please provide at least a photo or voice recording");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setAdvice(null);
    setGameRec(null);
    setContactNotified(false);

    try {
      const formData = new FormData();
      let endpoint = '';
      
      if (faceFile && voiceFile) {
        formData.append('face', faceFile);
        formData.append('voice', voiceFile);
        endpoint = '/emotion/all';
      } else if (faceFile) {
        formData.append('file', faceFile);
        endpoint = '/emotion/face';
      } else {
        formData.append('file', voiceFile);
        endpoint = '/emotion/voice';
      }

      // Feature: Unified Architecture. One single secure request returns the Analysis, AI Interventions, and automated Safety Pings!
      const res = await api.post(endpoint, formData);
      const unifiedData = res.data;
      
      setResult(unifiedData);
      setAdvice(unifiedData.advice || "No specific advice generated for this session.");

      // ── Persist detected emotion + generate game recommendation ──
      const rawEmotion = (unifiedData?.emotion?.state || 'neutral').toLowerCase();
      const mappedEmotion = EMOTION_MAP[rawEmotion] || 'neutral';
      const confidence    = unifiedData?.emotion?.confidence || 0;
      const energyLevel   = inferEnergy(confidence);
      setEmotion(mappedEmotion, energyLevel, 'focused', confidence);

      const spec = generateGame({
        emotion: mappedEmotion,
        energy_level: energyLevel,
        user_behavior: 'focused',
        streak_days,
        past_sessions: past_sessions.map((s) => ({ game_type: s.game_type || s.game_name, game_name: s.game_name })),
      });
      setGameRec(spec);

      if (unifiedData.contactNotified) {
         setContactNotified(unifiedData.contactNotified);
      }

    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelVideoCapture = () => {
    stopCamera();
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
      <div>
        <h1 className="text-2xl" style={{ fontWeight: '700' }}>Emotion Tracker</h1>
        <p className="text-muted mt-2">Capture a live photo, record your voice, or upload media to analyze your emotional state.</p>
      </div>

      {error && <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}

      <div className="flex gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        
        {/* Face Section */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: faceFile ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-center">
             <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera color="var(--accent-primary)" /> Facial Scan</h3>
             {faceFile && <span className="flex items-center gap-1" style={{color: 'var(--success)', fontSize: '0.875rem'}}>Ready</span>}
          </div>
          
          {cameraActive ? (
             <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '300px', display: 'block', objectFit: 'cover' }}></video>
               <div style={{ position: 'absolute', bottom: '1rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                 <button className="btn btn-primary" onClick={takePhoto} style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)' }}>Capture</button>
                 <button className="btn btn-secondary" onClick={cancelVideoCapture} style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.5)', border: 'none' }}>Cancel</button>
               </div>
               <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
             </div>
          ) : faceFile ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                 <img src={faceUrl} alt="Captured preview" style={{ width: '100%', maxHeight: '300px', display: 'block', objectFit: 'cover' }} />
               </div>
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="btn btn-secondary w-full" onClick={() => setFaceFile(null)}>
                   <RefreshCcw size={18} /> Choose Another
                 </button>
               </div>
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div 
                style={{ padding: '2rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'background 0.3s' }}
                onClick={() => faceInputRef.current?.click()}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <UploadCloud size={32} color="var(--text-secondary)" />
                <p className="text-sm text-muted" style={{textAlign: 'center'}}>Click to upload a photo</p>
                <input type="file" accept="image/*" ref={faceInputRef} style={{ display: 'none' }} onChange={(e) => setFaceFile(e.target.files[0])} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span className="text-xs text-muted" style={{fontWeight: 600}}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>

              <button className="btn btn-secondary w-full" onClick={startCamera}>
                <Video size={18} /> Open Camera
              </button>
            </div>
          )}
        </div>

        {/* Voice Section */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: voiceFile ? '1px solid var(--accent-secondary)' : '1px solid var(--border-color)' }}>
          <div className="flex justify-between items-center">
             <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mic color="var(--accent-secondary)" /> Voice Scan</h3>
             {voiceFile && <span className="flex items-center gap-1" style={{color: 'var(--success)', fontSize: '0.875rem'}}>Ready</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {voiceFile && !isRecording ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <audio controls src={voiceUrl} style={{ width: '100%', outline: 'none' }}></audio>
                 </div>
                 <button className="btn btn-secondary w-full" onClick={() => setVoiceFile(null)}>
                   <RefreshCcw size={18} /> Choose Another
                 </button>
               </div>
             ) : isRecording ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>
                     <div className="animate-pulse flex items-center gap-2">
                       <div style={{width: 12, height: 12, borderRadius: '50%', background: 'var(--error)'}}></div> Recording...
                     </div>
                   </div>
                   <button className="btn w-full" onClick={stopRecording} style={{ background: 'rgba(244, 63, 94, 0.2)', color: 'var(--error)', border: '1px solid rgba(244, 63, 94, 0.5)' }}>
                     <StopCircle size={18} /> Stop Recording
                   </button>
                 </div>
              ) : (
                <>
                 <div 
                    style={{ padding: '2rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'background 0.3s' }}
                    onClick={() => voiceInputRef.current?.click()}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <UploadCloud size={32} color="var(--text-secondary)" />
                    <p className="text-sm text-muted" style={{textAlign: 'center'}}>Click to upload an audio file</p>
                    <input type="file" accept="audio/*" ref={voiceInputRef} style={{ display: 'none' }} onChange={(e) => setVoiceFile(e.target.files[0])} />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span className="text-xs text-muted" style={{fontWeight: 600}}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                  </div>

                  <button className="btn btn-secondary w-full" onClick={startRecording}>
                    <Mic size={18} /> Start Live Recording
                  </button>
                </>
              )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button 
          className="btn btn-primary" 
          style={{ padding: '1rem 3rem', fontSize: '1.1rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)' }}
          onClick={handleAnalyze}
          disabled={loading || (!faceFile && !voiceFile)}
        >
          {loading ? (
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <Loader2 className="animate-spin" size={20}/> Analyzing Model...
            </div>
          ) : (
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <Brain size={20}/> Analyze Emotion
            </div>
          )}
        </button>
      </div>

      {/* --- Beautiful Result & Advice UI --- */}
      {result && (
        <div className="animate-fade-in flex-col gap-6" style={{ marginTop: '2rem', display: 'flex' }}>
          
          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: '0.2' }}></div>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '50%' }}>
                 <Activity color="var(--accent-primary)" />
              </div>
              Analysis Detailed Results
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <p className="text-muted" style={{ marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Dominant Emotion Detected</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }} dir="auto">
                  <span style={{ fontSize: '3rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textTransform: 'capitalize' }}>
                    {result?.emotion?.state || 'Unknown'}
                  </span>
                  {result?.emotion?.confidence && (
                    <span style={{ fontSize: '1.15rem', color: 'var(--success)', fontWeight: '600', padding: '0.25rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-full)' }}>
                      {(result.emotion.confidence * 100).toFixed(1)}% Artificial Match
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {contactNotified === 'success' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
               <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '50%' }}><Activity color="#ef4444" size={24} /></div>
               <div>
                 <strong style={{ display: 'block', color: '#ef4444', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Safety Alert Dispatched</strong>
                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>A professional automated email has just been dispatched to your trusted contact because a high stress emotion was cataloged.</span>
               </div>
            </div>
          )}

          {contactNotified === 'failed' && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem 1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
               <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '50%' }}><Activity color="#f59e0b" size={24} /></div>
               <div>
                 <strong style={{ display: 'block', color: '#f59e0b', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Safety Alert Could Not Be Sent</strong>
                 <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>We attempted to auto-notify your trusted contact about your high-stress state, but no configured/accepted contact was found on your account.</span>
               </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(236, 72, 153, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'var(--accent-secondary)', filter: 'blur(100px)', opacity: '0.15' }}></div>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '50%' }}>
                 <Brain color="var(--accent-secondary)" />
              </div>
              AI Recommendations & Advice
            </h2>

            {advice ? (
               <div dir="auto" style={{ lineHeight: '2.2', color: 'var(--text-primary)', fontSize: '1.1rem', background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', letterSpacing: '0.3px', fontWeight: '500' }}>
                 {renderAdviceContent(advice)}
               </div>
            ) : (
               <p className="text-muted">No specific advice generated for this session.</p>
            )}
          </div>

          {/* ── Game Recommendation Panel ── */}
          {gameRec && (
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.35)', position: 'relative', overflow: 'hidden' }}>
              {/* Background glow */}
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', background: '#8b5cf6', filter: 'blur(110px)', opacity: '0.15', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '180px', height: '180px', background: '#ec4899', filter: 'blur(100px)', opacity: '0.1', pointerEvents: 'none' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.15)', borderRadius: '50%' }}>
                  <Gamepad2 color="#a78bfa" size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Game Recommendation</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>Based on your detected emotional state</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{EMOTION_EMOJIS[result?.emotion?.state?.toLowerCase()] || '🎮'}</span>
                  <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', textTransform: 'capitalize', fontWeight: 600 }}>
                    {result?.emotion?.state || 'neutral'}
                  </span>
                </div>
              </div>

              {/* Game Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{gameRec.game_name}</span>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, color: DIFFICULTY_COLORS[gameRec.difficulty], background: `${DIFFICULTY_COLORS[gameRec.difficulty]}22`, border: `1px solid ${DIFFICULTY_COLORS[gameRec.difficulty]}44` }}>
                      {gameRec.difficulty}
                    </span>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                      ⏱ {gameRec.estimated_time}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{gameRec.goal}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                      +{gameRec.reward_system.xp}
                    </span>
                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}>
                      {gameRec.reward_system.bonus}
                    </span>
                  </div>
                </div>

                {/* Rules preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '160px' }}>
                  {gameRec.rules.slice(0, 3).map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#8b5cf6', flexShrink: 0 }}>▸</span> {rule}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  id="btn-play-game"
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: '180px', fontSize: '1rem', gap: '0.6rem' }}
                  onClick={() => navigate('/games')}
                >
                  <Gamepad2 size={18} /> Play Now →
                </button>
                <button
                  id="btn-analyze-again"
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '160px' }}
                  onClick={() => { setResult(null); setGameRec(null); setAdvice(null); }}
                >
                  <RefreshCcw size={18} /> Analyze Again
                </button>
              </div>

              {/* Motivational note */}
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  This game was selected specifically for your <strong style={{ color: '#c4b5fd' }}>{result?.emotion?.state || 'current'}</strong> mood.
                  Playing for just {gameRec.estimated_time} can meaningfully shift your emotional state.
                </span>
              </div>
            </div>
          )}


        </div>
      )}
    </div>
  );
};

export default EmotionTracker;
