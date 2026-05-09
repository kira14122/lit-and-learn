export default {
  name: 'unitAssessment',
  type: 'document',
  title: 'Unit Assessments (Full Quizzes)',
  fields: [
    {
      name: 'title',
      title: 'Assessment Title',
      type: 'string',
      description: 'e.g., "Level 4 - Unit 1 Final Exam"',
      validation: Rule => Rule.required()
    },
    {
      name: 'level',
      title: 'Main Level',
      type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
      validation: Rule => Rule.required()
    },
    {
      name: 'subLevel',
      title: 'Path / Sub-Level',
      type: 'string',
      options: { list: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Business English'] },
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
      title: 'Quiz Questions',
      type: 'array',
      description: 'Click "Add item" to add as many questions as you want to this exam!',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', title: 'The Question', type: 'text', rows: 3, validation: Rule => Rule.required() },
            {
              name: 'questionFormat',
              title: 'Question Format',
              type: 'string',
              options: { list: ['Multiple Choice', 'True / False / Not Given'], layout: 'radio' },
              initialValue: 'Multiple Choice',
              validation: Rule => Rule.required()
            },
            {
              name: 'skill',
              title: 'Target Skill',
              type: 'string',
              options: { list: ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Writing'] },
              validation: Rule => Rule.required()
            },
            { name: 'audioSnippet', title: '🎧 Listening Audio (Optional)', type: 'file', options: { accept: 'audio/*' } },
            { name: 'optionA', title: 'Option A', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionB', title: 'Option B', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionC', title: 'Option C', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            { name: 'optionD', title: 'Option D', type: 'string', hidden: ({parent}) => parent?.questionFormat === 'True / False / Not Given' },
            {
              name: 'correctAnswer',
              title: 'Correct Answer',
              type: 'string',
              options: { list: ['A', 'B', 'C', 'D', 'True', 'False', 'Not Given'] },
              validation: Rule => Rule.required()
            },
            { name: 'explanation', title: 'Diagnostic Explanation', type: 'text', rows: 2 }
          ],
          preview: {
            select: { title: 'question', subtitle: 'skill', correct: 'correctAnswer' },
            prepare({title, subtitle, correct}) { 
              return { title: title, subtitle: `[${subtitle}] Answer: ${correct}` } 
            }
          }
        }
      ]
    }
  ],
  preview: {
    select: { title: 'title', level: 'level', subLevel: 'subLevel', unit: 'unit' },
    prepare({title, level, subLevel, unit}) {
      return { title: title || 'Untitled Assessment', subtitle: `${level} > ${subLevel} > Unit ${unit}` }
    }
  }
}