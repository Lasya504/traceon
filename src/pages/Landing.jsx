import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="app-shell flex flex-col items-center justify-center px-6 page-in text-center">
      <Logo size={96} className="mb-6" />
      
      <h1 className="mb-3">TraceOn</h1>
      
      <p className="text-[17px] text-text-secondary font-medium mb-12">
        Track today. Own tomorrow.
      </p>

      <div className="w-full max-w-[280px]">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
