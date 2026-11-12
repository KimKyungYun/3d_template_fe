import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import styles from './LiveClock.module.scss';

/** 머리띠 시계 — 초 단위로 흐른다. 콜론이 1초마다 깜빡인다 */
export function LiveClock() {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 1000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <time className={styles.clock} dateTime={now.toISOString()}>
      <span className={styles.clock__date}>{now.format('YYYY.MM.DD')}</span>
      <span className={styles.clock__time}>
        {now.format('HH')}
        <span className={styles.clock__colon}>:</span>
        {now.format('mm')}
        <span className={styles.clock__colon}>:</span>
        {now.format('ss')}
      </span>
    </time>
  );
}
