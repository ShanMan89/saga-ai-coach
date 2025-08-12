/**
 * Avatar utility functions for generating local placeholder avatars
 * Replaces external dependencies like placehold.co
 */

/**
 * Generates a data URL for an SVG avatar with initials
 * @param initials - The initials to display (1-2 characters)
 * @param size - Size in pixels (default: 128)
 * @param backgroundColor - Background color (default: based on initials)
 * @param textColor - Text color (default: white)
 */
export function generateAvatarDataUrl(
  initials: string,
  size: number = 128,
  backgroundColor?: string,
  textColor: string = 'white'
): string {
  // Generate a consistent color based on initials
  if (!backgroundColor) {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#EC4899', // pink
      '#84CC16', // lime
    ];
    const index = initials.charCodeAt(0) % colors.length;
    backgroundColor = colors[index];
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="8"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="${textColor}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="600"
      >
        ${initials.toUpperCase().slice(0, 2)}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a placeholder avatar URL for a given name
 * @param name - Full name or display name
 * @param size - Size in pixels (default: 128)
 */
export function getPlaceholderAvatar(name: string, size: number = 128): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    || 'U'; // Default to 'U' for User
  
  return generateAvatarDataUrl(initials, size);
}

/**
 * Creates a generic admin avatar
 */
export function getAdminAvatar(size: number = 40): string {
  return generateAvatarDataUrl('A', size, '#6366F1'); // Indigo for admin
}