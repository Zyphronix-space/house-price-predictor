import PublicShell from './PublicShell'

export default function Terms() {
  return (
    <PublicShell>
      <section className="marketing-hero marketing-hero--compact">
        <p className="marketing-hero__eyebrow">Terms and Conditions</p>
        <h1 className="marketing-hero__headline">The rules for using HomeValue.</h1>
        <p className="marketing-hero__sub">
          Last updated: September 2026. Please read these terms before creating an account or using
          the app.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">What HomeValue is</p>
        <p className="marketing-about-copy">
          HomeValue is an individual, non-commercial portfolio project built by Stephan
          Wasalathanthrige to demonstrate a machine-learning application end to end. It is not a
          licensed property appraisal service, a real estate brokerage, or a financial advisory
          service. Every valuation, comparable, what-if figure, and investment calculation is a
          model-generated or formula-based estimate for demonstration purposes only, and must not be
          relied on for an actual real estate, financial, or investment decision.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Accounts</p>
        <p className="marketing-about-copy">
          You must provide a working email address to create an account and are responsible for
          keeping your password confidential. You must be old enough, under the laws that apply to
          you, to agree to these terms. You may delete your account at any time from Settings &gt;
          Privacy.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Acceptable use</p>
        <p className="marketing-about-copy">
          You agree not to attempt to disrupt, overload, or gain unauthorized access to the
          application or its underlying infrastructure, and not to use the account system, the
          free-text description feature, or any other part of the app to submit unlawful, abusive, or
          malicious content.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Intellectual property</p>
        <p className="marketing-about-copy">
          The HomeValue name, interface design, and original source code belong to Stephan
          Wasalathanthrige. The underlying training data is the public California Housing dataset. You
          retain ownership of the property labels, notes, and free-text descriptions you enter.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">No payments</p>
        <p className="marketing-about-copy">
          HomeValue does not charge for access and has no billing, subscriptions, or refunds, because
          no payment functionality exists in the app.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Third-party services</p>
        <p className="marketing-about-copy">
          The app relies on third-party infrastructure, including Microsoft Azure, Vercel, Google
          Fonts, and, for the optional free-text description feature, Google's Gemini API. Their
          availability and performance are outside the operator's control.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Availability and changes</p>
        <p className="marketing-about-copy">
          As a demo project, HomeValue is provided on a best-effort basis with no uptime guarantee. It
          may be modified, temporarily unavailable, or discontinued at any time without prior notice.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Limitation of liability</p>
        <p className="marketing-about-copy">
          HomeValue is provided "as is," without warranties of any kind. To the fullest extent
          permitted by law, the operator is not liable for any loss or damage arising from your use of
          the app, including decisions made based on its estimates.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Governing law</p>
        <p className="marketing-about-copy">
          These terms are intended to be interpreted reasonably and in good faith. As this project is
          not tied to a single formal jurisdiction of incorporation, any dispute should first be raised
          directly with the operator by email before pursuing any other avenue.
        </p>
      </section>

      <section className="hv-card marketing-about-block">
        <p className="hv-label">Contact</p>
        <p className="marketing-about-copy">
          Questions about these terms can be sent to{' '}
          <a href="mailto:stephanwasalathanthrige@gmail.com">stephanwasalathanthrige@gmail.com</a>.
        </p>
      </section>
    </PublicShell>
  )
}
