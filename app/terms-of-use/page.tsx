import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Use — Quanta Paper",
  description:
    "Terms of Use for the Quanta Paper Corporation e-commerce platform.",
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

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: "terms-of-use",
    title: "Terms of Use",
    body: (
      <>
        <p>
          This e-commerce website is managed and operated by Quanta Paper
          Corporation (&quot;QPC&quot;). Through the site, the terms
          &quot;we&quot;, &quot;us&quot; and &quot;our&quot; refer to Quanta
          Paper Corporation. QPC offers its website/e-commerce platform,
          including all information, tools and services available from this site
          to you, the user, conditioned upon your acceptance of all terms,
          conditions, policies and notices stated here.
        </p>
        <p>
          Please read these Terms of Use carefully before accessing or using our
          website. By accessing or using any part of the site, you agree to be
          bound by these Terms of Use. If you do not agree to all the terms and
          conditions of this agreement, then you may not access the website or
          use any services. If these Terms of Use are considered an offer,
          acceptance is expressly limited to these Terms of Use. If you are
          under 18, you must let your parent or guardian know about our Privacy
          Policy before you register to use this site or any of its services. We
          reserve the right to only accept orders from those over 18, however.
        </p>
        <p>
          The platform allows you to purchase Quanta Paper products and connects
          you to our main branch/warehouse to complete and fulfill your
          purchase.
        </p>
        <p>
          We may modify these Terms of Use from time to time. Please read them
          and check back often. If you do not agree to any change, you must
          immediately stop using the platform. Any changes made after you have
          placed an order will not affect that order, unless we are required to
          make the change by law.
        </p>
      </>
    ),
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    body: (
      <p>
        Please review our Privacy Policy so that you may understand our privacy
        practices.
      </p>
    ),
  },
  {
    id: "registration",
    title: "Registration",
    body: (
      <p>
        To use some of the services or features made available to you on this
        platform, you will need to register. When you register, you are required
        to provide information about yourself that is true, accurate, current
        and complete in all respects. Should any of your registration
        information change, please notify us immediately at{" "}
        <a href="mailto:qstore@quantapaper.com" className={LINK_CLASS}>
          qstore@quantapaper.com
        </a>
        . You may also want to view our Privacy Policy and Cookie Notice to
        understand how we handle your personal information. We may change
        registration requirements from time to time.
      </p>
    ),
  },
  {
    id: "personal-use",
    title: "Products and Services for Personal Use",
    body: (
      <p>
        The products and services described on this website, including any
        samples or gifts with purchase we may provide, are for personal use
        only. You may not sell or resell any of the products or services that
        you receive from us. We reserve the right, with or without notice, to
        cancel or reduce the quantity of products or services provided to you
        that we believe may result in a violation of our Terms of Use.
      </p>
    ),
  },
  {
    id: "privacy-personal-info",
    title: "Privacy and Personal Information",
    body: (
      <>
        <p>
          On certain areas of our website, you may be asked to provide us with
          personally identifiable information. Please read through our Privacy
          Policy for more information about our information collection and use
          practices.
        </p>
        <p>
          To access some features of the website, you may be asked to create
          your own account. If you register an account, you agree to accept
          responsibility for maintaining the confidentiality of your account
          name and password. When creating your account, you must provide
          accurate and complete information. You may never use another
          person&apos;s account without permission. You must notify QPC
          immediately of any breach of security or unauthorized use of your
          account. QPC will not be liable for your losses caused by any
          unauthorized use of your account.
        </p>
        <p>
          QPC sells products and services to adults who can purchase using a
          credit card. If you are under 18, you may browse the platform but you
          may not register an account, purchase goods, or participate in any
          offers or promotions. QPC reserves the right to refuse service,
          terminate accounts, remove or edit content, or cancel orders at its
          sole discretion.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Modification to the Services and Prices",
    body: (
      <p>
        Prices for our products and services are subject to change without
        notice. We reserve the right at any time to modify or discontinue a
        product or service (or any part or content thereof) without notice. We
        shall not be liable to you or any third party for any modification,
        price change, suspension or discontinuation of any product or service.
      </p>
    ),
  },
  {
    id: "products-services",
    title: "Products and Services",
    body: (
      <>
        <p>
          Certain products and/or services may be available exclusively online
          through the website. These products or services may have limited
          quantities and are subject to return or exchange only according to our
          Return Policy.
        </p>
        <p>
          We try our best to display as accurately as possible the colors and
          images of our products and services that appear on Quanta Paper. We
          cannot guarantee that your device&apos;s monitor display of any color
          will be accurate.
        </p>
        <p>
          We reserve the right, but are not obligated, to limit the sales of our
          products or services to any person, geographic region or jurisdiction.
          We may exercise this right on a case-by-case basis. We may also limit
          the quantities of any products or services we offer. All descriptions
          of our products and services, including price, are subject to change
          at any time without notice at the sole discretion of QPC. We reserve
          the right to discontinue any product at any time.
        </p>
      </>
    ),
  },
  {
    id: "third-party-links",
    title: "Third Party Links",
    body: (
      <p>
        These Terms of Use apply to all users, including users who contribute
        video content, information, or other materials or services. The website
        may also contain links to third-party platforms that are not owned or
        controlled by QPC. QPC has no control over, and assumes no
        responsibility for, the content, privacy policies or practices of any
        third-party platforms, and will not and cannot censor or edit the
        content of any third-party links. By using our website, you expressly
        release QPC from any liability arising from your use of any third-party
        website. When you leave the QPC website and submit information to a
        third-party link, that party&apos;s privacy policy and terms of use will
        apply instead.
      </p>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <>
        <p>
          Payment can be made via Visa, MasterCard, and any other methods which
          may be clearly advertised on the site from time to time. Payment will
          be debited and cleared from your account upon dispatch of your order.
          You confirm that the credit/debit card being used is yours, or that
          you have been specifically authorized by the owner of the card to use
          it. All card users are subject to validation checks and authorization
          by the card issuer. If the issuer of your payment card refuses to
          authorize payment to QPC, we will not be liable for any delay or
          non-delivery.
        </p>
        <p>
          We take efforts to make our site secure. All credit card transactions
          on this site are processed using PayPal. We will take all reasonable
          care, so far as it is in our power to do so, to keep the details of
          your order and payment secure, but in the absence of negligence on our
          part, we cannot be held liable for any loss you may suffer if a third
          party procures unauthorized access to any data you provide when
          accessing or ordering from our website.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Insurance and Delivery",
    body: (
      <>
        <p>
          QPC takes every effort to ensure your purchase is protected while in
          transit until it is delivered to your specified address. We require a
          signature for goods delivered, at which point responsibility for your
          purchased goods passes to you. If you have specified a recipient other
          than yourself for delivery purposes, you accept that evidence of a
          signature by them (or at the delivery address) is evidence of
          delivery, fulfilment of the order, and transfer of responsibility in
          the same way.
        </p>
        <p>
          We aim to dispatch all orders within 24–48 hours. Estimated delivery
          times are a guide only and commence from the date of dispatch. QPC is
          not responsible for delays caused by destination customs clearance
          processes.
        </p>
      </>
    ),
  },
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    body: (
      <>
        <p>
          You affirm that you are either more than 18 years of age, an
          emancipated minor, or possess legal parental or guardian consent, and
          are fully able and competent to enter into the terms, conditions,
          obligations, affirmations, representations and warranties set forth in
          these Terms of Use, and to abide by and comply with them.
        </p>
        <p>
          You acknowledge and agree that no joint venture, partnership,
          employment or agency exists between you and QPC as a result of these
          Terms of Use. You agree that you may not and will not hold yourself
          out as a representative, agent, or employee of QPC, and we shall not
          be liable for any representation, act, or omission on your part.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limits on Our Liability",
    body: (
      <>
        <p>
          Nothing in these Terms of Use is intended to affect your rights under
          the law:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-[#006B3F]">
          <li>
            That any products you order through this website shall be of
            satisfactory quality, fit for their intended purpose, and will
            conform to any description given on this site;
          </li>
          <li>Certain remedies if a product is defective;</li>
          <li>
            A right to exchange any order of a product within seven working
            days, commencing on the day after the date on which you received it.
          </li>
        </ul>
        <p>
          QPC shall not be liable under any circumstances for any damages and
          injury, including any direct, special, indirect, consequential,
          punitive or other damages that may result from the use of the
          platform.
        </p>
        <p>
          We are not responsible for losses not caused by our breach or
          negligence, indirect losses which are a side effect of the main loss
          or damage and which are not reasonably foreseeable by you and us (for
          example, loss of profits or loss of opportunity).
        </p>
        <p>
          We are also not responsible for failure to meet any of our obligations
          under these Terms of Use where such failure is due to events beyond
          our reasonable control.
        </p>
      </>
    ),
  },
  {
    id: "miscellaneous",
    title: "Miscellaneous",
    body: (
      <>
        <p>
          If you breach these Terms of Use and we take no action against you, we
          will still be entitled to use our rights and remedies in any other
          situation where you breach these Terms of Use.
        </p>
        <p>
          These Terms of Use, together with all our policies and procedures,
          will be governed by and construed in accordance with the relevant
          Philippine law, and the relevant courts of the Philippines will have
          exclusive jurisdiction.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    body: (
      <p>
        QPC Customer Support can be reached via e-mail at{" "}
        <a href="mailto:qstore@quantapaper.com" className={LINK_CLASS}>
          qstore@quantapaper.com
        </a>{" "}
        or via telephone at{" "}
        <a href="tel:+63285339250" className={LINK_CLASS}>
          8533-9250
        </a>
        .
      </p>
    ),
  },
];

export default function TermsOfUsePage() {
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
              Terms of Use
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#252927]/65">
              These terms govern your use of the Quanta Paper Corporation
              website and e-commerce platform. Please read them carefully before
              placing an order.
            </p>
          </div>
        </div>

        <div className="container grid gap-10 py-10 sm:py-14 lg:grid-cols-[220px_1fr]">
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
