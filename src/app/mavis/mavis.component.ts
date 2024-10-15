import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import OpenAI from "openai";

@Component({
    selector: 'app-mavis',
    standalone: true,
    imports: [
        MatButtonModule, MatSnackBarModule, MatCardModule, 
        CommonModule, FormsModule, MatIconModule],
    templateUrl: './mavis.component.html',
    styleUrl: './mavis.component.css'
})

export class MavisComponent {
    showChat = false;  // Controla a visibilidade do chat
    messages: string[] = [];  // Armazena as mensagens enviadas
    newMessage = '';  // Armazena a nova mensagem a ser enviada
    recognizing = false;  // Controla se a API de reconhecimento de voz está ativa


    // Inicialize a API de reconhecimento de fala
    recognition: any;

    constructor() {
        // Verifique se a API de reconhecimento de fala está disponível no navegador
        const SpeechRecognition = (window as any).SpeechRecognition ||
         (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'pt-BR';  // Defina o idioma para português (Brasil)

            // Ações ao reconhecer a fala
            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                this.newMessage = transcript;  // Coloca a fala reconhecida no campo de entrada
                this.recognizing = false;
            };

            this.recognition.onstart = () => {
                this.recognizing = true;
            };

            this.recognition.onend = () => {
                this.recognizing = false;
            };

            this.recognition.onerror = (event: any) => {
                console.error('Erro no reconhecimento de fala: ', event.error);
                this.recognizing = false;
            };
        } else {
            console.error('Reconhecimento de fala não suportado no navegador.');
        }
    }

    toggleChat() {
        this.showChat = !this.showChat;  // Alterna a visibilidade do chat
    }

    sendMessage() {
        if (this.newMessage.trim()) {
            this.messages.push(this.newMessage);  // Adiciona a nova mensagem ao array de mensagens
            this.newMessage = '';  // Limpa o campo de entrada
        }
    }

    // Função que verifica se o input está vazio ou não
    isMessageEmpty() {
        return this.newMessage.trim().length === 0;
    }

    // Inicia o reconhecimento de fala
    startVoiceRecognition() {
        if (!this.recognizing) {
            this.recognition.start();
        }
    }
}