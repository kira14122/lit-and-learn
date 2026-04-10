export default {
  name: 'review',
  type: 'document',
  title: 'Book Reviews',
  fields: [
    { name: 'title', type: 'string', title: 'Book Title' },
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
          { title: 'Arabic Literature', value: 'Arabic Literature' },
          { title: 'Other Literature', value: 'Other Literature' },
          // Non-Fiction options
          { title: 'Self Improvement', value: 'Self Improvement' },
          { title: 'Informative & Educational', value: 'Informative & Educational' },
          { title: 'Language Learning & Teaching', value: 'Language Learning & Teaching' },
        ]
      }
    },
    { name: 'coverImage', type: 'image', title: 'Book Cover' },
    // --- THE NEW RICH TEXT EDITOR ---
    { 
      name: 'content', 
      type: 'array', 
      title: 'Review Content',
      of: [{ type: 'block' }] 
    }
  ] // <-- This is the little bracket that went missing!
}