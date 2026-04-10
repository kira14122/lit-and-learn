import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'ols5q948', // Your unique Sanity ID
  dataset: 'production',
  useCdn: true,          
  apiVersion: '2024-03-20', 
})

const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)