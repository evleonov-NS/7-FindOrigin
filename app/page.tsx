import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>FindOrigin</h1>
          <p>
            Telegram-бот для поиска первоисточника информации. Webhook:{" "}
            <code>/api/telegram</code>
          </p>
        </div>
      </main>
    </div>
  );
}
