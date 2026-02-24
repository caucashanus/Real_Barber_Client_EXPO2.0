# Get all employees (Client API)

**Endpoint:** `GET /api/client/employees`  
**URL:** `https://crm.xrb.cz/api/client/employees`

## Popis

Vrací všechny zaměstnance (holiče) s kompletními daty: osobní info, směny, média, položky, ceny, recenze, webové URL.

## Request

- **Method:** GET
- **Header:** `Authorization: Bearer <apiToken>`

### Query parametry

| Parametr         | Typ     | Popis              |
|------------------|---------|--------------------|
| `includeReviews` | boolean | Zahrnout recenze   |
| `reviewsLimit`   | number  | Limit recenzí      |

### cURL

```bash
curl 'https://crm.xrb.cz/api/client/employees?includeReviews=true&reviewsLimit=1' \
  --header 'Authorization: Bearer YOUR_API_TOKEN'
```

## Response

- **200** – Pole zaměstnanců (full dataset)
- **401** – Unauthorized
- **500** – Internal server error

---

# Get employee by ID (Client API)

**Endpoint:** `GET /api/client/employees/[id]`  
**URL:** `https://crm.xrb.cz/api/client/employees/{id}`

## Popis

Vrací detail zaměstnance: `id`, `name`, `email`, `avatarUrl`, `createdAt`, `media[]`, `branches[]`, `services[]` (s cenou, délkou, kategorií), `workSchedule`, `availability` (upcomingBookings).

## Request

- **Method:** GET
- **Header:** `Authorization: Bearer <apiToken>`
- **Path:** `id` – UUID zaměstnance

## Response

- **200** – Kompletní data zaměstnance (včetně branches, services, workSchedule, availability)
- **401** – Unauthorized
- **404** – Employee not found
- **500** – Internal server error
