import { Suspense } from 'react'
import LoginContent from './LoginContent'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-white/70">
          <div className="border border-black p-6 rounded-md shadow-md bg-white">
            <p className="text-lg">Cargando login...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
