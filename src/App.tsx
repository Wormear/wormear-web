import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Method from './pages/Method';
import SongsPage from './pages/SongsPage';
import GamesPage from './pages/GamesPage';
import Parents from './pages/Parents';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import GetStarted from './pages/GetStarted';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RequireAuth from './pages/app/RequireAuth';
import AppLayout from './pages/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import AppLearn from './pages/app/AppLearn';
import AppLesson from './pages/app/AppLesson';
import AppSongs from './pages/app/AppSongs';
import AppSongDetail from './pages/app/AppSongDetail';
import AppProgress from './pages/app/AppProgress';
import PracticeHub from './pages/app/PracticeHub';
import PracticeSetup from './pages/app/PracticeSetup';
import GamePlay from './pages/app/GamePlay';
import Assessment from './pages/app/Assessment';
import History from './pages/app/History';
import Profile from './pages/app/Profile';
import AppSettings from './pages/app/AppSettings';
import Premium from './pages/app/Premium';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const inApp = pathname.startsWith('/app');
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollToTop />
      {inApp ? null : <Navbar />}
      <div id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/method" element={<Method />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/get-started" element={<GetStarted />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="learn" element={<AppLearn />} />
              <Route path="lessons/:id" element={<AppLesson />} />
              <Route path="songs" element={<AppSongs />} />
              <Route path="songs/:id" element={<AppSongDetail />} />
              <Route path="progress" element={<AppProgress />} />
              <Route path="practice" element={<PracticeHub />} />
              <Route path="setup" element={<PracticeSetup />} />
              <Route path="games/:kind" element={<GamePlay />} />
              <Route path="assessment" element={<Assessment />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="premium" element={<Premium />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {inApp ? null : <Footer />}
    </>
  );
}
