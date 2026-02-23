import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" search={{}} to="/">
          KikiChoice
        </Link>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
