import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
    <h1 className="text-9xl font-bold text-gray-200">404</h1>
    <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
    <p className="text-muted-foreground mt-2 mb-6">
      The page you are looking for does not exist.
    </p>
    <Link
      to="/"
      className="px-6 py-2 bg-primary text-white rounded-md text-sm font-medium hover:opacity-90"
    >
      Go Home
    </Link>
  </div>
);

export default NotFoundPage;
