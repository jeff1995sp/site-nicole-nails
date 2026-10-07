export const handler = async function(event, context) {
    // Aceita somente POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: "Method Not Allowed"
            })
        };
    }

    try {
        // Verifica se veio um body
        if (!event.body) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "Nenhum conteúdo foi enviado."
                })
            };
        }

        const body = JSON.parse(event.body);
        const prompt = body.prompt;

        // Verifica o prompt
        if (!prompt || typeof prompt !== "string") {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "O campo 'prompt' é obrigatório."
                })
            };
        }

        // Pega a chave configurada no Netlify
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            console.error("GEMINI_API_KEY não encontrada.");

            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "A chave GEMINI_API_KEY não está configurada no Netlify."
                })
            };
        }

        /*
         * MODELO ATUAL
         *
         * Gemini 3.8 Flash
         */
        const MODEL = "gemini-3.8-flash";

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": API_KEY
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [
                        {
                            text: `
Você é a assistente virtual oficial do salão Nicole Nails.

Seu atendimento deve ser:

- Em português do Brasil.
- Educado, simpático e profissional.
- Respostas curtas e fáceis de entender.
- Use emojis com moderação.
- Especialidade do salão: Unhas em Gel e Spa dos Pés.
- Nunca invente preços, horários, promoções ou informações que não estejam disponíveis.
- Quando não souber alguma informação, diga claramente que precisa confirmar.
- Ajude a cliente a entender os serviços e, quando apropriado, incentive o agendamento.
- Não responda assuntos que não tenham relação com o atendimento do salão.
`
                        }
                    ]
                },

                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],

                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300
                }
            })
        });

        const data = await response.json();

        // Log completo para facilitar diagnóstico
        console.log("Status Gemini:", response.status);

        if (!response.ok) {
            console.error("Erro retornado pelo Gemini:", JSON.stringify(data, null, 2));

            return {
                statusCode: response.status,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error:
                        data?.error?.message ||
                        "A API do Gemini retornou um erro.",
                    status:
                        data?.error?.status || "UNKNOWN"
                })
            };
        }

        // Verifica se veio uma resposta válida
        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!text) {
            console.error(
                "Gemini respondeu sem texto:",
                JSON.stringify(data, null, 2)
            );

            return {
                statusCode: 502,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    error: "O Gemini respondeu, mas não retornou texto."
                })
            };
        }

        /*
         * Retorna a resposta completa.
         *
         * Mantemos também "text" para facilitar o frontend.
         */
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                text: text,
                data: data
            })
        };

    } catch (error) {
        console.error("Falha na Netlify Function:", error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: error?.message || "Erro interno do servidor."
            })
        };
    }
};
