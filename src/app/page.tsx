import { redirect } from 'next/navigation'

// Middleware (src/proxy.ts) already guarantees that any request reaching this
// page is authenticated and has a referral applied — otherwise it would have
// redirected to /login before this component ever rendered.
export default function App() {
  redirect('/mint')
}
