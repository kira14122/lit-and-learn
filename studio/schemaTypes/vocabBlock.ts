export default {
  name: 'vocabBlock',
  title: 'Vocabulary Block',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Block Title',
      type: 'string',
      initialValue: 'Vocabulary Focus',
    },
    {
      name: 'instruction',
      title: 'Main Instructions',
      type: 'text',
      initialValue: 'Scan the text to find words that match the definitions, then use the word bank to complete the sentences.',
    },
    // PART 1: THE CONTEXT HUNT
    {
      name: 'vocabHunt',
      title: 'Part 1: Vocabulary Hunt',
      type: 'array',
      description: 'Students must scan the reading text and type the word that matches the definition.',
      of: [
        {
          type: 'object',
          fields: [
            { 
              name: 'definition', 
              title: 'Definition / Clue', 
              type: 'text' 
            },
            { 
              name: 'targetWord', 
              title: 'Target Word', 
              type: 'string',
              description: 'The exact word they need to type.' 
            }
          ],
          preview: {
            select: { title: 'targetWord', subtitle: 'definition' }
          }
        }
      ]
    },
    // PART 2: FILL IN THE BLANKS
    {
      name: 'wordBank',
      title: 'Word Bank',
      type: 'array',
      description: 'Add the target words here, plus a few "distractor" words to make it challenging.',
      of: [{ type: 'string' }]
    },
    {
      name: 'fillInTheBlanks',
      title: 'Part 2: Fill in the Blanks',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { 
              name: 'sentence', 
              title: 'Sentence', 
              type: 'text',
              description: 'Use three underscores (___) where the blank should be.' 
            },
            { 
              name: 'correctWord', 
              title: 'Correct Word', 
              type: 'string' 
            }
          ],
          preview: {
            select: { title: 'sentence', subtitle: 'correctWord' }
          }
        }
      ]
    }
  ]
};