import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';

const SITE_URL = 'https://difae.ai';
const SOCIAL_IMAGE_PATH = '/proland/watch-hero.svg';
const SEO_TITLE = 'Proland — The future of wearable tech';
const SEO_DESCRIPTION =
  'Explore Proland, the smart wearable crafted for wellness, productivity, and safety with adaptive intelligence.';

const bodyClassName =
  'flex min-h-screen flex-col bg-gradient-to-b from-[#060A15] via-[#060A15] to-[#0B1220] text-white';

class ProlandDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render(): JSX.Element {
    return (
      <Html lang="en" className="bg-[#060A15]">
        <Head>
          <meta name="description" content={SEO_DESCRIPTION} />
          <meta property="og:title" content={SEO_TITLE} />
          <meta property="og:description" content={SEO_DESCRIPTION} />
          <meta property="og:url" content={SITE_URL} />
          <meta property="og:site_name" content="Proland" />
          <meta property="og:image" content={SOCIAL_IMAGE_PATH} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Proland smartwatch hero image" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={SEO_TITLE} />
          <meta name="twitter:description" content={SEO_DESCRIPTION} />
          <meta name="twitter:image" content={SOCIAL_IMAGE_PATH} />
          <link rel="canonical" href={SITE_URL} />
        </Head>
        <body className={bodyClassName}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default ProlandDocument;
