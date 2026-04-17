export default {
  name: 'warmUpBlock',
  title: 'Warm-Up Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Warm-Up: Before You Read',
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      initialValue: 'Look at the image and answer the questions to activate your background knowledge.',
    },
    // NEW VISUAL HOOK UPDATE
    {
      name: 'visualHook',
      title: 'Visual Hook (Upload Image)',
      type: 'image',
      options: {
        hotspot: true, // This allows you to crop the image directly inside Sanity!
      },
      description: 'Upload an engaging photo to activate schema before they read. (Optional)',
    },
    // WARM-UP QUESTIONS
    {
      name: 'questions',
      title: 'Warm-Up Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { 
              name: 'questionText', 
              title: 'Question', 
              type: 'string' 
            },
            {
              name: 'options',
              title: 'Options',
              type: 'array',
              of: [{ type: 'string' }],
            },
            { 
              name: 'correctAnswer', 
              title: 'Correct Answer', 
              type: 'string' 
            },
            {
              name: 'extraContext',
              title: 'Extra Context (The Reveal)',
              type: 'text',
              description: 'This paragraph appears after they guess the answer to build more background knowledge.'
            }
          ]
        }
      ]
    }
  ]
};