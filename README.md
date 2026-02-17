# Subscription Manager (React + Vite + Tailwind)

Gerenciador de assinaturas PWA: CRUD local (localStorage), dashboard com gráficos (Chart.js), alertas de cobrança (Notification API) e modo escuro. Pronto para deploy na Netlify.

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS 3, lucide-react para ícones
- Chart.js + react-chartjs-2
- date-fns para datas
- Armazenamento: localStorage (sem backend)

## Como rodar
```bash
pnpm install
pnpm dev
```
App em http://localhost:5173.

Build/preview de produção:
```bash
pnpm build
pnpm preview
```

## Scripts
- `pnpm dev` – modo desenvolvimento
- `pnpm build` – build produção (tsc + vite build)
- `pnpm preview` – serve build
- `pnpm lint` – lint

## Estrutura
```
src/
  App.tsx               # UI principal, dashboard, filtros, modal
  main.tsx              # bootstrap e registro do service worker
  index.css             # Tailwind base
  hooks/useSubscriptions.ts
  utils/subscriptions.ts  # CRUD localStorage, totais, alertas
  utils/csv.ts            # export CSV
public/
  sw.js                 # service worker básico
  manifest.webmanifest  # PWA
```

## Armazenamento e alertas
- `localStorage` chave `subscriptions`.
- `checkAlerts` dispara Notification API para cobranças nos próximos 7 dias (permite ícone `/icon.png` se adicionado em `public`).

## Deploy na Netlify
- Arquivo `netlify.toml` já define `build = "pnpm build"` e `publish = "dist"`.
- Passos CLI:
  ```bash
  npm i -g netlify-cli   # se precisar
  netlify login
  netlify init           # ou netlify link se já houver site
  netlify deploy --prod
  ```

## PWA
- `manifest.webmanifest` configurado (tema roxo).
- `public/sw.js` registra skipWaiting/claim.
- Registro do SW em `main.tsx` (após load).

## Licença
MIT © 2026 ens-Emilio
