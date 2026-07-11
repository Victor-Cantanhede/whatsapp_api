# Módulo de Integração: WhatsApp Business API via Facebook Login

Este módulo detalha as diretrizes e os pré-requisitos necessários para estabelecer a conexão entre a sua aplicação e a **WhatsApp Business API** utilizando o fluxo de Login do Facebook.

---

## ⚠️ Diretriz Fundamental

> **Nota:** É altamente recomendável a leitura prévia da [Documentação Oficial da Cloud API do WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api). A Meta atualiza frequentemente as políticas, os endpoints e os fluxos de integração.

---

## 🛠️ Pré-requisitos e Configurações no Meta Business Suite

Antes de iniciar a integração via código, o proprietário da conta no **Facebook Business Manager (BM)** e o desenvolvedor responsável devem garantir que as etapas administrativas e de configuração na plataforma Meta foram concluídas:

1. **Criação do Aplicativo:** Um aplicativo do tipo _Business_ deve estar criado no painel [Meta for Developers](https://developers.facebook.com/).
2. **Aprovação de Recursos (Escopos):** O aplicativo precisa ter a aprovação explícita da Meta para os seguintes recursos essenciais:
    - `whatsapp_business_messaging`: Permite o envio e recebimento de mensagens comerciais.
    - `whatsapp_business_management`: Permite gerenciar ativos da conta do WhatsApp Business.
    - `whatsapp_business_manage_events`: Permite a assinatura e gerenciamento de webhooks e eventos.

---

## 🔄 Fluxo de Integração (Frontend)

Com o aplicativo configurado e aprovado no painel da Meta, o fluxo técnico segue as etapas abaixo:

### 1. Inicialização da SDK

O desenvolvedor deve configurar e inicializar a **SDK do Facebook Login para JavaScript** diretamente no frontend da aplicação.

### 2. Autenticação do Usuário

Deve ser disponibilizado o botão oficial _"Entrar com o Facebook"_. Este botão aciona o fluxo de login em modo incorporado (_Embedded Signup_), permitindo que o cliente final selecione a sua conta business e o número de telefone que deseja integrar.

### 3. Captura de Dados

Após a autenticação bem-sucedida, a SDK do Facebook retornará um objeto de resposta. O frontend deve capturar obrigatoriamente as seguintes credenciais para enviá-las à API:

| Parâmetro      | Descrição                                                                        |
| :------------- | :------------------------------------------------------------------------------- |
| **`token`**    | Token de acesso do usuário (Access Token) gerado pelo fluxo de login.            |
| **`phone_id`** | Identificador exclusivo do número de telefone que enviará/receberá as mensagens. |
| **`waba_id`**  | Identificador da Conta do WhatsApp Business (_WhatsApp Business Account ID_).    |

---

## 💻 Exemplo Prático de Implementação (HTML/JavaScript)

Abaixo está o exemplo completo de como estruturar o seu frontend para carregar a SDK da Meta, acionar a modal de login incorporado (_Embedded Signup_) e processar os retornos necessários (`token`, `phone_id` e `waba_id`).

> 🛑 **Atenção:** Certifique-se de substituir os marcadores `[SEU_APP_ID]`, `[SEU_APP_SECRET]` e `[SEU_CONFIGURATION_ID]` pelos dados reais gerados no seu painel de desenvolvedor da Meta.

```html
<!DOCTYPE html>
<html lang="pt-BR">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Integração WhatsApp Business API</title>

		<script
			async
			defer
			crossorigin="anonymous"
			src="https://connect.facebook.net/en_US/sdk.js"
		></script>

		<script>
			// CONFIGURAÇÕES DA CONTA META (SUBSTITUA PELOS SEUS DADOS)
			const APP_ID = '[SEU_APP_ID]';
			const APP_SECRET = '[SEU_APP_SECRET]'; // IMPORTANTE: Mova esta credencial para o seu Backend!
			const CONFIGURATION_ID = '[SEU_CONFIGURATION_ID]';
			const APP_VERSION = 'v25.0';
			const IGNORE_SYNC = true;

			// Inicialização assíncrona do SDK do Facebook
			window.fbAsyncInit = function () {
				FB.init({
					appId: APP_ID,
					autoLogAppEvents: true,
					xfbml: true,
					version: APP_VERSION,
				});
			};

			// Ouvinte de eventos (Listener) para capturar o retorno do fluxo incorporado do WhatsApp
			window.addEventListener('message', (event) => {
				// Garante que a mensagem provém de uma origem confiável do Facebook
				if (!event.origin.endsWith('facebook.com')) return;

				try {
					const data = JSON.parse(event.data);
					if (data.type === 'WA_EMBEDDED_SIGNUP') {
						console.log('Evento do fluxo capturado:', data);

						const waba_id = data.data.waba_id;
						const business_id = data.data.business_id;

						console.log('DADOS DA INTEGRAÇÃO EXTRAÍDOS:', data.data);

						// Dispara o fluxo principal com as IDs coletadas
						AfterFlowManager.startMainFlow({
							waba_id,
							business_id,
						});
					}
				} catch (err) {
					console.error('ERRO AO PROCESSAR MENSAGEM DO FLUXO:', err);
				}
			});

			// Gerenciador do fluxo pós-autenticação
			class AfterFlowManager {
				static token = '';

				// Troca o código temporário obtido no front pelo token de acesso de longa duração
				static async setToken(code) {
					const url = `https://graph.facebook.com/${APP_VERSION}/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&code=${code}`;
					const response = await fetch(url, { method: 'POST' });
					const data = await response.json();

					AfterFlowManager.token = data.access_token;
					console.log('TOKEN DE ACESSO DO CLIENTE GERADO:', AfterFlowManager.token);
				}

				// Orquestrador das rotinas necessárias após o login do usuário
				static async startMainFlow(payload) {
					await AfterFlowManager.waitForToken();

					// Recupera o Phone ID atrelado à conta de WhatsApp Business (WABA)
					const phoneData = await this.recoverPhoneNumberId(payload.waba_id);
					const phone_id = phoneData.data[0].id;

					console.log('=== CONFIGURAÇÃO ATUAL ===');
					console.log('TOKEN CLIENTE:', AfterFlowManager.token);
					console.log('PHONE_ID:', phone_id);
					console.log('WABA_ID:', payload.waba_id);

					// Renderiza as informações na tela do usuário
					AfterFlowManager.renderIntegrationDetails({
						token: AfterFlowManager.token,
						phone_id,
						waba_id: payload.waba_id,
					});

					// Inscreve o aplicativo para ouvir os Webhooks da WABA do cliente
					await this.setWebhooks(payload.waba_id);

					if (IGNORE_SYNC) return;

					// Sincronizações opcionais de histórico e contatos (SMB)
					await this.synchronizeContacts(phone_id);
					await this.synchronizeMessages(phone_id);
				}

				// Cria uma lista visual no HTML com as credenciais obtidas
				static async renderIntegrationDetails(integration) {
					const ul = document.createElement('ul');
					const items = [
						{ label: 'TOKEN CLIENTE', value: integration.token },
						{ label: 'PHONE_ID', value: integration.phone_id },
						{ label: 'WABA_ID', value: integration.waba_id },
					];

					items.forEach((item) => {
						const li = document.createElement('li');
						li.innerHTML = `<strong>${item.label}:</strong> <code>${item.value}</code>`;
						ul.appendChild(li);
					});

					document.body.appendChild(ul);
				}

				// Consome a Graph API para buscar a ID do número telefônico da WABA
				static async recoverPhoneNumberId(waba_id) {
					const response = await fetch(
						`https://graph.facebook.com/${APP_VERSION}/${waba_id}/phone_numbers?fields=id&access_token=${AfterFlowManager.token}`,
					);
					return await response.json();
				}

				// Registra os Webhooks necessários na conta do cliente
				static async setWebhooks(waba_id) {
					await fetch(`https://graph.facebook.com/${APP_VERSION}/${waba_id}/subscribed_apps`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${AfterFlowManager.token}`,
							'Content-Type': 'application/json',
						},
					});
				}

				// Sincroniza a lista de contatos do dispositivo via API
				static async synchronizeContacts(phone_number_id) {
					await fetch(`https://graph.facebook.com/${APP_VERSION}/${phone_number_id}/smb_app_data`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${AfterFlowManager.token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							messaging_product: 'whatsapp',
							sync_type: 'smb_app_state_sync',
						}),
					});
				}

				// Sincroniza as mensagens históricas enviadas/recebidas
				static async synchronizeMessages(phone_number_id) {
					await fetch(`https://graph.facebook.com/${APP_VERSION}/${phone_number_id}/smb_app_data`, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${AfterFlowManager.token}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							messaging_product: 'whatsapp',
							sync_type: 'history',
						}),
					});
				}

				// Função auxiliar que aguarda o token estar preenchido antes de dar andamento
				static waitForToken(interval = 100) {
					return new Promise((resolve) => {
						const check = () => {
							if (AfterFlowManager.token) {
								resolve(AfterFlowManager.token);
							} else {
								setTimeout(check, interval);
							}
						};
						check();
					});
				}
			}

			// Função de callback acionada pelo encerramento da janela modal de Login do Facebook
			const fbLoginCallback = (response) => {
				if (response.authResponse) {
					const code = response.authResponse.code;
					console.log('Código de autenticação retornado:', code);
					AfterFlowManager.setToken(code);
				} else {
					console.warn('Fluxo cancelado ou falha na autenticação:', response);
				}
			};

			// Disparador inicial do fluxo integrado que abre o Embedded Signup do WhatsApp
			window.launchWhatsAppSignup = () => {
				FB.login(fbLoginCallback, {
					config_id: CONFIGURATION_ID,
					response_type: 'code', // Exige o retorno do código de autorização para o token de sistema
					override_default_response_type: true,
					extras: {
						version: 'v3',
						setup: {
							business: {
								id: null,
								name: null,
								email: null,
								phone: { code: null, number: null },
								website: null,
								address: { streetAddress1: null, streetAddress2: null, city: null, state: null, zipPostal: null, country: null },
								timezone: null,
							},
							phone: {
								displayName: null,
								category: null,
								description: null,
							},
							preVerifiedPhone: { ids: null },
							solutionID: null,
							whatsAppBusinessAccount: { ids: null },
						},
						featureType: 'whatsapp_business_app_onboarding',
					},
				});
			};
		</script>
	</head>
	<body>
		<button
			onclick="window.launchWhatsAppSignup()"
			style="background-color: #1877f2; border: 0; border-radius: 4px; color: #fff; cursor: pointer; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; height: 40px; padding: 0 24px;"
		>
			Login com Facebook
		</button>
	</body>
</html>
```
