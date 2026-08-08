"use client";

import { useEffect, useMemo, useState, useEffectEvent } from "react";
import styles from "./mini.module.css";
import type { AnalysisResult } from "@/types";

type StepId = "normalize" | "extract" | "search";
type UiStatus = "idle" | "running" | "done" | "error";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "normalize", label: "Анализирую запрос..." },
  { id: "extract", label: "Извлекаю ключевые элементы..." },
  { id: "search", label: "Ищу и анализирую источники с помощью AI..." },
];

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const display = `${parsed.hostname}${path}`;
    return display.length > 52 ? `${display.slice(0, 49)}...` : display;
  } catch {
    return url;
  }
}

function applyTheme(webApp: TelegramWebApp) {
  const root = document.documentElement;
  const theme = webApp.themeParams;
  const map: Array<[string, string | undefined]> = [
    ["--tg-theme-bg-color", theme.bg_color],
    ["--tg-theme-text-color", theme.text_color],
    ["--tg-theme-hint-color", theme.hint_color],
    ["--tg-theme-link-color", theme.link_color],
    ["--tg-theme-button-color", theme.button_color],
    ["--tg-theme-button-text-color", theme.button_text_color],
    ["--tg-theme-secondary-bg-color", theme.secondary_bg_color],
  ];
  for (const [key, value] of map) {
    if (value) root.style.setProperty(key, value);
  }
  if (theme.bg_color) {
    webApp.setBackgroundColor(theme.bg_color);
    webApp.setHeaderColor(theme.bg_color);
  }
}

