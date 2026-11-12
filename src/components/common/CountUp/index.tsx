import { useCountUp } from '@/hooks/useCountUp';
import { formatNumber, formatNumberFixed } from '@/utils/format';

interface CountUpProps {
  value: number;
  fractionDigits?: number;
  duration?: number;
  className?: string;
}

/** 목표 수치까지 굴러 올라가는 숫자. tabular-nums 는 호출부 타이포 믹스인이 맡는다 */
export function CountUp({ value, fractionDigits = 0, duration = 900, className }: CountUpProps) {
  const displayed = useCountUp(value, { duration });

  return (
    <span className={className}>
      {/* 굴러가는 동안만 자릿수를 채워 폭을 고정하고, 다 오르면 끝자리 0 을 지운 최종값으로 적는다 */}
      {Math.abs(displayed - value) < 1e-6 ? formatNumber(value, fractionDigits) : formatNumberFixed(displayed, fractionDigits)}
    </span>
  );
}
