export const handler = async function(event, context) {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    
    try {
        if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: "Sem conteúdo." }) };
        
        const body = JSON.parse(event.body);
        const prompt = body.prompt;
        
        if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: "Prompt vazio." }) };

        const API_KEY = process.env.GEMINI_API_KEY;
        if (!API_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Chave ausente no Netlify." }) };

        // 1. Ordem de prioridade dos modelos REAIS e ativos da Google
        const modelos = ["gemini-1.5-flash", "gemini-1.5-pro"];
        
        // 2. Configurações de retentativa
        const maxTentativasPorModelo = 2; // Tenta a 1ª vez e faz até 2 repetições se der erro 503
        const tempoEsperaBase = 1500; // Começa por esperar 1.5 segundos

        // Função auxiliar para pausar a execução (espera progressiva)
        const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 3. Loop principal: Testa um modelo de cada vez
        for (const modelo of modelos) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

            // Loop de tentativas para o modelo atual
            for (let tentativa = 0; tentativa <= maxTentativasPorModelo; tentativa++) {
                try {
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": API_KEY // Chave enviada de forma segura
                        },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{ 
                                    // Instrução melhorada para não cortar frases
                                    text: "Você é a assistente virtual oficial do salão Nicole Nails. Responda em português do Brasil. Seja educada, simpática, profissional. Especialidade: Unhas em Gel e Spa dos Pés. Não invente preços ou horários que não sabe. Regra de Ouro: NUNCA deixe frases pela metade ou incompletas, termine sempre a sua explicação de forma clara e natural." 
                                }]
                            },
                            contents: [{ 
                                role: "user", 
                                parts: [{ text: prompt }] 
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                // O LIMITE AUMENTADO PARA 1000 (evita que a frase seja cortada a meio)
                                maxOutputTokens: 1000 
                            }
                        })
                    });

                    const data = await response.json();

                    // Se a resposta for um SUCESSO (200 OK)
                    if (response.ok) {
                        // Junta as partes do texto para evitar cortes na leitura
                        const partes = data?.candidates?.[0]?.content?.parts || [];
                        const text = partes.map(p => p.text || "").join("").trim();

                        if (!text) {
                            return { statusCode: 502, body: JSON.stringify({ error: "O Gemini não retornou texto." }) };
                        }
                        
                        // Retorna a resposta para o utilizador e TERMINA a função
                        return {
                            statusCode: 200,
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ success: true, text: text })
                        };
                    }

                    // Se for erro 503 (Ocupado) ou 429 (Muitos Pedidos), faz a espera progressiva e tenta de novo
                    if (response.status === 503 || response.status === 429) {
                        console.warn(`[${modelo}] Tentativa ${tentativa + 1} falhou (Ocupado). Status: ${response.status}.`);
                        
                        if (tentativa < maxTentativasPorModelo) {
                            const tempo = tempoEsperaBase * Math.pow(2, tentativa); 
                            console.log(`Esperando ${tempo}ms antes de tentar novamente...`);
                            await esperar(tempo);
                            continue; 
                        } else {
                            console.warn(`[${modelo}] Esgotou as tentativas. A avançar para o próximo modelo.`);
                            break; 
                        }
                    }

                    // Se for erro 404 (Modelo não encontrado), passa diretamente para o próximo
                    if (response.status === 404) {
                        console.warn(`[${modelo}] Modelo não encontrado (404). A testar a versão anterior...`);
                        break; 
                    } 
                    
                    // Outro erro fatal
                    console.error(`Erro fatal da API Gemini no modelo ${modelo}:`, data);
                    return { statusCode: response.status, body: JSON.stringify({ error: data?.error?.message || "Erro interno da API." }) };

                } catch (fetchError) {
                    console.error(`Falha de comunicação de rede no modelo ${modelo}:`, fetchError);
                    if (tentativa < maxTentativasPorModelo) {
                        await esperar(tempoEsperaBase * Math.pow(2, tentativa));
                    } else {
                        break; 
                    }
                }
            }
        }

        // Se falhou tudo
        return {
            statusCode: 503,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Todos os modelos de IA estão superlotados neste momento. Tente novamente mais tarde." })
        };

    } catch (error) {
        console.error("Falha na Netlify Function:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message || "Erro no servidor interno." })
        };
    }
};
