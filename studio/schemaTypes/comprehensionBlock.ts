export default {
  name: 'comprehensionBlock',
  type: 'document',
  title: 'Comprehension Blocks (Multi-Question)',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'instruction',
      title: 'Student Instructions',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      options: { list: ['Listening (Audio)', 'Reading (Text)'] },
      validation: Rule => Rule.required()
    },
    {
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: { accept: 'audio/*' },
      hidden: ({ document }) => document?.contentType !== 'Listening (Audio)'
    },
    {
      name: 'readingPassage',
      title: 'Reading Text',
      type: 'text',
      rows: 10,
      hidden: ({ document }) => document?.contentType !== 'Reading (Text)'
    },
    {
      name: 'level',
      title: 'Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      validation: Rule => Rule.required()
    },
    {
      name: 'unit',
      title: 'Unit Number',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(12)
    },
    {
      name: 'questions',
      title: 'Questions for this Block',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'blockQuestion',
          fields: [
            { name: 'questionText', type: 'string', title: 'Question', validation: Rule => Rule.required() },
            {
              name: 'questionFormat',
              title: 'Question Format',
              type: 'string',
              options: { list: ['Multiple Choice', 'True / False / Not Given'], layout: 'radio' },
              initialValue: 'Multiple Choice'
            },
            { name: 'optionA', type: 'string', title: 'Option A', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionB', type: 'string', title: 'Option B', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionC', type: 'string', title: 'Option C', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionD', type: 'string', title: 'Option D', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            {
              name: 'correctAnswer',
              title: 'Correct Answer',
              type: 'string',
              options: { list: ['A', 'B', 'C', 'D', 'True', 'False', 'Not Given'] },
              validation: Rule => Rule.required()
            },
            { name: 'explanation', title: 'Explanation', type: 'text', rows: 2 }
          ]
        }
      ],
      validation: Rule => Rule.min(1).max(10)
    }
  ],
  preview: {
    select: { title: 'title', level: 'level', unit: 'unit', type: 'contentType' },
    prepare({ title, level, unit, type }) {
      return {
        title: title,
        subtitle: `${type} | ${level} - Unit ${unit}`
      }
    }
  }
}