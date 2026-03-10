# API Design Patterns

## RESTful Resource Design
- `GET /resources` — List (supports filtering, pagination, sorting)
- `GET /resources/:id` — Get single resource
- `POST /resources` — Create new resource
- `PUT /resources/:id` — Full update (replace)
- `PATCH /resources/:id` — Partial update
- `DELETE /resources/:id` — Delete resource

## Response Format
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}
```

Error response:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "This field is required" }
    ]
  }
}
```

## Status Codes
- `200` — Success (GET, PUT, PATCH)
- `201` — Created (POST)
- `204` — No Content (DELETE)
- `400` — Bad Request (validation errors)
- `401` — Unauthorized (missing/invalid auth)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `409` — Conflict (duplicate resource)
- `422` — Unprocessable Entity (business logic error)
- `500` — Internal Server Error

## Pagination
Cursor-based for large datasets:
```
GET /resources?cursor=abc123&limit=20
```

Offset-based for simple cases:
```
GET /resources?page=2&limit=20
```

## Filtering and Sorting
```
GET /resources?status=active&sort=-created_at&fields=id,name,email
```
