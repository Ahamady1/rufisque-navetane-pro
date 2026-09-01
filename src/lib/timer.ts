import { useEffect, useState } from 'react';
import type { Match } from './supabase';

export type TimerState = {
  running: boolean;
  currentMs: number;
  displayMinute: string;
  displayTime: string;
  totalMinutes: number;
  totalSeconds: number;
};

export function getTimerState(m: Match, now: number = Date.now()): TimerState {
  const halfMs = m.timer_half_minutes * 60_000;

  let elapsedMs = m.timer_offset_ms;

  if (m.timer_started_at && !m.timer_paused_at) {
    const started = new Date(m.timer_started_at).getTime();
    if (!isNaN(started)) {
      elapsedMs += now - started;
    }
  } else if (!m.timer_started_at && m.status === 'live') {
    const started = new Date(m.match_date).getTime();
    if (!isNaN(started) && now > started) {
      elapsedMs += now - started;
    }
  }

  const running = (m.status === 'live') && !m.timer_paused_at;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const overtimeMs = elapsedMs - m.timer_half * halfMs;
  let displayMinute: string;

  if (m.timer_half === 1) {
    if (overtimeMs > 0) {
      displayMinute = `${m.timer_half_minutes}+${Math.max(1, Math.floor(overtimeMs / 60_000))}'`;
    } else {
      displayMinute = `${Math.max(0, totalMinutes)}'`;
    }
  } else {
    const minSecond = totalMinutes - m.timer_half_minutes;
    if (overtimeMs > 0) {
      displayMinute = `${m.timer_half_minutes * 2}+${Math.max(1, Math.floor(overtimeMs / 60_000))}'`;
    } else {
      displayMinute = `${Math.max(m.timer_half_minutes, minSecond)}'`;
    }
  }

  const displayTime = `${String(totalMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return { running, currentMs: elapsedMs, displayMinute, displayTime, totalMinutes, totalSeconds };
}

export function useNow(intervalMs: number = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
