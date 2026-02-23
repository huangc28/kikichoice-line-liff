import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要內容
      </a>
      <header className="topbar">
        <Link className="brand" search={{}} to="/">
          KikiChoice
        </Link>
      </header>
      <main className="content" id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
