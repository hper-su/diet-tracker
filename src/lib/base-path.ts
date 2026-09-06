// next.config.ts の `env` 経由でビルド時に埋め込まれる値。GitHub Pages配信時
// (npm run deploy)は "/diet-tracker"、それ以外(ローカルのdev/serve)は空文字列になる。
// next/metadataのmanifest/iconsやService Worker登録先など、Next.jsの<Link>/
// next/navigation経由の遷移とは違い、basePathが自動で付与されない箇所で使う。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
