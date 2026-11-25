# Novas funções Nicole Nails — prévia de testes

## Netlify / variáveis de ambiente (Functions)
- NICOLE_ADMIN_KEY: senha aleatória e exclusiva de pelo menos 24 caracteres. Não reutilizar a senha do HTML nem enviar ao GitHub.
- NICOLE_ENABLE_TRYON: true para ativar o provador. Padrão desligado, até verificar custos, limites e política de dados do Google.
- GEMINI_API_KEY: chave existente do Gemini. Precisa ter acesso ao modelo de imagens.
- GEMINI_IMAGE_MODEL: opcional, padrão gemini-2.5-flash-image.
- NICOLE_STORAGE_SCOPE: deixar ausente nas prévias. Usar production apenas no contexto Production do Netlify; nunca aplicar a todos os contextos. Configurações e cartões novos usam Netlify Blobs separados. O Firebase antigo continua compartilhado com o site real.

## Limites e testes
- Testar a instalação de @netlify/blobs e as duas Functions após o deploy.
- A chave administrativa protege apenas as novas operações, não o admin antigo. Antes de publicar, corrigir autenticação do admin e regras do Firebase, que contém anamnese. Não usar fichas reais na prévia nem efetuar reservas fictícias.
- O provador envia foto para Gemini apenas com consentimento, sem gravação intencional no site. Conferir políticas de tratamento de dados e faturamento do Google. A simulação não garante resultado real.
- Clube: emissão por código aleatório na ficha. Indicações e aniversário são confirmados manualmente pela profissional. Pontos por visitas reais são atualizados no checkout quando a chave administrativa está ativa na sessão e há cartão emitido. Caso contrário, atualizar na ficha. Não há resgate automático de recompensas.
- Agenda: datas fechadas, férias e horários filtram os horários retornados pelo Google no site. Não alteram eventos no calendário. A duração efetiva, intervalos e encaixes precisam de alteração no Google Apps Script original. Não liberar uma vaga que o Google não retornou.
- Valor do sinal: muda instrução e mensagens; o Pix existente não gera cobrança automática nem verifica pagamento. Conferir o valor no banco.
- Configurações de preços, imagens, música e avisos são carregadas ao abrir a página. Música exige clique; URLs devem ser HTTPS e autorizadas.
- Não publicar antes dos testes das novas funções, da segurança do Firebase e da agenda. Nenhuma credencial real foi usada nesta revisão.
