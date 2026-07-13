# Zait Pay - HTML/CSS/JS conectado à API própria

Esta versão foi ajustada para sair do modo somente local e enviar requisições para:

`https://api.zaitpay.com.br`

## Arquivos principais

- `index.html`
- `styles.css`
- `script.js`
- `api-config.js`
- `api-client.js`

## Como configurar

Abra `api-config.js` e ajuste:

```js
window.ZAITPAY_API_CONFIG = {
  BASE_URL: "https://api.zaitpay.com.br",
  PREFIX: ""
};
```

Se o backend usa `/api`, troque para:

```js
PREFIX: "api"
```

## Rotas tentadas automaticamente

Para facilitar compatibilidade com seu backend, o client tenta rotas comuns:

- Login: `/auth/login`, `/login`, `/usuarios/login`, `/users/login`
- Cadastro: `/auth/register`, `/register`, `/clientes`, `/users`, `/usuarios`
- PIX: `/pix`, `/transactions/pix`, `/transacoes/pix`, `/payments/pix`
- Boleto: `/boletos`, `/boleto`, `/cobrancas/boleto`, `/charges/boleto`
- Link de pagamento: `/payment-links`, `/links-pagamento`, `/links`, `/checkout/links`

Quando você me passar a documentação real do backend, eu deixo as rotas 100% exatas.
