export default {
  name: 'warmUpBlock',
  title: 'Warm-Up Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Warm-Up: Before We Read',
      description: 'The heading the student will see.',
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      rows: 2,
      initialValue: 'Choose the best answer before reading the text. Don\'t worry about being right—just guess!',
      description: 'Tell the students what to do.',
    },
    {
      name: 'questions',
      title: 'Warm-Up Questions',
      type: 'array',
      description: 'Add your multiple choice questions here.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'questionText',
              title: 'Question',
              type: 'string',
              description: 'Example: What kind of animal do you think a mongoose is?',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'options',
              title: 'Multiple Choice Options',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Add the choices (e.g., A large bird, A small mammal, etc.)',
              validation: (Rule) => Rule.required().min(2).max(4),
            },
            {
              name: 'correctAnswer',
              title: 'Correct Answer',
              type: 'string',
              description: 'IMPORTANT: This must exactly match one of the options you typed above.',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {
              title: 'questionText',
            }
          }
        }
      ]
    },
    {
      name: 'postQuizReveal',
      title: 'Post-Quiz Extra Information (The Reveal Window)',
      type: 'text',
      rows: 4,
      description: 'This is the text that pops up in the new window AFTER they answer, giving them the correct answers and extra context BEFORE they start reading the main text.',
      validation: (Rule) => Rule.required(),
    }
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Warm-Up Block',
        subtitle: 'Pre-reading questions with information reveal'
      }
    }
  }
};