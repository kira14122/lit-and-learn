import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'grammarPracticeBlock',
  title: 'Grammar Practice Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Grammar Practice'
    }),
    defineField({
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      description: 'e.g., Test your understanding of the grammar rules.'
    }),
    defineField({
      name: 'questions',
      title: 'Practice Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'questionType',
              title: 'Question Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Multiple Choice', value: 'multipleChoice' },
                  { title: 'Error Correction', value: 'errorCorrection' },
                  { title: 'Fill-in-the-Blank', value: 'cloze' },
                  { title: 'Sentence Unscramble', value: 'unscramble' }
                ]
              },
              initialValue: 'multipleChoice'
            }),
            defineField({ 
              name: 'questionText', 
              title: 'Question Text', 
              type: 'string',
              description: 'For Cloze, use ___ for the blank. For Error Correction, write the sentence with the mistake. Leave empty for Unscramble.'
            }),
            defineField({
              name: 'options',
              title: 'Multiple Choice Options',
              type: 'array',
              of: [{ type: 'string' }],
              hidden: ({ parent }) => parent?.questionType !== 'multipleChoice'
            }),
            defineField({
              name: 'scrambledWords',
              title: 'Scrambled Words',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Add the words in a mixed-up order.',
              hidden: ({ parent }) => parent?.questionType !== 'unscramble'
            }),
            defineField({ 
              name: 'correctAnswer', 
              title: 'Correct Answer', 
              type: 'string',
              description: 'The exact correct word or the full correct sentence.'
            }),
            defineField({ 
              name: 'explanation', 
              title: 'Explanation (Optional)', 
              type: 'text'
            })
          ]
        }
      ]
    })
  ],
  preview: {
    select: { title: 'title' },
    prepare(selection) {
      return { ...selection, subtitle: 'Grammar Practice' }
    }
  }
})