import { Link } from 'react-router-dom'
import PublicNav from './PublicNav'
import './Marketing.css'

export default function PublicShell({ children }) {
  return (
    <div className="hv-app">
      <PublicNav />
      <main className="hv-main marketing-main">{children}</main>
      <footer className="marketing-footer">
        <p>
          <Link to="/">HomeValue</Link>: an AI real estate intelligence portfolio project. Not a
          licensed appraisal service.
        </p>
        <nav className="marketing-footer__links" aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms and Conditions</Link>
          <a href="mailto:stephanwasalathanthrige@gmail.com">Contact</a>
        </nav>
      </footer>
    </div>
  )
}
