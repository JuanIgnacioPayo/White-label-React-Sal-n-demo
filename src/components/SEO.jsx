import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteContext } from '../contexts/SiteContext';

const SEO = ({ title, description, url, imageUrl, noindex = false, schema }) => {
    const { siteName } = useSiteContext() || {};
    const defaultSiteName = siteName || 'Salón Magic Eventos';
    const siteBase = typeof window !== 'undefined' ? window.location.origin : 'https://melishare-redirect-payo.web.app';
    const canonicalUrl = url && url.startsWith('http')
        ? url
        : `${siteBase}${url ? (url.startsWith('/') ? '' : '/') + url : '/'}`;

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:locale" content="es_AR" />
            <meta property="og:site_name" content={defaultSiteName} />
            <meta property="og:url" content={canonicalUrl} />
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {imageUrl && <meta property="og:image" content={imageUrl} />}

            {/* Twitter */}
            <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
            <meta name="twitter:url" content={canonicalUrl} />
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            {imageUrl && <meta name="twitter:image" content={imageUrl} />}

            {noindex ? (
                <meta name="robots" content="noindex" />
            ) : (
                <link rel="canonical" href={canonicalUrl} />
            )}
            
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
