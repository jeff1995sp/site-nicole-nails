export const handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        const API_KEY = process.env.GEMINI_API_KEY; 

        if (!API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Chave da API não configurada nas variáveis de ambiente do Netlify." })
            };
        }

        // MUDANÇA AQUI: Trocámos "v1beta" por "v1" (versão estável) e o modelo voltou para gemini-1.5-flash
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { 
                    parts: [{ text: "Você é a assistente virtual inteligente do salão Nicole Nails. Especialidade: Unhas em Gel e Spa dos Pés. Respostas curtas, profissionais e fofas com emojis." }] 
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro da API Gemini:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || "Erro interno da API do Google." })
            };
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
