import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useAnimationControls } from 'motion/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import { DEMO_ACCOUNT } from '@/mocks/accounts';
import { useLogin } from '../hooks/useLogin';
import styles from './LoginCard.module.scss';

const schema = z.object({
  loginId: z.string().trim().min(1, '아이디를 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

type FormValues = z.infer<typeof schema>;

/** 로그인 카드 — 유리 판 위 폼. 틀리면 카드가 짧게 흔들린다 */
export function LoginCard() {
  const login = useLogin();
  const shake = useAnimationControls();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { loginId: '', password: '' } });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onError: () => {
        void shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.42 } });
      },
    });
  }, () => {
    void shake.start({ x: [0, -6, 5, -3, 0], transition: { duration: 0.36 } });
  });

  const errorMessage = errors.loginId?.message ?? errors.password?.message ?? login.error?.message;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, delay: 0.35 }}
    >
      <motion.form className={styles.card__form} animate={shake} onSubmit={onSubmit} noValidate>
        <header className={styles.card__head}>
          <h2 className={styles.card__title}>관제 시스템 로그인</h2>
        </header>

        <label className={styles.card__field} htmlFor="loginId">
          <span className={styles.card__label}>아이디</span>
          <span className={styles.card__control}>
            <Icon name="user" size={16} />
            <input
              id="loginId"
              autoComplete="username"
              placeholder="아이디"
              aria-invalid={!!errors.loginId}
              {...register('loginId')}
            />
          </span>
        </label>

        <label className={styles.card__field} htmlFor="password">
          <span className={styles.card__label}>비밀번호</span>
          <span className={styles.card__control}>
            <Icon name="lock" size={16} />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </span>
        </label>

        <p className={styles.card__error} role="alert" aria-live="polite">
          {errorMessage ?? ''}
        </p>

        <Button type="submit" size="lg" isFullWidth isLoading={login.isPending}>
          {login.isPending ? '접속 중' : '접속'}
        </Button>

        <p className={styles.card__hint}>
          데모 계정 <code>{DEMO_ACCOUNT.loginId}</code> / <code>{DEMO_ACCOUNT.password}</code>
        </p>
      </motion.form>
    </motion.div>
  );
}
