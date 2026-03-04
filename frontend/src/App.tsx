import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import './App.css'

type View = 'login' | 'register'

function App() {
  const [view, setView] = useState<View>('login')

  return (
    <div className="app-container">
      {view === 'login'
        ? <Login onSwitch={() => setView('register')} />
        : <Register onSwitch={() => setView('login')} />
      }
    </div>
  )
}

export default App
