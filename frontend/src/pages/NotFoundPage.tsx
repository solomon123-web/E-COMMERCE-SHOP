import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container page-space empty-state-box">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you requested could not be found.</p>
      <Link to="/" className="primary-button">Back to home</Link>
    </div>
  );
}
