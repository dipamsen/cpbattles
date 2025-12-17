import { useEffect, useState, useRef } from "react";
import { BASE_API_URL } from "../hooks/useAuth";

export default function Countdown({
  targetTime,
  onZero,
}: {
  targetTime: Date;
  onZero: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const serverTimeRef = useRef<number | null>(null);
  const performanceTimeRef = useRef<number>(0);
  const hasCalledOnZero = useRef(false);

  useEffect(() => {
    // fetch server time on loading
    // time = serverTime + (performance.now() - performanceTimeAtFetch)
    const fetchServerTime = async () => {
      try {
        const beforeRequest = performance.now();
        const response = await fetch(`${BASE_API_URL}/time`);
        const afterRequest = performance.now();
        const data = await response.json();
        const networkLatency = (afterRequest - beforeRequest) / 2;
        performanceTimeRef.current = beforeRequest + networkLatency;
        serverTimeRef.current = data.serverTime;
      } catch (error) {
        console.warn("Failed to fetch server time, falling back to local time:", error);
        performanceTimeRef.current = performance.now();
        serverTimeRef.current = Date.now();
      }
    };

    fetchServerTime();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (serverTimeRef.current === null) return;
      
      const elapsed = performance.now() - performanceTimeRef.current;
      const currentServerTime = serverTimeRef.current + elapsed;
      
      const tl = calculateTimeLeft(targetTime, currentServerTime);
      setTimeLeft(tl);
      if (tl.hours <= 0 && tl.minutes <= 0 && tl.seconds <= 0 && !hasCalledOnZero.current) {
        hasCalledOnZero.current = true;
        clearInterval(interval);
        onZero();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onZero]);

  return <p className="text-2xl font-bold">{formatTimeLeft(timeLeft)}</p>;
}

function calculateTimeLeft(targetTime: Date, currentServerTime: number) {
  const diff = targetTime.getTime() - currentServerTime;
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

function formatTimeLeft(timeLeft: {
  hours: number;
  minutes: number;
  seconds: number;
}) {
  return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
}