export default function MiniAppClient() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<UiStatus>("idle");
  const [activeStep, setActiveStep] = useState<StepId | null>(null);
  const [doneSteps, setDoneSteps] = useState<StepId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [insideTelegram, setInsideTelegram] = useState(false);

  const canSubmit = text.trim().length >= 8 && status !== "running";

  const runAnalyze = useEffectEvent(async () => {
    const payload = text.trim();
    if (payload.length < 8 || status === "running") return;

    setStatus("running");
    setError(null);
    setResult(null);
    setDoneSteps([]);
    setActiveStep("normalize");

    const webApp = window.Telegram?.WebApp;
    webApp?.HapticFeedback?.impactOccurred("light");

    const timers = [
      window.setTimeout(() => {
        setDoneSteps(["normalize"]);
        setActiveStep("extract");
      }, 700),
      window.setTimeout(() => {
        setDoneSteps(["normalize", "extract"]);
        setActiveStep("search");
      }, 1400),
    ];

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload,
          initData: webApp?.initData ?? "",
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        result?: AnalysisResult;
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error || "Не удалось выполнить анализ.");
      }

      setDoneSteps(["normalize", "extract", "search"]);
      setActiveStep(null);
      setResult(data.result);
      setStatus("done");
      webApp?.HapticFeedback?.notificationOccurred("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus("error");
      setActiveStep(null);
      webApp?.HapticFeedback?.notificationOccurred("error");
    } finally {
      for (const timer of timers) window.clearTimeout(timer);
    }
  });

  const syncMainButton = useEffectEvent(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.MainButton.setText(
      status === "running" ? "Идёт анализ..." : "Найти источники",
    );

    if (canSubmit) {
      webApp.MainButton.enable();
    } else {
      webApp.MainButton.disable();
    }

    if (status === "running") {
      webApp.MainButton.showProgress(false);
    } else {
      webApp.MainButton.hideProgress();
    }

    webApp.MainButton.show();
  });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    setInsideTelegram(Boolean(webApp.initData));
    applyTheme(webApp);
    webApp.ready();
    webApp.expand();

    const user = webApp.initDataUnsafe.user;
    if (user?.first_name) {
      setUserName(
        [user.first_name, user.last_name].filter(Boolean).join(" "),
      );
    }

    const startParam = webApp.initDataUnsafe.start_param;
    if (startParam) {
      try {
        setText(decodeURIComponent(startParam));
      } catch {
        setText(startParam);
      }
    }

    const onMainClick = () => {
      void runAnalyze();
    };
    webApp.MainButton.onClick(onMainClick);
    syncMainButton();

    return () => {
      webApp.MainButton.offClick(onMainClick);
    };
  }, [runAnalyze, syncMainButton]);

  useEffect(() => {
    syncMainButton();
  }, [canSubmit, status, syncMainButton]);

  const stepState = useMemo(() => {
    return STEPS.map((step) => {
      if (doneSteps.includes(step.id)) return "done";
      if (activeStep === step.id) return "active";
      return "idle";
    });
  }, [activeStep, doneSteps]);

  function openSource(url: string) {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.openLink(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.brand}>
        <div className={styles.brandMark}>FindOrigin</div>
        <p className={styles.brandLead}>
          Вставьте текст или ссылку на публичный Telegram-пост — найду возможные
          первоисточники и оценю уверенность.
        </p>
        {userName ? (
          <div className={styles.userChip}>Вы вошли как {userName}</div>
        ) : null}
      </header>

      <section className={styles.panel}>
        <label className={styles.label} htmlFor="claim">
          Текст или ссылка
        </label>
        <textarea
          id="claim"
          className={styles.textarea}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Например: генеральный директор Coinbase уволил программистов, не использующих ИИ"
          disabled={status === "running"}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={!canSubmit}
            onClick={() => void runAnalyze()}
          >
            {status === "running" ? "Анализирую..." : "Найти источники"}
          </button>
          {result || error ? (
            <button
              type="button"
              className={styles.ghost}
              onClick={() => {
                setResult(null);
                setError(null);
                setStatus("idle");
                setDoneSteps([]);
                setActiveStep(null);
              }}
            >
              Сбросить
            </button>
          ) : null}
        </div>
      </section>

      {!insideTelegram ? (
        <p className={styles.warning}>
          Откройте эту страницу через кнопку Mini App в боте Telegram — так
          работает авторизация. Локальный обход: MINIAPP_DEV_BYPASS=1.
        </p>
      ) : null}

      {(status === "running" || doneSteps.length > 0) && (
        <div className={styles.steps} aria-live="polite">
          {STEPS.map((step, index) => {
            const state = stepState[index];
            const className = [
              styles.step,
              state === "active" ? styles.stepActive : "",
              state === "done" ? styles.stepDone : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={step.id} className={className}>
                <span className={styles.dot} />
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <section className={styles.results}>
          <div className={styles.resultsHead}>
            <h2 className={styles.resultsTitle}>Результаты анализа</h2>
            <p className={styles.original}>
              <strong>Исходный текст:</strong> {result.originalText}
            </p>
            <p className={styles.meta}>
              <strong>Найдено источников:</strong> {result.sources.length}
            </p>
            <p className={styles.summary}>
              <strong>Резюме:</strong> {result.summary}
            </p>
          </div>

          {result.sources.map((source, index) => (
            <article key={source.url} className={styles.source}>
              <div className={styles.sourceTitle}>
                Источник {index + 1}: {source.title}
              </div>
              <button
                type="button"
                className={styles.sourceLink}
                onClick={() => openSource(source.url)}
              >
                {shortUrl(source.url)}
              </button>
              {source.snippet ? (
                <p className={styles.snippet}>{source.snippet}</p>
              ) : null}
              <div className={styles.scores}>
                <span className={styles.score}>
                  Релевантность:{" "}
                  {typeof source.relevance === "number"
                    ? `${source.relevance}%`
                    : "—"}
                </span>
                <span className={styles.score}>
                  Уверенность:{" "}
                  {typeof source.confidence === "number"
                    ? `${source.confidence}%`
                    : "—"}
                </span>
              </div>
              {source.reason ? (
                <p className={styles.reason}>{source.reason}</p>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
