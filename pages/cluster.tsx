import Head from 'next/head';
import styles from './cluster.module.scss';
import { BsShieldLock } from 'react-icons/bs';
import { FaKey } from 'react-icons/fa';
import { SiKubernetes } from 'react-icons/si';

export default function Cluster() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Secure Cluster Access - Kanwarpal Brar</title>
        <meta name="description" content="Private Kubernetes Cluster Access - Secure Infrastructure Management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <div className={styles.titleIcon}>
            <SiKubernetes />
          </div>
          Private Kubernetes Cluster
        </h1>

        <div className={styles.description}>
          <div className={styles.shieldIcon}>
            <BsShieldLock size={40} />
          </div>
          <p>
            Welcome to the secure access portal for the private Kubernetes cluster at
            <strong> cluster-ssh.kanwarpal.com</strong>
          </p>
          <p>
            Access to this infrastructure is strictly controlled and requires prior authorization.
          </p>
          <a
            href="mailto:kanwarpal.brar@outlook.com"
            className={styles.email}
          >
            <FaKey />
            kanwarpal.brar@outlook.com
          </a>
          <p>
            Your request should include the following information:
          </p>
          <ul>
            <li>Your full name and organization</li>
            <li>Intended use case and project scope</li>
            <li>Required access level and duration</li>
            <li>Any relevant technical requirements</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
