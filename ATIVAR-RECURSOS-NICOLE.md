# Novas funções Nicole Nails — prévia de testes

## Netlify / variáveis de ambiente (Functions)
- NICOLE_ADMIN_KEY: senha aleatória e exclusiva de pelo menos 24 caracteres. Não reutilizar a senha do HTML nem enviar ao GitHub.
- NICOLE_ENABLE_TRYON: true para ativar o provador. Padrão desligado, até verificar custos, limites e política de dados do Google.
- GEMINI_API_KEY: chave existente do Gemini. Precisa ter acesso ao modelo de imagens.
- GEMINI_IMAGE_MODEL: opcional, padrão gemini-2.5-flash-image.
- NICOLE_STORAGE_SCOPE: deixar ausente nas prévias. Usar production apenas no contexto Production do Netlify; nunca aplicar a todos os contextos. Configurações e lembretes novos usam Netlify Blobs separados. O Firebase antigo continua compartilhado com o site real.

## Limites e testes
- Testar a instalação de @netlify/blobs e as duas Functions após o deploy.
- A chave administrativa protege apenas as novas operações, não o admin antigo. Antes de publicar, corrigir autenticação do admin e regras do Firebase, que contém anamnese. Não usar fichas reais na prévia nem efetuar reservas fictícias.
- O provador envia foto para Gemini apenas com consentimento, sem gravação intencional no site. Conferir políticas de tratamento de dados e faturamento do Google. A simulação não garante resultado real.
- Clube removido a pedido; cartões desativados sem apagar registros anteriores.
- Agenda: datas fechadas, férias e horários filtram os horários retornados pelo Google no site. Não alteram eventos no calendário. A duração efetiva, intervalos e encaixes precisam de alteração no Google Apps Script original. Não liberar uma vaga que o Google não retornou.
- Valor do sinal: muda instrução e mensagens; o Pix existente não gera cobrança automática nem verifica pagamento. Conferir o valor no banco.
- Configurações de preços, imagens, música e avisos são carregadas ao abrir a página. Música exige clique; URLs devem ser HTTPS e autorizadas.
- Não publicar antes dos testes das novas funções, da segurança do Firebase e da agenda. Nenhuma credencial real foi usada nesta revisão.

## Lembretes de atendimento por Web Push
Gere um par VAPID em um computador com Node usando `npx web-push generate-vapid-keys`. Configure no Netlify (escopo Functions): NICOLE_VAPID_PUBLIC, NICOLE_VAPID_PRIVATE e NICOLE_VAPID_CONTACT (mailto:email oficial do studio). Nunca publique a chave privada no GitHub. Abra a prévia no celular, toque Ativar lembretes e Enviar teste; não é preciso reservar horário real. No iPhone, o navegador precisa oferecer Web Push, normalmente via aplicativo web na Tela de Início. O lembrete é solicitado após o retorno de sucesso do Google e enviado aproximadamente uma hora antes, em ciclos de cinco minutos na produção. A prévia não roda cron automaticamente; para testar um lembrete agendado, use Run now na função nicole-reminders. A entrega depende do navegador e do sistema operacional. Um dispositivo guarda um lembrete por vez. Desativar cancela o lembrete. Cancelamentos e reagendamentos realizados fora do dispositivo ainda não sincronizam automaticamente; a mensagem pede que a cliente confira se o horário está válido. Nenhum dado de saúde, telefone ou nome é armazenado pelo módulo push.
