import { Fragment } from "react";

// 本文中の "**強調したい部分**" を、太字+色付きのテキストに変換して表示する。
// お客様が読む解説文の中で、特に大事な一文だけを目立たせるための簡易記法。
export function Emphasized({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-rose-700">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
