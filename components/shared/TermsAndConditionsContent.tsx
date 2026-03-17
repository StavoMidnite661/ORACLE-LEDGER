import React from 'react';

export const TermsAndConditionsContent: React.FC = () => {
  return (
    <div className="space-y-8 pr-4">
      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">1. Introduction</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt mb-4">
          Welcome to SOVR Ledger (the "Platform"), owned and operated by SOVR Development Holdings LLC ("the Company", "we", "us", or "our"). These Terms and Conditions ("Terms") govern your access to and use of our financial management dashboard, blockchain-integrated ledger, and related services.
        </p>
        <p className="text-sm leading-relaxed text-sov-light-alt font-bold italic">
          PLEASE READ THESE TERMS CAREFULLY. SECTION 14 CONTAINS A BINDING ARBITRATION CLAUSE AND CLASS ACTION WAIVER THAT AFFECTS YOUR LEGAL RIGHTS.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">2. No Financial Advice</h2>
        <div className="bg-sov-gold/5 border border-sov-gold/20 p-4 rounded-xl mb-4">
          <p className="text-xs text-sov-light-alt text-justify leading-relaxed">
            The Platform provides financial management tools and data visualization only. The Company is not a bank, investment advisor, or broker-dealer. No content on the Platform constitutes professional financial, investment, legal, or tax advice. You should consult with qualified professionals before making any financial decisions.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">3. Eligibility & Account Security</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-sov-light-alt text-justify">
          <li><strong>Age:</strong> You must be at least 18 years old or the legal age of majority in your jurisdiction.</li>
          <li><strong>Business Use:</strong> The Platform is designed for business and professional use. By using the Platform, you represent that you have the authority to bind your organization to these Terms.</li>
          <li><strong>Credentials:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and any API keys provided. Any action taken through your account is deemed to be your action.</li>
          <li><strong>Unauthorized Access:</strong> You must notify us immediately of any unauthorized use of your account or security breach.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">3. Financial Services & Stripe Integration</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt mb-4 text-justify">
          The Platform integrates with third-party payment processors, primarily Stripe, Inc. ("Stripe"). Your use of payment features is subject to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-sov-light-alt text-justify">
          <li><strong>Stripe Services Agreement:</strong> You agree to comply with the Stripe Connected Account Agreement and the Stripe Services Agreement.</li>
          <li><strong>ACH Transactions:</strong> Automated Clearing House (ACH) payments are subject to NACHA operating rules. You represent that you have obtained all necessary authorizations for debits or credits initiated through the Platform.</li>
          <li><strong>Compliance:</strong> You are responsible for maintaining PCI-DSS compliance if you handle cardholder data outside of the Platform's provided secure interfaces.</li>
          <li><strong>Fees:</strong> You agree to pay all transaction fees, subscription costs, and other charges as disclosed in the Platform's billing section.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">4. Blockchain & Digital Assets</h2>
        <div className="bg-sov-red/5 border border-sov-red/20 p-4 rounded-xl mb-4">
          <h3 className="text-sov-red text-sm font-bold uppercase mb-2">High-Risk Notice</h3>
          <p className="text-xs text-sov-light-alt text-justify leading-relaxed">
            The Platform provides interfaces for interacting with blockchain networks and smart contracts. Blockchain transactions are irreversible. The Company has no power to reverse, undo, or modify transactions recorded on a distributed ledger. You assume all risks associated with digital asset volatility, smart contract vulnerabilities, and network congestion.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-sm text-sov-light-alt text-justify">
          <li><strong>Non-Custodial:</strong> Unless explicitly stated, the Platform is a non-custodial interface. You retain sole control over your private keys and seed phrases.</li>
          <li><strong>Gas Fees:</strong> You are responsible for all network fees ("gas") required to execute blockchain transactions.</li>
          <li><strong>Regulatory Uncertainty:</strong> Digital asset regulations vary by jurisdiction and are subject to change. You are responsible for ensuring your use of the Platform complies with local laws.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">5. Prohibited Activities</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt mb-2 text-justify">Users are strictly prohibited from:</p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-sov-light-alt text-justify">
          <li>Engaging in money laundering, terrorist financing, or sanctions evasion.</li>
          <li>Attempting to circumvent Platform security or rate-limiting features.</li>
          <li>Using the Platform to facilitate illegal gambling, adult content, or illicit drug sales.</li>
          <li>Reverse engineering or decompiling any portion of the Platform's proprietary code.</li>
          <li>Submitting fraudulent invoices or initiating unauthorized reverse entries in the ACH system.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">6. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify uppercase font-bold">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOVR DEVELOPMENT HOLDINGS LLC AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE PLATFORM; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE PLATFORM; (III) ANY CONTENT OBTAINED FROM THE PLATFORM; AND (IV) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">7. Intellectual Property</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify">
          All code, interface designs, logos, and proprietary workflows within the Platform are the exclusive property of SOVR Development Holdings LLC. No license is granted to users except for the limited right to access and use the Platform for its intended business purposes.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">8. AML/KYC & Compliance</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify mb-4">
          The Company complies with the Bank Secrecy Act (BSA) and related anti-money laundering (AML) regulations. We reserve the right to:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-sov-light-alt text-justify">
          <li>Perform Know Your Customer (KYC) and Know Your Business (KYB) checks on all users.</li>
          <li>Suspend or terminate accounts that fail to provide requested verification data.</li>
          <li>Report suspicious activity to relevant financial authorities (FinCEN, etc.) without notice to the user.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">9. Governing Law & Dispute Resolution</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify">
          These Terms shall be governed and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any dispute arising from these Terms shall be resolved through binding arbitration in Wilmington, DE, under the rules of the American Arbitration Association (AAA).
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">11. Data Privacy & Security</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify">
          Your privacy is paramount. We implement industry-standard encryption (AES-256) and security protocols. However, the transmission of information via the internet is not completely secure. You acknowledge that you provide your personal and financial data at your own risk. We comply with relevant data protection laws, including the principle-based requirements of the GDPR and CCPA, as applicable to our business model.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">12. Audit & Investigation Rights</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify">
          To maintain Platform integrity, the Company reserves the right to audit any transactions or activities originating from your account. This includes the right to request documentation regarding source of funds, business license verification, and tax identification. Failure to cooperate with an investigation may lead to immediate account termination and reporting to regulatory bodies.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">13. Force Majeure</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify uppercase italic">
          THE COMPANY SHALL NOT BE LIABLE FOR ANY DELAY OR FAILURE TO PERFORM RESULTING FROM CAUSES OUTSIDE ITS REASONABLE CONTROL, INCLUDING, BUT NOT LIMITED TO, ACTS OF GOD, WAR, TERRORISM, RIOTS, EMBARGOES, ACTS OF CIVIL OR MILITARY AUTHORITIES, FIRE, FLOODS, ACCIDENTS, STRIKES OR SHORTAGES OF TRANSPORTATION FACILITIES, FUEL, ENERGY, LABOR OR MATERIALS, OR BLOCKCHAIN NETWORK FAILURES.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">14. Dispute Resolution & Class Action Waiver</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify mb-4">
          Any dispute arising from these Terms shall be resolved through binding arbitration in Wilmington, DE, under the rules of the American Arbitration Association (AAA). 
        </p>
        <p className="text-sm leading-relaxed text-sov-accent text-justify font-bold uppercase tracking-tight">
          YOU AGREE THAT ANY CLAIMS WILL BE BROUGHT ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-sov-accent mb-4 uppercase tracking-tighter">15. Contact Information</h2>
        <p className="text-sm leading-relaxed text-sov-light-alt text-justify">
          If you have any questions about these Terms, please contact the SOVR Legal Department at legal@sovr.credit.
        </p>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-700 text-center">
        <p className="text-xs text-sov-light-alt font-mono opacity-50 uppercase tracking-widest">
          Last Updated: February 12, 2026 | Document ID: SOVR-TOS-2026-v1.4
        </p>
      </div>
    </div>
  );
};
