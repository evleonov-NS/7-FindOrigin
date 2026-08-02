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
| `OPENAI_API_KEY` | нет | AI-извлечение фактов; без ключа работают правила |
| `OPENAI_BASE_URL` | нет | по умолчанию `https://api.openai.com/v1` |
| `OPENAI_MODEL` | нет | по умолчанию `gpt-4o-mini` |

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
3. Бот ответит «Ищу источник…», затем пришлёт выделенные факты

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
lib/facts/          # извлечение фактов (правила + AI)
lib/pipeline/       # обработка сообщения
types/              # общие типы
```
