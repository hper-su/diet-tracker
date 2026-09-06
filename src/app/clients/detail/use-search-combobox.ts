"use client";

import { useRef, useState } from "react";

// FoodPicker/ExercisePickerで共通の「入力しながら候補を絞り込むコンボボックス」の
// 開閉状態・ハイライト位置・blur遅延(候補クリックがblurより先に発火するようにする)を
// まとめたフック。候補の絞り込みロジックや見た目は呼び出し側に任せる。
export function useSearchCombobox() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelBlur() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
  }

  function scheduleBlur() {
    blurTimeout.current = setTimeout(() => setIsOpen(false), 150);
  }

  // optionCount: 現在選択可能な候補の総数(呼び出し側で「自由入力」等の
  // 追加行を末尾に足している場合はその分も含めた数)。
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    optionCount: number,
    onSelect: (index: number) => void,
  ) {
    if (!isOpen || optionCount === 0) {
      // 候補がない状態でEnterを押すと、テキスト入力自体は値を持っているため
      // フォームのネイティブsubmitが発火してしまう(選択されていないのに送信される)。
      // 候補を選べない以上ここでは何もしないが、意図しない送信だけは防ぐ。
      if (isOpen && e.key === "Enter") {
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, optionCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(highlighted);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function reset() {
    setQuery("");
    setIsOpen(false);
    setHighlighted(0);
  }

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    highlighted,
    setHighlighted,
    cancelBlur,
    scheduleBlur,
    handleKeyDown,
    reset,
  };
}
