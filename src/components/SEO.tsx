import Head from 'next/head';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const SEO = ({ title, description, keywords }: SEOProps) => {
  const { t } = useLanguage();
  const router = useRouter();
  
  const siteName = "InvoiceGod";
  const pageTitle = title ? `${title} | ${siteName}` : siteName;
  const pageDescription = description || t('seo.default_description');
  const pageKeywords = keywords || t('seo.default_keywords');
  
  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://invoicegod.com${router.asPath}`} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      
      {/* Canonical */}
      <link
        rel="canonical"
        href={`https://invoicegod.com${router.locale === 'en' ? '' : `/${router.locale}`}${router.asPath}`}
      />
      
      {/* Alternate languages */}
      {['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'ru'].map((locale) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={`https://invoicegod.com/${locale}${router.asPath}`}
        />
      ))}
    </Head>
  );
};