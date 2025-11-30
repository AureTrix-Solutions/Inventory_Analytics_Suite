export function NetlifyBadge() {
  const isNetlify = import.meta.env.VITE_NETLIFY === "true";
  const showForTesting = new URLSearchParams(window.location.search).get('showNetlifyBadge') === 'true';

  if (!isNetlify && !showForTesting) {
    return null;
  }

  return (
    <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer">
      <img 
        src="https://www.netlify.com/assets/badges/netlify-badge-color-bg.svg" 
        alt="Deploys by Netlify" 
        className="h-10 ml-1"
      />
    </a>
  );
}
