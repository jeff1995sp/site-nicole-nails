export const handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        
        // 1. Capturando a chave diretamente das variáveis de ambiente do Netlify
        const API_KEY = process.env.GEMINI_API_KEY; 

        if (!API_KEY) {
            throw new Error("Chave da API não configurada nas variáveis de ambiente.");
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // 2. Corrigido para 'systemInstruction'
                systemInstruction: { 
                    parts: [{ text: "Você é a assistente virtual inteligente do salão Nicole Nails. Especialidade: Unhas em Gel e Spa dos Pés. Respostas curtas, profissionais e fofas com emojis." }] 
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Repassa o erro detalhado da API para ajudar na depuração, caso a requisição falhe
        if (!response.ok) {
            console.error("Erro interno do Gemini:", data);
            throw new Error(data.error?.message || "Erro desconhecido da API");
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error("Falha no Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
