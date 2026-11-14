# Fundo com fotos do Instagram — Nicole Nails

## O que está pronto

O topo alterna fotos a cada 10 segundos, com transição suave, texto e botão preservados. Há um botão de pausa, respeito à preferência de movimento reduzido e interrupção das trocas quando a aba está escondida.

Sem conexão com a Meta, usa as cinco fotos locais existentes. Com a conexão, consulta as 12 publicações mais recentes e apresenta até 16 imagens, incluindo fotos dentro de carrosséis. No topo, Reels/vídeos com URL disponibilizada pela Meta tocam sem som, em trechos de até aproximadamente 10 segundos por slide. Na galeria aparecem as capas. Se o navegador bloquear reprodução ou a pessoa preferir movimento reduzido, fica a imagem. Stories não estão incluídos.

Consulta novas publicações a cada 5 minutos enquanto a página estiver aberta e visível. O cache também pode acrescentar alguns minutos: não é atualização instantânea. Em erro, mantém as imagens atuais ou o fundo original.

A galeria “Nossos Trabalhos” também usa a mesma consulta: mostra até oito fotos/capas recentes. As quatro fotos originais ficam como reserva até haver imagens válidas do Instagram. A galeria só é substituída depois do carregamento das novas fotos. As novas publicações são buscadas ao abrir a página e a cada cinco minutos com a aba visível, sujeito ao cache. Não é preciso editar o GitHub a cada postagem.

## 1. Enviar os arquivos para o GitHub

Extraia este ZIP. Na pasta principal do seu repositório, atualize:

- `index.html`
- `assets/elegance.css`
- `assets/instagram-hero.css`
- `assets/instagram-hero.js`
- `netlify/functions/instagram.mjs`

Mantenha as pastas e os demais arquivos existentes. Não envie só o ZIP e não crie uma pasta extra `site-nicole-nails-main` dentro do repositório. Confirme as alterações (Commit changes) e aguarde a publicação automática da Netlify.

Não é necessário substituir `admin.html`, `gemini.mjs` nem as imagens. Eles foram preservados neste pacote.

## 2. Autorizar o Instagram na Meta

Abra https://developers.facebook.com/ e crie/configure um aplicativo com a API do Instagram com Login do Instagram (Instagram API with Instagram Login).

Adicione a conta profissional da Nicole na configuração do Instagram. Se a Meta pedir convite de testador, aceite na conta da Nicole. Autorize a leitura de mídia com a permissão `instagram_business_basic`.

Obtenha o ID da conta profissional do Instagram e um token de acesso de longa duração para essa conta. Use o fluxo oficial de geração/troca de tokens; não use token de Página do Facebook para esta implementação. As opções exibidas dependem da configuração do aplicativo. Para usar outras contas sem função no app, a Meta pode exigir análise e acesso avançado.

Não envie o token por mensagem e não coloque no GitHub. A autorização real não foi executada neste pacote.

Documentação oficial:
https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/

## 3. Configurar a Netlify

No projeto, abra Project configuration → Environment variables. Cadastre para produção, com acesso às Functions (ou todos os escopos):

| Nome | Valor |
| --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | Token de longa duração da conta autorizada |
| `INSTAGRAM_USER_ID` | ID numérico da conta profissional, não o @ |
| `INSTAGRAM_API_VERSION` | `v27.0` (opcional; já é o padrão do código) |

Depois, faça um novo deploy para aplicar as variáveis. As funções estão no diretório padrão `netlify/functions`; se o projeto tiver uma configuração diferente, ajuste o diretório de Functions para essa pasta.

Tokens expiram ou podem ser revogados. Este pacote não renova nem armazena automaticamente novos tokens: renove pelo fluxo oficial antes do vencimento e atualize a variável na Netlify, fazendo novo deploy. Se desconectar, o site continuará com imagens de reserva; a integração precisará ser reautorizada.

Documentação Netlify:
https://docs.netlify.com/build/functions/environment-variables/

## 4. Conferir

Abra `https://SEU-SITE/.netlify/functions/instagram`:

- `items` com URLs: a consulta funcionou.
- `not_configured`: faltam token ou ID nas variáveis.
- `invalid_configuration`: confira o ID numérico e a versão.
- `instagram_unavailable`: confira autorização, validade do token, permissão e versão. Pode também ser falha temporária da Meta.
- Página 404: confirme que a função foi enviada na pasta certa e publicada.

Depois, abra a página inicial e espere as trocas. Teste também no celular e use o botão de pausa.

## Validação realizada

Sintaxe JavaScript validada e função testada com respostas simuladas (fotos, carrosséis, capas de Reels, ausência de configuração, feed vazio e falhas de rede/autorização). A página inicial e o formulário foram inspecionados visualmente em uma prévia de desktop. Nenhuma credencial real foi usada. A conexão com a conta, a reprodução de Reels reais e o fluxo completo de agendamento ainda precisam ser verificados no site publicado. Não foi realizado agendamento de teste nem alterado o banco de dados.

O visual público foi renovado com rosa antigo e marfim, botões em relevo, animações suaves e formulário com mais espaçamento. Foram adicionados o fundo, a galeria e a conexão de leitura com o Instagram. Não inclui música nem correções no agendamento, painel ou banco de dados existente.
