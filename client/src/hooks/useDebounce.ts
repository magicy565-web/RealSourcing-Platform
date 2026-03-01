import { useState, useEffect } from "react";

/**
 * useDebounce — 通用防抖 Hook
 *
 * 使用场景：搜索框输入防抖，避免每次按键都触发 API 请求
 *
 * @param value   需要防抖的值
 * @param delay   防抖延迟（毫秒），默认 300ms
 * @returns       防抖后的稳定值
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
