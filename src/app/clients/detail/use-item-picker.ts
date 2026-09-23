"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useSearchCombobox } from "./use-search-combobox";

const MAX_RESULTS = 20;

export type ItemPickerHandle = {
  reset: () => void;
};

// FoodPicker・ExercisePickerで共通する「入力しながら候補を絞り込むコンボボックス」の
// 状態管理(選択状態・検索語・開閉状態・候補一覧の絞り込み・required時のカスタム
// バリデーション・キーボード操作)をまとめたフック。候補の見た目(一覧の各行の
// 表示内容)や検索条件・選択時に入力欄へ入れるラベルは呼び出し側に委ねる。
export function useItemPicker<T>({
  items,
  ref,
  getId,
  matches,
  formatLabel,
  required,
  defaultItem,
  requiredMessage,
}: {
  items: T[];
  ref: React.Ref<ItemPickerHandle>;
  getId: (item: T) => string;
  matches: (item: T, query: string) => boolean;
  formatLabel: (item: T) => string;
  required?: boolean;
  defaultItem?: T | null;
  requiredMessage: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultItem ? getId(defaultItem) : null,
  );
  const combo = useSearchCombobox();
  const { query, setQuery, isOpen, setIsOpen, highlighted } = combo;
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    reset() {
      setSelectedId(null);
      combo.reset();
    },
  }));

  // 編集フォームなど、既存の選択済み項目をあらかじめ表示したい場合に使う
  // (defaultValueと同様、マウント時の初期表示だけに使い、以後の変化は追わない)。
  useEffect(() => {
    if (defaultItem) {
      setQuery(formatLabel(defaultItem));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // requiredはvalue(=selectedId)ではなく見た目上のテキスト欄に付いていると、
  // 候補を選ばず文字だけ入力した状態でもネイティブのバリデーションを通ってしまう。
  // selectedIdの有無で独自にカスタムバリデーションメッセージを出す。
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && selectedId === null ? requiredMessage : "",
    );
  }, [required, selectedId, requiredMessage]);

  const trimmed = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmed) return [];
    return items.filter((item) => matches(item, trimmed)).slice(0, MAX_RESULTS);
  }, [items, trimmed, matches]);

  function select(item: T) {
    setSelectedId(getId(item));
    setQuery(formatLabel(item));
    setIsOpen(false);
  }

  return {
    selectedId,
    results,
    highlighted,
    isOpen,
    select,
    cancelBlur: combo.cancelBlur,
    inputProps: {
      ref: inputRef,
      value: query,
      autoComplete: "off" as const,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setSelectedId(null);
        setIsOpen(true);
        combo.setHighlighted(0);
      },
      onFocus: () => setIsOpen(true),
      onBlur: combo.scheduleBlur,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
        combo.handleKeyDown(e, results.length, (index: number) => select(results[index])),
    },
  };
}
