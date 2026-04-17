export default {
  name: 'comprehensionBlock',
  title: 'Comprehension Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Check Your Understanding',
    },
    {
      name: 'instruction',
      title: 'Instructions',
      type: 'text',
      initialValue: 'Answer the following questions based on the reading text.',
    },
    {
      name: 'questions',
      title: 'Questions',
      type: 'array',
      description: 'Add a mix of True/False and Multiple Choice questions here to match the chronological flow of the text.',
      of: [
        // QUESTION TYPE 1: MULTIPLE CHOICE
        {
          name: 'mcq',
          title: 'Multiple Choice Question',
          type: 'object',
          fields: [
            { 
              name: 'questionText', 
              title: 'Question', 
              type: 'string' 
            },
            {
              name: 'options',
              title: 'Options (Add 4 choices)',
              type: 'array',
              of: [{ type: 'string' }]
            },
            { 
              name: 'correctAnswer', 
              title: 'Correct Answer', 
              type: 'string', 
              description: 'MUST exactly match one of the options you typed above.' 
            }
          ],
          preview: {
            select: { title: 'questionText' },
            prepare(selection: any) { 
              return { title: `🔵 [Multiple Choice] ${selection.title || 'New Question'}` } 
            }
          }
        },
        // QUESTION TYPE 2: TRUE/FALSE
        {
          name: 'tfq',
          title: 'True/False Statement',
          type: 'object',
          fields: [
            { 
              name: 'statement', 
              title: 'Statement', 
              type: 'string' 
            },
            { 
              name: 'isTrue', 
              title: 'Is this statement True?', 
              type: 'boolean', 
              initialValue: false,
              description: 'Toggle ON for True, leave OFF for False.'
            }
          ],
          preview: {
            select: { title: 'statement', isTrue: 'isTrue' },
            prepare(selection: any) { 
              return { title: `🟢 [True/False] ${selection.title || 'New Statement'} (Answer: ${selection.isTrue ? 'True' : 'False'})` } 
            }
          }
        }
      ]
    }
  ]
};