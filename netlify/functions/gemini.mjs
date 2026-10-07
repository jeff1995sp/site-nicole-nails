export const handler = async function(event, context) {
    // 1. Bloqueia qualquer método que não seja POST (ex: acessos diretos pelo navegador)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        
        // 2. Captura a chave de API do ambiente do Netlify
        const API_KEY = process.env.GEMINI_API_KEY; 

        if (!API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Chave da API não configurada nas variáveis de ambiente do Netlify." })
            };
        }

        // 3. O URL exato sem duplicar a palavra "models/" (causa comum do erro 404)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // 4. Chamada direta (fetch) à API do Google
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // NOTA: Em requisições fetch diretas, o correto é system_instruction com sublinhado
                system_instruction: { 
                    parts: [{ text: "Você é a assistente virtual inteligente do salão Nicole Nails. Especialidade: Unhas em Gel e Spa dos Pés. Respostas curtas, profissionais e fofas com emojis." }] 
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // 5. Tratamento de erros detalhado caso o Google rejeite o pedido
        if (!response.ok) {
            console.error("Erro da API Gemini:", data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || "Erro interno da API do Google." })
            };
        }

        // 6. Retorna o sucesso para o frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        // 7. Captura de erros gerais do servidor/código
        console.error("Falha no Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
