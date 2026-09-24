import { useEffect, useState } from "react";
import FeedPage from "./components/FeedPage.jsx";
import SubmitClaimPage from "./components/SubmitClaimPage.jsx";
import ClaimDetailPage from "./components/ClaimDetailPage.jsx";
import ReviewerPage from "./components/ReviewerPage.jsx";

function parseHash() {
  const hash = window.location.hash || "#feed";
  if (hash === "#submit-claim") {
    return { page: "submit" };
  }
  if (hash.startsWith("#reviewer")) {
    const queryIdx = hash.indexOf("?");
    let claimId = null;
    if (queryIdx !== -1) {
      const searchParams = new URLSearchParams(hash.slice(queryIdx + 1));
      claimId = searchParams.get("claimId");
    }
    return { page: "reviewer", claimId };
  }
  if (hash.startsWith("#claim/")) {
    const claimId = hash.replace("#claim/", "");
    return { page: "detail", claimId };
  }
  return { page: "feed" };
}

function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const syncRouteWithHash = () => setRoute(parseHash());

    window.addEventListener("hashchange", syncRouteWithHash);
    return () => window.removeEventListener("hashchange", syncRouteWithHash);
  }, []);

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="layout-container header-content">
          <a className="brand" href="#feed" aria-label="TruthLens home">
            <span className="brand-mark" aria-hidden="true">
              T
            </span>
            <span>TruthLens</span>
          </a>

          <nav className="primary-nav" aria-label="Primary navigation">
            <a
              className={route.page === "feed" ? "is-active" : undefined}
              href="#feed"
              aria-current={route.page === "feed" ? "page" : undefined}
            >
              Public Feed
            </a>
            <a
              className={route.page === "submit" ? "is-active" : undefined}
              href="#submit-claim"
              aria-current={route.page === "submit" ? "page" : undefined}
            >
              Submit Claim
            </a>
            <a
              className={route.page === "reviewer" ? "is-active" : undefined}
              href="#reviewer"
              aria-current={route.page === "reviewer" ? "page" : undefined}
            >
              Reviewer Dashboard
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <div className="layout-container page-content">
          {route.page === "submit" && <SubmitClaimPage />}
          {route.page === "reviewer" && (
            <ReviewerPage initialClaimId={route.claimId} key={route.claimId || "reviewer-root"} />
          )}
          {route.page === "detail" && (
            <ClaimDetailPage claimId={route.claimId} key={route.claimId} />
          )}
          {route.page === "feed" && <FeedPage />}
        </div>
      </main>

      <footer className="site-footer">
        <div className="layout-container footer-content-wrap">
          <p>TruthLens &mdash; Civic Misinformation Triage &amp; Human Review Platform</p>
          <div className="footer-links">
            <a href="#feed">Feed (DP1 Order)</a>
            <span className="dot-sep">&bull;</span>
            <a href="#submit-claim">Submit Claim</a>
            <span className="dot-sep">&bull;</span>
            <a href="#reviewer">Reviewer Portal (No Auth)</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
