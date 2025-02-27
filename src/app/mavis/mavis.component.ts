import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
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
    messages: string[] = []; // Armazena as mensagens
    newMessage: string = ''; // Input da mensagem


    showChat = false;  // Controla a visibilidade do chat
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
            this.recognition.start();
            this.recognition.continuous = true; // Para cada comando, precisa reiniciar o reconhecimento
            this.recognition.interimResults = false;

            // Ações ao reconhecer a fala
            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                if (transcript.toLowerCase() == 'abra') {
                    console.log(transcript.toLowerCase())
                    this.showChat = true; // Abre o chat
                } else {
                    this.messages.push(`Você: ${transcript}`);
                }
                this.newMessage = transcript;  // Coloca a fala reconhecida no campo de entrada
                this.recognizing = true;
            };

            // this.recognition.onstart = () => {
            //     this.recognizing = true;
            // };

            // this.recognition.onend = () => {
            //     this.recognizing = false;
            // };

            // this.recognition.onerror = (event: any) => {
            //     console.error('Erro no reconhecimento de fala: ', event.error);
            //     this.recognizing = false;
            // };
        } else {
            console.error('Reconhecimento de fala não suportado no navegador.');
        }

    }

    // Método para enviar a mensagem
    sendMessage() {
        if (this.newMessage.trim() !== '') {
            this.messages.push(`Você: ${this.newMessage}`);
            this.newMessage = ''; // Limpa o input
            setTimeout(() => this.scrollToBottom(), 100); // Garante que role para a última mensagem
        }
    }

    // Permite enviar com "Enter"
    handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    // Rola para a última mensagem
    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    toggleChat() {
        console.log(this.showChat)
        this.showChat = !this.showChat;
        // this.showChat = !this.showChat;  // Alterna a visibilidade do chat
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