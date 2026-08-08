# FindOrigin

Telegram-бот и Mini App на Next.js: принимают текст или ссылку на публичный Telegram-пост, выделяют факты через AI, ищут кандидатов через Serper и оценивают источники по смыслу.

Текущая реализация: этапы 0–6 из `PLAN.md` + UI Mini App.

## Стек

- Next.js (App Router)
- Деплой: Vercel
- Webhook: `POST /api/telegram`
- Mini App: `/app` + `POST /api/analyze`
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
| `PUBLIC_APP_URL` | да для кнопки Mini App | например `https://7-find-origin.vercel.app` |

\* Нужен один из ключей: `OPENROUTER_API_KEY` или `OPENAI_API_KEY`.

### Serper

1. Зарегистрируйтесь на [serper.dev](https://serper.dev) (~2500 бесплатных запросов)
2. Скопируйте API key в `SERPER_API_KEY`
3. На Vercel добавьте ту же переменную и сделайте Redeploy

### Telegram Mini App

1. На Vercel задайте `PUBLIC_APP_URL=https://7-find-origin.vercel.app`
2. Redeploy
3. В [@BotFather](https://t.me/BotFather): `/mybots` → бот → **Bot Settings → Menu Button → Configure menu button**  
   URL: `https://7-find-origin.vercel.app/app`
4. В чате с ботом: `/start` — кнопка **Открыть FindOrigin** (inline WebApp)

Проверка меню (PowerShell):

```powershell
$token = "<TELEGRAM_BOT_TOKEN>"
Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot$token/setChatMenuButton" `
  -ContentType "application/json" `
  -Body (@{
    menu_button = @{
      type = "web_app"
      text = "FindOrigin"
      web_app = @{ url = "https://7-find-origin.vercel.app/app" }
    }
  } | ConvertTo-Json -Depth 5)
```

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

1. `/start` или `/help` — инструкция; можно открыть Mini App
2. Отправьте текст или ссылку `https://t.me/channel/123` (в боте или в Mini App)
3. Получите 1–3 источника с релевантностью и уверенностью

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
lib/pipeline/       # analyze + обработка сообщения бота
app/app/            # Telegram Mini App UI
app/api/analyze/    # API для Mini App
types/              # общие типы
```
