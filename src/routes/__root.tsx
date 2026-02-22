import { Link, Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <div className="app-shell">
        <header className="topbar">
          <Link className="brand" to="/">
            KikiChoice
          </Link>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  )
}
