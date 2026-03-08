import Footer from './Footer'

function Legal() {
  return (
    <div className="auth-shell">
      <div>
        <div className="auth-card">
          <div className="brand-lockup">
            <img className="brand-logo" src="/Pragyanovation_Logo.jpg" alt="Pragyanovation" />
            <div className="brand-text">
              <h1>Privacy Policy & Terms of Use</h1>
            </div>
          </div>

          <p>
            Please review the Privacy Policy and Terms of Use for this product. By creating an admin account or submitting a form, you
            agree to these terms.
          </p>

          <h3 style={{ marginTop: '1rem' }}>Key points</h3>
          <div style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            <p style={{ marginTop: 0 }}>
              - Public form submissions are provided to the Admin who published the form.
              <br />- You should not submit sensitive information unless you trust the Admin collecting it.
              <br />- The product is provided “AS IS” and “AS AVAILABLE”.
              <br />- If enabled, advertising such as Google AdSense may be displayed and may use cookies.
            </p>
          </div>

          <p style={{ marginTop: '1rem' }}>
            Full text is available in the product documentation:
            <br />
            <a href="https://github.com/Dr-Satya/PDF_Form_Digitization/blob/master/docs/Privacy-Policy-and-Third-Party-Licenses.md" target="_blank" rel="noreferrer">
              Privacy-Policy-and-Third-Party-Licenses.md
            </a>
          </p>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default Legal
