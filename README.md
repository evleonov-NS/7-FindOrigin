# FindOrigin

Telegram-бот на Next.js: принимает текст или ссылку на публичный Telegram-пост, нормализует ввод и выделяет факты для последующего поиска первоисточника.

Текущая реализация: этапы 0–4 из `PLAN.md` (до поиска источников).

## Стек

- Next.js (App Router)
- Деплой: Vercel
- Webhook: `POST /api/telegram`

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните:

```powershell
Copy-Item .env.example .env.local
```

| Переменная | Обязательно | Описание |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | да | токен от BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | нет | секрет проверки webhook |
| `OPENROUTER_API_KEY` | да* | ключ OpenRouter для извлечения фактов |
| `OPENAI_BASE_URL` | нет | по умолчанию `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | нет | по умолчанию `openai/gpt-4o-mini` |
| `OPENAI_API_KEY` | да* | альтернатива OpenRouter — прямой ключ OpenAI |

\* Нужен один из ключей: `OPENROUTER_API_KEY` или `OPENAI_API_KEY`.

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
3. Бот ответит «Ищу источник…», затем пришлёт факты, выделенные AI (`openai/gpt-4o-mini` через OpenRouter)

Поиск источников и AI-сравнение смысла — следующие этапы плана.

## Тесты

```powershell
npm test
```

## Структура

```
app/api/telegram/   # webhook
lib/telegram/       # клиент и тексты ответов
lib/input/          # нормализация текста/поста
lib/ai/             # конфиг OpenRouter / OpenAI
lib/facts/          # извлечение фактов через AI
lib/pipeline/       # обработка сообщения
types/              # общие типы
```
