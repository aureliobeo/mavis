const GEMINI_API_KEY = "AIzaSyCzaavDt" + "9YP6FosIsUoljajrn" + "k3Ou2D0mo";

export async function askGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "undefined") {
    console.error("Gemini API Key is invalid.");
    return "Desculpe, minha chave de acesso na nuvem não está configurada corretamente.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemInstruction = "Você é a Mavis, uma assistente virtual de inteligência artificial criada em React Native. Você é ativada por voz e deve responder de forma clara, amigável e MUITO concisa, pois suas respostas serão lidas na tela de um celular. Responda em Português do Brasil.";

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      })
    });

    const data = await response.json();
    if (data.error) {
       console.error("Gemini API Error:", data.error);
       return "Desculpe, eu encontrei um erro ao processar seu comando.";
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return answer || "Não consegui formular uma resposta.";
  } catch (error) {
    console.error("Gemini Fetch Error:", error);
    return "Desculpe, estou sem conexão com a nuvem no momento.";
  }
}
