import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  // Using your specific project details
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'ols5q948',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  
  // THE CRITICAL FIX: Set to false to bypass the cache and get live data!
  useCdn: false, 
  
  apiVersion: '2024-04-20', // Using today's API version
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: any) => builder.image(source);