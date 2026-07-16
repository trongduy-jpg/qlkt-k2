# Supabase setup

Chay theo thu tu trong Supabase SQL Editor:

1. `schema.sql`
2. `seed.sql`

Sau do tao file `.env.local` o root project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Ghi chu

- `schema.sql` tao bang nen tang cho MVP.
- `seed.sql` nap du lieu mau giong demo local.
- Demo hien tai van uu tien localStorage cho den khi co env Supabase.
- Khi chuyen sang Supabase that, can them Auth/RLS truoc khi dung noi bo that.
