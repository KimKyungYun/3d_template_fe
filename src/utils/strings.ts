/** [3, 4, 5, 9] → '스트링 3~5, 9' — 이어지는 번호는 범위로 묶는다 */
export function stringRangeText(strings: number[]) {
  if (strings.length === 0) return '';

  const parts: string[] = [];
  let start = strings[0];

  for (let i = 1; i <= strings.length; i += 1) {
    if (strings[i] === strings[i - 1] + 1) continue;

    parts.push(start === strings[i - 1] ? `${start}` : `${start}~${strings[i - 1]}`);
    start = strings[i];
  }

  return `스트링 ${parts.join(', ')}`;
}
