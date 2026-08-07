# FindOrigin

Telegram-бот на Next.js: принимает текст или ссылку на публичный Telegram-пост, выделяет факты через AI, ищет кандидатов через Serper и оценивает источники по смыслу.

Текущая реализация: этапы 0–6 из `PLAN.md`.

## Стек

- Next.js (App Router)
- Деплой: Vercel
- Webhook: `POST /api/telegram`
- AI: OpenRouter (`openai/gpt-4o-mini`)
- Поиск: Serper (Google SERP API)

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```powershell
Copy-Item .env.example .env.local
```

| Переменная | Обязательно | Описание |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | да | токен от BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | нет | секрет проверки webhook |
| `OPENROUTER_API_KEY` | да* | ключ OpenRouter для AI |
| `OPENAI_BASE_URL` | нет | по умолчанию `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | нет | по умолчанию `openai/gpt-4o-mini` |
| `OPENAI_API_KEY` | да* | альтернатива OpenRouter |
| `SERPER_API_KEY` | да | ключ поиска с [serper.dev](https://serper.dev) |

\* Нужен один из ключей: `OPENROUTER_API_KEY` или `OPENAI_API_KEY`.

### Serper

1. Зарегистрируйтесь на [serper.dev](https://serper.dev) (~2500 бесплатных запросов)
2. Скопируйте API key в `SERPER_API_KEY`
3. На Vercel добавьте ту же переменную и сделайте Redeploy

`SEARCH_API_KEY` / `GOOGLE_CSE_ID` больше не используются (у новых Google CSE отключён поиск по всему интернету).

## Локальный запуск

```powershell
npm install
npm run dev
```

Для приёма webhook с Telegram нужен публичный HTTPS URL (Vercel или туннель вроде ngrok).

## Установка webhook

После деплоя на Vercel:

```powershell
$token = "<TELEGRAM_BOT_TOKEN>"
$url = "https://<ваш-домен>/api/telegram"
$secret = "<TELEGRAM_WEBHOOK_SECRET>" # опционально

Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/setWebhook" -ContentType "application/json" -Body (@{
  url = $url
  secret_token = $secret
} | ConvertTo-Json)
```

Проверка:

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo"
```

## Как пользоваться ботом

1. `/start` или `/help` — инструкция
2. Отправьте текст или ссылку `https://t.me/channel/123`
3. Бот пришлёт статусы анализа/поиска, затем HTML-отчёт с 1–3 источниками (релевантность и уверенность)

## Тесты

```powershell
npm test
```

## Структура

```
app/api/telegram/   # webhook
lib/telegram/       # клиент и тексты ответов
lib/input/          # нормализация текста/поста
lib/ai/             # конфиг и chat completions
lib/facts/          # извлечение фактов через AI
lib/search/         # запросы и Serper
lib/sources/        # AI-ранжирование источников
lib/pipeline/       # обработка сообщения
types/              # общие типы
```
