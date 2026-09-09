import PublicShell from './PublicShell'

export default function PrivacyPolicy() {
  return (
    <PublicShell>
      <section className="marketing-hero marketing-hero--compact">
        <p className="marketing-hero__eyebrow">Privacy Policy</p>
        <h1 className="marketing-hero__headline">How HomeValue handles your data.</h1>
        <p className="marketing-hero__sub">
          Last updated: September 2026. HomeValue is an individual student portfolio project, not a
          registered company. This page explains, plainly, what is collected and why.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Who operates this site</p>
        <p className="marketing-about-copy">
          HomeValue is built and operated by Stephan Wasalathanthrige as a personal, non-commercial
          portfolio project. There is no company, no billing, and no sale of any data to anyone. You
          can reach the operator directly at{' '}
          <a href="mailto:stephanwasalathanthrige@gmail.com">stephanwasalathanthrige@gmail.com</a>.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">What is collected</p>
        <p className="marketing-about-copy">
          Creating an account collects your email address, a hashed and salted password, and an
          optional display name. Using the app may create additional records tied to your account:
          saved properties (label, notes, and the model's 8 input features), prediction history, and
          your notification log. If you use the optional "describe your property in plain English"
          feature, the text you type is sent to Google's Gemini API to extract structured field
          values; that request text is not saved on the HomeValue server beyond the single request.
          Interface preferences (theme, glass intensity, motion, density, notification toggles) are
          stored only in your browser.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Why it is collected</p>
        <p className="marketing-about-copy">
          Your email and password exist solely to authenticate you and keep your saved properties and
          predictions private to your account. Saved properties and predictions exist because they are
          the core function of the app: without storing them, there would be no history, comparison,
          or dashboard to show you. Nothing is collected for advertising, resale, or profiling.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Cookies and browser storage</p>
        <p className="marketing-about-copy">
          HomeValue does not set cookies and does not use any analytics, advertising, or tracking
          scripts. Your session token is kept in your browser's localStorage (if "remember me" is
          checked at login) or sessionStorage (if not), so the app can tell the backend who you are on
          each request. A small amount of localStorage also holds your UI preferences and a temporary
          property-comparison list. None of this is shared with any third party or used to track you
          across other sites.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Third-party services</p>
        <p className="marketing-about-copy">
          The backend is hosted on Microsoft Azure App Service and the frontend on Vercel; both
          process traffic (including your IP address) as part of normal web hosting. Page fonts are
          loaded from Google Fonts, which means your browser makes a direct request to Google's
          servers, sharing your IP address with Google in the process. If you use the free-text
          property description feature, the text you enter is sent to Google's Gemini API to be
          converted into structured property values. No other third-party services are used.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Data retention</p>
        <p className="marketing-about-copy">
          Your account data is retained until you delete your account. Deleting your account (in
          Settings &gt; Privacy) permanently removes your account, saved properties, and prediction
          history from the database; this action cannot be undone. As this is a demo project, backups
          and long-term retention schedules are not formally defined.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Data security</p>
        <p className="marketing-about-copy">
          Passwords are hashed and salted before storage; they are never stored or logged in plain
          text. Sessions use signed JWTs. As with any individual project, no absolute guarantee of
          security can be made, and this application has not been through a formal third-party
          security audit.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Your rights</p>
        <p className="marketing-about-copy">
          You can export a JSON copy of your saved properties and prediction history at any time from
          Settings &gt; Privacy. You can permanently delete your account and all associated data from
          the same page. You can also email the operator directly with any question, correction, or
          deletion request.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Changes to this policy</p>
        <p className="marketing-about-copy">
          If this policy changes, the "last updated" date at the top of this page will change too.
          Continued use of the app after an update means you accept the revised policy.
        </p>
      </section>
    </PublicShell>
  )
}
