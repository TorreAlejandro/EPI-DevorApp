import { useState } from 'react'
import LoginPage from './views/LoginPage'
import RegisterPage from './views/RegisterPage'
import './App.css'

type View = 'login' | 'register'

function App() {
  const [view, setView] = useState<View>('login')

  return (
    <div className="app-container">
      {view === 'login'
        ? <LoginPage onSwitch={() => setView('register')} />
        : <RegisterPage onSwitch={() => setView('login')} />
      }
    </div>
  )
}

export default App
