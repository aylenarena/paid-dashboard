# AIXIOM — Hackathon Context

## Empresa
**Humand** — HR Tech SaaS B2B. Plataforma de comunicación y engagement para empleados.

## Contexto del hackathon
Hackathon interno de 2 días. El objetivo es construir un MVP funcional que cruce data de CRM con campañas publicitarias para optimizar por calidad de lead, no por volumen (CPL).

## Problema central
Las campañas de ads están optimizadas por CPL (costo por lead), pero no por calidad real. No se usa la data del CRM para saber qué campañas generan demos calificadas ni para optimizar targeting en base a revenue impact real.

## Stack técnico
- Next.js App Router (JavaScript, no TypeScript en páginas)
- Tailwind CSS (dark theme, fondo #0f0f0f, acento violet #7c3aed)
- Supabase JS client (read-only, datos ficticios HubSpot-style)
- Anthropic SDK (`claude-sonnet-4-0`) — llamadas solo server-side en route handlers
- Sin base de datos propia — todo en tiempo real vía APIs

## Fuentes de datos disponibles
- **Supabase (CRM sandbox)**: companies, contacts, deals, meetings, call_transcripts, owners + junction tables
- **LinkedIn Ads**: campaigns, creatives, leads, performance
- **Google Ads**: campaigns, keywords, conversions
- **Meta Ads Manager**: campaigns, ad sets, leads, performance

## Schema Supabase (columnas reales confirmadas)
### deals
- `id`, `deal_name`, `amount`, `deal_stage` (NO "stage"), `inbound_source` (NO "source")
- `close_date`, `owner_id`, `company_id`, `pipeline`, `deal_type`

### contacts
- `id`, `first_name`, `last_name`, `email`, `job_title`, `lifecycle_stage`, `lead_status`
- `company_id`, `owner_id`, `deal_source_of_the_deal`, `stage_of_the_deal`

### companies
- `id`, `name`, `industry`, `country`, `number_of_employees`, `annual_revenue`
- `lifecycle_stage`, `owner_id`

### meetings
- `id`, `title`, `start_time`, `contact_id`, `deal_id`

### call_transcripts
- `id`, `transcript`, `summary`, `created_at`

### owners
- `id`, `first_name`, `last_name`, `email`

### Junction tables
- `deal_contacts` (deal_id, contact_id)
- `meeting_contacts` (meeting_id, contact_id)
- `meeting_deals` (meeting_id, deal_id)
- `call_transcript_deals` (transcript_id, deal_id)
- `call_transcript_contacts` (transcript_id, contact_id)
- `call_transcript_companies` (transcript_id, company_id)

## Rutas actuales
- `/` — Dashboard principal (Run Analysis con Claude)
- `/explorer` — Data catalog para teammates no técnicos
- `/api/analyze` — POST: fetches CRM data → Claude → JSON analysis
- `/api/explore` — GET: samples + distribuciones reales de Supabase

## MVP a construir (priorizado)

### 1. Lead Quality Score
Lista de leads con demo agendada + score de calidad.
Breakdown por: campaña, plataforma, industria, tamaño de empresa, seniority.

### 2. Calidad por región
"Best quality leads by region" — % demo, % SQL, score promedio por región.

### 3. Performance por plataforma (calidad > volumen)
LinkedIn Ads vs Meta Ads Manager vs Google Ads.
CPL vs Quality Score, campañas con leads basura vs alto pipeline.

### 4. Recomendador de audiencias ⭐ (diferenciador clave)
Sugerencias específicas por plataforma basadas en patrones de leads que avanzan:
- **LinkedIn**: job titles, seniority, company size, industries
- **Meta**: intereses, lookalikes de alto score, comportamiento
- **Google**: keywords alta intención, exclusión de keywords irrelevantes

### 5. Insights accionables automáticos (Claude)
Ejemplos: "Pause campaigns generating low-quality leads", "Scale campaigns targeting HR Directors in Enterprise"

### 6. Análisis de calls / feedback BDR
Procesar notas y transcripts de HubSpot con NLP:
- Detectar patrones en texto
- Agrupar razones de descalificación
- Output: top pain points, qué segmentos evitar

### 7. Loop de aprendizaje (simple)
Marcar good/bad leads → retroalimentar audiencias y recomendaciones.

## Lógica de matching crítica (ads → CRM)
**Cómo cruzar un lead de Ads con un contacto en HubSpot:**
1. **Email match**: campo email del lead form = contacts.email (más confiable)
2. **UTM → source match**: UTM params de la landing = deal.inbound_source o contact.deal_source_of_the_deal
3. **Nombre + empresa**: fallback si no hay email (fuzzy match)
4. **Fecha de creación**: el contacto en CRM debe crearse dentro de ±24hs del lead en Ads

## Restricciones
- Solo lectura — no ejecutar cambios en campañas ni en CRM
- Sin deploy externo requerido (puede correr local)
- MVP en 2 días — priorizar simplicidad sobre escalabilidad
- API keys nunca en el cliente — solo en route handlers server-side
- No usar `select("*")` en Supabase — siempre especificar columnas

## Estilo de código
- Componentes simples en archivos únicos cuando sea posible (facilita que otros extiendan)
- Comentarios en español para contexto de negocio
- Tailwind classes inline, sin CSS modules
- Colores: fondo `#0f0f0f`, texto blanco/gris, acento `violet-600` (#7c3aed)
