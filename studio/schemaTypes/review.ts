export default {
  name: 'review',
  type: 'document',
  title: 'Book Reviews',
  fields: [
    { 
      name: 'title', 
      type: 'string', 
      title: 'Book Title' 
    },
    // --- NEW AUTHOR FIELD ---
    {
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    // --- NEW LEVEL DROPDOWN ---
    {
      name: 'level',
      title: 'Target CEFR Level',
      type: 'string',
      options: {
        list: [
          { title: 'A1 (Beginner)', value: 'A1' },
          { title: 'A2 (Elementary)', value: 'A2' },
          { title: 'B1 (Intermediate)', value: 'B1' },
          { title: 'B2 (Upper Intermediate)', value: 'B2' },
          { title: 'C1 (Advanced)', value: 'C1' },
          { title: 'C2 (Mastery)', value: 'C2' },
        ],
        layout: 'dropdown', 
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      type: 'string',
      title: 'Main Category',
      options: { list: ['Fiction', 'Non-Fiction'] }
    },
    {
      name: 'subCategory',
      type: 'string',
      title: 'Sub-Category',
      options: {
        list: [
          // Fiction options
          { title: 'British Literature', value: 'British Literature' },
          { title: 'American Literature', value: 'American Literature' },
          { title: 'Russian Literature', value: 'Russian Literature' },
          { title: 'French Literature', value: 'French Literature' },
          { title: 'Arabic Literature', value: 'Arabic Literature' },
          { title: 'Other Literature', value: 'Other Literature' },
          // Non-Fiction options
          { title: 'Self Improvement', value: 'Self Improvement' },
          { title: 'Informative & Educational', value: 'Informative & Educational' },
          { title: 'Language Learning & Teaching', value: 'Language Learning & Teaching' },
        ]
      }
    },
    { 
      name: 'coverImage', 
      type: 'image', 
      title: 'Book Cover' 
    },
    // --- THE RICH TEXT EDITOR ---
    { 
      name: 'content', 
      type: 'array', 
      title: 'Review Content',
      of: [{ type: 'block' }] 
    }
  ] 
}