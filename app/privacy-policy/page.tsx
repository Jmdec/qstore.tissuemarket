import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Quanta Paper",
  description:
    "How Quanta Paper Corporation collects, uses, discloses, and protects your personal data, in compliance with the Data Privacy Act of 2012.",
};

/*
 * Quanta Paper brand palette (hardcoded on this page only):
 *   Quanta Green      #00A552  primary: accents, hover
 *   Heritage Forest   #006B3F  secondary: links, eyebrow, hover text
 *   Graphite Black    #252927  headings and body text
 *   Industrial Silver #C6C8C5  borders, rules
 *   Paper White       #F8F7F4  page background
 */

const LINK_CLASS =
  "text-[#006B3F] underline underline-offset-2 hover:text-[#00A552]";

const STRONG_CLASS = "font-semibold text-[#252927]";

const CALLOUT_CLASS = "rounded-xl border border-[#C6C8C5] bg-[#00A552]/5 p-4";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: "privacy-policy",
    title: "I. Privacy Policy",
    body: (
      <>
        <p>
          In compliance with the Data Privacy Act of 2012 (&quot;DPA&quot;),
          Quanta Paper Corporation hereby declares its commitment to protect the
          confidentiality of your personal data against unauthorized use or
          disclosure.
        </p>
        <p>
          Quanta Paper Corporation commits to uphold your rights under the DPA
          with respect to the collecting, processing, storing, and disposing of
          your personal data.
        </p>
        <p>
          By continuing to use the platform, products and website services, you
          signify that you have read, understood, and consented to the
          collection and use of your Customer Data, particularly your Personal
          Information, in accordance with this Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "collection",
    title: "II. Collection of Customer Data",
    body: (
      <>
        <p>
          As part of our continuing relationship with you, we collect your
          Customer Data, as may be applicable. Customer Data is either Personal
          Information or Non-Personal Information:
        </p>
        <ul className="list-disc space-y-2.5 pl-5 marker:text-[#006B3F]">
          <li>
            <span className={STRONG_CLASS}>Personal Information</span> is any
            information from which the identity of an individual can be
            reasonably and directly ascertained, or when put together with other
            information would directly and certainly identify an individual —
            such as name, gender, date of birth, address, telephone/mobile
            number, email address, and proof of identification. It also includes
            information about:
            <ul className="mt-2 list-[circle] space-y-1.5 pl-5 marker:text-[#006B3F]">
              <li>
                the services provided to you, such as the platform for ordering,
                location information, and certain information about your
                account, as required by law;
              </li>
              <li>
                the location of your device whenever you are connected to our
                platform/site; and
              </li>
              <li>
                your use of our network, platform, network performance
                experience, and diagnostics — such as site speed, landing pages,
                data failures, exit pages, and data analytics — to help us
                improve our site/network and quality of products and services,
                determine tailored content, and for other legitimate business
                purposes.
              </li>
            </ul>
          </li>
          <li>
            <span className={STRONG_CLASS}>Non-Personal Information</span> is
            any information that does not identify you individually, and
            includes statistical and analytical data, and anonymous and
            aggregate reports.
          </li>
        </ul>
        <p>
          We may also request you to update your Personal Information from time
          to time. Should you be unable to supply us with the required Personal
          Information, we may be unable to provide you with your requested
          products and services, and you may be unable to participate in our
          events, promotions or other activities. When you use our website and
          electronically communicate with us, depending on your settings, we may
          use cookies, web beacons, small data text files or similar
          technologies to identify your device and record your preferences, with
          your consent.
        </p>
        <p>We also collect the following:</p>

        <div className={CALLOUT_CLASS}>
          <p className={STRONG_CLASS}>Cookies</p>
          <p className="mt-2">
            We (or third party service providers on our behalf) may set and
            access Cookies and similar technologies on your computer. A Cookie
            is a small piece of data (often including a unique identifier) that
            is stored on your computer or mobile device by your web browser when
            you visit a website. We use Cookies to understand site usage and
            improve the content and offerings on our site and in other media, to
            control the display of ads, to track usage patterns, to deliver
            editorial content, to record requests for subscriptions, and to
            personalize the content that you see on our site. We (or third party
            service providers on our behalf) may also use Cookies to collect
            aggregate information about website users on an anonymous basis
            (&quot;Anonymous Information&quot;). We may share aggregate
            demographics and usage information with our prospective and actual
            business partners, advertisers and other third parties for any
            business purpose.
          </p>
          <p className="mt-2">
            Some of our third party partners (including advertisers and
            marketing services companies) may set and access Cookies and similar
            technologies on your computer as well, or we may do so on their
            behalf. We do not have control over how these third parties use such
            Cookies and similar technologies or the information derived
            therefrom.
          </p>
          <p className="mt-2">
            Most web browsers can be set to disable the use of Cookies. However,
            if you disable Cookies, you may not be able to access full
            functionality of the site correctly or at all. We never place
            Personally Identifiable Information on Cookies.
          </p>
        </div>

        <div className={CALLOUT_CLASS}>
          <p className={STRONG_CLASS}>IP Address</p>
          <p className="mt-2">
            Your Internet Protocol (&quot;IP&quot;) address is usually
            associated with the place from which you enter the internet, like
            your Internet Service Provider, your company, or your university.
            Our server may also record the referring page that linked you to us;
            the pages you visit on our site; the websites you visit after this
            website; the ads you see and click on; other information about the
            type of web browser, computer operating system, device, platform,
            related software and settings you are using; any search terms you
            have entered on this website or a referral site; and other web usage
            activity and data logged by our web servers. We may use your IP
            address to help diagnose problems with our servers, gather broad
            demographic information, and analyze trends among our users to help
            us improve and administer the site. We may also link this
            information with your Personally Identifiable Information when we
            feel it is necessary to enforce compliance with our rules, policies,
            or terms of service, or to protect our site, customers, or others.
          </p>
        </div>

        <div className={CALLOUT_CLASS}>
          <p className={STRONG_CLASS}>Third Party Tracking Tools</p>
          <p className="mt-2">
            We also use third party tracking tools to improve the performance
            and features of the site. These tools are designed to collect only
            Non-Personal Information about your use of the site. However, such
            tools are created and managed by parties outside our control. As
            such, we are not responsible for what information is actually
            captured by such third parties or how they use and protect that
            information.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "use",
    title: "III. Use of Customer Data",
    body: (
      <>
        <p>
          Without limiting the generality of the foregoing, we use Customer Data
          to, among others:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-[#006B3F]">
          <li>Provide e-commerce services, including customer support;</li>
          <li>
            Enhance your customer experience and determine tailored content to
            meet your preferences and needs;
          </li>
          <li>Communicate relevant services and/or advisories to you;</li>
          <li>
            Abide by any safety, security, public service or legal requirements
            and processes; and
          </li>
          <li>
            Process information for statistical, analytical, and research
            purposes.
          </li>
        </ul>
        <p>
          We use your Personal Information to the extent necessary to comply
          with the requirements of the law and legal process, such as a court
          order; to comply with a legal obligation; or to prevent imminent harm
          to public security, safety or order.
        </p>
        <p>
          We use your Non-Personal Information for statistical, analytical, and
          research purposes to create anonymous and aggregate reports.
        </p>
        <p>
          When required by this Privacy Policy and the law, and before we use or
          process your Customer Data for any other purpose, we will ask for your
          consent.
        </p>
        <p>
          We outsource or contract the processing of Customer Data to third
          parties — such as payment gateways, fraud systems, vendors, service
          providers, partners, or other platform operators — to fulfill any of
          the above purposes. They are only authorized to use Customer Data for
          such contracted purposes. They may have access to Customer Data for a
          limited time under reasonable contractual and technical safeguards to
          limit their use of such information. We require them to protect
          Customer Data consistent with this Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "disclosure",
    title: "IV. Disclosure of Your Information",
    body: (
      <>
        <p>
          In addition to the other disclosures described in this policy, we may
          (and you authorize us to) share or disclose Personally Identifiable
          Information about you to other companies or individuals in the
          following situations:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[#006B3F]">
          <li>
            We utilize third party service providers to provide products,
            services or functions on our behalf (such as sending emails,
            processing credit cards, or fulfilling subscriptions), and ask these
            service providers to agree to maintain the confidentiality of your
            Personally Identifiable Information and not to use it for any reason
            except to carry out the purpose(s) for which we hired them
            (&quot;Service Provider Exception&quot;).
          </li>
          <li>
            You have entered a promo or contest sponsored by a third party, in
            which case the information you provide may be shared with that third
            party for their use in their discretion, including direct marketing.
            Some promos and contests will ask at the time of entry whether you
            would like your personal information shared with the sponsor, in
            which case we will honor your selection. Others will not give you
            that option — in that event, if you do not want your information
            shared, you should not enter. The privacy policies of such third
            party companies apply to their use and disclosure of your
            information.
          </li>
          <li>
            The entity to whom the information is disclosed is our affiliate.
          </li>
          <li>
            In accordance with your indicated preferences (e.g., you indicated
            you wanted to receive promotional materials directly from a third
            party partner).
          </li>
          <li>
            The entity is a third party who wants to promote goods and services
            we think would be of interest to you.
          </li>
          <li>
            You have furnished us Personally Identifiable Information with the
            intent that it be forwarded to a third party for use in connection
            with a specified service you are electing to participate in (e.g.,
            e-commerce partners, online contest partners, services to help old
            friends locate you online, etc.).
          </li>
          <li>
            We may be legally required to disclose your Personally Identifiable
            Information if such disclosure is: required by subpoena, law, or
            other legal process; necessary to assist law enforcement or
            government agencies; necessary to investigate violations of or
            otherwise enforce our Terms of Use; necessary to protect us from any
            legal action or claims from third parties including you and/or other
            members; and/or we have reason to believe it is necessary to protect
            against someone who may be causing injury to someone, or interfering
            with our rights or the rights of our users, employees, affiliates,
            or the general public, or using our services in violation of a legal
            or personal right, including our Terms of Use (collectively,
            &quot;Legal Exceptions&quot;).
          </li>
          <li>
            In connection with a sale, merger, transfer, exchange, or other
            disposition (whether of assets, stock, or otherwise, including via
            bankruptcy) of all or a portion of the business conducted by our
            site to which this policy applies, in which case the acquiring
            company will possess the Personally Identifiable Information
            collected by us and will assume the rights and obligations regarding
            your Personally Identifiable Information as described in this
            Privacy Policy (&quot;Acquisition Exception&quot;).
          </li>
          <li>
            <span className={STRONG_CLASS}>Social Networks.</span> If you use
            your login credentials from a social networking site (e.g. Facebook
            or Twitter) (&quot;SNS&quot;) on our site, we may receive
            information from such SNS in accordance with its own terms and
            conditions (&quot;SNS Terms&quot;). If you elect to share your
            information with an SNS, we will share information with them in
            accordance with your election, and the applicable SNS Terms will
            apply to the information we disclose to them.
          </li>
          <li>
            <span className={STRONG_CLASS}>Third Party Partners.</span> Our site
            may from time to time partner with a retailer or other third party
            to offer online shopping opportunities, games, services,
            subscriptions, and other applications on a co-branded or
            cross-promotional basis. Personally Identifiable Information you
            provide in connection with such a transaction may be collected
            directly by, or shared by our site with, the third party, as well as
            any participating sponsor or advertiser. These third parties will
            use your information in accordance with their own privacy policy.
          </li>
          <li>
            <span className={STRONG_CLASS}>
              Delivery of Advertising and Other Content.
            </span>{" "}
            In addition to ads and content we serve you directly, we use third
            party advertising and marketing services companies to serve ads and
            other content when you visit our site. Both we and these companies
            may use information about your visits to this site and elsewhere to
            serve ads and content to you. In doing so, a unique third-party
            Cookie may be placed or recognized on your browser by such
            companies.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "opt-out",
    title: "V. Right to Opt-Out",
    body: (
      <ul className="list-disc space-y-2.5 pl-5 marker:text-[#006B3F]">
        <li>
          <span className={STRONG_CLASS}>Email Policy.</span> We and our
          affiliates and partners fully comply with national laws regarding
          SPAM. If you wish to opt out of our email services, you may do so by
          following the unsubscribe instructions in the email you received. We
          will not sell, rent, or trade your email address to any unaffiliated
          third-party partners without your permission.
        </li>
        <li>
          <span className={STRONG_CLASS}>User Registration.</span> You may elect
          to change the details of your user registration at any time by logging
          in and editing your User Profile. If you wish to cancel or delete your
          registration, you may contact us below. Please note that when we
          delete information, it is removed from the active database but may be
          retained in our archives. We may retain your information for fraud or
          similar purposes.
        </li>
        <li>
          <span className={STRONG_CLASS}>Exceptions.</span> If you have opted
          out as described above, and thereafter elect to use a service or
          promotion that requires us to contact you or share your information
          with a third party (e.g., you enter a promo or contest), your previous
          opt-out preferences will not apply to that service. Despite your
          indicated preferences, we may send you service-related communications,
          including notices about your subscription, and may continue disclosing
          your information to third parties under the Service Provider
          Exception, Legal Exceptions, and Acquisition Exception described
          above.
        </li>
      </ul>
    ),
  },
  {
    id: "protection",
    title: "VI. Protection of Customer Data",
    body: (
      <>
        <p>
          We respect your privacy. We take paramount care in protecting your
          Customer Data. As such, we secure and protect it with proper
          safeguards to ensure confidentiality and privacy; prevent loss, theft,
          or use for unauthorized purposes; and comply with the requirements of
          the law.
        </p>
        <p>
          As communications over the internet may not be secure, we make
          reasonable and appropriate security arrangements using a variety of
          physical, electronic, and procedural safeguards to protect Customer
          Data. For example, we protect information submitted through our
          website using a secured server behind a firewall, encryption, and
          other appropriate security controls. When you enter your information
          through our website, we encrypt it using Secure Sockets Layer
          technology (SSL) so it cannot be read as it travels over the internet.
          We regularly review our information collection, storage, and
          processing practices, including physical security measures, to guard
          against unauthorized access, alteration, disclosure, or destruction of
          information we hold.
        </p>
        <p>
          We only permit your Customer Data to be accessed or processed by our
          authorized personnel, who hold such information under strict
          confidentiality. We restrict access to employees, contractors, and
          agents who need to know such information to process it for us, who are
          subject to strict contractual and technical safeguards and are
          accountable if they fail to meet these.
        </p>
        <p>
          We only give you or your authorized representative access to your
          Personal Information. We do not sell your Personal Information to
          anyone for any purpose, and we do not use nor share your Personal
          Information with content and/or information providers without your
          prior request or consent. Personal Information will only be disclosed
          to third parties in accordance with this Privacy Policy.
        </p>
        <p>
          We keep our records as accurate as possible. If your Personal
          Information is incorrect, we give you ways to update it. Once
          registered as our customer, you may access your account details and
          correct your Personal Information by visiting our website.
        </p>
        <p>
          We keep your Personal Information in our business records, as
          applicable, while you are a customer, or as long as it is necessary to
          fulfill the purpose for which it was collected, or while needed for
          business, tax, or legal purposes. When disposing of your Personal
          Information, we take reasonable measures to ensure it is done properly
          and is not accessible to the public.
        </p>
        <p>
          We are not responsible for information, content, applications,
          products or services that we do not provide. But because we care for
          you and want to protect you, we take measures to fight spam, fraud, or
          any unauthorized transaction that traverses our network.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "VII. Contact Us",
    body: (
      <p>
        For any questions or concerns, you may contact our office at{" "}
        <a href="mailto:wecare@quantapaper.com" className={LINK_CLASS}>
          wecare@quantapaper.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#F8F7F4]">
        <div className="border-b border-[#C6C8C5] bg-[#00A552]/5">
          <div className="container py-10 sm:py-14">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-[#006B3F]">
              Legal
            </p>
            <h1 className="mt-1 font-display text-3xl font-medium italic text-[#252927] sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#252927]/65">
              How Quanta Paper Corporation collects, uses, discloses, and
              protects your personal data, in compliance with the Data Privacy
              Act of 2012.
            </p>
          </div>
        </div>

        <div className="container grid gap-10 py-10 sm:py-14 lg:grid-cols-[240px_1fr]">
          {/* Section nav */}
          <nav className="hidden lg:block">
            <div className="sticky top-28 space-y-1">
              <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-widest text-[#252927]/55">
                On this page
              </p>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-2.5 py-1.5 text-xs text-[#252927]/70 transition-colors hover:bg-[#00A552]/10 hover:text-[#006B3F]"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="min-w-0 max-w-3xl space-y-10">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28"
              >
                <h2 className="font-display text-xl font-semibold text-[#252927] sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#252927]/80 sm:text-[15px]">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
