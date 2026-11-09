import deployment from '../deployment.json';

/** Local assets must retain the project prefix on nested GitHub Pages routes. */
export const assetUrl = (filename: string) => `${deployment.basePath}assets/${filename}`;
