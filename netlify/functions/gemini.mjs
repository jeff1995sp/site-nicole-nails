export const handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    
    try {
        if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "Sem conteúdo." }) };
        
        const body = JSON.parse(event.body);
        const prompt = body.prompt;
        
        if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: "Prompt vazio." }) };

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Chave ausente no Netlify." }) };

        // O modelo oficial e real da Google (o 3.8 não existe e causou o travamento)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ 
                        text: "Você é a assistente virtual oficial do salão Nicole Nails. Responda em português do Brasil. Seja educada, simpática, profissional e use respostas curtas. Especialidade: Unhas em Gel e Spa dos Pés. Não invente preços ou horários que não sabe." 
                    }]
                },
                contents: [{ 
                    role: "user", 
                    parts: [{ text: prompt }] 
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro da API Gemini:", data);
            return { statusCode: response.status, body: JSON.stringify({ error: data?.error?.message || "Erro interno da API do Google." }) };
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!text) {
            return { statusCode: 502, body: JSON.stringify({ error: "O Gemini não retornou texto." }) };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, text: text })
        };

    } catch (error) {
        console.error("Falha na Netlify Function:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message || "Erro no servidor." })
        };
    }
};
