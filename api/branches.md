# Get all branches (Client API)

**Endpoint:** `GET /api/client/branches`  
**URL:** `https://crm.xrb.cz/api/client/branches`

## Popis

Vrací všechny pobočky s kompletními daty: info o pobočce, zaměstnanci, směny, služby, ceny, média, recenze, webové URL.

## Request

- **Method:** GET
- **Header:** `Authorization: Bearer <apiToken>` (povinné – `apiToken` z přihlášení)

### Query parametry

| Parametr         | Typ     | Popis                    |
|------------------|---------|---------------------------|
| `includeReviews` | boolean | Zahrnout recenze (např. true) |
| `reviewsLimit`   | number  | Limit počtu recenzí      |

### cURL

```bash
curl 'https://crm.xrb.cz/api/client/branches?includeReviews=true&reviewsLimit=1' \
  --header 'Authorization: Bearer YOUR_API_TOKEN'
```

## Response

- **200** – Pole poboček (branch info, employees, shifts, services, prices, media, reviews, web URLs)
- **401** – Unauthorized
- **500** – Internal server error

Služby v rámci pobočky mají strukturu: `id`, `name`, `imageUrl`, `price`, `duration`, `employee: { id, name }`, `category: { id, name }`.
