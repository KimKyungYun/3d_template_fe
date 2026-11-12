import { useState } from 'react';
import { HudPanel } from '@/components/common/HudPanel';
import { FAULT_CODES } from '@/configs/faultCodes';
import { cn } from '@/utils/cn';
import { useInverterScope } from '../hooks/useInverterScope';
import styles from './FaultGuide.module.scss';

/** 고장코드 안내 — 무엇이 문제인지와 현장 조치 순서. 조치 줄은 눌러 체크해 가며 본다 (저장하지 않음) */
export function FaultGuide() {
  const { alert, diag } = useInverterScope();
  const [done, setDone] = useState<number[]>([]);
  const code = alert?.faultCode ?? diag?.faultCode ?? null;

  if (alert?.status === 'commLost') {
    return (
      <HudPanel title="통신단절" order={1}>
        <ol className={styles.guide__plan}>
          <li>RTU 결선 탭에서 끊긴 포트를 확인합니다.</li>
          <li>해당 장비의 RS485 A·B 단자 체결과 전원 램프를 확인합니다.</li>
          <li>인버터 표시창이 켜져 있으면 통신 설정(국번·속도)을 확인합니다.</li>
        </ol>
      </HudPanel>
    );
  }

  if (!code) return null;

  const fault = FAULT_CODES[code];

  return (
    <HudPanel title={`${fault.label} · 코드 ${code}`} order={1}>
      <div className={styles.guide}>
        <p className={styles.guide__summary}>{fault.summary}</p>
        <ul className={styles.guide__description}>
          {fault.description.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <span className={styles.guide__head}>현장 조치</span>
        <ol className={styles.guide__plan}>
          {fault.plan.map((line, i) => (
            <li key={line}>
              <button
                type="button"
                className={cn(styles.guide__step, { [styles['guide__step--done']]: done.includes(i) })}
                onClick={() => setDone((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))}
                aria-pressed={done.includes(i)}
              >
                <span className={styles.guide__check} aria-hidden>{done.includes(i) ? '✓' : i + 1}</span>
                {line}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </HudPanel>
  );
}
