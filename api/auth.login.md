# Client login

**Endpoint:** `POST /api/client/auth/login`  
**URL:** `https://crm.xrb.cz/api/client/auth/login`

## Popis

Přihlášení klienta. Vrací klienta a token (pro další volání API).

## Request

- **Method:** POST
- **Header:** `Content-Type: application/json`
- **Body (JSON):**

| Pole        | Typ    | Povinné | Popis                    |
| ----------- | ------ | ------- | ------------------------- |
| `phone`     | string | ano     | Telefon (přihlašovací údaj) |
| `password`  | string | ano     | Heslo                     |
| `platform`  | string | ano     | Platforma (např. `ios`, `android`) |
| `appVersion`| string | ano     | Verze aplikace            |

### Příklad body

```json
{
  "phone": "+420123456789",
  "password": "***",
  "platform": "ios",
  "appVersion": "1.0.0"
}
```

### cURL

```bash
curl https://crm.xrb.cz/api/client/auth/login \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
    "phone": "",
    "password": "",
    "platform": "",
    "appVersion": ""
  }'
```

## Response

- **200** – Client and token (`application/json`)

### Struktura odpovědi

| Pole | Typ | Popis |
|------|-----|--------|
| `client` | object | Data přihlášeného klienta |
| `client.id` | string (UUID) | ID klienta |
| `client.name` | string | Jméno |
| `client.email` | string | E-mail |
| `client.phone` | string | Telefon |
| `client.avatarUrl` | string \| null | URL avataru |
| `client.address` | string | Adresa |
| `client.whatsapp` | string \| null | WhatsApp |
| `client.birthday` | string \| null | Datum narození |
| `client.lastVisit` | string \| null | Poslední návštěva |
| `client.createdAt` | string (ISO) | Vytvořeno |
| `client.updatedAt` | string (ISO) | Upraveno |
| `token` | string | JWT – pro hlavičku `Authorization: Bearer <token>` |
| `apiToken` | string | API token (alternativa pro autentizaci?) |

### Příklad odpovědi (200)

```json
{
  "client": {
    "id": "13100f49-27e3-4a72-b60f-1e6c2d12385a",
    "name": "Josef  Hanuš",
    "email": "rbaiagents@gmail.com",
    "phone": "+420774522114",
    "avatarUrl": "https://s3.xrb.cz/crm/avatar/1771593426896-mxrwl9.jpg",
    "address": "",
    "whatsapp": null,
    "birthday": null,
    "lastVisit": null,
    "createdAt": "2026-02-15T11:30:08.354Z",
    "updatedAt": "2026-02-23T13:46:49.257Z"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "apiToken": "0e53e41c530428398052b993ad18e47bd78bcefa79ca80dca8cb814e5587bd36"
}
```

---

**Poznámka:** Pro další volání CRM API používej v hlavičce:  
`Authorization: Bearer <token>` (hodnota z pole `token`).  
Pole `apiToken` může CRM používat jinde – podle jejich dokumentace.
