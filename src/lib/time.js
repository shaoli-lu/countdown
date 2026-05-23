export function padZero(num, digits = 2) {
  return String(Math.floor(num)).padStart(digits, "0");
}

export function formatWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatStopwatchTime(ms, showHours = false) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  if (showHours || h > 0) {
    return {
      h: padZero(h),
      m: padZero(m),
      s: padZero(s),
      cs: padZero(centiseconds),
    };
  }

  return {
    h: null,
    m: padZero(m),
    s: padZero(s),
    cs: padZero(centiseconds),
  };
}
