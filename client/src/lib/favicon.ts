/**
 * Updates the browser's favicon dynamically
 * @param logoUrl - URL of the new favicon image, or null to use default
 */
export const updateFavicon = (logoUrl: string | null) => {
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');

  existingFavicons.forEach(link => link.remove());

  const faviconLink = document.createElement('link');
  faviconLink.rel = 'icon';
  faviconLink.type = 'image/x-icon';

  faviconLink.href = logoUrl || '/favicon.png';

  document.head.appendChild(faviconLink);

  const appleTouchIcon = document.createElement('link');
  appleTouchIcon.rel = 'apple-touch-icon';
  appleTouchIcon.href = logoUrl || '/favicon.png';
  document.head.appendChild(appleTouchIcon);
};
