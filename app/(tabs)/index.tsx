import { Image } from 'expo-image';
import { StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { PorcupineManager } from '@picovoice/porcupine-react-native';
import * as Speech from 'expo-speech';
import { askGemini } from '../services/gemini';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const [isListening, setIsListening] = useState(false);
  const [isPorcupineListening, setIsPorcupineListening] = useState(false);
  const [text, setText] = useState('');
  const [uiStatus, setUiStatus] = useState('');
  const [isManualMode, setIsManualMode] = React.useState(false);
  
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const porcupineManager = useRef<PorcupineManager | null>(null);
  const transcriptRef = useRef<string>('');

  const ACCESS_KEY = "hVL5/vYCoZgtwQUmMtAq+JmvbaOjihi+xVQGm5OAxxVMAWM18kqXTQ==";

  const resumePorcupine = async () => {
    try {
      await porcupineManager.current?.start();
      setIsPorcupineListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  useSpeechRecognitionEvent('end', async () => {
    setIsListening(false);
    setUiStatus('');
    resumePorcupine(); // Religa o motor offline de escuta
    
    const finalSpeech = transcriptRef.current.trim();
    
    if (isManualMode && finalSpeech.length > 0) {
      setIsManualMode(false);
      setIsThinking(true);
      setAiResponse('');
      transcriptRef.current = ''; 
      
      try {
        const answer = await askGemini(finalSpeech);
        setAiResponse(answer);
        
        // --- TEXT-TO-SPEECH (Mavis fala) ---
        // Desligamos o microfone enquanto ela dita o texto para não se auto-ouvir.
        try {
          await porcupineManager.current?.stop();
          setIsPorcupineListening(false);
        } catch (e) {}

        Speech.speak(answer, {
          language: 'pt-BR',
          rate: 1.0,
          onDone: () => {
             // Terminou de falar, volta a escutar a palavra mágica
             resumePorcupine();
          },
          onError: () => {
             resumePorcupine();
          }
        });
        // ------------------------------------

      } catch (err) {
        setAiResponse('Desculpe, ocorreu um erro na rede com a nuvem do Google.');
        resumePorcupine();
      } finally {
        setIsThinking(false);
      }
    } else if (isManualMode) {
      // Se não ouviu nada, reseta o modo
      setIsManualMode(false);
      setText('');
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setText(transcript);
      transcriptRef.current = transcript; // Atualiza a Ref para a função 'end' enxergar a frase verdadeira
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    console.log('Error:', event.error, 'Message:', event.message);
    setIsListening(false);
    setUiStatus('Erro no microfone. Tente novamente.');
    resumePorcupine(); // Em caso de erro, também devolvemos o microfone
  });

  useEffect(() => {
    const initPorcupine = async () => {
      try {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!result.granted) return;

        porcupineManager.current = await PorcupineManager.fromKeywordPaths(
          ACCESS_KEY,
          ['Mavis.ppn'],
          (keywordIndex) => {
            if (keywordIndex === 0) {
              // Quando Porcupine ouvir "Mavis", liga a gravação real para enviar pro Gemini
              triggerManualMode();
            }
          }
        );
        await porcupineManager.current.start();
        setIsPorcupineListening(true);
      } catch (e: any) {
        console.error('Porcupine Error: ', e);
        Alert.alert('Erro no Porcupine', e.message || 'Falha ao iniciar motor offline');
      }
    };

    initPorcupine();

    return () => {
      porcupineManager.current?.stop();
      porcupineManager.current?.delete();
    };
  }, []);

  const triggerManualMode = async () => {
    setIsManualMode(true);
    setUiStatus('🟢 Mavis ouvindo o seu comando...');
    setText('');
    transcriptRef.current = '';
    setAiResponse('');
    
    // No Android, apenas UM motor pode usar o microfone.
    // Precisamos deitar o Porcupine para o Speech Recognition acordar.
    try {
      await porcupineManager.current?.stop();
      setIsPorcupineListening(false);
    } catch (e) {}

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) return;
      
      ExpoSpeechRecognitionModule.start({ lang: 'pt-BR', continuous: false, interimResults: true });
    } catch (e: any) {
      console.error(e);
      setIsListening(false);
      resumePorcupine();
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Mavis UI</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Comando de Voz</ThemedText>
        <ThemedText>
          1. Wake Word Offline: Diga "Mavis", espere 1 segundo, e dite seu comando para o Gemini.
          2. Manual: Aperte o botão e grave o comando diretamente com a API.
        </ThemedText>
        <Button 
          title={isManualMode ? 'Aguardando o seu comando...' : 'Acionar Mavis Manualmente 15'} 
          onPress={triggerManualMode}
          color={isManualMode ? 'green' : 'blue'}
        />
        <ThemedText style={{ marginTop: 10, fontSize: 12, color: 'gray' }}>
          Motor Offline (Porcupine): {isPorcupineListening ? 'Ligado ✅' : 'Desligado / Conectando... ⏳'}
        </ThemedText>
        
        {uiStatus ? (
          <ThemedText style={{ marginTop: 10, color: 'green', fontWeight: 'bold' }}>
            {uiStatus}
          </ThemedText>
        ) : null}

        <ThemedText style={{ marginTop: 10 }}>
          {text ? `Comando Dito: ${text}` : ''}
        </ThemedText>
        
        {isThinking && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />}
        
        {aiResponse ? (
          <ThemedView style={{ marginTop: 20, padding: 15, backgroundColor: '#e8f4f8', borderRadius: 8 }}>
            <ThemedText style={{ color: '#005b9f', fontWeight: 'bold' }}>✨ Mavis responde:</ThemedText>
            <ThemedText style={{ marginTop: 5, color: '#333' }}>{aiResponse}</ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
