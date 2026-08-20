import { supabase } from '@/lib/supabase';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useState } from 'react';

export function useManagerAudioTranscription(purpose: 'MINUTES' | 'COMMAND') {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [transcribing, setTranscribing] = useState(false);

  const start = useCallback(async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) throw new Error('Permissão do microfone não concedida. Libere o microfone nas configurações do aparelho.');

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const stopAndTranscribe = useCallback(async () => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    const uri = recorder.uri;
    if (!uri) throw new Error('A gravação terminou sem gerar um arquivo de áudio.');

    setTranscribing(true);
    try {
      if (!supabase) throw new Error('Supabase não configurado.');
      const response = await fetch(uri);
      const blob = await response.blob();
      if (!blob.size) throw new Error('O áudio gravado está vazio.');

      const { data, error } = await supabase.functions.invoke('transcribe-manager-audio', {
        body: blob,
        headers: {
          'content-type': blob.type || 'audio/mp4',
          'x-audio-purpose': purpose,
          'x-audio-name': purpose === 'MINUTES' ? 'ata.m4a' : 'comando.m4a',
          'x-audio-language': 'pt-BR',
        },
      });
      if (error) throw error;
      const text = String(data?.text ?? data?.transcript ?? '').trim();
      if (!text) throw new Error('O motor de voz não retornou transcrição.');
      return text;
    } finally {
      setTranscribing(false);
    }
  }, [purpose, recorder]);

  return {
    isRecording: recorderState.isRecording,
    durationMillis: recorderState.durationMillis ?? 0,
    transcribing,
    start,
    stopAndTranscribe,
  };
}
