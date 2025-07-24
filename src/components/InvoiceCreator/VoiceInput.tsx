import { useEffect, useState, useRef } from 'react';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const appId = process.env.NEXT_PUBLIC_SPEECHLY_APP_ID!;
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

export default function VoiceInput({ onParseComplete }: { onParseComplete: (data: any) => void }) {
  const [isSecure, setIsSecure] = useState(false);
  const { transcript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const parserTimeout = useRef<NodeJS.Timeout | null>(null);

  // Security check
  useEffect(() => {
    setIsSecure(window.isSecureContext && navigator.mediaDevices);
  }, []);

  useEffect(() => {
    if (transcript) {
      if (parserTimeout.current) clearTimeout(parserTimeout.current);
      parserTimeout.current = setTimeout(() => parseTranscript(transcript), 1500);
    }
  }, [transcript]);

  const parseTranscript = (text: string) => {
    // Secure NLP parsing
    const parsed = {
      hours: extractNumber(text, /(\d+)\s*hours?/),
      rate: extractNumber(text, /\$?(\d+)\s?(?:per hour|\/hr)/),
      description: text.replace(/(\d+|\$|hour|hr)/gi, '').trim(),
    };
    
    onParseComplete(parsed);
  };

  const extractNumber = (text: string, regex: RegExp) => {
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 0;
  };

  if (!isSecure || !browserSupportsSpeechRecognition) {
    return <div className="text-red-500">Secure voice input unavailable</div>;
  }

  return (
    <div className="voice-input-container">
      <button 
        className={`mic-button ${listening ? 'listening' : ''}`}
        onClick={() => listening 
          ? SpeechRecognition.stopListening() 
          : SpeechRecognition.startListening({ continuous: true })
        }
      >
        {listening ? '🛑 Stop' : '🎤 Speak Invoice'}
      </button>
      <div className="transcript-box">{transcript}</div>
      <style jsx>{`
        .voice-input-container {
          border: 2px solid ${isSecure ? '#4ade80' : '#ef4444'};
          border-radius: 12px;
          padding: 1.5rem;
          background: #0f172a;
        }
        .mic-button.listening {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
      `}</style>
    </div>
  );
}