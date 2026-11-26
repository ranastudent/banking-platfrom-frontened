# Frontend Architecture

The project uses a domain/feature-first structure. The root folder contains the single package manifest, Vite configuration, environment examples, and project documentation. `src/` is the only application source tree.

```text
src/
  app/
    providers/       # auth, theme, app-wide providers
    router/          # role guards and route helpers
  components/
    layout/          # portal/public layouts
    shared/          # reusable app-level components
    ui/              # design-system primitives
  features/
    public/          # public pages and auth screens
    auth/            # auth API/types
    customer/
      accounts/      # account API, hooks, pages, types
      deposits/      # deposit API, provider metadata, deposit UI
      pages/         # customer dashboard and customer workflows
      ...
    admin/
      pages/         # admin screens, including deposit management
    ...
    support/
      pages/         # support screens
    ...
    auditor/
      pages/         # read-only auditor screens
  hooks/             # cross-feature hooks
  lib/
    api/             # shared Axios client, token storage, API errors
    utils/           # cross-feature utilities
  styles/            # global styles
  types/             # shared TypeScript types
```

## Boundaries
1. `src/lib/api` owns transport concerns: API base URL, credentials, auth headers, refresh, and normalized errors.
2. A feature owns its endpoint functions, domain types, query/mutation hooks, and pages.
3. `App.tsx` composes route definitions; it should not contain request logic.
4. UI components in `src/components/ui` are presentation-only and reusable.
5. Role guards protect navigation only. Backend authorization remains authoritative.
6. Do not duplicate root package/tool configuration inside `src/`.
