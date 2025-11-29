import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Footer } from './layouts/Layout';
import { Home } from './pages/Home';
import { CaseStudy } from './pages/CaseStudy';
import { Playgrounds } from './pages/Playgrounds';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/case-study" element={<CaseStudy />} />
            <Route path="/playgrounds" element={<Playgrounds />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router >
  );
}

export default App;
