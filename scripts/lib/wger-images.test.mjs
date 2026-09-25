import { describe, expect, it } from "vitest";
import { pickFormImages } from "./wger-images.mjs";

const base = "https://wger.de/media/exercise-images";

describe("pickFormImages", () => {
  it("連番の組(-1, -2)が写真に挟まれていても、組だけを連番順で返す", () => {
    const urls = [
      `${base}/97/Dumbbell-bench-press-1.png.400x400_q85.jpg`,
      `${base}/75/7b700f5d-17fc-41a9-bd41-e98e45c15768.png`,
      `${base}/97/Dumbbell-bench-press-2.png.400x400_q85.jpg`,
    ];
    expect(pickFormImages(urls)).toEqual([urls[0], urls[2]]);
  });

  it("連番が逆順に並んでいても-1, -2の順にそろえる", () => {
    const urls = [
      `${base}/148/lateral-dumbbell-raises-large-2.png.400x400_q85.jpg`,
      `${base}/148/lateral-dumbbell-raises-large-1.png.400x400_q85.jpg`,
    ];
    expect(pickFormImages(urls)).toEqual([urls[1], urls[0]]);
  });

  it("連番の組が無ければ、元の並びのまま返す", () => {
    const urls = [`${base}/458/a.png`, `${base}/458/b.png`, `${base}/458/c.png`];
    expect(pickFormImages(urls)).toEqual(urls);
  });

  it("連番が1枚しかなければ、元の並びのまま返す", () => {
    const urls = [`${base}/1/x-1.png`, `${base}/1/photo.png`];
    expect(pickFormImages(urls)).toEqual(urls);
  });

  it("画像が無ければ空配列", () => {
    expect(pickFormImages([])).toEqual([]);
  });
});
