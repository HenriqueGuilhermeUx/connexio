import { useCallback, useState } from 'react';

export function useManagerAudioTranscription(_purpose: 'MINUTES' | 'COMMAND') {
  const [transcribing] = useState(false);

  const start = useCallback(async () => {
    throw new Error('A gravação de voz no Android está temporariamente desativada nesta versão de estabilidade. Digite o relato da ata; a voz continua disponível na Web.');
  }, []);

  const stopAndTranscribe = useCallback(async () => {
    throw new Error('A gravação de voz no Android está temporariamente desativada nesta versão de estabilidade.');
  }, []);

  return {
    isRecording: false,
    durationMillis: 0,
    transcribing,
    start,
    stopAndTranscribe,
  };
}
