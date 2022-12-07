/**
 * Index.html file for Vercel deployment
 */
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Asana AppComponent example" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Asana AppComponent example!</a>
        </h1>

        <p className={styles.description}>
          Check <code className={styles.code}>GitHub repo</code> for more information.
        </p>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://asana.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Asana
        </a>
      </footer>
    </div>
  );
}
