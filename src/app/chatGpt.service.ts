import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatgptService {
    private apiUrl = 'https://api.openai.com/v1/chat/completions';
    private apiKey = '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'; // Substitua pela sua chave da OpenAI

    constructor(private http: HttpClient) { }

    // Função para enviar a mensagem para a API do ChatGPT
    sendMessage(prompt: string): Observable<any> {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        });

        const body = {
            model: 'gpt-3.5-turbo', // ou 'gpt-4' se tiver acesso
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 20,
        };

        return this.http.post(this.apiUrl, body, { headers });
    }
}
