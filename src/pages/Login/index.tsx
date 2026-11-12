import { LoginBackdrop } from './components/LoginBackdrop';
import { LoginCard } from './components/LoginCard';
import { LoginHero } from './components/LoginHero';
import styles from './Login.module.scss';

export default function LoginPage() {
  return (
    <div className={styles.login}>
      <LoginBackdrop />
      <div className={styles.login__layout}>
        <LoginHero />
        <LoginCard />
      </div>
    </div>
  );
}
