# 🚀 Guia Rápido de Deploy e Comandos

## 📦 Instalação

```powershell
# 1. Instalar todas as dependências
npm install

# 2. Verificar vulnerabilidades
npm audit

# 3. Corrigir vulnerabilidades (se houver)
npm audit fix
```

## 🔧 Desenvolvimento Local

```powershell
# Executar em modo desenvolvimento (com auto-reload)
npm run dev

# Executar em modo produção
npm start

# Acessar localmente
# http://localhost:3002
```

## 🌐 Deploy no Render

### Primeira vez:
1. Faça commit das alterações:
```powershell
git add .
git commit -m "feat: melhorias de SEO e segurança v2.0"
git push origin main
```

2. No painel do Render (https://dashboard.render.com):
   - Verifique se o deploy foi iniciado automaticamente
   - Configure as variáveis de ambiente:
     - `MONGODB_URI`
     - `FORMSPREE_URL`
     - `PORT` (opcional, padrão 3002)
     - `NODE_ENV=production`

### Atualizações futuras:
```powershell
git add .
git commit -m "sua mensagem de commit"
git push origin main
# Deploy automático no Render!
```

## 🔍 Google Search Console Setup

### Passo 1: Adicionar Propriedade
1. Acesse: https://search.google.com/search-console
2. Clique em "Adicionar propriedade"
3. Escolha "Prefixo do URL"
4. Digite: `https://portfolio-yg0y.onrender.com/`

### Passo 2: Verificar Propriedade
Método recomendado: Tag HTML
1. Copie a meta tag fornecida pelo Google
2. Adicione no `<head>` do index.html:
```html
<meta name="google-site-verification" content="SEU_CODIGO_AQUI" />
```
3. Faça deploy
4. Clique em "Verificar" no Search Console

### Passo 3: Enviar Sitemap
1. No Search Console, vá em "Sitemaps"
2. Adicione: `https://portfolio-yg0y.onrender.com/sitemap.xml`
3. Clique em "Enviar"

### Passo 4: Solicitar Indexação
1. Use a ferramenta "Inspeção de URL"
2. Digite: `https://portfolio-yg0y.onrender.com/`
3. Clique em "Solicitar indexação"
4. Repita para: `https://portfolio-yg0y.onrender.com/html/projetos.html`

## 📊 Testes de SEO

### 1. Teste de Dados Estruturados
```
https://search.google.com/test/rich-results
```
Cole: `https://portfolio-yg0y.onrender.com/`

### 2. PageSpeed Insights
```
https://pagespeed.web.dev/
```
Cole: `https://portfolio-yg0y.onrender.com/`

### 3. Mobile-Friendly Test
```
https://search.google.com/test/mobile-friendly
```
Cole: `https://portfolio-yg0y.onrender.com/`

## 🔒 Testar Segurança

### Headers HTTP
```powershell
# No PowerShell
curl -I https://portfolio-yg0y.onrender.com/
```

Verifique se aparecem headers como:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: ...`

### Rate Limiting
Teste enviando múltiplas requisições rápidas - deve bloquear após o limite.

## 📝 Variáveis de Ambiente

Certifique-se de configurar no Render:

```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/portfolio
FORMSPREE_URL=https://formspree.io/f/seu-form-id
PORT=3002
NODE_ENV=production
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'helmet'"
```powershell
npm install
```

### Erro: "CORS policy"
Adicione o domínio em `server.js` no array `allowedOrigins`

### Formulário não envia
1. Verifique se `FORMSPREE_URL` está configurado
2. Teste com Postman/Insomnia primeiro
3. Verifique console do navegador

### Site não aparece no Google
1. Aguarde 1-2 semanas
2. Verifique Search Console
3. Solicite indexação manual
4. Compartilhe nas redes sociais

## 📈 Monitoramento

### Logs do Render
```
# No dashboard do Render:
Logs -> Visualizar logs em tempo real
```

### Logs Locais
```powershell
# Os logs aparecem no terminal onde você executou npm start
```

## 🎯 Próximas Ações Recomendadas

1. ✅ Instalar dependências: `npm install`
2. ✅ Testar localmente: `npm run dev`
3. ✅ Fazer deploy: `git push`
4. ⏳ Configurar Google Search Console (1-2 dias)
5. ⏳ Aguardar indexação (1-2 semanas)
6. ✅ Adicionar link no LinkedIn
7. ✅ Adicionar no perfil do GitHub
8. ✅ Compartilhar nas redes sociais

## 📞 Suporte

Se tiver dúvidas:
1. Verifique o arquivo `MELHORIAS.md`
2. Leia o `README.md` completo
3. Consulte a documentação das bibliotecas
4. Revise os logs de erro

---

**Última atualização:** 12 de Novembro de 2025
